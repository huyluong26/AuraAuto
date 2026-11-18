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

export const chatsApi = {
  async getUserConversations(): Promise<any[]> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) return [];
    const res = await authFetch(`${API_BASE}/chats/conversations`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    return res.json();
  },

  async getOrCreateConversation(listingId: string): Promise<any> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) throw new Error('Vui lòng đăng nhập để gửi tin nhắn cho chủ xe');
    const res = await authFetch(`${API_BASE}/chats/conversations`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ listing_id: listingId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || err?.detail || 'Không thể mở cuộc trò chuyện với chủ xe');
    }
    return res.json();
  },

  async getConversationMessages(conversationId: string, limit: number = 50): Promise<any[]> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) return [];
    const res = await authFetch(`${API_BASE}/chats/conversations/${conversationId}/messages?limit=${limit}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    return res.json();
  },

  async markConversationAsRead(conversationId: string): Promise<boolean> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) return false;
    const res = await authFetch(`${API_BASE}/chats/conversations/${conversationId}/read`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.ok;
  },

  async sendChatMessage(conversationId: string, content: string): Promise<any> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) throw new Error('Vui lòng đăng nhập để gửi tin nhắn');
    const res = await authFetch(`${API_BASE}/chats/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || err?.detail || 'Không thể gửi tin nhắn');
    }
    return res.json();
  },

  // Showrooms APIs,

};
