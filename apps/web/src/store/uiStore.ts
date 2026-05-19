import { create } from 'zustand';

interface UIState {
  commandPaletteOpen: boolean;
  sidebarCollapsed: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  commandPaletteOpen: false,
  sidebarCollapsed: false,
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
}));
