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

export const appointmentsApi = {
  async getAppointments(role: string = 'all'): Promise<any[]> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) return [];
    const res = await authFetch(`${API_BASE}/appointments?role=${role}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    return res.json();
  },

  async createAppointment(data: {
    listing_id: string;
    scheduled_at: string;
    location: string;
    note?: string;
  }): Promise<any> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) throw new Error('Vui lòng đăng nhập để đặt lịch xem xe');
    const res = await authFetch(`${API_BASE}/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || err?.message || 'Không thể tạo lịch hẹn');
    }
    return res.json();
  },

  async confirmAppointment(id: string): Promise<any> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) throw new Error('Chưa đăng nhập');
    const res = await authFetch(`${API_BASE}/appointments/${id}/confirm`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Không thể xác nhận lịch hẹn');
    return res.json();
  },

  async declineAppointment(id: string, reason?: string): Promise<any> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) throw new Error('Chưa đăng nhập');
    const res = await authFetch(`${API_BASE}/appointments/${id}/decline${reason ? `?reason=${encodeURIComponent(reason)}` : ''}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Không thể từ chối lịch hẹn');
    return res.json();
  },

  async cancelAppointment(id: string, reasonCode: string = 'OTHER', reasonText?: string): Promise<any> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) throw new Error('Chưa đăng nhập');
    const res = await authFetch(`${API_BASE}/appointments/${id}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        cancel_reason_code: reasonCode || 'OTHER',
        cancel_reason_text: reasonText || 'Thay đổi kế hoạch cá nhân',
        reason_code: reasonCode || 'OTHER',
        reason_text: reasonText || 'Thay đổi kế hoạch cá nhân',
      }),
    });
    if (!res.ok) {
      let errMsg = 'Không thể hủy lịch hẹn';
      try {
        const err = await res.json();
        errMsg = err?.error?.message || err?.message || err?.detail || 'Không thể hủy lịch hẹn';
      } catch {}
      throw new Error(errMsg);
    }
    return res.json();
  },

  async completeAppointment(id: string): Promise<any> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) throw new Error('Chưa đăng nhập');
    const res = await authFetch(`${API_BASE}/appointments/${id}/complete`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Không thể hoàn tất lịch hẹn');
    return res.json();
  },

  // AI Pricing & Search,

};
