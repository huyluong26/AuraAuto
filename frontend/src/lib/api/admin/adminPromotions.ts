import { API_BASE, authFetch, parseApiError } from '../core';
import {
  AdminPromotionsOverview,
  AdminPromotionPackage,
  AdminFeaturedListing,
  AdminPaymentTransaction,
} from '@/features/admin/types';

export const adminPromotionsApi = {
  async getAdminPromotionsOverview(): Promise<AdminPromotionsOverview> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const res = await authFetch(`${API_BASE}/admin/promotions/overview`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Không thể tải tổng quan doanh thu tin nổi bật');
    return res.json();
  },

  async getAdminPromotionPackages(): Promise<AdminPromotionPackage[]> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const res = await authFetch(`${API_BASE}/admin/promotions/packages`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Không thể tải danh sách gói khuyến mãi');
    return res.json();
  },

  async createAdminPromotionPackage(data: any): Promise<any> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const res = await authFetch(`${API_BASE}/admin/promotions/packages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(parseApiError(err, 'Không thể tạo mới gói khuyến mãi'));
    }
    return res.json();
  },

  async updateAdminPromotionPackage(id: string, data: any): Promise<any> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const res = await authFetch(`${API_BASE}/admin/promotions/packages/${id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(parseApiError(err, 'Không thể cập nhật gói khuyến mãi'));
    }
    return res.json();
  },

  async deleteAdminPromotionPackage(id: string): Promise<any> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const res = await authFetch(`${API_BASE}/admin/promotions/packages/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(parseApiError(err, 'Không thể xóa gói khuyến mãi'));
    }
    return res.json();
  },

  async getAdminFeaturedListings(params?: { status_filter?: string; search?: string }): Promise<AdminFeaturedListing[]> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const qs = new URLSearchParams();
    if (params?.status_filter) qs.set('status_filter', params.status_filter);
    if (params?.search) qs.set('search', params.search);

    const res = await authFetch(`${API_BASE}/admin/promotions/featured-listings?${qs.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Không thể tải danh sách tin nổi bật');
    return res.json();
  },

  async grantAdminFeaturedListing(listingId: string, data: { days: number; package_code?: string; note?: string }): Promise<any> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const res = await authFetch(`${API_BASE}/admin/promotions/featured-listings/${listingId}/grant`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(parseApiError(err, 'Không thể cấp quyền tin nổi bật'));
    }
    return res.json();
  },

  async revokeAdminFeaturedListing(listingId: string, data?: { reason?: string }): Promise<any> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const res = await authFetch(`${API_BASE}/admin/promotions/featured-listings/${listingId}/revoke`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data || {}),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(parseApiError(err, 'Không thể thu hồi tin nổi bật'));
    }
    return res.json();
  },

  async getAdminPaymentTransactions(params?: {
    status_filter?: string;
    search?: string;
    page?: number;
    page_size?: number;
  }): Promise<AdminPaymentTransaction[]> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const qs = new URLSearchParams();
    if (params?.status_filter) qs.set('status_filter', params.status_filter);
    if (params?.search) qs.set('search', params.search);
    if (params?.page) qs.set('page', String(params.page));
    if (params?.page_size) qs.set('page_size', String(params.page_size));

    const res = await authFetch(`${API_BASE}/admin/promotions/transactions?${qs.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Không thể tải lịch sử giao dịch thanh toán');
    return res.json();
  },
};

