import { Permit, Document, ChecklistItem, Inspection } from '@permitpro/shared';
import { PermitStatus, DocumentStatus, ChecklistItemStatus, InspectionStatus } from '@permitpro/shared';
import { RISK_SCORE_THRESHOLDS } from '@permitpro/shared';

export interface RiskBreakdown {
  score: number;
  level: 'low' | 'medium' | 'high' | 'critical';
  factors: Array<{ name: string; points: number; description: string }>;
}

/**
 * Calculates a 0-100 risk score for a permit.
 * Higher score = higher risk.
 */
export function calculateRiskScore(
  permit: Permit,
  documents: Document[],
  checklistItems: ChecklistItem[],
  inspections: Inspection[],
): RiskBreakdown {
  const factors: Array<{ name: string; points: number; description: string }> = [];
  let score = 0;

  // Days elapsed since application (max 20 points)
  if (permit.appliedDate) {
    const daysElapsed = Math.floor(
      (Date.now() - new Date(permit.appliedDate).getTime()) / (1000 * 60 * 60 * 24),
    );
    const points = Math.min(20, Math.floor(daysElapsed / 30) * 3);
    if (points > 0) {
      score += points;
      factors.push({
        name: 'Time elapsed',
        points,
        description: `${daysElapsed} days since application`,
      });
    }
  }

  // Corrections received (25 points)
  if (permit.status === PermitStatus.CORRECTIONS_NEEDED) {
    score += 25;
    factors.push({
      name: 'Corrections needed',
      points: 25,
      description: 'Agency requested corrections',
    });
  }

  // Document issues (max 20 points)
  if (documents.length > 0) {
    const problematic = documents.filter(
      (d) => d.status === DocumentStatus.REJECTED || d.status === DocumentStatus.EXPIRED,
    ).length;
    const points = Math.round((problematic / documents.length) * 20);
    if (points > 0) {
      score += points;
      factors.push({
        name: 'Document issues',
        points,
        description: `${problematic} rejected or expired document${problematic === 1 ? '' : 's'}`,
      });
    }
  }

  // Failed inspections (max 15 points)
  const failedInspections = inspections.filter((i) => i.status === InspectionStatus.FAILED).length;
  if (failedInspections > 0) {
    const points = Math.min(15, failedInspections * 8);
    score += points;
    factors.push({
      name: 'Failed inspections',
      points,
      description: `${failedInspections} failed inspection${failedInspections === 1 ? '' : 's'}`,
    });
  }

  // Overdue checklist items (max 10 points)
  const now = new Date();
  const overdue = checklistItems.filter(
    (i) =>
      i.dueDate &&
      new Date(i.dueDate) < now &&
      i.status !== ChecklistItemStatus.COMPLETED,
  ).length;
  if (overdue > 0) {
    const points = Math.min(10, overdue * 3);
    score += points;
    factors.push({
      name: 'Overdue items',
      points,
      description: `${overdue} overdue checklist item${overdue === 1 ? '' : 's'}`,
    });
  }

  // Expiring documents (max 10 points)
  const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const expiring = documents.filter(
    (d) =>
      d.expirationDate &&
      new Date(d.expirationDate) < thirtyDaysFromNow &&
      d.status !== DocumentStatus.EXPIRED,
  ).length;
  if (expiring > 0) {
    const points = Math.min(10, expiring * 4);
    score += points;
    factors.push({
      name: 'Expiring documents',
      points,
      description: `${expiring} document${expiring === 1 ? '' : 's'} expiring within 30 days`,
    });
  }

  const finalScore = Math.min(100, score);
  const level =
    finalScore >= RISK_SCORE_THRESHOLDS.high
      ? 'critical'
      : finalScore >= RISK_SCORE_THRESHOLDS.medium
        ? 'high'
        : finalScore >= RISK_SCORE_THRESHOLDS.low
          ? 'medium'
          : 'low';

  return { score: finalScore, level, factors };
}

export function getRiskLabel(score: number): { label: string; color: string; bgColor: string } {
  if (score >= RISK_SCORE_THRESHOLDS.high)
    return { label: 'Critical', color: '#DC2626', bgColor: 'bg-red-100' };
  if (score >= RISK_SCORE_THRESHOLDS.medium)
    return { label: 'High', color: '#EF4444', bgColor: 'bg-red-50' };
  if (score >= RISK_SCORE_THRESHOLDS.low)
    return { label: 'Medium', color: '#F59E0B', bgColor: 'bg-amber-50' };
  return { label: 'Low', color: '#10B981', bgColor: 'bg-green-50' };
}
