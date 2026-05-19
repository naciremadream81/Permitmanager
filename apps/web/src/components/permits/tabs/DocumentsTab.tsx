'use client';

import { useState } from 'react';
import { FileText, Filter } from 'lucide-react';
import { useDocuments } from '@/hooks/useDocuments';
import { DocumentCard } from '@/components/documents/DocumentCard';
import { DocumentUpload } from '@/components/documents/DocumentUpload';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { DocumentCategory, DOCUMENT_CATEGORY_CONFIG } from '@permitpro/shared';
import { cn } from '@/lib/utils';

interface DocumentsTabProps {
  permitId: string;
}

export function DocumentsTab({ permitId }: DocumentsTabProps) {
  const { data: documents = [], isLoading, isError } = useDocuments(permitId);
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date' | 'name'>('date');

  const filtered = documents
    .filter((d) => !categoryFilter || d.category === categoryFilter)
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const usedCategories = [...new Set(documents.map((d) => d.category))];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <DocumentUpload permitId={permitId} />
        <div className="py-10 flex items-center justify-center">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-4">
        <DocumentUpload permitId={permitId} />
        <p className="text-sm text-red-500 text-center py-8">Failed to load documents.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <DocumentUpload permitId={permitId} />

      {documents.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Filter className="w-3.5 h-3.5" />
            Filter:
          </div>
          <button
            onClick={() => setCategoryFilter('')}
            className={cn(
              'px-3 py-1 rounded-lg text-xs font-medium transition-colors',
              !categoryFilter ? 'bg-[#0F2044] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            All ({documents.length})
          </button>
          {usedCategories.map((cat) => {
            const config = DOCUMENT_CATEGORY_CONFIG[cat as DocumentCategory];
            return (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={cn(
                  'px-3 py-1 rounded-lg text-xs font-medium transition-colors',
                  categoryFilter === cat ? 'bg-[#0F2044] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {config?.label || cat}
              </button>
            );
          })}

          <div className="ml-auto flex items-center gap-1">
            <span className="text-xs text-gray-400">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'name')}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white"
            >
              <option value="date">Newest first</option>
              <option value="name">Name</option>
            </select>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No documents"
          description={categoryFilter ? 'No documents in this category.' : 'Upload documents to get started.'}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((doc) => (
            <DocumentCard key={doc.id} document={doc} permitId={permitId} />
          ))}
        </div>
      )}
    </div>
  );
}
