import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, isAuthContext } from '@/lib/api/auth';
import { handleApiError, notFound } from '@/lib/api/errors';
import { UpdateProjectSchema } from '@permitpro/shared';
import { logActivity } from '@/lib/api/audit';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await requireAuth();
    if (!isAuthContext(auth)) return auth;

    const project = await prisma.project.findFirst({
      where: { id: params.id, orgId: auth.orgId },
      include: {
        permits: {
          include: {
            assignee: { select: { id: true, name: true, avatar: true } },
            _count: { select: { documents: true, checklistItems: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!project) return notFound('Project not found');
    return NextResponse.json(project);
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
    const data = UpdateProjectSchema.parse(body);

    const existing = await prisma.project.findFirst({
      where: { id: params.id, orgId: auth.orgId },
    });
    if (!existing) return notFound('Project not found');

    const updated = await prisma.project.update({
      where: { id: params.id },
      data,
    });

    await logActivity({
      orgId: auth.orgId,
      userId: auth.userId,
      action: 'PROJECT_UPDATED',
      entityType: 'project',
      entityId: params.id,
      metadata: data as Record<string, unknown>,
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

    const project = await prisma.project.findFirst({
      where: { id: params.id, orgId: auth.orgId },
    });
    if (!project) return notFound('Project not found');

    await prisma.project.delete({ where: { id: params.id } });
    await logActivity({
      orgId: auth.orgId,
      userId: auth.userId,
      action: 'PROJECT_DELETED',
      entityType: 'project',
      entityId: params.id,
      metadata: { name: project.name },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
