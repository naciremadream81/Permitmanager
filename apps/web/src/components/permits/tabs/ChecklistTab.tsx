'use client';

import { useState } from 'react';
import { LayoutGrid, List, Plus } from 'lucide-react';
import { useChecklist, useCreateChecklistItem, useUpdateChecklistItem } from '@/hooks/useChecklist';
import { ChecklistKanban } from '@/components/checklist/ChecklistKanban';
import { ChecklistItemRow } from '@/components/checklist/ChecklistItemRow';
import { AIChecklistGenerator } from '@/components/checklist/AIChecklistGenerator';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { ChecklistItemStatus } from '@permitpro/shared';
import type { PermitType } from '@permitpro/shared';
import { cn } from '@/lib/utils';

interface ChecklistTabProps {
  permitId: string;
  permitType: PermitType;
}

export function ChecklistTab({ permitId, permitType }: ChecklistTabProps) {
  const [view, setView] = useState<'kanban' | 'list'>('list');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState('');

  const { data: items = [], isLoading } = useChecklist(permitId);
  const createItem = useCreateChecklistItem();
  const updateItem = useUpdateChecklistItem();

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    if (!newItemTitle.trim()) return;
    await createItem.mutateAsync({
      permitId,
      data: {
        title: newItemTitle.trim(),
        status: ChecklistItemStatus.NOT_STARTED,
        order: items.length,
      },
    });
    setNewItemTitle('');
    setShowAddForm(false);
  }

  if (isLoading) {
    return <div className="py-10 flex items-center justify-center"><LoadingSpinner /></div>;
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView('list')}
            className={cn('p-2 rounded-lg transition-colors', view === 'list' ? 'bg-[#0F2044] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200')}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setView('kanban')}
            className={cn('p-2 rounded-lg transition-colors', view === 'kanban' ? 'bg-[#0F2044] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200')}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <span className="text-sm text-gray-400">
            {items.filter(i => i.status === 'COMPLETED').length}/{items.length} complete
          </span>
        </div>
        <div className="flex items-center gap-2">
          <AIChecklistGenerator permitId={permitId} permitType={permitType} />
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-2 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add item
          </button>
        </div>
      </div>

      {/* Add form */}
      {showAddForm && (
        <form onSubmit={handleAddItem} className="flex items-center gap-2 bg-white rounded-xl border border-gray-200 p-3">
          <input
            autoFocus
            value={newItemTitle}
            onChange={(e) => setNewItemTitle(e.target.value)}
            placeholder="Checklist item title..."
            className="flex-1 text-sm focus:outline-none"
          />
          <button
            type="submit"
            disabled={createItem.isPending}
            className="px-3 py-1.5 bg-[#0F2044] text-white text-xs font-medium rounded-lg"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => setShowAddForm(false)}
            className="px-3 py-1.5 text-gray-400 hover:text-gray-600 text-xs"
          >
            Cancel
          </button>
        </form>
      )}

      {/* Content */}
      {items.length === 0 ? (
        <EmptyState
          icon={List}
          title="No checklist items"
          description="Generate AI checklist or add items manually."
          action={{ label: 'Add Item', onClick: () => setShowAddForm(true) }}
        />
      ) : view === 'kanban' ? (
        <ChecklistKanban items={items} permitId={permitId} />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {items.map((item, idx) => (
            <ChecklistItemRow
              key={item.id}
              item={item}
              permitId={permitId}
              isLast={idx === items.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
