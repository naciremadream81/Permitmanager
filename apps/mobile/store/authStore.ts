import { create } from 'zustand';
import type { User, Organization, OrgMembership, UserRole } from '@permitpro/shared';
import { clearAuthTokens, saveAuthTokens } from '../lib/auth';

interface AuthState {
  user: User | null;
  org: Organization | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setUser: (user: User, org: Organization, role: UserRole) => void;
  login: (accessToken: string, refreshToken: string, user: User, org: Organization, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  org: null,
  role: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user, org, role) => {
    set({ user, org, role, isAuthenticated: true, isLoading: false });
  },

  login: async (accessToken, refreshToken, user, org, role) => {
    await saveAuthTokens(accessToken, refreshToken);
    set({ user, org, role, isAuthenticated: true, isLoading: false });
  },

  logout: async () => {
    await clearAuthTokens();
    set({ user: null, org: null, role: null, isAuthenticated: false, isLoading: false });
  },

  setLoading: (loading) => set({ isLoading: loading }),
}));
