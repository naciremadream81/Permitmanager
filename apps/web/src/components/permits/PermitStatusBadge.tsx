import { PERMIT_STATUS_CONFIG } from '@permitpro/shared';
import type { PermitStatus } from '@permitpro/shared';

interface PermitStatusBadgeProps {
  status: PermitStatus;
  size?: 'sm' | 'md';
}

export function PermitStatusBadge({ status, size = 'sm' }: PermitStatusBadgeProps) {
  const config = PERMIT_STATUS_CONFIG[status];
  if (!config) return null;

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${config.bgColor} ${config.textColor} ${
        size === 'md' ? 'px-3 py-1 text-sm' : 'px-2.5 py-0.5 text-xs'
      }`}
    >
      {config.label}
    </span>
  );
}
