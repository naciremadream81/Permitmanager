import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, isAuthContext } from '@/lib/api/auth';
import { handleApiError, notFound } from '@/lib/api/errors';
import { UpdatePermitSchema } from '@permitpro/shared';
import { validateTransition } from '@permitpro/permit-engine';
import { logActivity } from '@/lib/api/audit';
import { validatePermitRelations } from '@/lib/api/permit-relations';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await requireAuth();
    if (!isAuthContext(auth)) return auth;

    const permit = await prisma.permit.findFirst({
      where: { id: params.id, orgId: auth.orgId },
      include: {
        project: true,
        assignee: { select: { id: true, name: true, avatar: true, email: true } },
        documents: {
          include: { uploadedBy: { select: { id: true, name: true, avatar: true } } },
          orderBy: { createdAt: 'desc' },
        },
        checklistItems: {
          include: { assignee: { select: { id: true, name: true } } },
          orderBy: { order: 'asc' },
        },
        inspections: { orderBy: { scheduledDate: 'asc' } },
        fees: { orderBy: { dueDate: 'asc' } },
        deadlines: { orderBy: { dueDate: 'asc' } },
        comments: {
          where: { parentCommentId: null },
          include: {
            user: { select: { id: true, name: true, avatar: true } },
            replies: { include: { user: { select: { id: true, name: true, avatar: true } } } },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        activities: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!permit) return notFound('Permit not found');
    return NextResponse.json(permit);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await requireAuth();
    if (!isAuthContext(auth)) return auth;

    const body = await request.json() as unknown;
    const data = UpdatePermitSchema.parse(body);
    const relationError = await validatePermitRelations(auth.orgId, data);
    if (relationError) return relationError;

    const current = await prisma.permit.findFirst({
      where: { id: params.id, orgId: auth.orgId },
    });
    if (!current) return notFound('Permit not found');

    // Validate status transition if changing
    if (data.status && data.status !== current.status) {
      const result = validateTransition(current.status, data.status);
      if (!result.success) {
        return NextResponse.json(
          { error: 'Invalid status transition', message: result.error },
          { status: 422 },
        );
      }
    }

    const updated = await prisma.permit.update({
      where: { id: params.id },
      data,
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, avatar: true } },
      },
    });

    await logActivity({
      orgId: auth.orgId,
      userId: auth.userId,
      permitId: params.id,
      action: data.status && data.status !== current.status ? 'STATUS_CHANGED' : 'PERMIT_UPDATED',
      entityType: 'permit',
      entityId: params.id,
      metadata: data.status && data.status !== current.status
        ? { from: current.status, to: data.status }
        : (data as Record<string, unknown>),
    });

    return NextResponse.json(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await requireAuth();
    if (!isAuthContext(auth)) return auth;

    const permit = await prisma.permit.findFirst({
      where: { id: params.id, orgId: auth.orgId },
    });
    if (!permit) return notFound('Permit not found');

    await prisma.permit.delete({ where: { id: params.id } });
    await logActivity({
      orgId: auth.orgId,
      userId: auth.userId,
      action: 'PERMIT_DELETED',
      entityType: 'permit',
      entityId: params.id,
      metadata: { title: permit.title },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
