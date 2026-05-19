import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getDocuments,
  uploadDocument,
  updateDocument,
  deleteDocument,
} from '@/lib/api-client';
import type { Document as PermitDocument } from '@permitpro/shared';
import { toast } from 'sonner';

export function useDocuments(permitId: string) {
  return useQuery({
    queryKey: ['documents', permitId],
    queryFn: () => getDocuments(permitId),
    enabled: !!permitId,
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ permitId, formData }: { permitId: string; formData: FormData }) =>
      uploadDocument(permitId, formData),
    onSuccess: (_, { permitId }) => {
      queryClient.invalidateQueries({ queryKey: ['documents', permitId] });
      queryClient.invalidateQueries({ queryKey: ['permits', permitId] });
      toast.success('Document uploaded successfully');
    },
    onError: (error: Error) => {
      toast.error(`Upload failed: ${error.message}`);
    },
  });
}

export function useUpdateDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      permitId,
      docId,
      data,
    }: {
      permitId: string;
      docId: string;
      data: Partial<PermitDocument>;
    }) => updateDocument(permitId, docId, data),
    onSuccess: (_, { permitId }) => {
      queryClient.invalidateQueries({ queryKey: ['documents', permitId] });
      toast.success('Document updated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update document: ${error.message}`);
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ permitId, docId }: { permitId: string; docId: string }) =>
      deleteDocument(permitId, docId),
    onSuccess: (_, { permitId }) => {
      queryClient.invalidateQueries({ queryKey: ['documents', permitId] });
      toast.success('Document deleted');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete document: ${error.message}`);
    },
  });
}
