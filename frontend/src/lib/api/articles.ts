import { API_BASE, authFetch, getClientCache, setClientCache, clearAuthSession, parseApiError } from './core';
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

export const articlesApi = {
  async getArticles(params?: {
    category?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<ArticleItem[]> {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.append('category', params.category);
    if (params?.search) searchParams.append('search', params.search);
    if (params?.limit) searchParams.append('limit', String(params.limit));
    if (params?.offset) searchParams.append('offset', String(params.offset));

    const isPublicDefault = !params?.category && !params?.search && (!params?.offset || params.offset === 0);
    const fetchOptions: RequestInit = isPublicDefault
      ? { next: { revalidate: 60 } }
      : { cache: 'no-store' };
    const res = await fetch(`${API_BASE}/articles?${searchParams.toString()}`, fetchOptions);
    if (!res.ok) throw new Error('Không thể tải danh sách bài viết');
    return res.json();
  },

  async getArticleDetail(idOrSlug: string): Promise<ArticleDetail> {
    const res = await fetch(`${API_BASE}/articles/${idOrSlug}`, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error('Không tìm thấy bài viết');
    return res.json();
  },

  async getAdminArticles(params?: {
    status_filter?: string;
    category?: string;
    search?: string;
  }): Promise<any[]> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const searchParams = new URLSearchParams();
    if (params?.status_filter) searchParams.append('status_filter', params.status_filter);
    if (params?.category) searchParams.append('category', params.category);
    if (params?.search) searchParams.append('search', params.search);

    const res = await authFetch(`${API_BASE}/admin/articles?${searchParams.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || 'Không thể tải danh sách tin tức quản trị');
    }
    return res.json();
  },

  async createAdminArticle(data: {
    title: string;
    summary?: string;
    content: string;
    thumbnail_url?: string;
    category?: string;
    status?: string;
  }): Promise<any> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const res = await authFetch(`${API_BASE}/admin/articles`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || 'Không thể đăng bài viết tin tức mới');
    }
    return res.json();
  },

  async updateAdminArticle(id: string, data: any): Promise<any> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const res = await authFetch(`${API_BASE}/admin/articles/${id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || 'Không thể cập nhật bài viết tin tức');
    }
    return res.json();
  },

  async approveAdminArticle(id: string): Promise<{ message: string }> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const res = await authFetch(`${API_BASE}/admin/articles/${id}/approve`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || 'Không thể duyệt xuất bản tin tức');
    }
    return res.json();
  },

  async deleteAdminArticle(id: string): Promise<{ message: string }> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const res = await authFetch(`${API_BASE}/admin/articles/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || 'Không thể xóa bài viết tin tức');
    }
    return res.json();
  },

};
