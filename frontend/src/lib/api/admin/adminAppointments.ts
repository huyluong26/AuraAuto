import { API_BASE, authFetch } from '../core';

export const adminAppointmentsApi = {
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
};

