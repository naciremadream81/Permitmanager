'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { Search, ExternalLink, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';
import { useQuery } from '@tanstack/react-query';
import type { PermitListItem, PermitStatus } from '@permitpro/shared';
import { PERMIT_STATUS_CONFIG, PERMIT_TYPE_CONFIG } from '@permitpro/shared';
import { PermitStatusBadge } from './PermitStatusBadge';
import { DeadlineCountdown } from '@/components/calendar/DeadlineCountdown';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { formatDate } from '@/lib/utils';
import { getPermits } from '@/lib/api-client';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 20;

const FILTER_OPTIONS: Array<{ label: string; value: string }> = [
  { label: 'All', value: '' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Submitted', value: 'SUBMITTED' },
  { label: 'Under Review', value: 'UNDER_REVIEW' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Corrections', value: 'CORRECTIONS_NEEDED' },
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Expired', value: 'EXPIRED' },
];

const columnHelper = createColumnHelper<PermitListItem>();

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const [timeoutId, setTimeoutId] = useState<ReturnType<typeof setTimeout>>();

  const update = useCallback(
    (newValue: T) => {
      if (timeoutId) clearTimeout(timeoutId);
      const id = setTimeout(() => setDebouncedValue(newValue), delay);
      setTimeoutId(id);
    },
    [timeoutId, delay]
  );

  return debouncedValue;
}

export function PermitsList() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['permits', { status: statusFilter, search: debouncedSearch, page, limit: PAGE_SIZE }],
    queryFn: () =>
      getPermits({
        status: statusFilter || undefined,
        search: debouncedSearch || undefined,
        page,
        limit: PAGE_SIZE,
      }),
  });

  const permits = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const columns = [
    columnHelper.accessor('permitNumber', {
      header: 'Permit #',
      cell: (info) => (
        <span className="font-mono text-xs text-gray-500">{info.getValue() || '—'}</span>
      ),
    }),
    columnHelper.accessor('title', {
      header: 'Title',
      cell: (info) => (
        <span className="font-medium text-gray-900 text-sm line-clamp-1">{info.getValue()}</span>
      ),
    }),
    columnHelper.accessor('project', {
      header: 'Project',
      cell: (info) => (
        <span className="text-sm text-gray-500 truncate max-w-[120px] block">
          {info.getValue()?.name || '—'}
        </span>
      ),
    }),
    columnHelper.accessor('type', {
      header: 'Type',
      cell: (info) => (
        <span className="text-xs text-gray-500">
          {PERMIT_TYPE_CONFIG[info.getValue()]?.label || info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: (info) => <PermitStatusBadge status={info.getValue()} />,
    }),
    columnHelper.accessor('riskScore', {
      header: 'Risk',
      cell: (info) => {
        const score = info.getValue();
        if (score == null) return <span className="text-gray-300 text-xs">—</span>;
        const color =
          score >= 80
            ? 'text-red-600 bg-red-50'
            : score >= 60
            ? 'text-orange-600 bg-orange-50'
            : score >= 30
            ? 'text-amber-600 bg-amber-50'
            : 'text-green-600 bg-green-50';
        return (
          <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', color)}>
            {score}
          </span>
        );
      },
    }),
    columnHelper.accessor('expirationDate', {
      header: 'Deadline',
      cell: (info) => {
        const date = info.getValue();
        if (!date) return <span className="text-gray-300 text-xs">—</span>;
        return (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-400">{formatDate(date)}</span>
            <DeadlineCountdown date={date} />
          </div>
        );
      },
    }),
    columnHelper.accessor('id', {
      header: '',
      cell: (info) => (
        <Link
          href={`/permits/${info.getValue()}`}
          className="inline-flex items-center gap-1 text-xs text-[#0F2044] hover:text-[#1e3a6e] font-medium"
        >
          View
          <ExternalLink className="w-3 h-3" />
        </Link>
      ),
    }),
  ];

  const table = useReactTable({
    data: permits,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: totalPages,
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Toolbar */}
      <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search permits..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F59E0B] focus:border-transparent"
          />
        </div>

        {/* Status filters */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { setStatusFilter(opt.value); setPage(1); }}
              className={cn(
                'whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                statusFilter === opt.value
                  ? 'bg-[#0F2044] text-white'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="py-20 flex items-center justify-center">
          <LoadingSpinner />
        </div>
      ) : isError ? (
        <div className="py-20 text-center text-red-500 text-sm">Failed to load permits.</div>
      ) : permits.length === 0 ? (
        <div className="py-20 text-center">
          <FileText className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="font-medium text-gray-500 mb-1">No permits found</p>
          <p className="text-sm text-gray-400">
            {search || statusFilter ? 'Try adjusting your filters.' : 'Create your first permit to get started.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id} className="border-b border-gray-100 bg-gray-50/50">
                  {hg.headers.map((h) => (
                    <th key={h.id} className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      {flexRender(h.column.columnDef.header, h.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-5 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-400">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs text-gray-500">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
