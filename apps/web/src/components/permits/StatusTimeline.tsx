import { Check } from 'lucide-react';
import { PERMIT_STATUS_CONFIG, PERMIT_STATUS_TRANSITIONS } from '@permitpro/shared';
import type { PermitStatus } from '@permitpro/shared';
import { cn } from '@/lib/utils';

interface StatusTimelineProps {
  currentStatus: PermitStatus;
}

// Logical progression order for display
const STATUS_ORDER: PermitStatus[] = [
  'DRAFT' as PermitStatus,
  'PENDING_REVIEW' as PermitStatus,
  'SUBMITTED' as PermitStatus,
  'UNDER_REVIEW' as PermitStatus,
  'CORRECTIONS_NEEDED' as PermitStatus,
  'APPROVED' as PermitStatus,
  'ISSUED' as PermitStatus,
  'ACTIVE' as PermitStatus,
];

const TERMINAL_STATUSES: PermitStatus[] = [
  'EXPIRED' as PermitStatus,
  'SUSPENDED' as PermitStatus,
  'REVOKED' as PermitStatus,
  'CLOSED' as PermitStatus,
];

export function StatusTimeline({ currentStatus }: StatusTimelineProps) {
  const isTerminal = TERMINAL_STATUSES.includes(currentStatus);
  const currentIdx = STATUS_ORDER.indexOf(currentStatus);

  const statusesToShow = isTerminal
    ? STATUS_ORDER.slice(0, Math.max(currentIdx, STATUS_ORDER.length))
    : STATUS_ORDER;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Status Timeline</h3>

      {isTerminal && (
        <div className="mb-4 px-3 py-2 bg-red-50 rounded-xl border border-red-100">
          <p className="text-xs text-red-700 font-medium">
            This permit is in a terminal state:{' '}
            <span className="font-bold">{PERMIT_STATUS_CONFIG[currentStatus]?.label}</span>
          </p>
        </div>
      )}

      <div className="flex items-center gap-0 overflow-x-auto pb-2 scrollbar-hide">
        {statusesToShow.map((status, idx) => {
          const isCurrentStatus = status === currentStatus;
          const isPast = currentIdx > idx;
          const isFuture = currentIdx < idx && !isTerminal;
          const config = PERMIT_STATUS_CONFIG[status];

          return (
            <div key={status} className="flex items-center min-w-0">
              <div className="flex flex-col items-center min-w-[72px]">
                {/* Circle */}
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all',
                    isCurrentStatus
                      ? 'bg-[#F59E0B] border-[#F59E0B] text-white'
                      : isPast
                      ? 'bg-green-500 border-green-500 text-white'
                      : 'bg-white border-gray-200 text-gray-300'
                  )}
                >
                  {isPast ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <div className={cn(
                      'w-2 h-2 rounded-full',
                      isCurrentStatus ? 'bg-white' : 'bg-gray-300'
                    )} />
                  )}
                </div>
                {/* Label */}
                <p className={cn(
                  'text-xs text-center mt-1.5 leading-tight max-w-[64px]',
                  isCurrentStatus ? 'text-[#0F2044] font-semibold' : isPast ? 'text-gray-500' : 'text-gray-300'
                )}>
                  {config?.label}
                </p>
              </div>
              {/* Connector line */}
              {idx < statusesToShow.length - 1 && (
                <div className={cn(
                  'h-0.5 w-6 flex-shrink-0 mx-0.5 mb-5',
                  isPast ? 'bg-green-300' : 'bg-gray-200'
                )} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
