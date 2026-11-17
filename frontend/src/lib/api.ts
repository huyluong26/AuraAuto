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

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// Client-side in-memory cache for static catalog and options (0ms read time in browser)
const clientMemoryCache = new Map<string, { data: any; expiry: number }>();

function getClientCache<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  const entry = clientMemoryCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiry) {
    clientMemoryCache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setClientCache(key: string, data: any, ttlSeconds: number = 300): void {
  if (typeof window === 'undefined') return;
  clientMemoryCache.set(key, { data, expiry: Date.now() + ttlSeconds * 1000 });
}

export function formatVND(amount?: number | null): string {
  if (amount === undefined || amount === null || amount <= 0) return 'Thỏa thuận';
  if (amount >= 1_000_000_000) {
    const ty = amount / 1_000_000_000;
    return `${ty.toLocaleString('vi-VN', { maximumFractionDigits: 2 })} tỷ`;
  }
  if (amount >= 1_000_000) {
    const tr = amount / 1_000_000;
    return `${tr.toLocaleString('vi-VN', { maximumFractionDigits: 1 })} triệu`;
  }
  return `${amount.toLocaleString('vi-VN')} đ`;
}

export function formatFullVND(amount?: number | null): string {
  if (amount === undefined || amount === null) return '0 đ';
  return `${amount.toLocaleString('vi-VN')} đ`;
}

export function formatKm(km?: number | null): string {
  if (km === undefined || km === null) return '0 km';
  return `${km.toLocaleString('vi-VN')} km`;
}

export function parseApiError(errData: any, fallbackMessage: string = 'Đã có lỗi xảy ra'): string {
  if (!errData) return fallbackMessage;

  // 1. Kiểm tra danh sách chi tiết lỗi trường nhập liệu (FastAPI RequestValidationError details)
  const details = errData?.error?.details || errData?.details;
  if (Array.isArray(details) && details.length > 0) {
    const fieldMap: Record<string, string> = {
      email: 'Email',
      password: 'Mật khẩu',
      new_password: 'Mật khẩu mới',
      current_password: 'Mật khẩu hiện tại',
      display_name: 'Họ và tên',
      phone: 'Số điện thoại',
      identifier: 'Email hoặc Số điện thoại',
      token: 'Mã xác thực',
      title: 'Tiêu đề',
      price_vnd: 'Giá bán',
      manufacture_year: 'Năm sản xuất',
      odometer_km: 'Số km (Odo)',
      body_type: 'Kiểu dáng',
      fuel_type: 'Nhiên liệu',
      transmission: 'Hộp số',
      province_code: 'Tỉnh thành',
      location_address: 'Địa chỉ',
      description: 'Mô tả',
      showroom_name: 'Tên Showroom',
      tax_code: 'Mã số thuế',
    };

    const fieldErrors: string[] = [];
    for (const d of details.slice(0, 3)) {
      const loc = d.loc ? d.loc.filter((x: any) => x !== 'body' && x !== 'query' && x !== 'path') : [];
      const rawField = loc.length > 0 ? String(loc[loc.length - 1]) : '';
      const fieldLabel = fieldMap[rawField] || rawField;

      let msg = d.msg ? String(d.msg).replace('Value error, ', '').trim() : '';
      if (d.type === 'missing') msg = 'Vui lòng không để trống';
      if (msg.includes('value is not a valid email address')) msg = 'Địa chỉ email không hợp lệ';

      if (fieldLabel && msg) {
        fieldErrors.push(`${fieldLabel}: ${msg}`);
      } else if (msg) {
        fieldErrors.push(msg);
      }
    }
    if (fieldErrors.length > 0) {
      return fieldErrors.join(' | ');
    }
  }

  // 2. Thông báo lỗi từ backend
  const backendMsg = errData?.error?.message || errData?.message || errData?.detail;
  if (typeof backendMsg === 'string' && backendMsg.trim() && backendMsg !== 'Dữ liệu gửi lên không đúng định dạng') {
    return backendMsg;
  }

  return fallbackMessage;
}

// Mutex / singleton promise for token refresh to prevent concurrent refresh calls & race conditions
let refreshPromise: Promise<string | null> | null = null;

export function clearAuthSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  localStorage.removeItem('user_province_code');
  window.dispatchEvent(new Event('aura_auth_changed'));
}

export async function requestTokenRefresh(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) {
    clearAuthSession();
    return null;
  }

  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!res.ok) {
      clearAuthSession();
      return null;
    }

    const data = await res.json();
    if (data && data.access_token) {
      localStorage.setItem('access_token', data.access_token);
      if (data.refresh_token) {
        localStorage.setItem('refresh_token', data.refresh_token);
      }
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      window.dispatchEvent(new Event('aura_auth_changed'));
      return data.access_token;
    } else {
      clearAuthSession();
      return null;
    }
  } catch {
    clearAuthSession();
    return null;
  }
}

export async function authFetch(url: string, init: RequestInit = {}): Promise<Response> {
  if (typeof window === 'undefined') {
    return fetch(url, init);
  }

  const token = localStorage.getItem('access_token');
  const headers = new Headers(init.headers || {});
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let res = await fetch(url, { ...init, headers });

  if (res.status === 401) {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      if (!refreshPromise) {
        refreshPromise = requestTokenRefresh().finally(() => {
          refreshPromise = null;
        });
      }
      const newToken = await refreshPromise;
      if (newToken) {
        const retryHeaders = new Headers(init.headers || {});
        retryHeaders.set('Authorization', `Bearer ${newToken}`);
        res = await fetch(url, { ...init, headers: retryHeaders });
        if (res.status === 401) {
          clearAuthSession();
        }
      } else {
        clearAuthSession();
      }
    } else {
      clearAuthSession();
    }
  }

  return res;
}

export const api = {
  // Public Listings
  async getListings(params?: {
    keyword?: string;
    search?: string;
    brand_id?: string;
    body_type?: string;
    fuel_type?: string;
    transmission?: string;
    min_price?: number;
    max_price?: number;
    min_price_vnd?: number;
    max_price_vnd?: number;
    min_year?: number;
    max_year?: number;
    max_km?: number;
    province_code?: string;
    sort_by?: string;
    page?: number;
    page_size?: number;
  }): Promise<{ items: ListingItem[]; total: number; page: number; total_pages: number }> {
    const searchParams = new URLSearchParams();
    if (params) {
      const p: Record<string, any> = { ...params };
      if (p.keyword && !p.search) p.search = p.keyword;
      if (p.min_price !== undefined && p.min_price_vnd === undefined) p.min_price_vnd = p.min_price;
      if (p.max_price !== undefined && p.max_price_vnd === undefined) p.max_price_vnd = p.max_price;
      delete p.keyword;
      delete p.min_price;
      delete p.max_price;

      Object.entries(p).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          searchParams.append(k, String(v));
        }
      });
    }
    const isHomepageOrStatic = !params || (Object.keys(params).length === 1 && params.page_size === 12);
    const fetchOptions: RequestInit = isHomepageOrStatic
      ? { next: { revalidate: 30 } }
      : { cache: 'no-store' };
    const res = await fetch(`${API_BASE}/listings?${searchParams.toString()}`, fetchOptions);
    if (!res.ok) throw new Error('Không thể tải danh sách xe');
    return res.json();
  },

  async getListingById(id: string): Promise<ListingDetail> {
    const res = await fetch(`${API_BASE}/listings/${id}`, { next: { revalidate: 30 } });
    if (!res.ok) throw new Error('Không tìm thấy thông tin xe');
    return res.json();
  },

  // Appointments (SCR-16 / SCR-17 - Real database calls)
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

  // AI Pricing & Search
  async estimateValuation(data: {
    brand: string;
    model: string;
    variant?: string;
    manufacture_year: number;
    odometer_km: number;
    body_type?: string;
    fuel_type?: string;
    transmission?: string;
    province_code?: string;
    engine_displacement?: number;
    seats?: number;
    doors?: number;
    origin?: string;
  }): Promise<ValuationResponse> {
    const res = await fetch(`${API_BASE}/ai/valuations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || 'Không thể định giá xe lúc này');
    }
    return res.json();
  },

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

  async naturalSearch(query: string): Promise<NaturalSearchResponse> {
    const res = await fetch(`${API_BASE}/ai/natural-search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || 'Lỗi tìm kiếm tự nhiên');
    }
    return res.json();
  },

  // AI Vision Vehicle Recognition
  async recognizeCarImage(file: File): Promise<CarRecognitionResponse> {
    const formData = new FormData();
    formData.append('file', file);
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await authFetch(`${API_BASE}/ai/recognize-car`, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.detail || err?.error?.message || 'Không thể nhận diện hình ảnh xe');
    }
    return res.json();
  },

  async recognizeCarFromUrl(imageUrl: string): Promise<CarRecognitionResponse> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await authFetch(`${API_BASE}/ai/recognize-car-url`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ image_url: imageUrl }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.detail || err?.error?.message || 'Không thể nhận diện hình ảnh từ link');
    }
    return res.json();
  },

  // Auth
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

  // Catalog
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

  // Listings Creation
  async createListing(data: any): Promise<{ message: string; data: { id: string; status: string } }> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await authFetch(`${API_BASE}/listings?submit_now=true`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(parseApiError(err, 'Không thể tạo tin đăng bán xe'));
    }
    return res.json();
  },

  async submitListingForReview(id: string): Promise<{ message: string; data: { id: string; status: string } }> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const res = await authFetch(`${API_BASE}/listings/${id}/submit`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || 'Không thể gửi duyệt tin');
    }
    return res.json();
  },

  // Auth & Profile
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
    return res.json();
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

  async getMyListings(
    page: number = 1,
    page_size: number = 20,
    statusFilter?: string,
    search?: string
  ): Promise<{ items: any[]; pagination: any }> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) return { items: [], pagination: { page: 1, page_size: 20, total: 0, total_pages: 0 } };

    const params = new URLSearchParams({
      page: String(page),
      page_size: String(page_size),
    });
    if (statusFilter && statusFilter !== 'ALL') params.set('status_filter', statusFilter);
    if (search && search.trim()) params.set('search', search.trim());

    const res = await authFetch(`${API_BASE}/listings/me/my-listings?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return { items: [], pagination: { page: 1, page_size: 20, total: 0, total_pages: 0 } };
    return res.json();
  },

  async getMyListingsSummary(): Promise<{
    total_listings: number;
    published_listings: number;
    pending_listings: number;
    sold_listings: number;
    rejected_listings: number;
    draft_listings: number;
    hidden_listings: number;
    featured_listings: number;
    total_views: number;
    total_favorites: number;
  }> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const defaultSummary = {
      total_listings: 0,
      published_listings: 0,
      pending_listings: 0,
      sold_listings: 0,
      rejected_listings: 0,
      draft_listings: 0,
      hidden_listings: 0,
      featured_listings: 0,
      total_views: 0,
      total_favorites: 0,
    };
    if (!token) return defaultSummary;

    const res = await authFetch(`${API_BASE}/listings/me/summary`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return defaultSummary;
    return res.json();
  },

  async toggleHideListing(id: string): Promise<any> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) throw new Error('Chưa đăng nhập');
    const res = await authFetch(`${API_BASE}/listings/${id}/toggle-hide`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || err?.message || 'Không thể thay đổi trạng thái ẩn/hiện');
    }
    return res.json();
  },

  async relistListing(id: string): Promise<any> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) throw new Error('Chưa đăng nhập');
    const res = await authFetch(`${API_BASE}/listings/${id}/relist`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || err?.message || 'Không thể mở bán lại tin');
    }
    return res.json();
  },

  async deleteMyListing(id: string): Promise<any> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) throw new Error('Chưa đăng nhập');
    const res = await authFetch(`${API_BASE}/listings/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || err?.message || 'Không thể xóa tin đăng');
    }
    return res.json();
  },

  async getEditableListing(id: string): Promise<any> {
    const res = await authFetch(`${API_BASE}/listings/${id}/editable`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || err?.message || 'Không thể lấy thông tin chỉnh sửa tin đăng');
    }
    const json = await res.json();
    return json.data;
  },

  async updateListing(id: string, data: any): Promise<{ message: string; data: any }> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) throw new Error('Chưa đăng nhập');
    const res = await authFetch(`${API_BASE}/listings/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || err?.message || 'Không thể cập nhật tin đăng');
    }
    return res.json();
  },

  async quickUpdateListing(
    id: string,
    data: { price_vnd?: number; title?: string; location_address?: string }
  ): Promise<any> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) throw new Error('Chưa đăng nhập');
    const res = await authFetch(`${API_BASE}/listings/${id}/quick-update`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || err?.message || 'Không thể cập nhật tin đăng');
    }
    return res.json();
  },

  async markListingSold(id: string): Promise<any> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) throw new Error('Chưa đăng nhập');
    const res = await authFetch(`${API_BASE}/listings/${id}/mark-sold`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || err?.message || 'Không thể đánh dấu đã bán');
    }
    return res.json();
  },

  // Admin APIs (Protected by require_admin)
  async getAdminMetrics(): Promise<any> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const res = await authFetch(`${API_BASE}/admin/metrics`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || 'Không thể lấy dữ liệu thống kê');
    }
    return res.json();
  },

  async getAdminAppointments(params?: {
    status_filter?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<any[]> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const searchParams = new URLSearchParams();
    if (params?.status_filter && params.status_filter !== 'ALL') {
      searchParams.append('status_filter', params.status_filter);
    }
    if (params?.search) searchParams.append('search', params.search);
    if (params?.limit) searchParams.append('limit', String(params.limit));
    if (params?.offset) searchParams.append('offset', String(params.offset));

    const res = await authFetch(`${API_BASE}/admin/appointments?${searchParams.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || 'Không thể tải danh sách lịch hẹn quản trị');
    }
    return res.json();
  },

  async getAdminAppointmentDetail(id: string): Promise<any> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const res = await authFetch(`${API_BASE}/admin/appointments/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || 'Không thể tải chi tiết lịch hẹn');
    }
    return res.json();
  },

  async adminCancelAppointment(id: string, reason: string): Promise<any> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const res = await authFetch(`${API_BASE}/admin/appointments/${id}/cancel`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || 'Không thể hủy lịch hẹn');
    }
    return res.json();
  },

  async getAdminListings(params?: {
    status_filter?: string;
    search?: string;
  }): Promise<any[]> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const searchParams = new URLSearchParams();
    if (params?.status_filter) searchParams.append('status_filter', params.status_filter);
    if (params?.search) searchParams.append('search', params.search);

    const res = await authFetch(`${API_BASE}/admin/listings?${searchParams.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || 'Không thể tải danh sách tin đăng');
    }
    return res.json();
  },

  async getAdminListingDetail(id: string): Promise<any> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const res = await authFetch(`${API_BASE}/admin/listings/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || 'Không tìm thấy chi tiết tin đăng');
    }
    return res.json();
  },

  async approveListing(id: string): Promise<{ message: string }> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const res = await authFetch(`${API_BASE}/admin/listings/${id}/approve`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || 'Không thể phê duyệt tin đăng');
    }
    return res.json();
  },

  async rejectListing(id: string, reason: string): Promise<{ message: string }> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const res = await authFetch(`${API_BASE}/admin/listings/${id}/reject`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || 'Không thể từ chối tin đăng');
    }
    return res.json();
  },

  async takedownListing(id: string, reason: string): Promise<{ message: string }> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const res = await authFetch(`${API_BASE}/admin/listings/${id}/takedown`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || 'Không thể gỡ tin đăng');
    }
    return res.json();
  },

  async deleteListing(id: string): Promise<{ message: string }> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const res = await authFetch(`${API_BASE}/admin/listings/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || 'Không thể xóa tin đăng');
    }
    return res.json();
  },

  async updateAdminListing(id: string, data: any): Promise<{ message: string }> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const res = await authFetch(`${API_BASE}/admin/listings/${id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || 'Không thể cập nhật bài đăng');
    }
    return res.json();
  },

  // News & Articles APIs
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

  async getAdminUsers(params?: {
    status_filter?: string;
    role_filter?: string;
    search?: string;
    limit?: number;
  }): Promise<any[]> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const searchParams = new URLSearchParams();
    if (params?.status_filter) searchParams.append('status_filter', params.status_filter);
    if (params?.role_filter) searchParams.append('role_filter', params.role_filter);
    if (params?.search) searchParams.append('search', params.search);
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    else searchParams.append('limit', '100');

    const res = await authFetch(`${API_BASE}/admin/users?${searchParams.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || 'Không thể tải danh sách người dùng');
    }
    return res.json();
  },

  async updateUserStatus(id: string, status: string, reason?: string): Promise<{ message: string }> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const res = await authFetch(`${API_BASE}/admin/users/${id}/status`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status, reason }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || 'Không thể cập nhật trạng thái người dùng');
    }
    return res.json();
  },

  async bulkUpdateUserStatus(userIds: string[], status: string, reason?: string): Promise<{ message: string; data?: any }> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const res = await authFetch(`${API_BASE}/admin/users/bulk-status`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_ids: userIds, status, reason }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || err?.detail || 'Không thể cập nhật trạng thái người dùng hàng loạt');
    }
    return res.json();
  },

  async updateUserRole(id: string, role: string): Promise<{ message: string }> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const res = await authFetch(`${API_BASE}/admin/users/${id}/role`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || 'Không thể cập nhật vai trò người dùng');
    }
    return res.json();
  },

  async createAdminUser(data: {
    email: string;
    password: string;
    display_name: string;
    phone?: string;
    province_code?: string;
    province_name?: string;
    address?: string;
    role: string;
  }): Promise<any> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const res = await authFetch(`${API_BASE}/admin/users`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(parseApiError(err, 'Không thể tạo mới tài khoản'));
    }
    return res.json();
  },

  async updateAdminUser(id: string, data: any): Promise<any> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const res = await authFetch(`${API_BASE}/admin/users/${id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(parseApiError(err, 'Không thể cập nhật người dùng'));
    }
    return res.json();
  },

  async deleteAdminUser(id: string): Promise<any> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const res = await authFetch(`${API_BASE}/admin/users/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(parseApiError(err, 'Không thể xóa tài khoản'));
    }
    return res.json();
  },

  async createAdminShowroom(data: {
    name: string;
    phone?: string;
    address?: string;
    province_code?: string;
    description?: string;
    logo_url?: string;
    banner_url?: string;
    is_verified?: boolean;
    is_active?: boolean;
    owner_email?: string;
    owner_user_id?: string;
  }): Promise<any> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const res = await authFetch(`${API_BASE}/admin/showrooms`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(parseApiError(err, 'Không thể tạo Showroom mới'));
    }
    return res.json();
  },

  async updateAdminShowroom(id: string, data: any): Promise<any> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const res = await authFetch(`${API_BASE}/admin/showrooms/${id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(parseApiError(err, 'Không thể cập nhật thông tin Showroom'));
    }
    return res.json();
  },

  async deleteAdminShowroom(id: string): Promise<any> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const res = await authFetch(`${API_BASE}/admin/showrooms/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(parseApiError(err, 'Không thể xóa Showroom'));
    }
    return res.json();
  },

  async bulkUpdateShowroomStatus(showroomIds: string[], is_active: boolean): Promise<any> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const res = await authFetch(`${API_BASE}/admin/showrooms/bulk-status`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ showroom_ids: showroomIds, is_active }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(parseApiError(err, 'Không thể cập nhật trạng thái Showroom hàng loạt'));
    }
    return res.json();
  },

  async bulkVerifyShowrooms(showroomIds: string[], is_verified: boolean, rejection_reason?: string): Promise<any> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const res = await authFetch(`${API_BASE}/admin/showrooms/bulk-verify`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ showroom_ids: showroomIds, is_verified, rejection_reason }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(parseApiError(err, 'Không thể cập nhật xác thực Showroom hàng loạt'));
    }
    return res.json();
  },

  async bulkDeleteShowrooms(showroomIds: string[]): Promise<any> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const res = await authFetch(`${API_BASE}/admin/showrooms/bulk-delete`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ showroom_ids: showroomIds }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(parseApiError(err, 'Không thể xóa Showroom hàng loạt'));
    }
    return res.json();
  },

  // ==========================================
  // Admin Promotions & Featured Listings APIs
  // ==========================================
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

  // Favorites APIs
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

  // Chats APIs
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

  // Showrooms APIs
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

  // Trust & Safety Reports (Admin)
  async getAdminReports(params?: { status?: string; limit?: number; offset?: number }): Promise<any[]> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.offset) qs.set('offset', String(params.offset));
    const res = await authFetch(`${API_BASE}/admin/reports?${qs.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    return res.json();
  },

  async resolveAdminReport(id: string, data: { action: string; note?: string }): Promise<any> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const res = await authFetch(`${API_BASE}/admin/reports/${id}/resolve`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || 'Không thể xử lý báo cáo vi phạm');
    }
    return res.json();
  },

  // Inspection Report
  async submitListingInspection(
    id: string,
    data: {
      inspection_score: number;
      inspection_inspector_name: string;
      inspection_report_pdf_url?: string;
      inspection_checklist?: any;
    }
  ): Promise<any> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const res = await authFetch(`${API_BASE}/admin/listings/${id}/inspection`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || 'Không thể cập nhật biên bản kiểm định');
    }
    return res.json();
  },

  // Showroom Verification
  async verifyShowroom(id: string, is_verified: boolean, rejection_reason?: string): Promise<any> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const res = await authFetch(`${API_BASE}/admin/showrooms/${id}/verify`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ is_verified, rejection_reason }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || 'Không thể cập nhật xác thực showroom');
    }
    return res.json();
  },

  // Maintenance & AI MLOps
  async triggerMaintenanceCleanup(): Promise<any> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const res = await authFetch(`${API_BASE}/admin/maintenance/cleanup`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || 'Không thể chạy bảo trì hệ thống');
    }
    return res.json();
  },

  async triggerAiRetrain(): Promise<any> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const res = await authFetch(`${API_BASE}/admin/ai/retrain`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || 'Không thể huấn luyện lại mô hình AI');
    }
    return res.json();
  },

  // Promotion & VNPay Payments
  async getFeaturedListings(limit: number = 6): Promise<ListingItem[]> {
    const res = await fetch(`${API_BASE}/listings/featured?limit=${limit}`, { next: { revalidate: 30 } });
    if (!res.ok) return [];
    return res.json();
  },

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

  async getListingPromotionStatus(listingId: string): Promise<{
    listing_id: string;
    is_featured: boolean;
    featured_until?: string | null;
    featured_tier?: string | null;
    active_days_remaining: number;
  }> {
    const res = await fetch(`${API_BASE}/payments/listing/${listingId}/status`, { cache: 'no-store' });
    if (!res.ok) {
      return {
        listing_id: listingId,
        is_featured: false,
        active_days_remaining: 0,
      };
    }
    return res.json();
  },
};
