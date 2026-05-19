import { PermitStatus } from '@permitpro/shared';
import { PERMIT_STATUS_TRANSITIONS } from '@permitpro/shared';

export interface TransitionResult {
  success: boolean;
  error?: string;
}

/**
 * Validates whether a permit status transition is allowed.
 * All permit status changes MUST go through this function.
 */
export function validateTransition(from: PermitStatus, to: PermitStatus): TransitionResult {
  const allowed = PERMIT_STATUS_TRANSITIONS[from] ?? [];
  if (!allowed.includes(to)) {
    return {
      success: false,
      error: `Cannot transition from ${from} to ${to}. Allowed: ${allowed.join(', ') || 'none (terminal state)'}`,
    };
  }
  return { success: true };
}

export function getAvailableTransitions(status: PermitStatus): PermitStatus[] {
  return PERMIT_STATUS_TRANSITIONS[status] ?? [];
}

export function isTerminalStatus(status: PermitStatus): boolean {
  return (PERMIT_STATUS_TRANSITIONS[status]?.length ?? 0) === 0;
}

export function isActiveStatus(status: PermitStatus): boolean {
  return [
    PermitStatus.ACTIVE,
    PermitStatus.ISSUED,
    PermitStatus.UNDER_REVIEW,
    PermitStatus.SUBMITTED,
    PermitStatus.PENDING_REVIEW,
  ].includes(status);
}

export function requiresAgencyInteraction(status: PermitStatus): boolean {
  return [
    PermitStatus.SUBMITTED,
    PermitStatus.UNDER_REVIEW,
    PermitStatus.CORRECTIONS_NEEDED,
  ].includes(status);
}
