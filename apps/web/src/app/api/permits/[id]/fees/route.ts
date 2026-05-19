import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, isAuthContext } from '@/lib/api/auth';
import { handleApiError, notFound } from '@/lib/api/errors';
import { CreateFeeSchema } from '@permitpro/shared';
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

    const fees = await prisma.fee.findMany({
      where: { permitId: params.id },
      orderBy: { dueDate: 'asc' },
    });

    return NextResponse.json(fees);
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
    const data = CreateFeeSchema.parse(body);

    const fee = await prisma.fee.create({ data: { ...data, permitId: params.id } });

    await logActivity({
      orgId: auth.orgId,
      userId: auth.userId,
      permitId: params.id,
      action: 'FEE_CREATED',
      entityType: 'fee',
      entityId: fee.id,
      metadata: { description: fee.description, amount: fee.amount },
    });

    return NextResponse.json(fee, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
