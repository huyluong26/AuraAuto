import {
  authFetch,
  API_BASE,
  getClientCache,
  setClientCache,
  invalidateClientCache,
  deduplicatedFetch,
} from './core';

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: string;
  reference_type?: string;
  reference_id?: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

export const notificationsApi = {
  async getNotifications(forceRefresh: boolean = false): Promise<NotificationItem[]> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) return [];
    const cacheKey = 'notifications:list';
    if (!forceRefresh) {
      const cached = getClientCache<NotificationItem[]>(cacheKey);
      if (cached) return cached;
    }
    return deduplicatedFetch(cacheKey, async () => {
      try {
        const res = await authFetch(`${API_BASE}/me/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });
        if (!res.ok) return [];
        const data = await res.json();
        setClientCache(cacheKey, data, 4);
        return data;
      } catch {
        return [];
      }
    });
  },

  async getUnreadCount(forceRefresh: boolean = false): Promise<{ unread_count: number }> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) return { unread_count: 0 };
    const cacheKey = 'notifications:unread_count';
    if (!forceRefresh) {
      const cached = getClientCache<{ unread_count: number }>(cacheKey);
      if (cached) return cached;
    }
    return deduplicatedFetch(cacheKey, async () => {
      try {
        const res = await authFetch(`${API_BASE}/me/notifications/unread-count`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });
        if (!res.ok) return { unread_count: 0 };
        const data = await res.json();
        setClientCache(cacheKey, data, 4);
        return data;
      } catch {
        return { unread_count: 0 };
      }
    });
  },

  async markNotificationRead(id: string): Promise<any> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) return;
    try {
      const res = await authFetch(`${API_BASE}/me/notifications/${id}/read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      invalidateClientCache('notifications:');
      return res.ok ? await res.json() : null;
    } catch {
      // ignore
    }
  },

  async markAllNotificationsRead(): Promise<any> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) return;
    try {
      const res = await authFetch(`${API_BASE}/me/notifications/read-all`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      invalidateClientCache('notifications:');
      return res.ok ? await res.json() : null;
    } catch {
      // ignore
    }
  },
};
