import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, isAuthContext } from '@/lib/api/auth';
import { handleApiError, notFound } from '@/lib/api/errors';
import { generatePermitSummary } from '@permitpro/ai';
import { DocumentStatus, FeeStatus, ChecklistItemStatus } from '@permitpro/shared';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await requireAuth();
    if (!isAuthContext(auth)) return auth;

    const permit = await prisma.permit.findFirst({
      where: { id: params.id, orgId: auth.orgId },
      include: {
        documents: true,
        checklistItems: true,
        fees: true,
        inspections: {
          where: { scheduledDate: { gte: new Date() } },
          orderBy: { scheduledDate: 'asc' },
          take: 5,
        },
        activities: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    });
    if (!permit) return notFound('Permit not found');

    const summary = await generatePermitSummary({
      title: permit.title,
      type: permit.type,
      status: permit.status,
      jurisdiction: permit.jurisdiction ?? '',
      agency: permit.agency ?? '',
      appliedDate: permit.appliedDate?.toISOString(),
      issuedDate: permit.issuedDate?.toISOString(),
      expirationDate: permit.expirationDate?.toISOString(),
      completionPercentage: permit.completionPercentage,
      riskScore: permit.riskScore ?? 0,
      documentCount: permit.documents.length,
      approvedDocuments: permit.documents.filter(d => d.status === DocumentStatus.APPROVED).length,
      pendingDocuments: permit.documents.filter(d => d.status === 'PENDING').length,
      rejectedDocuments: permit.documents.filter(d => d.status === 'REJECTED').length,
      checklistTotal: permit.checklistItems.length,
      checklistCompleted: permit.checklistItems.filter(i => i.status === ChecklistItemStatus.COMPLETED).length,
      checklistBlocked: permit.checklistItems.filter(i => i.status === ChecklistItemStatus.BLOCKED).length,
      pendingFees: permit.fees.filter(f => f.status === FeeStatus.PENDING).length,
      totalFeeAmount: permit.fees
        .filter(f => f.status === FeeStatus.PENDING || f.status === FeeStatus.OVERDUE)
        .reduce((s, f) => s + f.amount, 0),
      upcomingInspections: permit.inspections.map(i => ({
        type: i.type,
        date: i.scheduledDate.toISOString(),
      })),
      recentActivity: permit.activities.map(a => ({
        action: a.action,
        date: a.createdAt.toISOString(),
      })),
    });

    return NextResponse.json(summary);
  } catch (error) {
    return handleApiError(error);
  }
}
