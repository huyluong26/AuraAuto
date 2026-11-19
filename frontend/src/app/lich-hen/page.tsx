'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Navbar, Footer } from '@/components/layout';
import { Clock, MapPin, CheckCircle2, XCircle, User, Car, Loader2 } from 'lucide-react';
import { api, formatVND } from '@/lib/api';

interface AppointmentItem {
  id: string;
  carTitle: string;
  carPrice: number;
  scheduledAt: string;
  createdAt?: string;
  location: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  partnerName: string;
  partnerPhone: string;
  role: 'BUYER' | 'SELLER';
  note?: string;
  listingStatus?: string;
}

export default function LichHenPage() {
  const [activeTab, setActiveTab] = useState<'ALL' | 'BUYER' | 'SELLER'>('ALL');
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const currentUserStr = localStorage.getItem('user');
      if (!token || !currentUserStr) {
        setIsLoggedIn(false);
        setAppointments([]);
        setLoading(false);
        return;
      }
      setIsLoggedIn(true);
      const currentUser = JSON.parse(currentUserStr);

      const rawAppts = await api.getAppointments();
      const mapped: AppointmentItem[] = rawAppts.map((a: any) => {
        const isBuyer = a.buyer?.id === currentUser.id;
        const partner = isBuyer ? a.seller : a.buyer;
        return {
          id: a.id,
          carTitle: a.listing?.title || 'Xe ô tô',
          carPrice: a.listing?.price_vnd || 0,
          scheduledAt: a.scheduled_at,
          createdAt: a.created_at,
          location: a.location,
          status: a.status,
          partnerName: partner?.display_name || 'Đối tác',
          partnerPhone: partner?.phone || 'Liên hệ khi gặp',
          role: isBuyer ? 'BUYER' : 'SELLER',
          note: a.note,
          listingStatus: a.listing?.status,
        };
      });

      // Sort newest appointments first (by createdAt or scheduledAt desc)
      mapped.sort((a, b) => {
        const timeA = new Date(a.createdAt || a.scheduledAt).getTime();
        const timeB = new Date(b.createdAt || b.scheduledAt).getTime();
        return timeB - timeA;
      });

      setAppointments(mapped);
    } catch {
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const handleConfirm = async (id: string) => {
    try {
      setActionLoading(id);
      await api.confirmAppointment(id);
      loadAppointments();
    } catch (err: any) {
      alert(err.message || 'Không thể xác nhận lịch hẹn');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (id: string) => {
    const reason = prompt('Nhập lý do hủy lịch hẹn:', 'Thay đổi kế hoạch cá nhân');
    if (reason === null) return;
    try {
      setActionLoading(id);
      await api.cancelAppointment(id, 'OTHER', reason);
      loadAppointments();
    } catch (err: any) {
      alert(err.message || 'Không thể hủy lịch hẹn');
    } finally {
      setActionLoading(null);
    }
  };

  const handleComplete = async (id: string) => {
    if (!confirm('Xác nhận đã hoàn thành buổi xem xe và lái thử thực tế?')) return;
    try {
      setActionLoading(id);
      await api.completeAppointment(id);
      loadAppointments();
    } catch (err: any) {
      alert(err.message || 'Không thể hoàn thành');
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkSold = async (id: string, carTitle: string) => {
    if (
      !confirm(
        `Xác nhận bạn đã bán xe "${carTitle}" thành công cho khách hàng này?\n\nBuổi xem xe sẽ được hoàn tất và tin đăng xe sẽ chuyển sang trạng thái "Đã bán" trên toàn sàn AuraAuto.`
      )
    ) {
      return;
    }
    try {
      setActionLoading(id);
      await api.markAppointmentSold(id);
      await loadAppointments();
      alert('Chúc mừng bạn! Đã xác nhận bán xe thành công và cập nhật tin đăng sang "Đã bán".');
    } catch (err: any) {
      alert(err.message || 'Không thể xác nhận bán xe');
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = appointments.filter((a) => activeTab === 'ALL' || a.role === activeTab);

  return (
    <div className="min-h-screen bg-[#faf9f6] flex flex-col font-sans text-[#1a1c1a]">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 w-full space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold font-display text-[#1a1c1a] tracking-tight">
              Quản Lý Lịch Hẹn Xem Xe
            </h1>
            <p className="text-xs sm:text-sm text-[#777777] mt-1">
              Dữ liệu lịch hẹn trực tiếp giữa người mua & người bán từ cơ sở dữ liệu hệ thống
            </p>
          </div>

          {/* Role Filter Tabs */}
          {isLoggedIn && (
            <div className="inline-flex p-1 bg-white rounded-lg border border-[#eae8e3] shadow-sm">
              <button
                onClick={() => setActiveTab('ALL')}
                className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition ${
                  activeTab === 'ALL' ? 'bg-[#191919] text-white' : 'text-[#777777] hover:text-[#1a1c1a]'
                }`}
              >
                Tất cả ({appointments.length})
              </button>
              <button
                onClick={() => setActiveTab('BUYER')}
                className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition ${
                  activeTab === 'BUYER' ? 'bg-[#191919] text-white' : 'text-[#777777] hover:text-[#1a1c1a]'
                }`}
              >
                Tôi đi mua
              </button>
              <button
                onClick={() => setActiveTab('SELLER')}
                className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition ${
                  activeTab === 'SELLER' ? 'bg-[#191919] text-white' : 'text-[#777777] hover:text-[#1a1c1a]'
                }`}
              >
                Khách hẹn tôi
              </button>
            </div>
          )}
        </div>

        {/* Loading state */}
        {loading ? (
          <div className="py-24 text-center">
            <Loader2 className="w-8 h-8 text-[#b89b72] animate-spin mx-auto mb-3" />
            <p className="text-sm font-semibold text-[#444748]">Đang tải lịch hẹn từ hệ thống...</p>
          </div>
        ) : !isLoggedIn ? (
          <div className="py-20 text-center bg-white rounded-2xl border border-[#eae8e3] p-8 space-y-4 shadow-sm">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-[#faf9f6] border border-[#eae8e3] flex items-center justify-center text-[#777777]">
              <User className="w-8 h-8 text-[#b89b72]" />
            </div>
            <h3 className="text-base font-semibold text-[#1a1c1a] font-display">
              Đăng nhập để xem lịch hẹn của bạn
            </h3>
            <p className="text-xs text-[#777777] max-w-sm mx-auto">
              Vui lòng đăng nhập tài khoản để theo dõi tiến độ hẹn xem xe và lái thử trực tiếp với đối tác.
            </p>
            <Link
              href="/dang-nhap"
              className="inline-block px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#191919] hover:bg-black transition-colors"
            >
              Đăng nhập ngay
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-2xl border border-[#eae8e3] p-8 space-y-4 shadow-sm">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-[#faf9f6] border border-[#eae8e3] flex items-center justify-center text-[#777777]">
              <Clock className="w-8 h-8 text-[#b89b72]" />
            </div>
            <h3 className="text-base font-semibold text-[#1a1c1a] font-display">
              Chưa có lịch hẹn xem xe nào
            </h3>
            <p className="text-xs text-[#777777] max-w-sm mx-auto">
              Khi bạn đặt lịch xem xe hoặc có khách liên hệ xem xe bạn đăng bán, lịch hẹn sẽ được lưu trữ và hiển thị tại đây.
            </p>
            <Link
              href="/xe"
              className="inline-block px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#191919] hover:bg-black transition-colors"
            >
              Khám phá xe trên sàn
            </Link>
          </div>
        ) : (
          /* Real Appointment List from Database */
          <div className="space-y-4">
            {filtered.map((apt) => (
              <div
                key={apt.id}
                className="bg-white rounded-xl p-6 border border-[#eae8e3] shadow-[0_8px_30px_rgba(25,25,25,0.03)] hover:border-[#b89b72] transition space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#eae8e3] gap-2">
                  <div className="flex items-center space-x-2.5">
                    <span className="p-1.5 rounded-md bg-[#faf9f6] border border-[#eae8e3] text-[#725a37]">
                      <Car className="w-4 h-4 text-[#b89b72]" />
                    </span>
                    <span className="font-semibold font-display text-[#1a1c1a] text-base">
                      {apt.carTitle}
                    </span>
                  </div>

                  {/* Status Badges */}
                  <div>
                    {apt.status === 'CONFIRMED' && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold bg-[#fcdbad]/60 text-[#775f3a] border border-[#b89b72]/40">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-[#725a37]" />
                        Đã xác nhận hẹn
                      </span>
                    )}
                    {apt.status === 'PENDING' && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold bg-[#f4f3f0] text-[#777777] border border-[#eae8e3]">
                        <Clock className="w-3.5 h-3.5 mr-1 text-[#858383]" />
                        Chờ xác nhận
                      </span>
                    )}
                    {apt.status === 'COMPLETED' && (
                      <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold ${
                        apt.listingStatus === 'SOLD'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                          : 'bg-[#191919] text-white border border-[#191919]'
                      }`}>
                        <CheckCircle2 className={`w-3.5 h-3.5 mr-1 ${apt.listingStatus === 'SOLD' ? 'text-emerald-600' : 'text-[#b89b72]'}`} />
                        {apt.listingStatus === 'SOLD' ? 'Đã giao dịch bán xe' : 'Đã hoàn thành'}
                      </span>
                    )}
                    {apt.status === 'CANCELLED' && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold bg-[#ffdad6]/40 text-[#93000a] border border-[#ffdad6]">
                        <XCircle className="w-3.5 h-3.5 mr-1 text-[#ba1a1a]" />
                        Đã hủy
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-[#444748]">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-[#b89b72]" />
                    <div>
                      <span className="text-[#777777] block font-medium">Thời gian hẹn:</span>
                      <strong className="text-[#1a1c1a] font-display">
                        {new Date(apt.scheduledAt).toLocaleString('vi-VN')}
                      </strong>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-[#b89b72]" />
                    <div>
                      <span className="text-[#777777] block font-medium">Địa điểm xem xe:</span>
                      <strong className="text-[#1a1c1a]">{apt.location}</strong>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-[#b89b72]" />
                    <div>
                      <span className="text-[#777777] block font-medium">Đối tác giao dịch:</span>
                      <strong className="text-[#1a1c1a]">
                        {apt.partnerName} ({apt.partnerPhone})
                      </strong>
                    </div>
                  </div>
                </div>

                {apt.note && (
                  <div className="p-3 rounded bg-[#faf9f6] border border-[#eae8e3] text-xs text-[#444748] italic">
                    &quot;{apt.note}&quot;
                  </div>
                )}

                {/* Action buttons */}
                <div className="pt-2 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-[#777777] uppercase tracking-[0.08em] font-medium block">
                      Giá niêm yết
                    </span>
                    <span className="text-base font-bold font-display text-[#191919]">
                      {formatVND(apt.carPrice)}
                    </span>
                  </div>

                  <div className="flex space-x-2">
                    {apt.status === 'PENDING' && apt.role === 'SELLER' && (
                      <button
                        onClick={() => handleConfirm(apt.id)}
                        disabled={actionLoading === apt.id}
                        className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#191919] hover:bg-black text-white transition shadow-sm disabled:opacity-50"
                      >
                        {actionLoading === apt.id ? 'Đang xử lý...' : 'Xác nhận lịch hẹn'}
                      </button>
                    )}
                    {apt.status === 'CONFIRMED' && (
                      <>
                        {apt.role === 'SELLER' && apt.listingStatus !== 'SOLD' && (
                          <button
                            onClick={() => handleMarkSold(apt.id, apt.carTitle)}
                            disabled={actionLoading === apt.id}
                            className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white transition shadow-sm disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                            title="Xác nhận khách đã mua xe và chuyển trạng thái tin sang Đã bán"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{actionLoading === apt.id ? 'Đang xử lý...' : 'Đã bán xe'}</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleComplete(apt.id)}
                          disabled={actionLoading === apt.id}
                          className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#b89b72] hover:bg-[#a3865e] text-white transition shadow-sm disabled:opacity-50 cursor-pointer"
                        >
                          {actionLoading === apt.id ? 'Đang xử lý...' : 'Hoàn thành xem xe'}
                        </button>
                      </>
                    )}
                    {apt.status !== 'CANCELLED' && apt.status !== 'COMPLETED' && (
                      <button
                        onClick={() => handleCancel(apt.id)}
                        disabled={actionLoading === apt.id}
                        className="px-3 py-2 rounded-lg text-xs font-semibold text-[#777777] hover:text-[#ba1a1a] transition disabled:opacity-50"
                      >
                        {actionLoading === apt.id ? 'Đang hủy...' : 'Hủy lịch'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
