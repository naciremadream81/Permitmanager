import type { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { notFound } from '@/lib/api/errors';

interface PermitRelationInput {
  projectId?: string;
  assigneeId?: string;
}

interface ChecklistRelationInput {
  assigneeId?: string;
  parentItemId?: string;
}

export async function validatePermitRelations(
  data: PermitRelationInput,
  orgId: string,
): Promise<NextResponse | null> {
  if (data.projectId) {
    const project = await prisma.project.findFirst({
      where: { id: data.projectId, orgId },
      select: { id: true },
    });

    if (!project) return notFound('Project not found');
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

    if (!membership) return notFound('Assignee not found');
  }

  return null;
}

export async function validateChecklistRelations(
  data: ChecklistRelationInput,
  orgId: string,
  permitId: string,
): Promise<NextResponse | null> {
  if (data.assigneeId) {
    const membership = await prisma.orgMembership.findFirst({
      where: {
        userId: data.assigneeId,
        orgId,
        joinedAt: { not: null },
      },
      select: { id: true },
    });

    if (!membership) return notFound('Assignee not found');
  }

  if (data.parentItemId) {
    const parentItem = await prisma.checklistItem.findFirst({
      where: { id: data.parentItemId, permitId },
      select: { id: true },
    });

    if (!parentItem) return notFound('Parent checklist item not found');
  }

  return null;
}
