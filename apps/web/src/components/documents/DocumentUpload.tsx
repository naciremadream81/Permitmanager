'use client';

import { useCallback, useState } from 'react';
import { Upload, X, FileText, Loader2, AlertCircle } from 'lucide-react';
import { useUploadDocument } from '@/hooks/useDocuments';
import { MAX_FILE_SIZE_BYTES, ALLOWED_DOCUMENT_MIME_TYPES } from '@permitpro/shared';
import { formatFileSize } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface DocumentUploadProps {
  permitId: string;
}

interface PendingFile {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'done' | 'error';
  error?: string;
  progress?: number;
}

export function DocumentUpload({ permitId }: DocumentUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const uploadMutation = useUploadDocument();

  const processFiles = useCallback(
    async (files: File[]) => {
      const newPending: PendingFile[] = [];

      for (const file of files) {
        if (file.size > MAX_FILE_SIZE_BYTES) {
          newPending.push({
            file,
            id: Math.random().toString(36).slice(2),
            status: 'error',
            error: `File too large (max ${MAX_FILE_SIZE_BYTES / 1024 / 1024}MB)`,
          });
          continue;
        }
        if (!ALLOWED_DOCUMENT_MIME_TYPES.includes(file.type)) {
          newPending.push({
            file,
            id: Math.random().toString(36).slice(2),
            status: 'error',
            error: 'File type not allowed',
          });
          continue;
        }
        newPending.push({
          file,
          id: Math.random().toString(36).slice(2),
          status: 'pending',
        });
      }

      setPendingFiles((prev) => [...prev, ...newPending]);

      for (const pending of newPending) {
        if (pending.status !== 'pending') continue;

        setPendingFiles((prev) =>
          prev.map((p) => (p.id === pending.id ? { ...p, status: 'uploading' } : p))
        );

        try {
          const formData = new FormData();
          formData.append('file', pending.file);
          formData.append('name', pending.file.name.replace(/\.[^/.]+$/, ''));
          await uploadMutation.mutateAsync({ permitId, formData });
          setPendingFiles((prev) =>
            prev.map((p) => (p.id === pending.id ? { ...p, status: 'done' } : p))
          );
          // Remove done files after 2s
          setTimeout(() => {
            setPendingFiles((prev) => prev.filter((p) => p.id !== pending.id));
          }, 2000);
        } catch (err) {
          setPendingFiles((prev) =>
            prev.map((p) =>
              p.id === pending.id
                ? { ...p, status: 'error', error: err instanceof Error ? err.message : 'Upload failed' }
                : p
            )
          );
        }
      }
    },
    [permitId, uploadMutation]
  );

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length) processFiles(files);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length) processFiles(files);
    e.target.value = '';
  }

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          'relative border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer',
          isDragOver
            ? 'border-[#F59E0B] bg-amber-50'
            : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100'
        )}
      >
        <input
          type="file"
          multiple
          accept={ALLOWED_DOCUMENT_MIME_TYPES.join(',')}
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <Upload className={cn('w-8 h-8 mx-auto mb-3', isDragOver ? 'text-[#F59E0B]' : 'text-gray-300')} />
        <p className="text-sm font-medium text-gray-600">
          {isDragOver ? 'Drop files here' : 'Drag & drop files here'}
        </p>
        <p className="text-xs text-gray-400 mt-1">or click to browse</p>
        <p className="text-xs text-gray-300 mt-2">PDF, JPG, PNG, WEBP, DOC, DOCX · Max 50MB each</p>
      </div>

      {/* Pending files */}
      {pendingFiles.length > 0 && (
        <div className="space-y-2">
          {pendingFiles.map((pf) => (
            <div key={pf.id} className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-xl border text-sm',
              pf.status === 'error' ? 'border-red-200 bg-red-50' : pf.status === 'done' ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white'
            )}>
              <FileText className={cn('w-4 h-4 flex-shrink-0', pf.status === 'error' ? 'text-red-500' : pf.status === 'done' ? 'text-green-500' : 'text-gray-400')} />
              <span className="flex-1 truncate text-gray-700">{pf.file.name}</span>
              <span className="text-xs text-gray-400 flex-shrink-0">{formatFileSize(pf.file.size)}</span>
              {pf.status === 'uploading' && <Loader2 className="w-4 h-4 animate-spin text-[#F59E0B] flex-shrink-0" />}
              {pf.status === 'error' && (
                <div className="flex items-center gap-1 text-red-500">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-xs">{pf.error}</span>
                  <button onClick={() => setPendingFiles(prev => prev.filter(p => p.id !== pf.id))}>
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
