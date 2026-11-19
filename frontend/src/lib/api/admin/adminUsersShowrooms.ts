import { API_BASE, authFetch, parseApiError } from '../core';

export const adminUsersShowroomsApi = {
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
};

