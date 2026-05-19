import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getPermits,
  getPermit,
  createPermit,
  updatePermit,
  deletePermit,
  type PermitFilters,
} from '@/lib/api-client';
import type { Permit } from '@permitpro/shared';
import { toast } from 'sonner';

export function usePermits(filters?: PermitFilters) {
  return useQuery({
    queryKey: ['permits', filters],
    queryFn: () => getPermits(filters),
  });
}

export function usePermit(id: string) {
  return useQuery({
    queryKey: ['permits', id],
    queryFn: () => getPermit(id),
    enabled: !!id,
  });
}

export function useCreatePermit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Permit>) => createPermit(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permits'] });
      toast.success('Permit created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create permit: ${error.message}`);
    },
  });
}

export function useUpdatePermit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Permit> }) =>
      updatePermit(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['permits'] });
      queryClient.invalidateQueries({ queryKey: ['permits', id] });
      toast.success('Permit updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update permit: ${error.message}`);
    },
  });
}

export function useDeletePermit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePermit(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permits'] });
      toast.success('Permit deleted');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete permit: ${error.message}`);
    },
  });
}
