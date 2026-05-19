'use client';

import { useUpdateChecklistItem } from '@/hooks/useChecklist';
import type { ChecklistItem } from '@permitpro/shared';
import { ChecklistItemStatus } from '@permitpro/shared';
import { cn } from '@/lib/utils';

interface ChecklistKanbanProps {
  items: ChecklistItem[];
  permitId: string;
}

const COLUMNS = [
  { id: ChecklistItemStatus.NOT_STARTED, label: 'To Do', color: 'bg-gray-100' },
  { id: ChecklistItemStatus.IN_PROGRESS, label: 'In Progress', color: 'bg-blue-50' },
  { id: ChecklistItemStatus.COMPLETED, label: 'Done', color: 'bg-green-50' },
];

const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-500',
  MEDIUM: 'bg-amber-100 text-amber-600',
  HIGH: 'bg-orange-100 text-orange-600',
  CRITICAL: 'bg-red-100 text-red-600',
};

function getNextStatus(current: ChecklistItemStatus): ChecklistItemStatus {
  const map: Partial<Record<ChecklistItemStatus, ChecklistItemStatus>> = {
    [ChecklistItemStatus.NOT_STARTED]: ChecklistItemStatus.IN_PROGRESS,
    [ChecklistItemStatus.IN_PROGRESS]: ChecklistItemStatus.COMPLETED,
  };
  return map[current] ?? current;
}

export function ChecklistKanban({ items, permitId }: ChecklistKanbanProps) {
  const updateItem = useUpdateChecklistItem();

  function handleAdvance(item: ChecklistItem) {
    const next = getNextStatus(item.status as ChecklistItemStatus);
    if (next === item.status) return;
    updateItem.mutate({
      permitId,
      itemId: item.id,
      data: {
        status: next,
        completedAt: next === ChecklistItemStatus.COMPLETED ? new Date() : undefined,
      },
    });
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {COLUMNS.map((col) => {
        const colItems = items.filter((i) => i.status === col.id);
        return (
          <div key={col.id} className={cn('rounded-2xl p-4', col.color, 'min-h-[200px]')}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">{col.label}</h3>
              <span className="text-xs text-gray-400 bg-white rounded-full px-2 py-0.5">
                {colItems.length}
              </span>
            </div>
            <div className="space-y-2">
              {colItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleAdvance(item)}
                  disabled={item.status === ChecklistItemStatus.COMPLETED}
                  className={cn(
                    'w-full text-left bg-white rounded-xl p-3 shadow-sm border border-white/60 transition-all hover:shadow-md',
                    item.status !== ChecklistItemStatus.COMPLETED && 'cursor-pointer hover:-translate-y-0.5',
                    item.status === ChecklistItemStatus.COMPLETED && 'opacity-60'
                  )}
                  title={item.status !== ChecklistItemStatus.COMPLETED ? 'Click to advance status' : 'Completed'}
                >
                  <p className="text-sm font-medium text-gray-800 line-clamp-2">{item.title}</p>
                  {item.category && (
                    <p className="text-xs text-gray-400 mt-1">{item.category}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {item.status !== ChecklistItemStatus.COMPLETED && (
                      <span className="text-xs text-[#0F2044]/60 italic">
                        → {getNextStatus(item.status as ChecklistItemStatus).replace(/_/g, ' ').toLowerCase()}
                      </span>
                    )}
                  </div>
                </button>
              ))}
              {colItems.length === 0 && (
                <div className="text-xs text-gray-400 text-center py-4 italic">
                  No items
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
