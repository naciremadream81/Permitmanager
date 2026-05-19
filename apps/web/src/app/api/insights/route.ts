import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, isAuthContext } from '@/lib/api/auth';
import { handleApiError } from '@/lib/api/errors';
import { generateRuleBasedInsights } from '@permitpro/ai';
import { getDaysUntilDue } from '@permitpro/permit-engine';

export async function GET() {
  try {
    const auth = await requireAuth();
    if (!isAuthContext(auth)) return auth;

    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const permitIds = (
      await prisma.permit.findMany({
        where: { orgId: auth.orgId },
        select: { id: true },
      })
    ).map(p => p.id);

    const [permits, expiringDocs, upcomingDeadlines, overdueItems, overdueFees] =
      await Promise.all([
        prisma.permit.findMany({
          where: { orgId: auth.orgId, status: { notIn: ['CLOSED', 'EXPIRED', 'REVOKED'] } },
          select: {
            id: true, title: true, status: true, type: true,
            riskScore: true, completionPercentage: true, updatedAt: true,
          },
        }),
        prisma.document.findMany({
          where: {
            orgId: auth.orgId,
            expirationDate: { lte: in30Days, gte: now },
            status: { notIn: ['EXPIRED', 'SUPERSEDED'] },
          },
          include: { permit: { select: { title: true } } },
        }),
        prisma.deadline.findMany({
          where: {
            permitId: { in: permitIds },
            dueDate: { gte: now, lte: in30Days },
            status: 'active',
          },
          include: { permit: { select: { id: true, title: true } } },
        }),
        prisma.checklistItem.findMany({
          where: {
            permit: { orgId: auth.orgId },
            dueDate: { lt: now },
            status: { notIn: ['COMPLETED', 'NOT_APPLICABLE'] },
          },
          include: { permit: { select: { id: true, title: true } } },
        }),
        prisma.fee.findMany({
          where: {
            permit: { orgId: auth.orgId },
            dueDate: { lt: now },
            status: 'PENDING',
          },
          include: { permit: { select: { id: true, title: true } } },
        }),
      ]);

    const insights = generateRuleBasedInsights({
      totalPermits: permits.length,
      activePermits: permits.filter(p =>
        ['ACTIVE', 'SUBMITTED', 'UNDER_REVIEW', 'ISSUED'].includes(p.status),
      ).length,
      permitsNeedingAttention: permits.map(p => ({
        id: p.id,
        title: p.title,
        status: p.status,
        type: p.type,
        daysInCurrentStatus: Math.floor(
          (now.getTime() - p.updatedAt.getTime()) / (1000 * 60 * 60 * 24),
        ),
        completionPercentage: p.completionPercentage,
        riskScore: p.riskScore ?? 0,
      })),
      expiringDocuments: expiringDocs.map(d => ({
        id: d.id,
        name: d.name,
        permitTitle: d.permit?.title ?? 'N/A',
        expirationDate: d.expirationDate!.toISOString(),
        daysUntilExpiry: getDaysUntilDue(d.expirationDate!),
      })),
      upcomingDeadlines: upcomingDeadlines.map(d => ({
        permitId: d.permit.id,
        permitTitle: d.permit.title,
        title: d.title,
        dueDate: d.dueDate.toISOString(),
        daysUntilDue: getDaysUntilDue(d.dueDate),
      })),
      overdueItems: overdueItems.map(i => ({
        permitId: i.permit.id,
        permitTitle: i.permit.title,
        itemTitle: i.title,
        daysOverdue: Math.abs(getDaysUntilDue(i.dueDate!)),
      })),
      pendingFees: overdueFees.map(f => ({
        permitId: f.permit.id,
        permitTitle: f.permit.title,
        description: f.description,
        amount: f.amount,
        dueDate: f.dueDate?.toISOString(),
        isOverdue: true,
      })),
    });

    return NextResponse.json({ insights });
  } catch (error) {
    return handleApiError(error);
  }
}
