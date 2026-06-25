import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, isAuthContext } from '@/lib/api/auth';
import { badRequest, handleApiError, notFound } from '@/lib/api/errors';
import { CreateCommentSchema } from '@permitpro/shared';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await requireAuth();
    if (!isAuthContext(auth)) return auth;

    const permit = await prisma.permit.findFirst({ where: { id: params.id, orgId: auth.orgId } });
    if (!permit) return notFound('Permit not found');

    const comments = await prisma.comment.findMany({
      where: { permitId: params.id, parentCommentId: null },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        replies: {
          where: { permitId: params.id },
          include: { user: { select: { id: true, name: true, avatar: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(comments);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await requireAuth();
    if (!isAuthContext(auth)) return auth;

    const permit = await prisma.permit.findFirst({ where: { id: params.id, orgId: auth.orgId } });
    if (!permit) return notFound('Permit not found');

    const body = await request.json() as unknown;
    const data = CreateCommentSchema.parse(body);
    if (data.parentCommentId) {
      const parent = await prisma.comment.findFirst({
        where: { id: data.parentCommentId, permitId: params.id },
        select: { id: true },
      });

      if (!parent) {
        return badRequest('Parent comment not found');
      }
    }

    const comment = await prisma.comment.create({
      data: { ...data, permitId: params.id, userId: auth.userId },
      include: { user: { select: { id: true, name: true, avatar: true } } },
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
