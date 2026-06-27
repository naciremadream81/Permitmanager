import { NextResponse } from 'next/server';
import type { CreatePermitInput, UpdatePermitInput } from '@permitpro/shared';
import { badRequest } from '@/lib/api/errors';
import { prisma } from '@/lib/prisma';

type PermitRelationInput = Pick<CreatePermitInput | UpdatePermitInput, 'projectId' | 'assigneeId'>;

export async function validatePermitRelations(
  orgId: string,
  data: PermitRelationInput,
): Promise<NextResponse | null> {
  if (data.projectId) {
    const project = await prisma.project.findFirst({
      where: { id: data.projectId, orgId },
      select: { id: true },
    });

    if (!project) {
      return badRequest('Project must belong to the current organization');
    }
  }

  if (data.assigneeId) {
    const membership = await prisma.orgMembership.findFirst({
      where: {
        userId: data.assigneeId,
        orgId,
        joinedAt: { not: null },
      },
      select: { id: true },
    });

    if (!membership) {
      return badRequest('Assignee must be an active member of the current organization');
    }
  }

  return null;
}
