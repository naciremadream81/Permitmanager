export type DeadlineSeverity = 'info' | 'warning' | 'critical' | 'overdue';

export interface DeadlineAlert {
  id: string;
  permitId: string;
  title: string;
  dueDate: Date;
  daysUntilDue: number;
  severity: DeadlineSeverity;
}

export function getDaysUntilDue(dueDate: Date | string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diffMs = due.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function getDeadlineSeverity(daysUntilDue: number): DeadlineSeverity {
  if (daysUntilDue < 0) return 'overdue';
  if (daysUntilDue <= 1) return 'critical';
  if (daysUntilDue <= 7) return 'warning';
  return 'info';
}

export function shouldNotify(daysUntilDue: number, reminderDays: number[]): boolean {
  return reminderDays.includes(daysUntilDue) || daysUntilDue === 0 || daysUntilDue < 0;
}

export function getDocumentExpiryAlerts(
  documents: Array<{
    id: string;
    name: string;
    expirationDate?: Date | null;
    permitId?: string | null;
  }>,
  warningDays = 30,
): Array<{
  documentId: string;
  documentName: string;
  permitId?: string;
  expirationDate: Date;
  daysUntilExpiry: number;
  severity: DeadlineSeverity;
}> {
  const alerts = [];
  for (const doc of documents) {
    if (!doc.expirationDate) continue;
    const days = getDaysUntilDue(doc.expirationDate);
    if (days <= warningDays) {
      alerts.push({
        documentId: doc.id,
        documentName: doc.name,
        permitId: doc.permitId ?? undefined,
        expirationDate: new Date(doc.expirationDate),
        daysUntilExpiry: days,
        severity: getDeadlineSeverity(days),
      });
    }
  }
  return alerts.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
}

export function formatDaysRemaining(days: number): string {
  if (days < 0) return `${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} overdue`;
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  if (days < 7) return `Due in ${days} days`;
  if (days < 30) return `Due in ${Math.round(days / 7)} week${Math.round(days / 7) === 1 ? '' : 's'}`;
  return `Due in ${Math.round(days / 30)} month${Math.round(days / 30) === 1 ? '' : 's'}`;
}
