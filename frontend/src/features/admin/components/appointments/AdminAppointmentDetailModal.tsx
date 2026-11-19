'use client';

import React from 'react';
import Link from 'next/link';
import { formatVND } from '@/lib/api';
import { AdminBadge } from '../ui/AdminBadge';
import { AdminButton } from '../ui/AdminButton';
import { AdminAppointmentItem } from '../../types';

interface AdminAppointmentDetailModalProps {
  appointment: AdminAppointmentItem | null;
  onClose: () => void;
  onCancel: (appointment: AdminAppointmentItem) => void;
}

export function AdminAppointmentDetailModal({
  appointment,
  onClose,
  onCancel,
}: AdminAppointmentDetailModalProps) {
  if (!appointment) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-surface-container-lowest rounded-3xl border border-surface-container-high shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 border-b border-surface-container-high flex items-center justify-between bg-surface-container-low">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary-container/40 text-secondary flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">calendar_month</span>
            </div>
            <div>
              <h3 className="font-headline-sm text-base font-bold text-primary flex items-center gap-2">
                <span>Chi tiết Lịch hẹn Xem xe</span>
                <span className="font-mono text-secondary text-xs">#{appointment.id.slice(0, 8).toUpperCase()}</span>
              </h3>
              <p className="font-body-sm text-xs text-outline">
                Khởi tạo lúc: {new Date(appointment.created_at).toLocaleString('vi-VN')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <AdminBadge status={appointment.status} />
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:text-primary hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {/* Vehicle Card */}
          <div className="p-4 rounded-2xl bg-surface-container-low border border-surface-container-high flex items-center gap-4">
            <div className="w-20 h-20 rounded-xl overflow-hidden bg-surface-container-highest shrink-0 relative">
              {appointment.listing?.primary_image_url ? (
                <img
                  src={appointment.listing.primary_image_url}
                  alt={appointment.listing.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-outline">
                  <span className="material-symbols-outlined text-[24px]">directions_car</span>
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="text-[11px] font-semibold text-outline uppercase tracking-wider">Phương tiện giao dịch</div>
              <h4 className="font-bold text-primary text-sm truncate">{appointment.listing?.title}</h4>
              <div className="font-mono font-bold text-secondary text-base">
                {formatVND(appointment.listing?.price_vnd || 0)}
              </div>
            </div>
            <Link
              href={`/xe/${appointment.listing_id}`}
              target="_blank"
              className="px-3 py-1.5 rounded-xl border border-secondary text-secondary text-xs font-semibold hover:bg-secondary hover:text-on-secondary transition-colors shrink-0 flex items-center gap-1"
            >
              <span>Mở tin</span>
              <span className="material-symbols-outlined text-[14px]">open_in_new</span>
            </Link>
          </div>

          {/* Two Parties: Buyer & Seller */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Buyer */}
            <div className="p-4 rounded-2xl border border-blue-200/80 bg-blue-50/30 space-y-2">
              <div className="flex items-center gap-1.5 text-blue-800 text-xs font-bold uppercase tracking-wider">
                <span className="material-symbols-outlined text-[16px]">person</span>
                <span>Bên mua (Khách hàng)</span>
              </div>
              <div className="font-bold text-primary text-sm">{appointment.buyer?.display_name}</div>
              <div className="text-xs text-outline space-y-0.5">
                {appointment.buyer?.phone && (
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">phone</span>
                    <a href={`tel:${appointment.buyer.phone}`} className="text-primary hover:underline font-mono">
                      {appointment.buyer.phone}
                    </a>
                  </div>
                )}
                {appointment.buyer?.email && (
                  <div className="flex items-center gap-1 truncate">
                    <span className="material-symbols-outlined text-[13px]">email</span>
                    <span>{appointment.buyer.email}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Seller */}
            <div className="p-4 rounded-2xl border border-emerald-200/80 bg-emerald-50/30 space-y-2">
              <div className="flex items-center gap-1.5 text-emerald-800 text-xs font-bold uppercase tracking-wider">
                <span className="material-symbols-outlined text-[16px]">storefront</span>
                <span>Bên bán (Chủ xe / Showroom)</span>
              </div>
              <div className="font-bold text-primary text-sm">{appointment.seller?.display_name}</div>
              <div className="text-xs text-outline space-y-0.5">
                {appointment.seller?.phone && (
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">phone</span>
                    <a href={`tel:${appointment.seller.phone}`} className="text-primary hover:underline font-mono">
                      {appointment.seller.phone}
                    </a>
                  </div>
                )}
                {appointment.seller?.email && (
                  <div className="flex items-center gap-1 truncate">
                    <span className="material-symbols-outlined text-[13px]">email</span>
                    <span>{appointment.seller.email}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Schedule and Location info */}
          <div className="p-4 rounded-2xl bg-surface-container-low border border-surface-container-high space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-outline">
              <span className="material-symbols-outlined text-[16px] text-secondary">pin_drop</span>
              <span>Thời gian &amp; Địa điểm gặp mặt</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-outline block text-[11px]">Thời gian hẹn:</span>
                <span className="font-semibold text-primary text-sm">
                  {new Date(appointment.scheduled_at).toLocaleString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <div>
                <span className="text-outline block text-[11px]">Địa điểm xem xe:</span>
                <span className="font-medium text-primary">
                  {appointment.location || 'Tại địa chỉ theo tin đăng'}
                </span>
              </div>
            </div>

            {appointment.note && (
              <div className="pt-2 border-t border-surface-container-high/60 text-xs">
                <span className="text-outline block text-[11px]">Ghi chú của người mua:</span>
                <p className="text-primary mt-0.5 italic bg-surface-container/40 p-2.5 rounded-xl border border-surface-container-high">
                  &quot;{appointment.note}&quot;
                </p>
              </div>
            )}
          </div>

          {/* Cancellation Reason if cancelled */}
          {appointment.status === 'CANCELLED' && (
            <div className="p-4 rounded-2xl bg-red-50/80 border border-red-200 text-xs space-y-1.5">
              <div className="font-bold text-red-900 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                <span className="material-symbols-outlined text-[16px] text-red-600">cancel</span>
                <span>Thông tin Hủy lịch hẹn</span>
              </div>
              <div className="text-red-800">
                <span className="font-semibold">Mã lý do:</span> {appointment.cancel_reason_code || 'OTHER'}
              </div>
              {appointment.cancel_reason_text && (
                <div className="text-red-900">
                  <span className="font-semibold">Lý do chi tiết:</span> {appointment.cancel_reason_text}
                </div>
              )}
              {appointment.cancelled_by_name && (
                <div className="text-red-700 text-[11px]">
                  Thực hiện bởi: <span className="font-bold">{appointment.cancelled_by_name}</span>
                </div>
              )}
            </div>
          )}

          {/* Event Timeline */}
          {appointment.events && appointment.events.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-headline-sm text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-secondary">history</span>
                <span>Nhật ký Sự kiện &amp; Trạng thái Lịch hẹn</span>
              </h4>

              <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-surface-container-highest">
                {appointment.events.map((ev, idx) => (
                  <div key={ev.id || idx} className="relative flex items-start gap-3">
                    <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-secondary border-2 border-surface-container-lowest"></div>
                    <div className="flex-1 bg-surface-container-low p-3 rounded-xl border border-surface-container-high text-xs space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-primary font-mono text-[11px]">
                          {ev.from_status ? `${ev.from_status} → ` : ''}{ev.to_status}
                        </span>
                        <span className="text-[10px] text-outline font-mono">
                          {ev.created_at ? new Date(ev.created_at).toLocaleString('vi-VN') : ''}
                        </span>
                      </div>
                      {ev.note && <p className="text-outline text-xs mt-0.5">{ev.note}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-surface-container-high bg-surface-container-low flex items-center justify-between">
          <div>
            {(appointment.status === 'PENDING' || appointment.status === 'CONFIRMED') && (
              <AdminButton
                variant="danger"
                size="sm"
                icon="cancel"
                onClick={() => onCancel(appointment)}
              >
                Can thiệp Hủy lịch
              </AdminButton>
            )}
          </div>

          <AdminButton
            variant="outline"
            size="sm"
            onClick={onClose}
          >
            Đóng cửa sổ
          </AdminButton>
        </div>
      </div>
    </div>
  );
}

