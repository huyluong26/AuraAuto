'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';

export const AUTH_STORAGE_KEY = 'user';
export const TOKEN_STORAGE_KEY = 'access_token';
export const AUTH_EVENT_KEY = 'aura_auth_changed';

export interface CurrentUser {
  id: number | string;
  email: string;
  full_name?: string;
  display_name?: string;
  phone?: string;
  phone_number?: string;
  role: string;
  avatar_url?: string;
  province_code?: string;
  province_name?: string;
  address?: string;
  account_type?: 'INDIVIDUAL' | 'SHOWROOM';
  email_verified_at?: string | null;
  created_at?: string;
  showroom?: {
    id: string;
    name: string;
    phone?: string;
    address?: string;
    province_code?: string;
    is_verified?: boolean;
    description?: string;
  };
}

function getAuthSnapshot(): string {
  try {
    return JSON.stringify([
      localStorage.getItem(TOKEN_STORAGE_KEY),
      localStorage.getItem(AUTH_STORAGE_KEY),
    ]);
  } catch {
    return '[null,null]';
  }
}

function getServerSnapshot(): string {
  return '';
}

function subscribe(callback: () => void): () => void {
  window.addEventListener(AUTH_EVENT_KEY, callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener(AUTH_EVENT_KEY, callback);
    window.removeEventListener('storage', callback);
  };
}

export function useCurrentUser() {
  // The server and the first client render both use the empty snapshot.
  const snapshot = useSyncExternalStore(subscribe, getAuthSnapshot, getServerSnapshot);
  const { user, token } = useMemo(() => {
    if (!snapshot) return { user: null, token: null };
    try {
      const [storedToken, storedUser] = JSON.parse(snapshot) as [string | null, string | null];
      return {
        token: storedToken,
        user: storedToken && storedUser ? JSON.parse(storedUser) as CurrentUser : null,
      };
    } catch {
      return { user: null, token: null };
    }
  }, [snapshot]);
  const router = useRouter();

  const loadUser = useCallback(() => {
    window.dispatchEvent(new Event(AUTH_EVENT_KEY));
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem('user_province_code');
    window.dispatchEvent(new Event(AUTH_EVENT_KEY));
    router.push('/dang-nhap');
  }, [router]);

  return {
    user,
    token,
    isLoggedIn: Boolean(token && user),
    isLoaded: snapshot !== '',
    logout,
    refreshUser: loadUser,
  };
}
