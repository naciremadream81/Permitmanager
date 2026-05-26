import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, isAuthContext } from '@/lib/api/auth';
import { handleApiError, notFound } from '@/lib/api/errors';
import { CreateChecklistItemSchema } from '@permitpro/shared';
import { logActivity } from '@/lib/api/audit';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await requireAuth();
    if (!isAuthContext(auth)) return auth;

    const permit = await prisma.permit.findFirst({ where: { id: params.id, orgId: auth.orgId } });
    if (!permit) return notFound('Permit not found');

    const items = await prisma.checklistItem.findMany({
      where: { permitId: params.id },
      include: {
        assignee: { select: { id: true, name: true, avatar: true } },
        completedBy: { select: { id: true, name: true } },
        children: {
          where: { permitId: params.id },
          include: { assignee: { select: { id: true, name: true } } },
        },
      },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json(items);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await requireAuth();
    if (!isAuthContext(auth)) return auth;

    const permit = await prisma.permit.findFirst({ where: { id: params.id, orgId: auth.orgId } });
    if (!permit) return notFound('Permit not found');

    const body = await request.json() as unknown;
    const data = CreateChecklistItemSchema.parse(body);

    if (data.parentItemId) {
      const parent = await prisma.checklistItem.findFirst({
        where: { id: data.parentItemId, permitId: params.id },
      });
      if (!parent) return notFound('Parent checklist item not found');
    }

    // Auto-assign next order
    const maxResult = await prisma.checklistItem.aggregate({
      where: { permitId: params.id },
      _max: { order: true },
    });
    const order = data.order ?? (maxResult._max.order ?? 0) + 1;

    const item = await prisma.checklistItem.create({
      data: { ...data, permitId: params.id, order },
      include: { assignee: { select: { id: true, name: true, avatar: true } } },
    });

    await logActivity({
      orgId: auth.orgId,
      userId: auth.userId,
      permitId: params.id,
      action: 'CHECKLIST_ITEM_CREATED',
      entityType: 'checklist_item',
      entityId: item.id,
      metadata: { title: item.title },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
