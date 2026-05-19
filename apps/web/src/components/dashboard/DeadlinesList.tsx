'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { CalendarDays, CheckCircle } from 'lucide-react';
import { DeadlineCountdown } from '@/components/calendar/DeadlineCountdown';
import { formatDate } from '@/lib/utils';
import type { DeadlineWithPermit } from '@permitpro/shared';

async function fetchUpcomingDeadlines(): Promise<DeadlineWithPermit[]> {
  const res = await fetch('/api/permits?limit=20');
  if (!res.ok) return [];
  const data = await res.json();
  const permits = data.data ?? [];

  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const deadlines: DeadlineWithPermit[] = [];
  for (const permit of permits) {
    if (permit.expirationDate) {
      const d = new Date(permit.expirationDate);
      if (d >= now && d <= in7Days) {
        deadlines.push({
          id: `${permit.id}-exp`,
          permitId: permit.id,
          title: 'Permit expiration',
          dueDate: permit.expirationDate,
          reminderDays: [7, 1],
          status: 'active',
          notifiedAt: null,
          createdAt: permit.createdAt,
          updatedAt: permit.updatedAt,
          permit: {
            id: permit.id,
            title: permit.title,
            permitNumber: permit.permitNumber,
            type: permit.type,
            status: permit.status,
          },
        });
      }
    }
  }

  return deadlines.slice(0, 6);
}

export function DeadlinesList() {
  const { data: deadlines = [], isLoading } = useQuery({
    queryKey: ['upcoming-deadlines'],
    queryFn: fetchUpcomingDeadlines,
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="h-5 bg-gray-100 rounded w-32 mb-4 animate-pulse" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-14 bg-gray-50 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-gray-400" />
          <h2 className="font-semibold text-gray-900">Deadlines This Week</h2>
        </div>
        <span className="text-xs text-gray-400">{deadlines.length} upcoming</span>
      </div>

      {deadlines.length === 0 ? (
        <div className="py-12 px-6 text-center">
          <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-3" />
          <p className="font-medium text-gray-700 mb-1">No deadlines this week</p>
          <p className="text-sm text-gray-400">You&apos;re all caught up for the next 7 days.</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {deadlines.map((deadline) => (
            <div key={deadline.id} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors">
              <div className="flex-1 min-w-0">
                <Link
                  href={`/permits/${deadline.permitId}`}
                  className="text-sm font-medium text-gray-900 hover:text-[#0F2044] truncate block"
                >
                  {deadline.permit.title}
                  {deadline.permit.permitNumber && (
                    <span className="text-gray-400 font-normal"> · {deadline.permit.permitNumber}</span>
                  )}
                </Link>
                <p className="text-xs text-gray-400 mt-0.5">{deadline.title} · {formatDate(deadline.dueDate)}</p>
              </div>
              <DeadlineCountdown date={deadline.dueDate} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
