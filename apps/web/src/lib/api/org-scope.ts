import type { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { notFound } from '@/lib/api/errors';

interface PermitRelationInput {
  projectId?: string;
  assigneeId?: string;
}

interface ChecklistReferenceInput {
  parentItemId?: string;
  assigneeId?: string;
}

export async function validatePermitRelationsInOrg(
  input: PermitRelationInput,
  orgId: string,
): Promise<NextResponse | null> {
  if (input.projectId) {
    const project = await prisma.project.findFirst({
      where: { id: input.projectId, orgId },
      select: { id: true },
    });

    if (!project) return notFound('Project not found');
  }

  if (input.assigneeId) {
    const membership = await prisma.orgMembership.findFirst({
      where: {
        userId: input.assigneeId,
        orgId,
        joinedAt: { not: null },
      },
      select: { id: true },
    });

    if (!membership) return notFound('Assignee not found');
  }

  return null;
}

export async function validateChecklistReferencesForPermit(
  input: ChecklistReferenceInput,
  permitId: string,
  orgId: string,
): Promise<NextResponse | null> {
  if (input.parentItemId) {
    const parentItem = await prisma.checklistItem.findFirst({
      where: { id: input.parentItemId, permitId },
      select: { id: true },
    });

    if (!parentItem) return notFound('Parent checklist item not found');
  }

  if (input.assigneeId) {
    const membership = await prisma.orgMembership.findFirst({
      where: {
        userId: input.assigneeId,
        orgId,
        joinedAt: { not: null },
      },
      select: { id: true },
    });

    if (!membership) return notFound('Assignee not found');
  }

  return null;
}

export async function validateCommentParentForPermit(
  parentCommentId: string | undefined,
  permitId: string,
): Promise<NextResponse | null> {
  if (!parentCommentId) return null;

  const parentComment = await prisma.comment.findFirst({
    where: { id: parentCommentId, permitId },
    select: { id: true },
  });

  if (!parentComment) return notFound('Parent comment not found');

  return null;
}
