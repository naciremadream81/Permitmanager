import { create } from 'zustand';

interface UiState {
  activeTab: string;
  bottomSheetOpen: boolean;
  bottomSheetContent: string | null;
  scanInProgress: boolean;
  selectedPermitIdForScan: string | null;

  setActiveTab: (tab: string) => void;
  openBottomSheet: (content: string) => void;
  closeBottomSheet: () => void;
  setScanInProgress: (inProgress: boolean) => void;
  setSelectedPermitIdForScan: (id: string | null) => void;
}

export const useUiStore = create<UiState>((set) => ({
  activeTab: 'index',
  bottomSheetOpen: false,
  bottomSheetContent: null,
  scanInProgress: false,
  selectedPermitIdForScan: null,

  setActiveTab: (tab) => set({ activeTab: tab }),

  openBottomSheet: (content) =>
    set({ bottomSheetOpen: true, bottomSheetContent: content }),

  closeBottomSheet: () =>
    set({ bottomSheetOpen: false, bottomSheetContent: null }),

  setScanInProgress: (inProgress) => set({ scanInProgress: inProgress }),

  setSelectedPermitIdForScan: (id) =>
    set({ selectedPermitIdForScan: id }),
}));
