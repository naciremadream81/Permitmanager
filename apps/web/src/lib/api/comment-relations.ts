import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { notFound } from '@/lib/api/errors';

interface CommentRelationInput {
  parentCommentId?: string;
}

export async function validateCommentRelations(
  data: CommentRelationInput,
  permitId: string,
): Promise<NextResponse | null> {
  if (!data.parentCommentId) return null;

  const parentComment = await prisma.comment.findFirst({
    where: { id: data.parentCommentId, permitId },
    select: { id: true },
  });

  if (!parentComment) return notFound('Parent comment not found');

  return null;
}
