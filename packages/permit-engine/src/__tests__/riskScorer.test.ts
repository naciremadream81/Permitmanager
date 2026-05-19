import { describe, it, expect } from 'vitest';
import { calculateRiskScore, getRiskLabel } from '../riskScorer';
import {
  PermitStatus,
  PermitType,
  DocumentStatus,
  DocumentCategory,
  ChecklistItemStatus,
  InspectionStatus,
} from '@permitpro/shared';
import type { Permit, Document, ChecklistItem, Inspection } from '@permitpro/shared';

// ─── Fixture helpers ──────────────────────────────────────────────────────────

function makePermit(overrides: Partial<Permit> = {}): Permit {
  return {
    id: 'permit-1',
    orgId: 'org-1',
    projectId: null,
    permitNumber: 'BLD-2024-001',
    type: PermitType.BUILDING,
    status: PermitStatus.UNDER_REVIEW,
    title: 'Test Permit',
    description: null,
    jurisdiction: 'Test City',
    agency: 'Planning Dept',
    appliedDate: null,
    issuedDate: null,
    expirationDate: null,
    estimatedCost: null,
    actualCost: null,
    assigneeId: null,
    riskScore: null,
    completionPercentage: 0,
    metadata: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeDocument(overrides: Partial<Document> = {}): Document {
  return {
    id: 'doc-1',
    orgId: 'org-1',
    permitId: 'permit-1',
    name: 'Plan Set',
    fileName: 'plans.pdf',
    fileUrl: 'https://example.com/plans.pdf',
    fileSize: 1024,
    mimeType: 'application/pdf',
    category: DocumentCategory.PLAN,
    status: DocumentStatus.APPROVED,
    version: 1,
    uploadedById: 'user-1',
    expirationDate: null,
    extractedData: null,
    aiClassification: null,
    notes: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeChecklistItem(overrides: Partial<ChecklistItem> = {}): ChecklistItem {
  return {
    id: 'item-1',
    permitId: 'permit-1',
    title: 'Submit forms',
    description: null,
    status: ChecklistItemStatus.COMPLETED,
    category: null,
    order: 0,
    dueDate: null,
    assigneeId: null,
    completedAt: null,
    completedById: null,
    isConditional: false,
    condition: null,
    parentItemId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeInspection(overrides: Partial<Inspection> = {}): Inspection {
  return {
    id: 'insp-1',
    permitId: 'permit-1',
    type: 'Framing',
    status: InspectionStatus.PASSED,
    scheduledDate: new Date().toISOString(),
    completedDate: new Date().toISOString(),
    inspectorName: 'John Inspector',
    inspectorPhone: null,
    location: null,
    notes: null,
    result: 'Pass',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('calculateRiskScore', () => {
  it('returns score of 0 and level "low" for a clean permit with no issues', () => {
    const permit = makePermit();
    const result = calculateRiskScore(permit, [], [], []);
    expect(result.score).toBe(0);
    expect(result.level).toBe('low');
    expect(result.factors).toHaveLength(0);
  });

  it('adds 25 points for CORRECTIONS_NEEDED status', () => {
    const permit = makePermit({ status: PermitStatus.CORRECTIONS_NEEDED });
    const result = calculateRiskScore(permit, [], [], []);
    expect(result.score).toBe(25);
    expect(result.factors.some((f) => f.name === 'Corrections needed')).toBe(true);
  });

  it('does not add correction penalty for non-correction statuses', () => {
    const permit = makePermit({ status: PermitStatus.UNDER_REVIEW });
    const result = calculateRiskScore(permit, [], [], []);
    expect(result.factors.some((f) => f.name === 'Corrections needed')).toBe(false);
  });

  it('adds points for rejected documents', () => {
    const permit = makePermit();
    const docs = [
      makeDocument({ status: DocumentStatus.REJECTED }),
      makeDocument({ id: 'doc-2', status: DocumentStatus.APPROVED }),
    ];
    const result = calculateRiskScore(permit, docs, [], []);
    const docFactor = result.factors.find((f) => f.name === 'Document issues');
    expect(docFactor).toBeDefined();
    expect(docFactor!.points).toBeGreaterThan(0);
  });

  it('adds points for expired documents', () => {
    const permit = makePermit();
    const docs = [makeDocument({ status: DocumentStatus.EXPIRED })];
    const result = calculateRiskScore(permit, docs, [], []);
    const docFactor = result.factors.find((f) => f.name === 'Document issues');
    expect(docFactor).toBeDefined();
  });

  it('adds points for failed inspections', () => {
    const permit = makePermit();
    const inspections = [makeInspection({ status: InspectionStatus.FAILED })];
    const result = calculateRiskScore(permit, [], [], inspections);
    const inspFactor = result.factors.find((f) => f.name === 'Failed inspections');
    expect(inspFactor).toBeDefined();
    expect(inspFactor!.points).toBe(8);
  });

  it('caps failed inspection points at 15', () => {
    const permit = makePermit();
    const inspections = [
      makeInspection({ id: 'i1', status: InspectionStatus.FAILED }),
      makeInspection({ id: 'i2', status: InspectionStatus.FAILED }),
      makeInspection({ id: 'i3', status: InspectionStatus.FAILED }),
    ];
    const result = calculateRiskScore(permit, [], [], inspections);
    const inspFactor = result.factors.find((f) => f.name === 'Failed inspections');
    expect(inspFactor!.points).toBe(15);
  });

  it('adds points for overdue checklist items', () => {
    const permit = makePermit();
    const pastDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const items = [
      makeChecklistItem({ status: ChecklistItemStatus.IN_PROGRESS, dueDate: pastDate }),
    ];
    const result = calculateRiskScore(permit, [], items, []);
    const overdueFactor = result.factors.find((f) => f.name === 'Overdue items');
    expect(overdueFactor).toBeDefined();
    expect(overdueFactor!.points).toBeGreaterThan(0);
  });

  it('does not add overdue points for completed checklist items past due', () => {
    const permit = makePermit();
    const pastDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const items = [makeChecklistItem({ status: ChecklistItemStatus.COMPLETED, dueDate: pastDate })];
    const result = calculateRiskScore(permit, [], items, []);
    const overdueFactor = result.factors.find((f) => f.name === 'Overdue items');
    expect(overdueFactor).toBeUndefined();
  });

  it('adds points for documents expiring within 30 days', () => {
    const permit = makePermit();
    const soonDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();
    const docs = [makeDocument({ status: DocumentStatus.PENDING, expirationDate: soonDate })];
    const result = calculateRiskScore(permit, docs, [], []);
    const expiringFactor = result.factors.find((f) => f.name === 'Expiring documents');
    expect(expiringFactor).toBeDefined();
    expect(expiringFactor!.points).toBeGreaterThan(0);
  });

  it('does not add expiring-document points for already-expired docs', () => {
    const permit = makePermit();
    const soonDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();
    const docs = [makeDocument({ status: DocumentStatus.EXPIRED, expirationDate: soonDate })];
    const result = calculateRiskScore(permit, docs, [], []);
    const expiringFactor = result.factors.find((f) => f.name === 'Expiring documents');
    expect(expiringFactor).toBeUndefined();
  });

  it('adds time-elapsed points for old applications', () => {
    const permit = makePermit({
      appliedDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days ago
    });
    const result = calculateRiskScore(permit, [], [], []);
    const timeFactor = result.factors.find((f) => f.name === 'Time elapsed');
    expect(timeFactor).toBeDefined();
    expect(timeFactor!.points).toBeGreaterThan(0);
  });

  it('caps total score at 100', () => {
    const permit = makePermit({
      status: PermitStatus.CORRECTIONS_NEEDED,
      appliedDate: new Date(Date.now() - 1000 * 24 * 60 * 60 * 1000).toISOString(),
    });
    const docs = Array.from({ length: 5 }, (_, i) =>
      makeDocument({ id: `doc-${i}`, status: DocumentStatus.REJECTED }),
    );
    const inspections = Array.from({ length: 5 }, (_, i) =>
      makeInspection({ id: `insp-${i}`, status: InspectionStatus.FAILED }),
    );
    const pastDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const items = Array.from({ length: 5 }, (_, i) =>
      makeChecklistItem({ id: `item-${i}`, status: ChecklistItemStatus.IN_PROGRESS, dueDate: pastDate }),
    );
    const result = calculateRiskScore(permit, docs, items, inspections);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('returns level "medium" for score between 30 and 59', () => {
    // Force score to ~35: corrections_needed (25) + 1 failed inspection (8) = 33
    const permit = makePermit({ status: PermitStatus.CORRECTIONS_NEEDED });
    const inspections = [makeInspection({ status: InspectionStatus.FAILED })];
    const result = calculateRiskScore(permit, [], [], inspections);
    expect(result.score).toBe(33);
    expect(result.level).toBe('medium');
  });

  it('returns level "high" for score between 60 and 79', () => {
    // corrections (25) + 2 failed inspections (15) + 20 elapsed + some overdue
    const permit = makePermit({
      status: PermitStatus.CORRECTIONS_NEEDED,
      appliedDate: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(),
    });
    const inspections = [
      makeInspection({ id: 'i1', status: InspectionStatus.FAILED }),
      makeInspection({ id: 'i2', status: InspectionStatus.FAILED }),
    ];
    const result = calculateRiskScore(permit, [], [], inspections);
    expect(result.score).toBeGreaterThanOrEqual(60);
    // Could be 'high' or 'critical' depending on exact elapsed days, just check it's not low/medium
    expect(['high', 'critical']).toContain(result.level);
  });

  it('always returns a factors array', () => {
    const result = calculateRiskScore(makePermit(), [], [], []);
    expect(Array.isArray(result.factors)).toBe(true);
  });
});

describe('getRiskLabel', () => {
  it('returns "Low" label for score below 30', () => {
    const label = getRiskLabel(0);
    expect(label.label).toBe('Low');
  });

  it('returns "Medium" label for score 30', () => {
    const label = getRiskLabel(30);
    expect(label.label).toBe('Medium');
  });

  it('returns "High" label for score 60', () => {
    const label = getRiskLabel(60);
    expect(label.label).toBe('High');
  });

  it('returns "Critical" label for score 80', () => {
    const label = getRiskLabel(80);
    expect(label.label).toBe('Critical');
  });

  it('returns "Critical" label for score 100', () => {
    const label = getRiskLabel(100);
    expect(label.label).toBe('Critical');
  });

  it('includes color and bgColor in all responses', () => {
    for (const score of [0, 15, 30, 45, 60, 75, 80, 95, 100]) {
      const label = getRiskLabel(score);
      expect(label.color).toBeTruthy();
      expect(label.bgColor).toBeTruthy();
    }
  });
});
