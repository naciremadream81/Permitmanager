'use client';

import Link from 'next/link';
import { ExternalLink, FileText } from 'lucide-react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';
import type { PermitListItem } from '@permitpro/shared';
import { PermitStatusBadge } from '@/components/permits/PermitStatusBadge';
import { DeadlineCountdown } from '@/components/calendar/DeadlineCountdown';
import { PERMIT_TYPE_CONFIG } from '@permitpro/shared';
import { formatDate } from '@/lib/utils';

interface RecentPermitsTableProps {
  permits: PermitListItem[];
}

const columnHelper = createColumnHelper<PermitListItem>();

export function RecentPermitsTable({ permits }: RecentPermitsTableProps) {
  const columns = [
    columnHelper.accessor('permitNumber', {
      header: 'Permit #',
      cell: (info) => (
        <span className="font-mono text-sm text-gray-600">
          {info.getValue() || '—'}
        </span>
      ),
    }),
    columnHelper.accessor('title', {
      header: 'Title',
      cell: (info) => (
        <span className="font-medium text-gray-900 text-sm">{info.getValue()}</span>
      ),
    }),
    columnHelper.accessor('project', {
      header: 'Project',
      cell: (info) => (
        <span className="text-sm text-gray-500">{info.getValue()?.name || '—'}</span>
      ),
    }),
    columnHelper.accessor('type', {
      header: 'Type',
      cell: (info) => (
        <span className="text-sm text-gray-500">
          {PERMIT_TYPE_CONFIG[info.getValue()]?.label || info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: (info) => <PermitStatusBadge status={info.getValue()} />,
    }),
    columnHelper.accessor('expirationDate', {
      header: 'Deadline',
      cell: (info) => {
        const date = info.getValue();
        if (!date) return <span className="text-gray-400 text-sm">—</span>;
        return (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">{formatDate(date)}</span>
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
          className="inline-flex items-center gap-1 text-xs text-[#0F2044] hover:text-[#1e3a6e] font-medium transition-colors"
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
  });

  if (permits.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
        <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <p className="font-medium text-gray-700 mb-1">No permits yet</p>
        <p className="text-sm text-gray-400 mb-4">Create your first permit to get started.</p>
        <Link
          href="/permits/new"
          className="inline-flex items-center gap-2 bg-[#0F2044] text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-[#1e3a6e] transition-colors"
        >
          New Permit
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">Recent Permits</h2>
        <Link href="/permits" className="text-sm text-[#0F2044] hover:underline font-medium">
          View all
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-gray-100 bg-gray-50/50">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
              >
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
    </div>
  );
}
