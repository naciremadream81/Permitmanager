'use client';

import { useState } from 'react';
import { FileText, Download, Trash2, Eye, AlertTriangle } from 'lucide-react';
import { useDeleteDocument } from '@/hooks/useDocuments';
import { DOCUMENT_CATEGORY_CONFIG, DOCUMENT_STATUS_CONFIG } from '@permitpro/shared';
import type { Document as PermitDocument, DocumentCategory, DocumentStatus } from '@permitpro/shared';
import { formatDate, formatFileSize, daysUntil } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface DocumentCardProps {
  document: PermitDocument;
  permitId: string;
}

export function DocumentCard({ document: doc, permitId }: DocumentCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const deleteDoc = useDeleteDocument();

  const categoryConfig = DOCUMENT_CATEGORY_CONFIG[doc.category as DocumentCategory];
  const statusConfig = DOCUMENT_STATUS_CONFIG[doc.status as DocumentStatus];
  const expiryDays = daysUntil(doc.expirationDate);
  const isExpired = expiryDays !== null && expiryDays < 0;
  const isExpiringSoon = expiryDays !== null && expiryDays >= 0 && expiryDays <= 30;

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    await deleteDoc.mutateAsync({ permitId, docId: doc.id });
  }

  function handleView() {
    window.open(doc.fileUrl, '_blank');
  }

  function handleDownload() {
    const a = window.document.createElement('a');
    a.href = doc.fileUrl;
    a.download = doc.fileName;
    a.click();
    toast.success(`Downloading ${doc.fileName}`);
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <FileText className={cn('w-5 h-5', categoryConfig?.color || 'text-gray-400')} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 line-clamp-1">{doc.name}</p>
            <p className="text-xs text-gray-400 mt-0.5 truncate">{doc.fileName}</p>
          </div>
        </div>
      </div>

      {/* Badges */}
      <div className="flex items-center gap-2 flex-wrap mb-3">
        {categoryConfig && (
          <span className="text-xs text-gray-500 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full">
            {categoryConfig.label}
          </span>
        )}
        {statusConfig && (
          <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', statusConfig.bgColor, statusConfig.textColor)}>
            {statusConfig.label}
          </span>
        )}
      </div>

      {/* Expiry warning */}
      {doc.expirationDate && (
        <div className={cn(
          'flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg mb-3',
          isExpired ? 'bg-red-50 text-red-700 border border-red-100' : isExpiringSoon ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-gray-50 text-gray-500'
        )}>
          {(isExpired || isExpiringSoon) && <AlertTriangle className="w-3 h-3 flex-shrink-0" />}
          {isExpired ? 'Expired' : 'Expires'}: {formatDate(doc.expirationDate)}
          {!isExpired && expiryDays !== null && ` (${expiryDays}d)`}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-50">
        <div className="text-xs text-gray-400">
          {formatFileSize(doc.fileSize)} · v{doc.version}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleView}
            className="p-1.5 rounded-lg text-gray-400 hover:text-[#0F2044] hover:bg-gray-100 transition-colors"
            title="View"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleDownload}
            className="p-1.5 rounded-lg text-gray-400 hover:text-[#0F2044] hover:bg-gray-100 transition-colors"
            title="Download"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleDelete}
            disabled={deleteDoc.isPending}
            className={cn(
              'p-1.5 rounded-lg transition-colors',
              confirmDelete
                ? 'bg-red-100 text-red-600 hover:bg-red-200'
                : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
            )}
            title={confirmDelete ? 'Click again to confirm delete' : 'Delete'}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
