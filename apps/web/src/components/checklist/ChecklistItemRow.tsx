'use client';

import { useState } from 'react';
import { Trash2, GripVertical } from 'lucide-react';
import { useUpdateChecklistItem } from '@/hooks/useChecklist';
import type { ChecklistItem } from '@permitpro/shared';
import { ChecklistItemStatus, CHECKLIST_STATUS_CONFIG } from '@permitpro/shared';
import { cn } from '@/lib/utils';

interface ChecklistItemRowProps {
  item: ChecklistItem;
  permitId: string;
  isLast?: boolean;
}

export function ChecklistItemRow({ item, permitId, isLast }: ChecklistItemRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(item.title);
  const updateItem = useUpdateChecklistItem();

  const isCompleted = item.status === ChecklistItemStatus.COMPLETED;

  function handleToggle() {
    updateItem.mutate({
      permitId,
      itemId: item.id,
      data: {
        status: isCompleted ? ChecklistItemStatus.NOT_STARTED : ChecklistItemStatus.COMPLETED,
        completedAt: isCompleted ? null : new Date(),
      },
    });
  }

  function handleTitleSave() {
    if (editTitle.trim() && editTitle !== item.title) {
      updateItem.mutate({
        permitId,
        itemId: item.id,
        data: { title: editTitle.trim() },
      });
    }
    setIsEditing(false);
  }

  const statusConfig = CHECKLIST_STATUS_CONFIG[item.status as ChecklistItemStatus];

  return (
    <div className={cn(
      'flex items-center gap-3 px-4 py-3 hover:bg-gray-50 group transition-colors',
      !isLast && 'border-b border-gray-50'
    )}>
      {/* Drag handle */}
      <GripVertical className="w-4 h-4 text-gray-200 group-hover:text-gray-300 flex-shrink-0 cursor-grab" />

      {/* Checkbox */}
      <button
        onClick={handleToggle}
        disabled={updateItem.isPending}
        className={cn(
          'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all',
          isCompleted
            ? 'bg-green-500 border-green-500'
            : 'border-gray-300 hover:border-green-400'
        )}
      >
        {isCompleted && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12">
            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {/* Title */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <input
            autoFocus
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleTitleSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleTitleSave();
              if (e.key === 'Escape') { setEditTitle(item.title); setIsEditing(false); }
            }}
            className="w-full text-sm focus:outline-none bg-transparent border-b border-[#F59E0B]"
          />
        ) : (
          <p
            className={cn(
              'text-sm cursor-text truncate',
              isCompleted ? 'line-through text-gray-400' : 'text-gray-800 hover:text-[#0F2044]'
            )}
            onClick={() => setIsEditing(true)}
          >
            {item.title}
          </p>
        )}
        {item.category && (
          <p className="text-xs text-gray-400 mt-0.5">{item.category}</p>
        )}
      </div>

      {/* Status badge */}
      {statusConfig && (
        <span className={cn(
          'text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 hidden sm:block',
          statusConfig.bgColor,
          statusConfig.textColor
        )}>
          {statusConfig.label}
        </span>
      )}

      {/* Delete */}
      <button
        onClick={() => updateItem.mutate({ permitId, itemId: item.id, data: { status: ChecklistItemStatus.NOT_APPLICABLE } })}
        className="p-1 rounded-lg text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
        title="Mark N/A"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
