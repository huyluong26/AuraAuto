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

export const authApi = {
  async login(identifier: string, password: string): Promise<{ access_token: string; token_type: string; refresh_token?: string; user: any }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(parseApiError(err, 'Đăng nhập không thành công'));
    }
    const data = await res.json();
    if (typeof window !== 'undefined') {
      if (data.access_token) localStorage.setItem('access_token', data.access_token);
      if (data.refresh_token) localStorage.setItem('refresh_token', data.refresh_token);
      if (data.user) localStorage.setItem('user', JSON.stringify(data.user));
      window.dispatchEvent(new Event('aura_auth_changed'));
    }
    return data;
  },

  async refreshToken(refreshTokenStr?: string): Promise<{ access_token: string; token_type: string; refresh_token: string; user: any }> {
    const token = refreshTokenStr || (typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null);
    if (!token) throw new Error('Không có refresh token');
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: token }),
    });
    if (!res.ok) {
      clearAuthSession();
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || 'Không thể làm mới phiên đăng nhập');
    }
    const data = await res.json();
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      window.dispatchEvent(new Event('aura_auth_changed'));
    }
    return data;
  },

  async logout(): Promise<void> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;
    if (token) {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      }).catch(() => {});
    }
    if (typeof window !== 'undefined') {
      clearAuthSession();
    }
  },

  async register(data: {
    email: string;
    password: string;
    display_name: string;
    phone?: string;
    phone_number?: string;
    province_code?: string;
    province_name?: string;
    address?: string;
    account_type?: 'INDIVIDUAL' | 'SHOWROOM';
    showroom_name?: string;
    tax_code?: string;
  }): Promise<any> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(parseApiError(err, 'Đăng ký không thành công'));
    }
    return res.json();
  },

  // Catalog,

  async getPublicSellerProfile(userIdOrShowroomId: string): Promise<any> {
    const res = await authFetch(`${API_BASE}/users/${userIdOrShowroomId}/public`, {
      cache: 'no-store',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || 'Không thể tìm thấy thông tin người bán hoặc showroom');
    }
    return res.json();
  },

  async getMe(): Promise<any> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) throw new Error('Chưa đăng nhập');

    const cached = getClientCache<any>('auth:me');
    if (cached) return cached;

    return deduplicatedFetch('auth:me', async () => {
      const res = await authFetch(`${API_BASE}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: 'no-store',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message || 'Không thể xác thực phiên đăng nhập');
      }
      const data = await res.json();
      setClientCache('auth:me', data, 10);
      return data;
    });
  },

  async updateProfile(data: {
    display_name?: string;
    phone?: string;
    avatar_url?: string;
    province_code?: string;
    province_name?: string;
    address?: string;
  }): Promise<any> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) throw new Error('Chưa đăng nhập');
    const res = await authFetch(`${API_BASE}/auth/me`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || err?.message || 'Không thể cập nhật thông tin');
    }
    invalidateClientCache('auth:me');
    const updated = await res.json();
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(updated));
      if (updated.province_code) {
        localStorage.setItem('user_province_code', updated.province_code);
      }
      window.dispatchEvent(new Event('aura_auth_changed'));
    }
    return updated;
  },

  async changePassword(data: {
    current_password: string;
    new_password: string;
  }): Promise<any> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) throw new Error('Chưa đăng nhập');
    const res = await authFetch(`${API_BASE}/auth/change-password`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(parseApiError(err, 'Không thể đổi mật khẩu'));
    }
    return res.json();
  },

  async forgotPassword(email: string): Promise<any> {
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(parseApiError(err, 'Không thể gửi yêu cầu đặt lại mật khẩu'));
    }
    return res.json();
  },

  async resetPassword(data: { token: string; new_password: string }): Promise<any> {
    const res = await fetch(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(parseApiError(err, 'Mã khôi phục không hợp lệ hoặc đã hết hạn'));
    }
    return res.json();
  },

};
