import {
  API_BASE,
  authFetch,
  getClientCache,
  setClientCache,
  invalidateClientCache,
  deduplicatedFetch,
  clearAuthSession,
  parseApiError,
} from './core';
import {
  ListingItem,
  ListingDetail,
  ValuationResponse,
  NaturalSearchResponse,
  ArticleItem,
  ArticleDetail,
  CarRecognitionResponse,
} from '@/types';
import {
  AdminPromotionsOverview,
  AdminPromotionPackage,
  AdminFeaturedListing,
  AdminPaymentTransaction,
} from '@/features/admin/types';

export const listingsApi = {
  async getListings(params?: {
    keyword?: string;
    search?: string;
    brand?: string;
    brand_id?: string;
    body_type?: string;
    fuel_type?: string;
    transmission?: string;
    min_price?: number;
    max_price?: number;
    min_price_vnd?: number;
    max_price_vnd?: number;
    min_year?: number;
    max_year?: number;
    max_km?: number;
    province_code?: string;
    sort_by?: string;
    page?: number;
    page_size?: number;
  }): Promise<{ items: ListingItem[]; total: number; page: number; total_pages: number }> {
    const searchParams = new URLSearchParams();
    if (params) {
      const p: Record<string, any> = { ...params };
      if (p.keyword && !p.search) p.search = p.keyword;
      if (p.min_price !== undefined && p.min_price_vnd === undefined) p.min_price_vnd = p.min_price;
      if (p.max_price !== undefined && p.max_price_vnd === undefined) p.max_price_vnd = p.max_price;
      delete p.keyword;
      delete p.min_price;
      delete p.max_price;

      Object.entries(p).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          searchParams.append(k, String(v));
        }
      });
    }
    const isHomepageOrStatic = !params || (Object.keys(params).length === 1 && params.page_size === 12);
    const fetchOptions: RequestInit = isHomepageOrStatic
      ? { next: { revalidate: 30 } }
      : { cache: 'no-store' };
    const res = await fetch(`${API_BASE}/listings?${searchParams.toString()}`, fetchOptions);
    if (!res.ok) throw new Error('Không thể tải danh sách xe');
    return res.json();
  },

  async getListingById(id: string): Promise<ListingDetail> {
    const res = await fetch(`${API_BASE}/listings/${id}`, { next: { revalidate: 30 } });
    if (!res.ok) throw new Error('Không tìm thấy thông tin xe');
    return res.json();
  },

  // Appointments (SCR-16 / SCR-17 - Real database calls),

  async createListing(data: any): Promise<{ message: string; data: { id: string; status: string } }> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await authFetch(`${API_BASE}/listings?submit_now=true`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(parseApiError(err, 'Không thể tạo tin đăng bán xe'));
    }
    return res.json();
  },

  async submitListingForReview(id: string): Promise<{ message: string; data: { id: string; status: string } }> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const res = await authFetch(`${API_BASE}/listings/${id}/submit`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || 'Không thể gửi duyệt tin');
    }
    return res.json();
  },

  // Auth & Profile,

  async getMyListings(
    page: number = 1,
    page_size: number = 20,
    statusFilter?: string,
    search?: string
  ): Promise<{ items: any[]; pagination: any }> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) return { items: [], pagination: { page: 1, page_size: 20, total: 0, total_pages: 0 } };

    const params = new URLSearchParams({
      page: String(page),
      page_size: String(page_size),
    });
    if (statusFilter && statusFilter !== 'ALL') params.set('status_filter', statusFilter);
    if (search && search.trim()) params.set('search', search.trim());

    const res = await authFetch(`${API_BASE}/listings/me/my-listings?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return { items: [], pagination: { page: 1, page_size: 20, total: 0, total_pages: 0 } };
    return res.json();
  },

  async getMyListingsSummary(forceRefresh: boolean = false): Promise<{
    total_listings: number;
    published_listings: number;
    pending_listings: number;
    sold_listings: number;
    rejected_listings: number;
    draft_listings: number;
    hidden_listings: number;
    featured_listings: number;
    total_views: number;
    total_favorites: number;
  }> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const defaultSummary = {
      total_listings: 0,
      published_listings: 0,
      pending_listings: 0,
      sold_listings: 0,
      rejected_listings: 0,
      draft_listings: 0,
      hidden_listings: 0,
      featured_listings: 0,
      total_views: 0,
      total_favorites: 0,
    };
    if (!token) return defaultSummary;

    const cacheKey = 'listings:my_summary';
    if (!forceRefresh) {
      const cached = getClientCache<typeof defaultSummary>(cacheKey);
      if (cached) return cached;
    }

    return deduplicatedFetch(cacheKey, async () => {
      const res = await authFetch(`${API_BASE}/listings/me/summary`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      if (!res.ok) return defaultSummary;
      const data = await res.json();
      setClientCache(cacheKey, data, 15);
      return data;
    });
  },

  async toggleHideListing(id: string): Promise<any> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) throw new Error('Chưa đăng nhập');
    const res = await authFetch(`${API_BASE}/listings/${id}/toggle-hide`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || err?.message || 'Không thể thay đổi trạng thái ẩn/hiện');
    }
    invalidateClientCache('listings:my_summary');
    return res.json();
  },

  async relistListing(id: string): Promise<any> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) throw new Error('Chưa đăng nhập');
    const res = await authFetch(`${API_BASE}/listings/${id}/relist`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || err?.message || 'Không thể mở bán lại tin');
    }
    invalidateClientCache('listings:my_summary');
    return res.json();
  },

  async deleteMyListing(id: string): Promise<any> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) throw new Error('Chưa đăng nhập');
    const res = await authFetch(`${API_BASE}/listings/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || err?.message || 'Không thể xóa tin đăng');
    }
    invalidateClientCache('listings:my_summary');
    return res.json();
  },

  async getEditableListing(id: string): Promise<any> {
    const res = await authFetch(`${API_BASE}/listings/${id}/editable`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || err?.message || 'Không thể lấy thông tin chỉnh sửa tin đăng');
    }
    const json = await res.json();
    return json.data;
  },

  async updateListing(id: string, data: any): Promise<{ message: string; data: any }> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) throw new Error('Chưa đăng nhập');
    const res = await authFetch(`${API_BASE}/listings/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || err?.message || 'Không thể cập nhật tin đăng');
    }
    invalidateClientCache('listings:my_summary');
    return res.json();
  },

  async quickUpdateListing(
    id: string,
    data: { price_vnd?: number; title?: string; location_address?: string }
  ): Promise<any> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) throw new Error('Chưa đăng nhập');
    const res = await authFetch(`${API_BASE}/listings/${id}/quick-update`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || err?.message || 'Không thể cập nhật tin đăng');
    }
    invalidateClientCache('listings:my_summary');
    return res.json();
  },

  async markListingSold(id: string): Promise<any> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) throw new Error('Chưa đăng nhập');
    const res = await authFetch(`${API_BASE}/listings/${id}/mark-sold`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || err?.message || 'Không thể đánh dấu đã bán');
    }
    invalidateClientCache('listings:my_summary');
    return res.json();
  },

  // Admin APIs (Protected by require_admin),

  async getFeaturedListings(limit: number = 6): Promise<ListingItem[]> {
    const res = await fetch(`${API_BASE}/listings/featured?limit=${limit}`, { next: { revalidate: 30 } });
    if (!res.ok) return [];
    return res.json();
  },

  async getListingPromotionStatus(listingId: string): Promise<{
    listing_id: string;
    is_featured: boolean;
    featured_until?: string | null;
    featured_tier?: string | null;
    active_days_remaining: number;
  }> {
    const res = await fetch(`${API_BASE}/payments/listing/${listingId}/status`, { cache: 'no-store' });
    if (!res.ok) {
      return {
        listing_id: listingId,
        is_featured: false,
        active_days_remaining: 0,
      };
    }
    return res.json();
  },

};
