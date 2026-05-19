import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getChecklist,
  createChecklistItem,
  updateChecklistItem,
} from '@/lib/api-client';
import type { ChecklistItem } from '@permitpro/shared';
import { toast } from 'sonner';

export function useChecklist(permitId: string) {
  return useQuery({
    queryKey: ['checklist', permitId],
    queryFn: () => getChecklist(permitId),
    enabled: !!permitId,
  });
}

export function useCreateChecklistItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      permitId,
      data,
    }: {
      permitId: string;
      data: Partial<ChecklistItem>;
    }) => createChecklistItem(permitId, data),
    onSuccess: (_, { permitId }) => {
      queryClient.invalidateQueries({ queryKey: ['checklist', permitId] });
      toast.success('Checklist item added');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add item: ${error.message}`);
    },
  });
}

export function useUpdateChecklistItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      permitId,
      itemId,
      data,
    }: {
      permitId: string;
      itemId: string;
      data: Partial<ChecklistItem>;
    }) => updateChecklistItem(permitId, itemId, data),
    onSuccess: (_, { permitId }) => {
      queryClient.invalidateQueries({ queryKey: ['checklist', permitId] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to update item: ${error.message}`);
    },
  });
}
