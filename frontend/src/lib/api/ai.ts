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

export const aiApi = {
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
    condition?: string;
    accident_status?: string;
    flood_status?: string;
    service_history?: string;
    engine_repaired?: boolean;
    transmission_repaired?: boolean;
    owner_count?: number;
    repainted_parts_count?: number;
    replaced_parts?: string;
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

  // AI Vision Vehicle Recognition,

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

  // Auth,

};
