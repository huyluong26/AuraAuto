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

export const showroomsApi = {
  async getMyShowroom(): Promise<any | null> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) return null;
    const res = await authFetch(`${API_BASE}/showrooms/my`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return res.json();
  },

  async updateMyShowroom(data: {
    name?: string;
    phone?: string;
    address?: string;
    province_code?: string;
    description?: string;
    logo_url?: string;
    banner_url?: string;
  }): Promise<any> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) throw new Error('Vui lòng đăng nhập');
    const res = await authFetch(`${API_BASE}/showrooms/my`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || err?.detail || 'Không thể cập nhật Showroom');
    }
    return res.json();
  },

  async registerShowroom(data: {
    name: string;
    phone?: string;
    address?: string;
    province_code?: string;
    description?: string;
    logo_url?: string;
    banner_url?: string;
  }): Promise<any> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) throw new Error('Vui lòng đăng nhập để đăng ký Showroom');
    const res = await authFetch(`${API_BASE}/showrooms`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || err?.detail || 'Không thể đăng ký Showroom');
    }
    return res.json();
  },

  async getShowroom(id: string): Promise<any | null> {
    const res = await fetch(`${API_BASE}/showrooms/${id}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  },

  async getShowrooms(params?: {
    province_code?: string;
    search?: string;
    is_active?: boolean;
    page?: number;
    page_size?: number;
  }): Promise<any> {
    const qs = new URLSearchParams();
    if (params?.province_code) qs.set('province_code', params.province_code);
    if (params?.search) qs.set('search', params.search);
    if (params?.is_active !== undefined) qs.set('is_active', String(params.is_active));
    if (params?.page) qs.set('page', String(params.page));
    if (params?.page_size) qs.set('page_size', String(params.page_size));
    const res = await fetch(`${API_BASE}/showrooms?${qs.toString()}`, { cache: 'no-store' });
    if (!res.ok) return { items: [], total: 0 };
    return res.json();
  },

  // Trust & Safety Reports (Admin),

};
