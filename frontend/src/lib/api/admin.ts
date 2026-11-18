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

export const adminApi = {
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

  // News & Articles APIs,

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
  // ==========================================,

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

  // Favorites APIs,

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

  // Inspection Report,

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

  // Showroom Verification,

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

  // Maintenance & AI MLOps,

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

  // Promotion & VNPay Payments,

};
