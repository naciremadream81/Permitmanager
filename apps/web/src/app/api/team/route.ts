import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, isAuthContext } from '@/lib/api/auth';
import { handleApiError, forbidden } from '@/lib/api/errors';
import { InviteMemberSchema } from '@permitpro/shared';

export async function GET() {
  try {
    const auth = await requireAuth();
    if (!isAuthContext(auth)) return auth;

    const members = await prisma.orgMembership.findMany({
      where: { orgId: auth.orgId },
      include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
      orderBy: { joinedAt: 'asc' },
    });

    return NextResponse.json(members);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!isAuthContext(auth)) return auth;

    if (!['OWNER', 'ADMIN'].includes(auth.role)) {
      return forbidden('Only owners and admins can invite team members');
    }

    const body = await request.json() as unknown;
    const { email, role } = InviteMemberSchema.parse(body);

    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: { email, name: email.split('@')[0] },
      });
    }

    const existing = await prisma.orgMembership.findUnique({
      where: { userId_orgId: { userId: user.id, orgId: auth.orgId } },
    });
    if (existing) {
      return NextResponse.json({ error: 'User is already a member' }, { status: 409 });
    }

    const membership = await prisma.orgMembership.create({
      data: { userId: user.id, orgId: auth.orgId, role },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    return NextResponse.json(membership, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
