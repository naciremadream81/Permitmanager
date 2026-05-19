import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, isAuthContext } from '@/lib/api/auth';
import { handleApiError } from '@/lib/api/errors';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!isAuthContext(auth)) return auth;

    const q = new URL(request.url).searchParams.get('q')?.trim() ?? '';
    if (q.length < 2) {
      return NextResponse.json({ permits: [], projects: [], documents: [] });
    }

    const ci = { contains: q, mode: 'insensitive' as const };

    const [permits, projects, documents] = await Promise.all([
      prisma.permit.findMany({
        where: {
          orgId: auth.orgId,
          OR: [{ title: ci }, { permitNumber: ci }, { jurisdiction: ci }, { agency: ci }],
        },
        select: { id: true, title: true, type: true, status: true, permitNumber: true },
        take: 5,
      }),
      prisma.project.findMany({
        where: { orgId: auth.orgId, OR: [{ name: ci }, { address: ci }, { city: ci }] },
        select: { id: true, name: true, city: true, state: true },
        take: 5,
      }),
      prisma.document.findMany({
        where: { orgId: auth.orgId, OR: [{ name: ci }, { fileName: ci }] },
        select: { id: true, name: true, category: true, permitId: true },
        take: 5,
      }),
    ]);

    return NextResponse.json({ permits, projects, documents });
  } catch (error) {
    return handleApiError(error);
  }
}
