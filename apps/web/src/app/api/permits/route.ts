import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, isAuthContext } from '@/lib/api/auth';
import { handleApiError } from '@/lib/api/errors';
import { CreatePermitSchema, PermitFilterSchema } from '@permitpro/shared';
import { logActivity } from '@/lib/api/audit';
import { validatePermitReferences } from '@/lib/api/permit-references';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!isAuthContext(auth)) return auth;

    const { searchParams } = new URL(request.url);
    const {
      page, pageSize, search, status, type,
      projectId, assigneeId, sortOrder,
    } = PermitFilterSchema.parse(Object.fromEntries(searchParams));

    const where = {
      orgId: auth.orgId,
      ...(status && { status }),
      ...(type && { type }),
      ...(projectId && { projectId }),
      ...(assigneeId && { assigneeId }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' as const } },
          { permitNumber: { contains: search, mode: 'insensitive' as const } },
          { jurisdiction: { contains: search, mode: 'insensitive' as const } },
          { agency: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [permits, total] = await Promise.all([
      prisma.permit.findMany({
        where,
        include: {
          project: { select: { id: true, name: true } },
          assignee: { select: { id: true, name: true, avatar: true } },
          _count: { select: { documents: true, checklistItems: true, inspections: true, fees: true } },
        },
        orderBy: { createdAt: sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.permit.count({ where }),
    ]);

    return NextResponse.json({
      data: permits,
      total,
      page,
      pageSize,
      hasMore: total > page * pageSize,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!isAuthContext(auth)) return auth;

    const body = await request.json() as unknown;
    const data = CreatePermitSchema.parse(body);
    const referenceError = await validatePermitReferences({
      orgId: auth.orgId,
      projectId: data.projectId,
      assigneeId: data.assigneeId,
    });
    if (referenceError) return referenceError;

    const permit = await prisma.permit.create({
      data: { ...data, orgId: auth.orgId },
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, avatar: true } },
      },
    });

    await logActivity({
      orgId: auth.orgId,
      userId: auth.userId,
      permitId: permit.id,
      action: 'PERMIT_CREATED',
      entityType: 'permit',
      entityId: permit.id,
      metadata: { title: permit.title, type: permit.type },
    });

    return NextResponse.json(permit, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
