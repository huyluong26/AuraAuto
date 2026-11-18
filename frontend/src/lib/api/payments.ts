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

export const paymentsApi = {
  async getPromotionPackages(): Promise<{
    code: string;
    name: string;
    days: number;
    amount_vnd: number;
    description: string;
    badge?: string;
    color?: string;
  }[]> {
    const cached = getClientCache<any>('payments:packages');
    if (cached) return cached;

    const res = await fetch(`${API_BASE}/payments/packages`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json();
    setClientCache('payments:packages', data, 1800);
    return data;
  },

  async createPromotionPayment(data: {
    listing_id: string;
    package_code: string;
    bank_code?: string;
  }): Promise<{
    order_code: string;
    payment_url: string;
    amount_vnd: number;
    package_name: string;
    days: number;
  }> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const res = await authFetch(`${API_BASE}/payments/create-promotion`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || err?.detail || 'Không thể tạo đơn thanh toán');
    }
    return res.json();
  },

};
