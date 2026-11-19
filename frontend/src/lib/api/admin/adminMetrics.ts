import {
  API_BASE,
  authFetch,
  getClientCache,
  setClientCache,
  deduplicatedFetch,
} from '../core';

export const adminMetricsApi = {
  async getAdminMetrics(forceRefresh: boolean = false): Promise<any> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const cacheKey = 'admin:metrics';
    if (!forceRefresh) {
      const cached = getClientCache<any>(cacheKey);
      if (cached) return cached;
    }
    return deduplicatedFetch(cacheKey, async () => {
      const res = await authFetch(`${API_BASE}/admin/metrics`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: 'no-store',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message || 'Không thể lấy dữ liệu thống kê');
      }
      const data = await res.json();
      setClientCache(cacheKey, data, 15);
      return data;
    });
  },

  async getAdminListingCounts(forceRefresh: boolean = false): Promise<Record<string, number>> {
    const cacheKey = 'admin:listing_counts';
    if (!forceRefresh) {
      const cached = getClientCache<Record<string, number>>(cacheKey);
      if (cached) return cached;
    }
    return deduplicatedFetch(cacheKey, async () => {
      const res = await authFetch(`${API_BASE}/admin/listings/counts`, {
        cache: 'no-store',
      });
      if (!res.ok) {
        return { ALL: 0, PENDING_REVIEW: 0, PUBLISHED: 0, REJECTED: 0, SOLD: 0, DRAFT: 0 };
      }
      const data = await res.json();
      setClientCache(cacheKey, data, 10);
      return data;
    });
  },

  async getAdminArticleCounts(forceRefresh: boolean = false): Promise<Record<string, number>> {
    const cacheKey = 'admin:article_counts';
    if (!forceRefresh) {
      const cached = getClientCache<Record<string, number>>(cacheKey);
      if (cached) return cached;
    }
    return deduplicatedFetch(cacheKey, async () => {
      const res = await authFetch(`${API_BASE}/admin/articles/counts`, {
        cache: 'no-store',
      });
      if (!res.ok) {
        return { ALL: 0, PUBLISHED: 0, PENDING_REVIEW: 0, DRAFT: 0 };
      }
      const data = await res.json();
      setClientCache(cacheKey, data, 10);
      return data;
    });
  },

  async getAdminAppointmentCounts(forceRefresh: boolean = false): Promise<Record<string, number>> {
    const cacheKey = 'admin:appointment_counts';
    if (!forceRefresh) {
      const cached = getClientCache<Record<string, number>>(cacheKey);
      if (cached) return cached;
    }
    return deduplicatedFetch(cacheKey, async () => {
      const res = await authFetch(`${API_BASE}/admin/appointments/counts`, {
        cache: 'no-store',
      });
      if (!res.ok) {
        return { ALL: 0, PENDING: 0, CONFIRMED: 0, COMPLETED: 0, CANCELLED: 0 };
      }
      const data = await res.json();
      setClientCache(cacheKey, data, 10);
      return data;
    });
  },
};

