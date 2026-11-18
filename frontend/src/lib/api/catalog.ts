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

export const catalogApi = {
  async getBrands(): Promise<Array<{ id: string; name: string; slug: string; logo_url: string | null }>> {
    const cached = getClientCache<Array<{ id: string; name: string; slug: string; logo_url: string | null }>>('catalog:brands');
    if (cached) return cached;

    const res = await fetch(`${API_BASE}/catalog/brands`, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error('Không thể tải danh sách hãng xe');
    const data = await res.json();
    setClientCache('catalog:brands', data, 1800);
    return data;
  },

  async getModelsByBrand(brandId: string): Promise<Array<{ id: string; brand_id: string; name: string; slug: string; body_type: string }>> {
    const cacheKey = `catalog:models:${brandId}`;
    const cached = getClientCache<Array<{ id: string; brand_id: string; name: string; slug: string; body_type: string }>>(cacheKey);
    if (cached) return cached;

    const res = await fetch(`${API_BASE}/catalog/brands/${brandId}/models`, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error('Không thể tải danh sách dòng xe');
    const data = await res.json();
    setClientCache(cacheKey, data, 1800);
    return data;
  },

  async resolveBrandModel(data: {
    brand_name: string;
    model_name?: string;
    body_type?: string;
  }): Promise<{ brand_id: string; brand_name: string; model_id: string | null; model_name: string | null }> {
    const res = await fetch(`${API_BASE}/catalog/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Không thể xác thực thương hiệu / dòng xe');
    return res.json();
  },

  // Listings Creation,

};
