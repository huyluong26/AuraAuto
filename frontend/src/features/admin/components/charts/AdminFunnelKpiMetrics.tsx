'use client';

import React from 'react';
import { formatVND } from '@/lib/api';

interface AdminFunnelKpiMetricsProps {
  totalListings?: number;
  publishedListings?: number;
  soldListings?: number;
  pendingListings?: number;
  rejectedListings?: number;
  totalAppointments?: number;
  appointmentSuccessRate?: number;
  totalInventoryVal?: number;
  totalSoldVal?: number;
}

export function AdminFunnelKpiMetrics({
  totalListings = 0,
  publishedListings = 0,
  soldListings = 0,
  pendingListings = 0,
  rejectedListings = 0,
  totalAppointments = 0,
  appointmentSuccessRate = 0,
  totalInventoryVal = 0,
  totalSoldVal = 0,
}: AdminFunnelKpiMetricsProps) {
  const approvalRate =
    totalListings > 0
      ? (((publishedListings + soldListings) / totalListings) * 100).toFixed(1)
      : '0';

  const soldRate =
    totalListings > 0 ? ((soldListings / totalListings) * 100).toFixed(1) : '0';

  const pendingRate =
    totalListings > 0 ? ((pendingListings / totalListings) * 100).toFixed(1) : '0';

  const kpis = [
    {
      title: 'Tỷ lệ Phê duyệt Tin Đăng',
      value: `${approvalRate}%`,
      desc: `${publishedListings + soldListings} / ${totalListings} tin đã được duyệt lên sàn`,
      icon: 'verified',
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    },
    {
      title: 'Tỷ lệ Khớp Giao dịch (Đã bán)',
      value: `${soldRate}%`,
      desc: `${soldListings} xe đã giao dịch thành công`,
      icon: 'sell',
      color: 'text-blue-700 bg-blue-50 border-blue-200',
    },
    {
      title: 'Tỷ lệ Đang Chờ Thẩm định',
      value: `${pendingRate}%`,
      desc: `${pendingListings} xe đang chờ duyệt hồ sơ`,
      icon: 'hourglass_top',
      color: 'text-amber-700 bg-amber-50 border-amber-200',
    },
    {
      title: 'Lịch Hẹn Xem Xe Đã Đăng Ký',
      value: `${totalAppointments}`,
      desc: appointmentSuccessRate ? `Tỷ lệ hoàn tất xem xe đạt ${appointmentSuccessRate}%` : 'Tổng số lượt đặt lịch gặp mặt trực tiếp',
      icon: 'calendar_month',
      color: 'text-secondary bg-secondary-container/30 border-secondary/30',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="font-headline-sm text-sm text-primary font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[20px]">insights</span>
            <span>Hiệu Suất Vận Hành &amp; Tổng Giá Trị Sàn</span>
          </h3>
          <p className="font-body-sm text-xs text-outline mt-0.5">
            Dữ liệu tổng hợp thực tế từ toàn bộ bản ghi hệ thống
          </p>
        </div>

        {/* Real GMV Badges */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-xl bg-surface-container-low border border-surface-container-high text-xs">
            <span className="text-outline text-[11px] block">Tổng giá trị đang niêm yết:</span>
            <span className="font-mono font-bold text-secondary text-sm">
              {formatVND(totalInventoryVal)}
            </span>
          </div>

          <div className="px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
            <span className="text-emerald-700 text-[11px] block">Tổng giá trị xe đã bán:</span>
            <span className="font-mono font-bold text-emerald-950 text-sm">
              {formatVND(totalSoldVal)}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k, idx) => (
          <div
            key={idx}
            className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-container-high shadow-xs space-y-2 hover:border-secondary transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="font-label-md text-xs font-semibold text-primary">{k.title}</span>
              <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${k.color}`}>
                <span className="material-symbols-outlined text-[18px]">{k.icon}</span>
              </div>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="font-headline-md text-2xl font-extrabold text-primary font-mono">
                {k.value}
              </span>
            </div>

            <p className="font-body-sm text-[11px] text-outline leading-tight">
              {k.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
