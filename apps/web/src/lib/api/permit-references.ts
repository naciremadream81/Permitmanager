import type { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { badRequest } from '@/lib/api/errors';

interface PermitReferenceInput {
  orgId: string;
  projectId?: string | null;
  assigneeId?: string | null;
}

export async function validatePermitReferences({
  orgId,
  projectId,
  assigneeId,
}: PermitReferenceInput): Promise<NextResponse | null> {
  if (projectId) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, orgId },
      select: { id: true },
    });

    if (!project) {
      return badRequest('Project not found');
    }
  }

  if (assigneeId) {
    const membership = await prisma.orgMembership.findFirst({
      where: { userId: assigneeId, orgId, joinedAt: { not: null } },
      select: { id: true },
    });

    if (!membership) {
      return badRequest('Assignee not found');
    }
  }

  return null;
}

export async function validateChecklistItemReferences({
  orgId,
  permitId,
  parentItemId,
  assigneeId,
}: {
  orgId: string;
  permitId: string;
  parentItemId?: string | null;
  assigneeId?: string | null;
}): Promise<NextResponse | null> {
  if (parentItemId) {
    const parent = await prisma.checklistItem.findFirst({
      where: { id: parentItemId, permitId },
      select: { id: true },
    });

    if (!parent) {
      return badRequest('Parent checklist item not found');
    }
  }

  if (assigneeId) {
    const membership = await prisma.orgMembership.findFirst({
      where: { userId: assigneeId, orgId, joinedAt: { not: null } },
      select: { id: true },
    });

    if (!membership) {
      return badRequest('Assignee not found');
    }
  }

  return null;
}
