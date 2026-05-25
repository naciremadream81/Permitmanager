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

    const existing = await prisma.fee.findFirst({
      where: { id: params.feeId, permitId: params.id },
    });
    if (!existing) return notFound('Fee not found');

    const fee = await prisma.fee.update({ where: { id: params.feeId }, data });

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

    const existing = await prisma.fee.findFirst({
      where: { id: params.feeId, permitId: params.id },
    });
    if (!existing) return notFound('Fee not found');

    await prisma.fee.delete({ where: { id: params.feeId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
