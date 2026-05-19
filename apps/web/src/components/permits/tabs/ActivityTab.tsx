'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, ChevronDown } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate } from '@/lib/utils';

interface ActivityTabProps {
  permitId: string;
}

async function fetchActivity(permitId: string, page: number) {
  const res = await fetch(`/api/permits/${permitId}/comments?page=${page}`);
  if (!res.ok) return { data: [], total: 0 };
  return res.json();
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

const actionColors: Record<string, string> = {
  create: 'bg-green-100 text-green-700',
  update: 'bg-blue-100 text-blue-700',
  delete: 'bg-red-100 text-red-700',
  upload: 'bg-purple-100 text-purple-700',
  comment: 'bg-gray-100 text-gray-700',
};

export function ActivityTab({ permitId }: ActivityTabProps) {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['activity', permitId, page],
    queryFn: () => fetchActivity(permitId, page),
  });

  const activities = data?.data ?? [];
  const total = data?.total ?? 0;
  const hasMore = activities.length === 20 && page * 20 < total;

  if (isLoading) return <div className="py-10 flex items-center justify-center"><LoadingSpinner /></div>;

  if (activities.length === 0) {
    return (
      <EmptyState
        icon={Activity}
        title="No activity yet"
        description="Actions on this permit will appear here."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 text-sm">Activity Log</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {activities.map((entry: {
            id: string;
            action: string;
            entityType: string;
            metadata: Record<string, unknown>;
            createdAt: string;
            user?: { name?: string; avatar?: string } | null;
          }) => {
            const userName = entry.user?.name || 'System';
            const initials = getInitials(userName);
            const actionKey = entry.action.split('_')[0].toLowerCase();
            const colorClass = actionColors[actionKey] || actionColors.comment;

            return (
              <div key={entry.id} className="px-5 py-3 flex items-start gap-3">
                {/* Avatar */}
                <div className="w-7 h-7 bg-[#0F2044]/10 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-[#0F2044]">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-gray-900">{userName}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colorClass}`}>
                      {entry.action.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs text-gray-400">{entry.entityType}</span>
                  </div>
                  {entry.metadata?.description && (
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                      {String(entry.metadata.description)}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">{formatDate(entry.createdAt)}</p>
                </div>
              </div>
            );
          })}
        </div>

        {hasMore && (
          <div className="px-5 py-3 border-t border-gray-100">
            <button
              onClick={() => setPage((p) => p + 1)}
              className="flex items-center gap-1.5 text-sm text-[#0F2044] hover:underline mx-auto"
            >
              <ChevronDown className="w-4 h-4" />
              Load more
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
