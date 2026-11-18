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

export const mediaApi = {
  async uploadMedia(file: File, folder = 'avatars'): Promise<{ public_id: string; secure_url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await authFetch(`${API_BASE}/media/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || 'Lỗi tải ảnh lên hệ thống');
    }
    return res.json();
  },

  async uploadMultipleMedia(files: File[], folder = 'used_cars_listings'): Promise<any[]> {
    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));
    formData.append('folder', folder);

    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await authFetch(`${API_BASE}/media/upload-multiple`, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || 'Lỗi upload ảnh lên hệ thống');
    }
    return res.json();
  },

};
