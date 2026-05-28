import type { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { AuthContext } from '@/lib/api/auth';
import { notFound } from '@/lib/api/errors';

interface ChecklistRelationInput {
  assigneeId?: string;
  parentItemId?: string;
}

export async function validateChecklistItemRelations(
  data: ChecklistRelationInput,
  permitId: string,
  auth: Pick<AuthContext, 'orgId'>,
): Promise<NextResponse | null> {
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

  if (data.parentItemId) {
    const parentItem = await prisma.checklistItem.findFirst({
      where: { id: data.parentItemId, permitId },
      select: { id: true },
    });

    if (!parentItem) return notFound('Parent checklist item not found');
  }

  return null;
}
