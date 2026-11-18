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

export const favoritesApi = {
  async addFavorite(listingId: string): Promise<{ message: string }> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) throw new Error('Vui lòng đăng nhập để lưu tin');
    const res = await authFetch(`${API_BASE}/me/favorites/${listingId}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || 'Không thể lưu tin vào danh sách yêu thích');
    }
    return res.json();
  },

  async removeFavorite(listingId: string): Promise<{ message: string }> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) throw new Error('Vui lòng đăng nhập');
    const res = await authFetch(`${API_BASE}/me/favorites/${listingId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || 'Không thể xóa tin khỏi danh sách yêu thích');
    }
    return res.json();
  },

  async getFavorites(): Promise<any[]> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) return [];
    const res = await authFetch(`${API_BASE}/me/favorites`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    return res.json();
  },

  // Chats APIs,

};
