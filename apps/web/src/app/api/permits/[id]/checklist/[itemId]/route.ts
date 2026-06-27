import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, isAuthContext } from '@/lib/api/auth';
import { handleApiError, notFound } from '@/lib/api/errors';
import { UpdateChecklistItemSchema, ChecklistItemStatus } from '@permitpro/shared';
import { logActivity } from '@/lib/api/audit';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; itemId: string } },
) {
  try {
    const auth = await requireAuth();
    if (!isAuthContext(auth)) return auth;

    const permit = await prisma.permit.findFirst({ where: { id: params.id, orgId: auth.orgId } });
    if (!permit) return notFound('Permit not found');

    const body = await request.json() as unknown;
    const data = UpdateChecklistItemSchema.parse(body);

    const existing = await prisma.checklistItem.findFirst({
      where: { id: params.itemId, permitId: params.id },
      select: { id: true },
    });
    if (!existing) return notFound('Checklist item not found');

    // Auto-set completion fields
    const updateData: Record<string, unknown> = { ...data };
    if (data.status === ChecklistItemStatus.COMPLETED) {
      if (!data.completedAt) updateData.completedAt = new Date().toISOString();
      updateData.completedById = auth.userId;
    }

    const item = await prisma.checklistItem.update({
      where: { id: params.itemId },
      data: updateData,
      include: { assignee: { select: { id: true, name: true, avatar: true } } },
    });

    await logActivity({
      orgId: auth.orgId,
      userId: auth.userId,
      permitId: params.id,
      action: 'CHECKLIST_ITEM_UPDATED',
      entityType: 'checklist_item',
      entityId: params.itemId,
      metadata: data as Record<string, unknown>,
    });

    return NextResponse.json(item);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; itemId: string } },
) {
  try {
    const auth = await requireAuth();
    if (!isAuthContext(auth)) return auth;

    const permit = await prisma.permit.findFirst({ where: { id: params.id, orgId: auth.orgId } });
    if (!permit) return notFound('Permit not found');

    const existing = await prisma.checklistItem.findFirst({
      where: { id: params.itemId, permitId: params.id },
      select: { id: true },
    });
    if (!existing) return notFound('Checklist item not found');

    await prisma.checklistItem.delete({ where: { id: params.itemId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
