export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// Client-side in-memory cache for static catalog and options (0ms read time in browser)
const clientMemoryCache = new Map<string, { data: any; expiry: number }>();

export function getClientCache<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  const entry = clientMemoryCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiry) {
    clientMemoryCache.delete(key);
    return null;
  }
  return entry.data as T;
}

export function setClientCache(key: string, data: any, ttlSeconds: number = 300): void {
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
