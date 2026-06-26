import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, isAuthContext } from '@/lib/api/auth';
import { handleApiError, notFound } from '@/lib/api/errors';
import { UpdateInspectionSchema } from '@permitpro/shared';
import { logActivity } from '@/lib/api/audit';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; inspId: string } },
) {
  try {
    const auth = await requireAuth();
    if (!isAuthContext(auth)) return auth;

    const permit = await prisma.permit.findFirst({ where: { id: params.id, orgId: auth.orgId } });
    if (!permit) return notFound('Permit not found');

    const existingInspection = await prisma.inspection.findFirst({
      where: { id: params.inspId, permitId: params.id },
    });
    if (!existingInspection) return notFound('Inspection not found');

    const body = await request.json() as unknown;
    const data = UpdateInspectionSchema.parse(body);

    const inspection = await prisma.inspection.update({
      where: { id: params.inspId },
      data,
    });

    await logActivity({
      orgId: auth.orgId,
      userId: auth.userId,
      permitId: params.id,
      action: 'INSPECTION_UPDATED',
      entityType: 'inspection',
      entityId: params.inspId,
      metadata: data as Record<string, unknown>,
    });

    return NextResponse.json(inspection);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; inspId: string } },
) {
  try {
    const auth = await requireAuth();
    if (!isAuthContext(auth)) return auth;

    const permit = await prisma.permit.findFirst({ where: { id: params.id, orgId: auth.orgId } });
    if (!permit) return notFound('Permit not found');

    const existingInspection = await prisma.inspection.findFirst({
      where: { id: params.inspId, permitId: params.id },
    });
    if (!existingInspection) return notFound('Inspection not found');

    await prisma.inspection.delete({ where: { id: params.inspId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
