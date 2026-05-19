import { create } from 'zustand';
import type { PermitListItem, PermitWithRelations, PermitStatus } from '@permitpro/shared';

interface PermitsState {
  permits: PermitListItem[];
  permitsById: Record<string, PermitWithRelations>;
  total: number;
  isLoading: boolean;
  error: string | null;
  offlineQueueCount: number;
  searchQuery: string;
  statusFilter: PermitStatus | null;
  typeFilter: string | null;

  setPermits: (permits: PermitListItem[], total: number) => void;
  setPermitDetail: (permit: PermitWithRelations) => void;
  updatePermitOptimistic: (id: string, updates: Partial<PermitWithRelations>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setOfflineQueueCount: (count: number) => void;
  setSearchQuery: (query: string) => void;
  setStatusFilter: (status: PermitStatus | null) => void;
  setTypeFilter: (type: string | null) => void;
}

export const usePermitsStore = create<PermitsState>((set, get) => ({
  permits: [],
  permitsById: {},
  total: 0,
  isLoading: false,
  error: null,
  offlineQueueCount: 0,
  searchQuery: '',
  statusFilter: null,
  typeFilter: null,

  setPermits: (permits, total) => set({ permits, total }),

  setPermitDetail: (permit) =>
    set((state) => ({
      permitsById: { ...state.permitsById, [permit.id]: permit },
    })),

  updatePermitOptimistic: (id, updates) => {
    const { permitsById } = get();
    const existing = permitsById[id];
    if (existing) {
      set({
        permitsById: {
          ...permitsById,
          [id]: { ...existing, ...updates },
        },
      });
    }
  },

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  setOfflineQueueCount: (count) => set({ offlineQueueCount: count }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  setStatusFilter: (status) => set({ statusFilter: status }),

  setTypeFilter: (type) => set({ typeFilter: type }),
}));
