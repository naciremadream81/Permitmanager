import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, isAuthContext } from '@/lib/api/auth';
import { handleApiError, notFound } from '@/lib/api/errors';
import { CreateInspectionSchema } from '@permitpro/shared';
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

    const inspections = await prisma.inspection.findMany({
      where: { permitId: params.id },
      orderBy: { scheduledDate: 'asc' },
    });

    return NextResponse.json(inspections);
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
    const data = CreateInspectionSchema.parse(body);

    const inspection = await prisma.inspection.create({
      data: { ...data, permitId: params.id },
    });

    await logActivity({
      orgId: auth.orgId,
      userId: auth.userId,
      permitId: params.id,
      action: 'INSPECTION_SCHEDULED',
      entityType: 'inspection',
      entityId: inspection.id,
      metadata: { type: inspection.type, scheduledDate: inspection.scheduledDate },
    });

    return NextResponse.json(inspection, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
