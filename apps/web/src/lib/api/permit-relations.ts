import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { AuthContext } from '@/lib/api/auth';
import { notFound } from '@/lib/api/errors';

interface PermitRelationInput {
  projectId?: string;
  assigneeId?: string;
}

export async function validatePermitRelations(
  data: PermitRelationInput,
  auth: Pick<AuthContext, 'orgId'>,
): Promise<NextResponse | null> {
  if (data.projectId) {
    const project = await prisma.project.findFirst({
      where: { id: data.projectId, orgId: auth.orgId },
      select: { id: true },
    });

    if (!project) return notFound('Project not found');
  }

  if (data.assigneeId) {
    const membership = await prisma.orgMembership.findFirst({
      where: {
        userId: data.assigneeId,
        orgId: auth.orgId,
        joinedAt: { not: null },
      },
      select: { id: true },
    });

    if (!membership) return notFound('Assignee not found');
  }

  return null;
}
