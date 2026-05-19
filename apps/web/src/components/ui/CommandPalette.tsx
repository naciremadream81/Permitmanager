'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, FileText, Plus, Upload, FolderOpen, X } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { useQuery } from '@tanstack/react-query';
import { searchPermits } from '@/lib/api-client';
import { PERMIT_STATUS_CONFIG } from '@permitpro/shared';
import type { PermitListItem } from '@permitpro/shared';
import { cn } from '@/lib/utils';

const QUICK_ACTIONS = [
  { id: 'new-permit', label: 'New Permit', icon: Plus, href: '/permits/new', shortcut: 'N' },
  { id: 'new-project', label: 'New Project', icon: FolderOpen, href: '/projects/new', shortcut: 'P' },
  { id: 'permits', label: 'All Permits', icon: FileText, href: '/permits' },
];

function useDebounce(value: string, delay: number): string {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export function CommandPalette() {
  const router = useRouter();
  const { commandPaletteOpen, setCommandPaletteOpen } = useUIStore();
  const [query, setQuery] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const debouncedQuery = useDebounce(query, 300);

  const { data: searchResults = [] } = useQuery({
    queryKey: ['command-search', debouncedQuery],
    queryFn: () => searchPermits(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
  });

  // Keyboard shortcut to open
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
      if (e.key === 'Escape') {
        setCommandPaletteOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setCommandPaletteOpen]);

  // Reset on close
  useEffect(() => {
    if (!commandPaletteOpen) {
      setQuery('');
      setSelectedIdx(0);
    }
  }, [commandPaletteOpen]);

  function navigate(href: string) {
    router.push(href);
    setCommandPaletteOpen(false);
  }

  const allItems = [
    ...QUICK_ACTIONS.map((a) => ({ type: 'action' as const, ...a })),
    ...searchResults.slice(0, 5).map((p: PermitListItem) => ({
      type: 'permit' as const,
      id: p.id,
      label: p.title,
      sub: p.permitNumber || p.project?.name,
      status: p.status,
      href: `/permits/${p.id}`,
    })),
  ];

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx((i) => Math.min(i + 1, allItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && allItems[selectedIdx]) {
      navigate(allItems[selectedIdx].href);
    }
  }

  if (!commandPaletteOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={() => setCommandPaletteOpen(false)} />

      {/* Palette */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100">
          <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIdx(0); }}
            onKeyDown={handleKeyDown}
            placeholder="Search permits, or type a command..."
            className="flex-1 text-sm text-gray-800 placeholder-gray-400 focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-gray-300 hover:text-gray-500">
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="text-xs text-gray-300 border border-gray-200 rounded px-1.5 py-0.5">Esc</kbd>
        </div>

        {/* Results */}
        <div className="max-h-[50vh] overflow-y-auto">
          {/* Quick actions */}
          {!query && (
            <div className="py-2">
              <p className="px-4 py-1.5 text-xs font-medium text-gray-400 uppercase tracking-wider">Quick Actions</p>
              {QUICK_ACTIONS.map((action, idx) => (
                <button
                  key={action.id}
                  onClick={() => navigate(action.href)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-left',
                    selectedIdx === idx ? 'bg-gray-50' : 'hover:bg-gray-50'
                  )}
                >
                  <div className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <action.icon className="w-3.5 h-3.5 text-gray-500" />
                  </div>
                  <span className="font-medium text-gray-700">{action.label}</span>
                  {action.shortcut && (
                    <kbd className="ml-auto text-xs text-gray-300 border border-gray-200 rounded px-1.5 py-0.5">{action.shortcut}</kbd>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Search results */}
          {query && searchResults.length === 0 && debouncedQuery.length >= 2 && (
            <div className="py-8 text-center text-sm text-gray-400">No permits found for &quot;{query}&quot;</div>
          )}

          {searchResults.length > 0 && (
            <div className="py-2">
              <p className="px-4 py-1.5 text-xs font-medium text-gray-400 uppercase tracking-wider">Permits</p>
              {searchResults.slice(0, 5).map((permit: PermitListItem, idx) => {
                const statusConfig = PERMIT_STATUS_CONFIG[permit.status];
                const itemIdx = QUICK_ACTIONS.length + idx;
                return (
                  <button
                    key={permit.id}
                    onClick={() => navigate(`/permits/${permit.id}`)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-left',
                      selectedIdx === itemIdx ? 'bg-gray-50' : 'hover:bg-gray-50'
                    )}
                  >
                    <div className="w-7 h-7 bg-[#0F2044]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-3.5 h-3.5 text-[#0F2044]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 truncate">{permit.title}</p>
                      {permit.project?.name && (
                        <p className="text-xs text-gray-400 truncate">{permit.project.name}</p>
                      )}
                    </div>
                    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', statusConfig.bgColor, statusConfig.textColor)}>
                      {statusConfig.label}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-4 py-2 border-t border-gray-100 flex items-center gap-4 text-xs text-gray-400">
          <span>↑↓ navigate</span>
          <span>↵ open</span>
          <span>Esc close</span>
        </div>
      </div>
    </div>
  );
}
