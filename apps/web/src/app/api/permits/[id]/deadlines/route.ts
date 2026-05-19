import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, isAuthContext } from '@/lib/api/auth';
import { handleApiError, notFound } from '@/lib/api/errors';
import { CreateDeadlineSchema, DEFAULT_REMINDER_DAYS } from '@permitpro/shared';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await requireAuth();
    if (!isAuthContext(auth)) return auth;

    const permit = await prisma.permit.findFirst({ where: { id: params.id, orgId: auth.orgId } });
    if (!permit) return notFound('Permit not found');

    const deadlines = await prisma.deadline.findMany({
      where: { permitId: params.id },
      orderBy: { dueDate: 'asc' },
    });

    return NextResponse.json(deadlines);
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
    const data = CreateDeadlineSchema.parse(body);

    const deadline = await prisma.deadline.create({
      data: {
        permitId: params.id,
        title: data.title,
        dueDate: data.dueDate,
        reminderDays: data.reminderDays ?? DEFAULT_REMINDER_DAYS,
      },
    });

    return NextResponse.json(deadline, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
