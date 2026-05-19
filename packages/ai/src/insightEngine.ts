import OpenAI from 'openai';
import { MODELS, TEMPERATURES } from './config';

export type InsightSeverity = 'info' | 'warning' | 'critical';
export type InsightCategory = 'deadline' | 'document' | 'permit' | 'fee' | 'inspection' | 'checklist';

export interface Insight {
  id: string;
  title: string;
  description: string;
  severity: InsightSeverity;
  category: InsightCategory;
  permitId?: string;
  permitTitle?: string;
  actionRequired: string;
  daysUntilDeadline?: number;
  metadata: Record<string, unknown>;
}

export interface OrgSnapshot {
  totalPermits: number;
  activePermits: number;
  permitsNeedingAttention: Array<{
    id: string;
    title: string;
    status: string;
    type: string;
    daysInCurrentStatus: number;
    completionPercentage: number;
    riskScore: number;
  }>;
  expiringDocuments: Array<{
    id: string;
    name: string;
    permitTitle: string;
    expirationDate: string;
    daysUntilExpiry: number;
  }>;
  upcomingDeadlines: Array<{
    permitId: string;
    permitTitle: string;
    title: string;
    dueDate: string;
    daysUntilDue: number;
  }>;
  overdueItems: Array<{
    permitId: string;
    permitTitle: string;
    itemTitle: string;
    daysOverdue: number;
  }>;
  pendingFees: Array<{
    permitId: string;
    permitTitle: string;
    description: string;
    amount: number;
    dueDate?: string;
    isOverdue: boolean;
  }>;
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export function generateRuleBasedInsights(snapshot: OrgSnapshot): Insight[] {
  const insights: Insight[] = [];

  for (const doc of snapshot.expiringDocuments) {
    const severity: InsightSeverity =
      doc.daysUntilExpiry <= 7 ? 'critical' : doc.daysUntilExpiry <= 14 ? 'warning' : 'info';
    insights.push({
      id: `doc-expiry-${doc.id}`,
      title: `Document expiring: ${doc.name}`,
      description: `"${doc.name}" for "${doc.permitTitle}" expires in ${doc.daysUntilExpiry} day${doc.daysUntilExpiry === 1 ? '' : 's'}.`,
      severity,
      category: 'document',
      actionRequired: 'Renew or replace this document before expiry.',
      daysUntilDeadline: doc.daysUntilExpiry,
      metadata: { documentId: doc.id, expirationDate: doc.expirationDate },
    });
  }

  for (const deadline of snapshot.upcomingDeadlines) {
    const severity: InsightSeverity =
      deadline.daysUntilDue <= 1 ? 'critical' : deadline.daysUntilDue <= 7 ? 'warning' : 'info';
    insights.push({
      id: `deadline-${deadline.permitId}-${deadline.title.toLowerCase().replace(/\s+/g, '-').slice(0, 20)}`,
      title: `Deadline: ${deadline.title}`,
      description: `"${deadline.title}" for "${deadline.permitTitle}" due in ${deadline.daysUntilDue} day${deadline.daysUntilDue === 1 ? '' : 's'}.`,
      severity,
      category: 'deadline',
      permitId: deadline.permitId,
      permitTitle: deadline.permitTitle,
      actionRequired: 'Complete the required action before this deadline.',
      daysUntilDeadline: deadline.daysUntilDue,
      metadata: { dueDate: deadline.dueDate },
    });
  }

  for (const item of snapshot.overdueItems) {
    insights.push({
      id: `overdue-${item.permitId}-${item.itemTitle.toLowerCase().replace(/\s+/g, '-').slice(0, 20)}`,
      title: `Overdue: ${item.itemTitle}`,
      description: `"${item.itemTitle}" on "${item.permitTitle}" is ${item.daysOverdue} day${item.daysOverdue === 1 ? '' : 's'} overdue.`,
      severity: 'critical',
      category: 'checklist',
      permitId: item.permitId,
      permitTitle: item.permitTitle,
      actionRequired: 'Complete or update this overdue item immediately.',
      metadata: { daysOverdue: item.daysOverdue },
    });
  }

  for (const permit of snapshot.permitsNeedingAttention) {
    if (
      permit.daysInCurrentStatus > 30 &&
      !['DRAFT', 'CLOSED', 'EXPIRED', 'REVOKED'].includes(permit.status)
    ) {
      insights.push({
        id: `stalled-${permit.id}`,
        title: `Stalled permit: ${permit.title}`,
        description: `"${permit.title}" has been in ${permit.status} for ${permit.daysInCurrentStatus} days.`,
        severity: permit.daysInCurrentStatus > 60 ? 'critical' : 'warning',
        category: 'permit',
        permitId: permit.id,
        permitTitle: permit.title,
        actionRequired: 'Review this permit and take action to advance it.',
        metadata: { status: permit.status, daysInStatus: permit.daysInCurrentStatus },
      });
    }
  }

  for (const fee of snapshot.pendingFees.filter(f => f.isOverdue)) {
    insights.push({
      id: `overdue-fee-${fee.permitId}-${fee.description.toLowerCase().replace(/\s+/g, '-').slice(0, 20)}`,
      title: `Overdue fee: ${fee.description}`,
      description: `$${fee.amount.toLocaleString()} for "${fee.permitTitle}" is past due.`,
      severity: 'critical',
      category: 'fee',
      permitId: fee.permitId,
      permitTitle: fee.permitTitle,
      actionRequired: 'Pay this overdue fee immediately.',
      metadata: { amount: fee.amount, dueDate: fee.dueDate },
    });
  }

  const severityOrder: Record<InsightSeverity, number> = { critical: 0, warning: 1, info: 2 };
  return insights.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
}

export async function generateAIInsightSummary(snapshot: OrgSnapshot): Promise<string> {
  const summary = {
    totalPermits: snapshot.totalPermits,
    activePermits: snapshot.activePermits,
    criticalIssues:
      snapshot.expiringDocuments.filter(d => d.daysUntilExpiry <= 7).length +
      snapshot.overdueItems.length,
    stalledPermits: snapshot.permitsNeedingAttention.filter(p => p.daysInCurrentStatus > 30).length,
    upcomingDeadlines: snapshot.upcomingDeadlines.length,
  };

  try {
    const response = await openai.chat.completions.create({
      model: MODELS.analysis,
      messages: [
        {
          role: 'system',
          content:
            'You are a permit coordinator providing a weekly digest summary. Be direct and actionable. 3-4 sentences max.',
        },
        {
          role: 'user',
          content: `Portfolio snapshot:\n${JSON.stringify(summary, null, 2)}\n\nProvide an executive summary of top priorities for this week.`,
        },
      ],
      temperature: TEMPERATURES.generation,
      max_tokens: 300,
    });

    return response.choices[0].message.content ?? 'Unable to generate AI summary.';
  } catch {
    return `You have ${snapshot.totalPermits} permits in your portfolio, ${snapshot.activePermits} active. ${summary.criticalIssues} critical issues require immediate attention.`;
  }
}
