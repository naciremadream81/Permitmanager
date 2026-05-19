import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PermitStatusBadge } from '../../components/permits/PermitStatusBadge';
import { PermitStatus } from '@permitpro/shared';
import { PERMIT_STATUS_CONFIG } from '@permitpro/shared';

describe('PermitStatusBadge', () => {
  const allStatuses = Object.values(PermitStatus);

  it('renders without errors for every PermitStatus', () => {
    for (const status of allStatuses) {
      const { unmount } = render(<PermitStatusBadge status={status} />);
      unmount();
    }
  });

  it('displays the correct label for DRAFT', () => {
    render(<PermitStatusBadge status={PermitStatus.DRAFT} />);
    expect(screen.getByText('Draft')).toBeInTheDocument();
  });

  it('displays the correct label for SUBMITTED', () => {
    render(<PermitStatusBadge status={PermitStatus.SUBMITTED} />);
    expect(screen.getByText('Submitted')).toBeInTheDocument();
  });

  it('displays the correct label for UNDER_REVIEW', () => {
    render(<PermitStatusBadge status={PermitStatus.UNDER_REVIEW} />);
    expect(screen.getByText('Under Review')).toBeInTheDocument();
  });

  it('displays the correct label for CORRECTIONS_NEEDED', () => {
    render(<PermitStatusBadge status={PermitStatus.CORRECTIONS_NEEDED} />);
    expect(screen.getByText('Corrections Needed')).toBeInTheDocument();
  });

  it('displays the correct label for APPROVED', () => {
    render(<PermitStatusBadge status={PermitStatus.APPROVED} />);
    expect(screen.getByText('Approved')).toBeInTheDocument();
  });

  it('displays the correct label for ISSUED', () => {
    render(<PermitStatusBadge status={PermitStatus.ISSUED} />);
    expect(screen.getByText('Issued')).toBeInTheDocument();
  });

  it('displays the correct label for ACTIVE', () => {
    render(<PermitStatusBadge status={PermitStatus.ACTIVE} />);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('displays the correct label for EXPIRED', () => {
    render(<PermitStatusBadge status={PermitStatus.EXPIRED} />);
    expect(screen.getByText('Expired')).toBeInTheDocument();
  });

  it('displays the correct label for SUSPENDED', () => {
    render(<PermitStatusBadge status={PermitStatus.SUSPENDED} />);
    expect(screen.getByText('Suspended')).toBeInTheDocument();
  });

  it('displays the correct label for REVOKED', () => {
    render(<PermitStatusBadge status={PermitStatus.REVOKED} />);
    expect(screen.getByText('Revoked')).toBeInTheDocument();
  });

  it('displays the correct label for CLOSED', () => {
    render(<PermitStatusBadge status={PermitStatus.CLOSED} />);
    expect(screen.getByText('Closed')).toBeInTheDocument();
  });

  it('displays the correct label for PENDING_REVIEW', () => {
    render(<PermitStatusBadge status={PermitStatus.PENDING_REVIEW} />);
    expect(screen.getByText('Pending Review')).toBeInTheDocument();
  });

  it('applies bgColor CSS class from PERMIT_STATUS_CONFIG', () => {
    render(<PermitStatusBadge status={PermitStatus.DRAFT} />);
    const badge = screen.getByText('Draft');
    expect(badge.className).toContain(PERMIT_STATUS_CONFIG[PermitStatus.DRAFT].bgColor);
  });

  it('applies textColor CSS class from PERMIT_STATUS_CONFIG', () => {
    render(<PermitStatusBadge status={PermitStatus.APPROVED} />);
    const badge = screen.getByText('Approved');
    expect(badge.className).toContain(PERMIT_STATUS_CONFIG[PermitStatus.APPROVED].textColor);
  });

  it('renders as a span element', () => {
    render(<PermitStatusBadge status={PermitStatus.DRAFT} />);
    const badge = screen.getByText('Draft');
    expect(badge.tagName).toBe('SPAN');
  });

  it('uses small size classes by default (sm)', () => {
    render(<PermitStatusBadge status={PermitStatus.DRAFT} />);
    const badge = screen.getByText('Draft');
    expect(badge.className).toContain('text-xs');
    expect(badge.className).toContain('px-2.5');
  });

  it('uses medium size classes when size="md"', () => {
    render(<PermitStatusBadge status={PermitStatus.DRAFT} size="md" />);
    const badge = screen.getByText('Draft');
    expect(badge.className).toContain('text-sm');
    expect(badge.className).toContain('px-3');
  });

  it('renders correct label for all statuses matching config', () => {
    for (const status of allStatuses) {
      const { unmount } = render(<PermitStatusBadge status={status} />);
      const expectedLabel = PERMIT_STATUS_CONFIG[status].label;
      expect(screen.getByText(expectedLabel)).toBeInTheDocument();
      unmount();
    }
  });
});
