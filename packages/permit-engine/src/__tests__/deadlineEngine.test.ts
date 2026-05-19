import { describe, it, expect } from 'vitest';
import {
  getDaysUntilDue,
  getDeadlineSeverity,
  shouldNotify,
  getDocumentExpiryAlerts,
  formatDaysRemaining,
} from '../deadlineEngine';

// ─── getDaysUntilDue ──────────────────────────────────────────────────────────

describe('getDaysUntilDue', () => {
  it('returns 0 for today', () => {
    const today = new Date();
    const result = getDaysUntilDue(today);
    expect(result).toBe(0);
  });

  it('returns positive number for a future date', () => {
    const future = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
    const result = getDaysUntilDue(future);
    expect(result).toBeGreaterThan(0);
  });

  it('returns negative number for a past date', () => {
    const past = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const result = getDaysUntilDue(past);
    expect(result).toBeLessThan(0);
  });

  it('returns roughly 7 for a date 7 days out', () => {
    const sevenDays = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const result = getDaysUntilDue(sevenDays);
    expect(result).toBe(7);
  });

  it('accepts ISO string dates', () => {
    const future = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();
    const result = getDaysUntilDue(future);
    expect(result).toBeGreaterThan(0);
  });
});

// ─── getDeadlineSeverity ──────────────────────────────────────────────────────

describe('getDeadlineSeverity', () => {
  it('returns "overdue" for negative days', () => {
    expect(getDeadlineSeverity(-1)).toBe('overdue');
    expect(getDeadlineSeverity(-30)).toBe('overdue');
  });

  it('returns "critical" for 0 days', () => {
    expect(getDeadlineSeverity(0)).toBe('critical');
  });

  it('returns "critical" for 1 day', () => {
    expect(getDeadlineSeverity(1)).toBe('critical');
  });

  it('returns "warning" for 2–7 days', () => {
    expect(getDeadlineSeverity(2)).toBe('warning');
    expect(getDeadlineSeverity(7)).toBe('warning');
  });

  it('returns "info" for 8+ days', () => {
    expect(getDeadlineSeverity(8)).toBe('info');
    expect(getDeadlineSeverity(30)).toBe('info');
    expect(getDeadlineSeverity(365)).toBe('info');
  });
});

// ─── shouldNotify ─────────────────────────────────────────────────────────────

describe('shouldNotify', () => {
  it('returns true when daysUntilDue is in reminderDays', () => {
    expect(shouldNotify(7, [7, 1])).toBe(true);
    expect(shouldNotify(1, [7, 1])).toBe(true);
  });

  it('returns true when daysUntilDue is 0 (due today)', () => {
    expect(shouldNotify(0, [7, 1])).toBe(true);
  });

  it('returns true when daysUntilDue is negative (overdue)', () => {
    expect(shouldNotify(-1, [7, 1])).toBe(true);
    expect(shouldNotify(-5, [])).toBe(true);
  });

  it('returns false when daysUntilDue is not in reminderDays and not overdue', () => {
    expect(shouldNotify(14, [7, 1])).toBe(false);
    expect(shouldNotify(30, [7, 1])).toBe(false);
  });

  it('returns false for future date with empty reminderDays', () => {
    expect(shouldNotify(5, [])).toBe(false);
  });
});

// ─── getDocumentExpiryAlerts ──────────────────────────────────────────────────

describe('getDocumentExpiryAlerts', () => {
  it('returns empty array when no documents have expiration dates', () => {
    const docs = [{ id: 'doc-1', name: 'Plan', expirationDate: null }];
    expect(getDocumentExpiryAlerts(docs)).toEqual([]);
  });

  it('returns an alert for a document expiring within 30 days', () => {
    const soon = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
    const docs = [{ id: 'doc-1', name: 'Insurance', expirationDate: soon, permitId: 'permit-1' }];
    const alerts = getDocumentExpiryAlerts(docs);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].documentId).toBe('doc-1');
    expect(alerts[0].documentName).toBe('Insurance');
    expect(alerts[0].permitId).toBe('permit-1');
  });

  it('does not return an alert for a document expiring after the warningDays threshold', () => {
    const far = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
    const docs = [{ id: 'doc-1', name: 'Plan', expirationDate: far }];
    expect(getDocumentExpiryAlerts(docs)).toHaveLength(0);
  });

  it('respects custom warningDays', () => {
    const in45Days = new Date(Date.now() + 45 * 24 * 60 * 60 * 1000);
    const docs = [{ id: 'doc-1', name: 'Plan', expirationDate: in45Days }];
    expect(getDocumentExpiryAlerts(docs, 30)).toHaveLength(0);
    expect(getDocumentExpiryAlerts(docs, 60)).toHaveLength(1);
  });

  it('returns alerts sorted by daysUntilExpiry ascending', () => {
    const soon = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
    const sooner = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    const docs = [
      { id: 'doc-1', name: 'Late', expirationDate: soon },
      { id: 'doc-2', name: 'Early', expirationDate: sooner },
    ];
    const alerts = getDocumentExpiryAlerts(docs);
    expect(alerts[0].documentId).toBe('doc-2');
    expect(alerts[1].documentId).toBe('doc-1');
  });

  it('includes correct severity in alerts', () => {
    const overdue = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
    const critical = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000);
    const warning = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
    const docs = [
      { id: 'doc-1', name: 'Overdue', expirationDate: overdue },
      { id: 'doc-2', name: 'Critical', expirationDate: critical },
      { id: 'doc-3', name: 'Warning', expirationDate: warning },
    ];
    const alerts = getDocumentExpiryAlerts(docs, 30);
    const overdueAlert = alerts.find((a) => a.documentId === 'doc-1');
    const criticalAlert = alerts.find((a) => a.documentId === 'doc-2');
    const warningAlert = alerts.find((a) => a.documentId === 'doc-3');
    expect(overdueAlert?.severity).toBe('overdue');
    expect(criticalAlert?.severity).toBe('critical');
    expect(warningAlert?.severity).toBe('warning');
  });

  it('handles undefined permitId gracefully', () => {
    const soon = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
    const docs = [{ id: 'doc-1', name: 'Plan', expirationDate: soon }];
    const alerts = getDocumentExpiryAlerts(docs);
    expect(alerts[0].permitId).toBeUndefined();
  });
});

// ─── formatDaysRemaining ──────────────────────────────────────────────────────

describe('formatDaysRemaining', () => {
  it('formats overdue day count', () => {
    expect(formatDaysRemaining(-1)).toBe('1 day overdue');
    expect(formatDaysRemaining(-3)).toBe('3 days overdue');
  });

  it('returns "Due today" for 0', () => {
    expect(formatDaysRemaining(0)).toBe('Due today');
  });

  it('returns "Due tomorrow" for 1', () => {
    expect(formatDaysRemaining(1)).toBe('Due tomorrow');
  });

  it('returns "Due in N days" for 2–6 days', () => {
    expect(formatDaysRemaining(3)).toBe('Due in 3 days');
    expect(formatDaysRemaining(6)).toBe('Due in 6 days');
  });

  it('returns weeks format for 7–29 days', () => {
    const result = formatDaysRemaining(14);
    expect(result).toMatch(/week/);
  });

  it('returns months format for 30+ days', () => {
    const result = formatDaysRemaining(60);
    expect(result).toMatch(/month/);
  });

  it('uses singular "week" for exactly 1 week', () => {
    expect(formatDaysRemaining(7)).toBe('Due in 1 week');
  });

  it('uses singular "month" for exactly 1 month', () => {
    expect(formatDaysRemaining(30)).toBe('Due in 1 month');
  });
});
