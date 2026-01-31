/**
 * 인증 전역 상태 (Zustand)
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types/entities';
import type { TokenResponse, UserResponse } from '@/types/dto';

const TOKEN_ACCESS = 'accessToken';
const TOKEN_REFRESH = 'refreshToken';

export type LoginOptions = { keepLoggedIn?: boolean };

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  login: (tokenResponse: TokenResponse, options?: LoginOptions) => void;
  logout: () => void;
  setUser: (user: User | null) => void;
}

function getTokenStorage(keepLoggedIn: boolean): Storage {
  return keepLoggedIn !== false ? localStorage : sessionStorage;
}

export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_ACCESS) || sessionStorage.getItem(TOKEN_ACCESS);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(TOKEN_REFRESH) || sessionStorage.getItem(TOKEN_REFRESH);
}

function userResponseToUser(r: UserResponse): User {
  return {
    id: r.id,
    email: r.email,
    name: r.name,
    phone: '',
    role: r.role as User['role'],
    createdAt: new Date().toISOString(),
  };
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,

      login: (tokenResponse, options) => {
        const storage = getTokenStorage(options?.keepLoggedIn ?? true);
        storage.setItem(TOKEN_ACCESS, tokenResponse.accessToken);
        storage.setItem(TOKEN_REFRESH, tokenResponse.refreshToken ?? '');
        set({
          user: tokenResponse.user ? userResponseToUser(tokenResponse.user) : null,
          accessToken: tokenResponse.accessToken,
          isAuthenticated: true,
        });
      },

      logout: () => {
        localStorage.removeItem(TOKEN_ACCESS);
        localStorage.removeItem(TOKEN_REFRESH);
        sessionStorage.removeItem(TOKEN_ACCESS);
        sessionStorage.removeItem(TOKEN_REFRESH);
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
        });
      },

      setUser: (user) => set({ user }),
    }),
    {
      name: 'auth-storage',
      partialize: (s) => ({ user: s.user, isAuthenticated: s.isAuthenticated }),
      onRehydrateStorage: () => (storedState) => {
        if (storedState?.isAuthenticated && !getAccessToken()) {
          useAuthStore.getState().logout();
        }
      },
    }
  )
);
