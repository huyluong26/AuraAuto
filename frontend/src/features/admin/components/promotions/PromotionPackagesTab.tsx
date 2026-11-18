'use client';

import React from 'react';
import { AdminPromotionPackage } from '@/features/admin/types';
import { formatVND } from '@/lib/api';

interface PromotionPackagesTabProps {
  packages: AdminPromotionPackage[];
  loading: boolean;
  onToggleActive: (pkg: AdminPromotionPackage) => Promise<void>;
  onOpenModal: (pkg?: AdminPromotionPackage) => void;
  onDeletePackage: (pkg: AdminPromotionPackage) => Promise<void>;
}

export const PromotionPackagesTab: React.FC<PromotionPackagesTabProps> = ({
  packages,
  loading,
  onToggleActive,
  onOpenModal,
  onDeletePackage,
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-surface-container-lowest p-5 rounded-2xl border border-surface-container-high shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-sm text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-amber-600">tune</span>
            <span>Bảng Cấu Hình Giá &amp; Khuyến Mãi Gói Đẩy Tin</span>
          </h3>
          <p className="text-xs text-outline mt-1">
            Mức giá cấu hình ở đây sẽ áp dụng trực tiếp khi khách hàng thanh toán đẩy tin qua cổng VNPay.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 border-3 border-secondary/30 border-t-secondary rounded-full animate-spin" />
          <p className="font-body-sm text-xs text-outline">Đang tải danh sách gói khuyến mãi...</p>
        </div>
      ) : packages.length === 0 ? (
        <div className="p-16 rounded-2xl bg-surface-container-lowest border border-surface-container-high text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-surface-container-low text-outline mx-auto flex items-center justify-center">
            <span className="material-symbols-outlined text-[32px]">price_change</span>
          </div>
          <h4 className="font-headline-sm text-base text-primary font-bold">Chưa có gói cước nào</h4>
          <p className="font-body-sm text-xs text-outline max-w-sm mx-auto">
            Hãy bấm &ldquo;Tạo Gói Khuyến Mãi Mới&rdquo; để thiết lập gói đầu tiên.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {packages.map((pkg) => {
            const discount =
              pkg.original_amount_vnd && pkg.original_amount_vnd > pkg.amount_vnd
                ? Math.round((1 - pkg.amount_vnd / pkg.original_amount_vnd) * 100)
                : null;

            return (
              <div
                key={pkg.id}
                className={`p-5 rounded-2xl bg-surface-container-lowest border transition-all shadow-xs flex flex-col justify-between space-y-4 relative ${
                  pkg.is_active
                    ? 'border-surface-container-high hover:border-secondary hover:shadow-sm'
                    : 'opacity-60 bg-surface-container-low/50 border-surface-container-high'
                }`}
              >
                <div className="space-y-3">
                  {/* Header: Name + Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-outline uppercase tracking-wider block">
                        {pkg.code}
                      </span>
                      <h4 className="font-bold text-base text-primary mt-0.5">{pkg.name}</h4>
                    </div>
                    {pkg.badge && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[10px] font-extrabold uppercase shrink-0">
                        {pkg.badge}
                      </span>
                    )}
                  </div>

                  {/* Pricing */}
                  <div className="pt-2 border-t border-surface-container-high">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-secondary">
                        {formatVND(pkg.amount_vnd)}
                      </span>
                      {pkg.original_amount_vnd && pkg.original_amount_vnd > pkg.amount_vnd && (
                        <span className="text-xs text-outline line-through">
                          {formatVND(pkg.original_amount_vnd)}
                        </span>
                      )}
                    </div>

                    {discount && (
                      <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-red-100 text-red-700 text-[10px] font-extrabold">
                        Giảm {discount}%
                      </span>
                    )}
                  </div>

                  {/* Duration & Description */}
                  <div className="space-y-1.5 text-xs text-outline">
                    <div className="flex items-center gap-1.5 text-primary font-semibold">
                      <span className="material-symbols-outlined text-[16px] text-amber-600">verified</span>
                      <span>Thời hạn: {pkg.days} ngày</span>
                    </div>
                    {pkg.description && (
                      <p className="text-[11px] text-outline leading-relaxed line-clamp-3">
                        {pkg.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-3 border-t border-surface-container-high flex items-center justify-between gap-2">
                  {/* Toggle Active Switch */}
                  <button
                    type="button"
                    onClick={() => onToggleActive(pkg)}
                    className={`h-6 text-[10.5px] font-semibold px-2 rounded-md border active:scale-[0.98] transition-all cursor-pointer flex items-center gap-1 ${
                      pkg.is_active
                        ? 'text-emerald-700 bg-emerald-50 border-emerald-300 hover:bg-emerald-100'
                        : 'text-[#64748b] bg-white border-[#d8d6d0] hover:text-[#0f172a] hover:bg-slate-100'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[13px]">
                      {pkg.is_active ? 'check_circle' : 'do_not_disturb_on'}
                    </span>
                    <span>{pkg.is_active ? 'Đang mở bán' : 'Tạm dừng'}</span>
                  </button>

                  <div className="flex items-center gap-1">
                    {/* Edit button */}
                    <button
                      type="button"
                      onClick={() => onOpenModal(pkg)}
                      title="Sửa cấu hình gói"
                      className="w-6 h-6 rounded-md flex items-center justify-center bg-white hover:bg-slate-100 border border-[#d8d6d0] hover:border-slate-400 text-[#475569] hover:text-[#0f172a] active:scale-[0.98] transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[13px]">edit</span>
                    </button>

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={() => onDeletePackage(pkg)}
                      title="Xóa gói khuyến mãi"
                      className="w-6 h-6 rounded-md flex items-center justify-center bg-white hover:bg-rose-50 border border-rose-200 hover:border-rose-300 text-rose-600 hover:text-rose-700 active:scale-[0.98] transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[13px]">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
