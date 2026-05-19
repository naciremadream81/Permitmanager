import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getDaysUntilDue, shouldNotify } from '@permitpro/permit-engine';
import { DEFAULT_REMINDER_DAYS, DOCUMENT_EXPIRY_REMINDER_DAYS } from '@permitpro/shared';

export async function GET(request: Request) {
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const toCreate: Array<{
      userId: string; orgId: string; type: string;
      title: string; body: string; data: object;
    }> = [];

    // Scan deadlines
    const deadlines = await prisma.deadline.findMany({
      where: { dueDate: { lte: in30Days }, status: 'active' },
      include: { permit: { select: { id: true, title: true, orgId: true } } },
    });

    for (const dl of deadlines) {
      const days = getDaysUntilDue(dl.dueDate);
      const reminders = dl.reminderDays?.length ? dl.reminderDays : DEFAULT_REMINDER_DAYS;
      if (!shouldNotify(days, reminders)) continue;

      const members = await prisma.orgMembership.findMany({
        where: { orgId: dl.permit.orgId, role: { in: ['OWNER', 'ADMIN', 'COORDINATOR'] } },
      });
      for (const m of members) {
        toCreate.push({
          userId: m.userId,
          orgId: dl.permit.orgId,
          type: 'DEADLINE_APPROACHING',
          title: `Deadline in ${days} day${days === 1 ? '' : 's'}: ${dl.title}`,
          body: `"${dl.title}" for "${dl.permit.title}" is due ${days <= 0 ? 'today' : `in ${days} day${days === 1 ? '' : 's'}`}.`,
          data: { deadlineId: dl.id, permitId: dl.permit.id, daysUntil: days },
        });
      }
    }

    // Scan expiring documents
    const expiringDocs = await prisma.document.findMany({
      where: {
        expirationDate: { gte: now, lte: in30Days },
        status: { notIn: ['EXPIRED', 'SUPERSEDED'] },
      },
      include: { permit: { select: { title: true } } },
    });

    for (const doc of expiringDocs) {
      const days = getDaysUntilDue(doc.expirationDate!);
      if (!shouldNotify(days, DOCUMENT_EXPIRY_REMINDER_DAYS)) continue;

      const members = await prisma.orgMembership.findMany({
        where: { orgId: doc.orgId, role: { in: ['OWNER', 'ADMIN', 'COORDINATOR'] } },
      });
      for (const m of members) {
        toCreate.push({
          userId: m.userId,
          orgId: doc.orgId,
          type: 'DOCUMENT_EXPIRING',
          title: `Document expiring: ${doc.name}`,
          body: `"${doc.name}" expires in ${days} day${days === 1 ? '' : 's'}.`,
          data: { documentId: doc.id, permitId: doc.permitId, daysUntil: days },
        });
      }
    }

    if (toCreate.length > 0) {
      await prisma.notification.createMany({ data: toCreate as Parameters<typeof prisma.notification.createMany>[0]['data'] });
    }

    return NextResponse.json({
      success: true,
      deadlinesScanned: deadlines.length,
      docsScanned: expiringDocs.length,
      notificationsCreated: toCreate.length,
    });
  } catch (err) {
    console.error('[cron/scan-deadlines]', err);
    return NextResponse.json({ error: 'Cron failed' }, { status: 500 });
  }
}
