import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, isAuthContext } from '@/lib/api/auth';
import { handleApiError } from '@/lib/api/errors';
import { CreateProjectSchema, PaginationSchema } from '@permitpro/shared';
import { logActivity } from '@/lib/api/audit';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!isAuthContext(auth)) return auth;

    const { searchParams } = new URL(request.url);
    const { page, pageSize, search, sortOrder } = PaginationSchema.parse(
      Object.fromEntries(searchParams),
    );

    const where = {
      orgId: auth.orgId,
      ...(search && { name: { contains: search, mode: 'insensitive' as const } }),
    };

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        include: {
          _count: { select: { permits: true } },
        },
        orderBy: { createdAt: sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.project.count({ where }),
    ]);

    return NextResponse.json({
      data: projects,
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
    const data = CreateProjectSchema.parse(body);

    const project = await prisma.project.create({
      data: { ...data, orgId: auth.orgId },
    });

    await logActivity({
      orgId: auth.orgId,
      userId: auth.userId,
      action: 'PROJECT_CREATED',
      entityType: 'project',
      entityId: project.id,
      metadata: { name: project.name },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
