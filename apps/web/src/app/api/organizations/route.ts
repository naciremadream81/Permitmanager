import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, isAuthContext } from '@/lib/api/auth';
import { handleApiError } from '@/lib/api/errors';
import { z } from 'zod';

const CreateOrgSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only'),
});

export async function GET() {
  try {
    const auth = await requireAuth();
    if (!isAuthContext(auth)) return auth;

    const org = await prisma.organization.findUnique({
      where: { id: auth.orgId },
      include: {
        memberships: {
          include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
          orderBy: { joinedAt: 'asc' },
        },
        _count: { select: { permits: true, projects: true, documents: true } },
      },
    });

    return NextResponse.json(org);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!isAuthContext(auth)) return auth;

    const body = await request.json() as unknown;
    const data = CreateOrgSchema.parse(body);

    const org = await prisma.organization.create({
      data: {
        ...data,
        memberships: {
          create: { userId: auth.userId, role: 'OWNER', joinedAt: new Date() },
        },
      },
    });

    return NextResponse.json(org, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
