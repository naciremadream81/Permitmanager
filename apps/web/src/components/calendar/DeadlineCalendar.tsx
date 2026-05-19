'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
} from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { getPermits } from '@/lib/api-client';
import type { PermitListItem } from '@permitpro/shared';
import { DeadlineCountdown } from './DeadlineCountdown';
import { PermitStatusBadge } from '@/components/permits/PermitStatusBadge';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface DayDeadlines {
  date: Date;
  items: Array<{ permitId: string; title: string; type: 'expiry' | 'inspection'; status: PermitListItem['status'] }>;
}

export function DeadlineCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const { data } = useQuery({
    queryKey: ['permits-calendar'],
    queryFn: () => getPermits({ limit: 200 }),
  });

  const permits = data?.data ?? [];

  // Build deadline map
  const deadlineMap = new Map<string, DayDeadlines['items']>();
  for (const permit of permits) {
    if (permit.expirationDate) {
      const d = new Date(permit.expirationDate);
      const key = format(d, 'yyyy-MM-dd');
      const arr = deadlineMap.get(key) ?? [];
      arr.push({ permitId: permit.id, title: permit.title, type: 'expiry', status: permit.status });
      deadlineMap.set(key, arr);
    }
  }

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const selectedDeadlines = selectedDate
    ? (deadlineMap.get(format(selectedDate, 'yyyy-MM-dd')) ?? [])
    : [];

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Calendar header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 text-sm">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setCurrentMonth(new Date()); setSelectedDate(null); }}
              className="text-xs text-[#0F2044] font-medium px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-gray-500" />
            </button>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-gray-100">
          {weekdays.map((d) => (
            <div key={d} className="py-2 text-center text-xs font-medium text-gray-400">
              {d}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7">
          {days.map((day, idx) => {
            const key = format(day, 'yyyy-MM-dd');
            const deadlines = deadlineMap.get(key) ?? [];
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isTodayDay = isToday(day);

            return (
              <button
                key={idx}
                onClick={() => setSelectedDate(isSameDay(day, selectedDate ?? new Date(0)) ? null : day)}
                className={cn(
                  'relative min-h-[72px] p-2 text-left border-b border-r border-gray-50 hover:bg-gray-50 transition-colors',
                  idx % 7 === 6 && 'border-r-0',
                  !isCurrentMonth && 'opacity-40',
                  isSelected && 'bg-amber-50 hover:bg-amber-50'
                )}
              >
                <span className={cn(
                  'inline-flex w-6 h-6 items-center justify-center rounded-full text-xs font-medium',
                  isTodayDay ? 'bg-[#0F2044] text-white' : isSelected ? 'bg-[#F59E0B] text-white' : 'text-gray-600'
                )}>
                  {format(day, 'd')}
                </span>

                {/* Deadline dots */}
                {deadlines.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {deadlines.slice(0, 3).map((d, i) => (
                      <span
                        key={i}
                        className={cn(
                          'w-1.5 h-1.5 rounded-full',
                          d.type === 'expiry' ? 'bg-red-400' : 'bg-blue-400'
                        )}
                      />
                    ))}
                    {deadlines.length > 3 && (
                      <span className="text-xs text-gray-400">+{deadlines.length - 3}</span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-gray-500 px-1">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
          Permit expiry
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
          Inspection
        </div>
      </div>

      {/* Selected date panel */}
      {selectedDate && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <CalendarDays className="w-4 h-4 text-gray-400" />
            <h3 className="font-semibold text-gray-900 text-sm">
              {format(selectedDate, 'MMMM d, yyyy')}
            </h3>
            <DeadlineCountdown date={selectedDate} />
          </div>

          {selectedDeadlines.length === 0 ? (
            <p className="text-sm text-gray-400">No deadlines on this day.</p>
          ) : (
            <div className="space-y-3">
              {selectedDeadlines.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/permits/${item.permitId}`}
                      className="text-sm font-medium text-gray-800 hover:text-[#0F2044] transition-colors line-clamp-1"
                    >
                      {item.title}
                    </Link>
                    <p className="text-xs text-gray-400 mt-0.5 capitalize">{item.type}</p>
                  </div>
                  <PermitStatusBadge status={item.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
