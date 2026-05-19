import { daysUntil } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface DeadlineCountdownProps {
  date: Date | string;
}

export function DeadlineCountdown({ date }: DeadlineCountdownProps) {
  const days = daysUntil(date);

  if (days === null) return null;

  if (days < 0) {
    return (
      <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
        Overdue
      </span>
    );
  }

  const colorClass =
    days <= 3
      ? 'bg-red-100 text-red-700'
      : days <= 7
      ? 'bg-amber-100 text-amber-700'
      : 'bg-green-100 text-green-700';

  const label = days === 0 ? 'Today' : days === 1 ? '1d' : `${days}d`;

  return (
    <span className={cn('inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full', colorClass)}>
      {label}
    </span>
  );
}
