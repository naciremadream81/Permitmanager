import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, isAuthContext } from '@/lib/api/auth';
import { handleApiError } from '@/lib/api/errors';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!isAuthContext(auth)) return auth;

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unread') === 'true';

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: {
          userId: auth.userId,
          orgId: auth.orgId,
          ...(unreadOnly ? { read: false } : {}),
        },
        orderBy: { sentAt: 'desc' },
        take: 50,
      }),
      prisma.notification.count({
        where: { userId: auth.userId, orgId: auth.orgId, read: false },
      }),
    ]);

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!isAuthContext(auth)) return auth;

    const body = await request.json() as { ids?: string[]; readAll?: boolean };

    if (body.readAll) {
      await prisma.notification.updateMany({
        where: { userId: auth.userId, orgId: auth.orgId, read: false },
        data: { read: true, readAt: new Date() },
      });
    } else if (body.ids?.length) {
      await prisma.notification.updateMany({
        where: { id: { in: body.ids }, userId: auth.userId },
        data: { read: true, readAt: new Date() },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
