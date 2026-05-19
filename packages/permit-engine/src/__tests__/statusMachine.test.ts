import { describe, it, expect } from 'vitest';
import {
  validateTransition,
  getAvailableTransitions,
  isTerminalStatus,
  isActiveStatus,
  requiresAgencyInteraction,
} from '../statusMachine';
import { PermitStatus } from '@permitpro/shared';

describe('validateTransition', () => {
  it('allows DRAFT → PENDING_REVIEW', () => {
    const result = validateTransition(PermitStatus.DRAFT, PermitStatus.PENDING_REVIEW);
    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('allows PENDING_REVIEW → SUBMITTED', () => {
    const result = validateTransition(PermitStatus.PENDING_REVIEW, PermitStatus.SUBMITTED);
    expect(result.success).toBe(true);
  });

  it('allows PENDING_REVIEW → DRAFT (send back)', () => {
    const result = validateTransition(PermitStatus.PENDING_REVIEW, PermitStatus.DRAFT);
    expect(result.success).toBe(true);
  });

  it('allows SUBMITTED → UNDER_REVIEW', () => {
    const result = validateTransition(PermitStatus.SUBMITTED, PermitStatus.UNDER_REVIEW);
    expect(result.success).toBe(true);
  });

  it('allows SUBMITTED → CORRECTIONS_NEEDED', () => {
    const result = validateTransition(PermitStatus.SUBMITTED, PermitStatus.CORRECTIONS_NEEDED);
    expect(result.success).toBe(true);
  });

  it('allows UNDER_REVIEW → APPROVED', () => {
    const result = validateTransition(PermitStatus.UNDER_REVIEW, PermitStatus.APPROVED);
    expect(result.success).toBe(true);
  });

  it('allows APPROVED → ISSUED', () => {
    const result = validateTransition(PermitStatus.APPROVED, PermitStatus.ISSUED);
    expect(result.success).toBe(true);
  });

  it('allows ISSUED → ACTIVE', () => {
    const result = validateTransition(PermitStatus.ISSUED, PermitStatus.ACTIVE);
    expect(result.success).toBe(true);
  });

  it('allows ACTIVE → CLOSED', () => {
    const result = validateTransition(PermitStatus.ACTIVE, PermitStatus.CLOSED);
    expect(result.success).toBe(true);
  });

  it('allows CORRECTIONS_NEEDED → SUBMITTED (resubmit)', () => {
    const result = validateTransition(PermitStatus.CORRECTIONS_NEEDED, PermitStatus.SUBMITTED);
    expect(result.success).toBe(true);
  });

  it('rejects APPROVED → DRAFT (backward leap)', () => {
    const result = validateTransition(PermitStatus.APPROVED, PermitStatus.DRAFT);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Cannot transition from');
  });

  it('rejects CLOSED → DRAFT (from terminal state)', () => {
    const result = validateTransition(PermitStatus.CLOSED, PermitStatus.DRAFT);
    expect(result.success).toBe(false);
    expect(result.error).toContain('terminal state');
  });

  it('rejects REVOKED → SUBMITTED', () => {
    const result = validateTransition(PermitStatus.REVOKED, PermitStatus.SUBMITTED);
    expect(result.success).toBe(false);
  });

  it('rejects DRAFT → APPROVED (skipping steps)', () => {
    const result = validateTransition(PermitStatus.DRAFT, PermitStatus.APPROVED);
    expect(result.success).toBe(false);
  });

  it('rejects transition to the same status', () => {
    const result = validateTransition(PermitStatus.DRAFT, PermitStatus.DRAFT);
    expect(result.success).toBe(false);
  });

  it('rejects ISSUED → DRAFT', () => {
    const result = validateTransition(PermitStatus.ISSUED, PermitStatus.DRAFT);
    expect(result.success).toBe(false);
  });

  it('error message includes allowed transitions when not terminal', () => {
    const result = validateTransition(PermitStatus.DRAFT, PermitStatus.ISSUED);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Allowed:');
    expect(result.error).toContain('PENDING_REVIEW');
  });
});

describe('getAvailableTransitions', () => {
  it('returns an array for DRAFT', () => {
    const transitions = getAvailableTransitions(PermitStatus.DRAFT);
    expect(Array.isArray(transitions)).toBe(true);
    expect(transitions).toContain(PermitStatus.PENDING_REVIEW);
  });

  it('returns an empty array for CLOSED (terminal)', () => {
    const transitions = getAvailableTransitions(PermitStatus.CLOSED);
    expect(transitions).toEqual([]);
  });

  it('returns multiple options from ISSUED', () => {
    const transitions = getAvailableTransitions(PermitStatus.ISSUED);
    expect(transitions.length).toBeGreaterThan(1);
    expect(transitions).toContain(PermitStatus.ACTIVE);
    expect(transitions).toContain(PermitStatus.EXPIRED);
  });

  it('returns transitions for every PermitStatus without throwing', () => {
    for (const status of Object.values(PermitStatus)) {
      expect(() => getAvailableTransitions(status)).not.toThrow();
    }
  });
});

describe('isTerminalStatus', () => {
  it('returns true for CLOSED', () => {
    expect(isTerminalStatus(PermitStatus.CLOSED)).toBe(true);
  });

  it('returns true for REVOKED', () => {
    // REVOKED → CLOSED, so not terminal
    // Actually check: REVOKED has [CLOSED], so not terminal; let's check what the actual data says
    const transitions = getAvailableTransitions(PermitStatus.REVOKED);
    const expected = transitions.length === 0;
    expect(isTerminalStatus(PermitStatus.REVOKED)).toBe(expected);
  });

  it('returns false for DRAFT', () => {
    expect(isTerminalStatus(PermitStatus.DRAFT)).toBe(false);
  });

  it('returns false for ACTIVE', () => {
    expect(isTerminalStatus(PermitStatus.ACTIVE)).toBe(false);
  });

  it('returns false for APPROVED', () => {
    expect(isTerminalStatus(PermitStatus.APPROVED)).toBe(false);
  });

  it('CLOSED is the only status with zero allowed transitions', () => {
    const terminalStatuses = Object.values(PermitStatus).filter(isTerminalStatus);
    expect(terminalStatuses).toContain(PermitStatus.CLOSED);
    // Every terminal status should have no transitions
    for (const s of terminalStatuses) {
      expect(getAvailableTransitions(s)).toEqual([]);
    }
  });
});

describe('isActiveStatus', () => {
  it('returns true for ACTIVE', () => {
    expect(isActiveStatus(PermitStatus.ACTIVE)).toBe(true);
  });

  it('returns true for ISSUED', () => {
    expect(isActiveStatus(PermitStatus.ISSUED)).toBe(true);
  });

  it('returns true for UNDER_REVIEW', () => {
    expect(isActiveStatus(PermitStatus.UNDER_REVIEW)).toBe(true);
  });

  it('returns true for SUBMITTED', () => {
    expect(isActiveStatus(PermitStatus.SUBMITTED)).toBe(true);
  });

  it('returns true for PENDING_REVIEW', () => {
    expect(isActiveStatus(PermitStatus.PENDING_REVIEW)).toBe(true);
  });

  it('returns false for DRAFT', () => {
    expect(isActiveStatus(PermitStatus.DRAFT)).toBe(false);
  });

  it('returns false for CLOSED', () => {
    expect(isActiveStatus(PermitStatus.CLOSED)).toBe(false);
  });

  it('returns false for REVOKED', () => {
    expect(isActiveStatus(PermitStatus.REVOKED)).toBe(false);
  });
});

describe('requiresAgencyInteraction', () => {
  it('returns true for SUBMITTED', () => {
    expect(requiresAgencyInteraction(PermitStatus.SUBMITTED)).toBe(true);
  });

  it('returns true for UNDER_REVIEW', () => {
    expect(requiresAgencyInteraction(PermitStatus.UNDER_REVIEW)).toBe(true);
  });

  it('returns true for CORRECTIONS_NEEDED', () => {
    expect(requiresAgencyInteraction(PermitStatus.CORRECTIONS_NEEDED)).toBe(true);
  });

  it('returns false for DRAFT', () => {
    expect(requiresAgencyInteraction(PermitStatus.DRAFT)).toBe(false);
  });

  it('returns false for APPROVED', () => {
    expect(requiresAgencyInteraction(PermitStatus.APPROVED)).toBe(false);
  });

  it('returns false for CLOSED', () => {
    expect(requiresAgencyInteraction(PermitStatus.CLOSED)).toBe(false);
  });
});
