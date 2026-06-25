import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, isAuthContext } from '@/lib/api/auth';
import { handleApiError, notFound } from '@/lib/api/errors';
import { UpdateFeeSchema } from '@permitpro/shared';
import { logActivity } from '@/lib/api/audit';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; feeId: string } },
) {
  try {
    const auth = await requireAuth();
    if (!isAuthContext(auth)) return auth;

    const permit = await prisma.permit.findFirst({ where: { id: params.id, orgId: auth.orgId } });
    if (!permit) return notFound('Permit not found');

    const body = await request.json() as unknown;
    const data = UpdateFeeSchema.parse(body);

    const updateResult = await prisma.fee.updateMany({
      where: { id: params.feeId, permitId: params.id },
      data,
    });
    if (updateResult.count !== 1) return notFound('Fee not found');

    const fee = await prisma.fee.findFirst({
      where: { id: params.feeId, permitId: params.id },
    });
    if (!fee) return notFound('Fee not found');

    await logActivity({
      orgId: auth.orgId,
      userId: auth.userId,
      permitId: params.id,
      action: 'FEE_UPDATED',
      entityType: 'fee',
      entityId: params.feeId,
      metadata: data as Record<string, unknown>,
    });

    return NextResponse.json(fee);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; feeId: string } },
) {
  try {
    const auth = await requireAuth();
    if (!isAuthContext(auth)) return auth;

    const permit = await prisma.permit.findFirst({ where: { id: params.id, orgId: auth.orgId } });
    if (!permit) return notFound('Permit not found');

    const deleteResult = await prisma.fee.deleteMany({
      where: { id: params.feeId, permitId: params.id },
    });
    if (deleteResult.count !== 1) return notFound('Fee not found');

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
