'use client';

import React from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { CommitmentsState, TradeOptionsState, VehicleHistoryState } from '../types';
import { formatVND } from '@/lib/api';

interface Step5PreviewAndSubmitProps {
  sellerType?: 'INDIVIDUAL' | 'SHOWROOM';
  showroomName?: string;
  showroomPhone?: string;
  brandName: string;
  modelName: string;
  trim: string;
  manufactureYear: number;
  odometerKm: string;
  provinceCode: string;
  locationAddress: string;
  condition: string;
  origin: string;
  bodyType: string;
  transmission: string;
  powertrain: string;
  engineDisplacement: string;
  drivetrain: string;
  seats: number;
  doors: number;
  color: string;
  interiorColor: string;
  description: string;
  commitments: CommitmentsState;
  vehicleHistory: VehicleHistoryState;
  primaryPhotoPreview?: string;
  totalPhotosCount: number;
  priceVnd: string;
  tradeOptions: TradeOptionsState;
  privacyShield: boolean;
  onTogglePrivacyShield: (val: boolean) => void;
  submitting: boolean;
  submitStatusText: string;
  onPrev: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function Step5PreviewAndSubmit({
  sellerType = 'INDIVIDUAL',
  showroomName = '',
  showroomPhone = '',
  brandName,
  modelName,
  trim,
  manufactureYear,
  odometerKm,
  provinceCode,
  locationAddress,
  condition,
  origin,
  bodyType,
  transmission,
  powertrain,
  engineDisplacement,
  drivetrain,
  seats,
  doors,
  color,
  interiorColor,
  description,
  commitments,
  vehicleHistory,
  primaryPhotoPreview,
  totalPhotosCount,
  priceVnd,
  tradeOptions,
  privacyShield,
  onTogglePrivacyShield,
  submitting,
  submitStatusText,
  onPrev,
  onSubmit,
}: Step5PreviewAndSubmitProps) {
  const { user } = useCurrentUser();
  const numericPrice = parseInt(priceVnd.replace(/\D/g, ''), 10) || 0;
  const fullTitle = `${brandName} ${modelName} ${trim} ${manufactureYear}`.replace(/\s+/g, ' ').trim();
  const accidentLabel = { UNKNOWN: 'Chưa xác định', NONE: 'Không tai nạn', MINOR: 'Va chạm nhẹ', MAJOR: 'Tai nạn nặng' }[vehicleHistory.accidentStatus];
  const floodLabel = { UNKNOWN: 'Chưa xác định', NONE: 'Không ngập nước', SUSPECTED: 'Nghi ngờ ngập', CONFIRMED: 'Đã ngập nước' }[vehicleHistory.floodStatus];
  const serviceLabel = { UNKNOWN: 'Chưa xác định', NONE: 'Không hồ sơ', PARTIAL: 'Hồ sơ một phần', FULL: 'Hồ sơ đầy đủ' }[vehicleHistory.serviceHistory];

  const sellerName = user?.full_name || 'Khách hàng cá nhân';
  const sellerPhone = user?.phone
    ? `${user.phone.slice(0, 4)} ••• ${user.phone.slice(-3)}`
    : '0908 ••• 888';

  return (
    <section className="bg-surface-container-lowest p-6 sm:p-8 lg:p-10 rounded-2xl shadow-sm border border-surface-container-high/60 space-y-8 animate-in fade-in duration-200">
      <div className="flex items-center justify-between border-b border-surface-container-high/70 pb-5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-secondary-container/40 text-secondary font-label-sm text-xs uppercase tracking-wider font-semibold">
            <span>Bước 05 / 05</span>
          </div>
          <h2 className="font-headline-md text-xl sm:text-2xl text-primary font-bold tracking-tight">
            Xem trước tin đăng &amp; Xác nhận công bố
          </h2>
          <p className="font-body-sm text-xs sm:text-sm text-on-surface-variant">
            Kiểm tra lại toàn bộ thông số thực tế trước khi chuyển hồ sơ tới ban thẩm định.
          </p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-surface-container-low border border-surface-container-high flex items-center justify-center text-secondary shrink-0">
          <span className="material-symbols-outlined text-[28px]">visibility</span>
        </div>
      </div>

      {/* Modern Luxury Preview Card */}
      <div className="rounded-2xl border border-outline-variant/40 overflow-hidden bg-surface-container-low/50 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-0">
          {/* Ảnh bìa */}
          <div className="md:col-span-5 relative aspect-[4/3] md:aspect-auto bg-surface-container overflow-hidden">
            {primaryPhotoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={primaryPhotoPreview} alt={fullTitle} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full min-h-[220px] flex flex-col items-center justify-center text-outline bg-surface-container-low">
                <span className="material-symbols-outlined text-[48px] text-secondary">directions_car</span>
                <span className="text-xs font-medium mt-1">Chưa tải ảnh bìa</span>
              </div>
            )}
            <span className="absolute bottom-3 left-3 bg-primary/80 backdrop-blur-md text-white text-[11px] font-semibold px-2.5 py-1 rounded-md">
              Đã đính kèm {totalPhotosCount} góc ảnh
            </span>
          </div>

          {/* Chi tiết thông số tóm tắt */}
          <div className="md:col-span-7 p-6 space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold uppercase">
                <span className="px-2 py-0.5 rounded bg-secondary-container/40 text-on-secondary-container">
                  {brandName || 'Thương hiệu'} • Đời {manufactureYear || 'Đang cập nhật'}
                </span>
                <span className="px-2 py-0.5 rounded bg-surface-container text-primary">
                  {condition || 'Đã qua sử dụng'}
                </span>
                <span className="px-2 py-0.5 rounded bg-surface-container text-primary">
                  {origin || 'Xuất xứ xe'}
                </span>
              </div>

              <h3 className="font-headline-sm text-headline-sm font-bold text-primary leading-tight">
                {fullTitle}
              </h3>

              <div className="text-secondary font-headline-md text-headline-md font-bold">
                {numericPrice > 0 ? `${formatVND(numericPrice)} (${numericPrice.toLocaleString('vi-VN')} ₫)` : 'Chưa định giá'}
              </div>
            </div>

            {/* Bảng thông số kỹ thuật chi tiết */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs pt-1">
              <div className="p-2 rounded bg-surface-container-lowest">
                <span className="text-on-surface-variant block text-[10px]">Số km ODO:</span>
                <strong className="text-primary font-medium">{odometerKm || '0'} km</strong>
              </div>
              <div className="p-2 rounded bg-surface-container-lowest">
                <span className="text-on-surface-variant block text-[10px]">Hộp số:</span>
                <strong className="text-primary font-medium">{transmission || 'Tự động (AT)'}</strong>
              </div>
              <div className="p-2 rounded bg-surface-container-lowest">
                <span className="text-on-surface-variant block text-[10px]">Động cơ:</span>
                <strong className="text-primary font-medium">{engineDisplacement || 'Tiêu chuẩn'}</strong>
              </div>
              <div className="p-2 rounded bg-surface-container-lowest">
                <span className="text-on-surface-variant block text-[10px]">Dẫn động:</span>
                <strong className="text-primary font-medium">{drivetrain}</strong>
              </div>
              <div className="p-2 rounded bg-surface-container-lowest">
                <span className="text-on-surface-variant block text-[10px]">Số chỗ / Cửa:</span>
                <strong className="text-primary font-medium">{seats} chỗ • {doors} cửa</strong>
              </div>
              <div className="p-2 rounded bg-surface-container-lowest">
                <span className="text-on-surface-variant block text-[10px]">Màu xe:</span>
                <strong className="text-primary font-medium truncate block">{color || 'Đang cập nhật'}</strong>
              </div>
            </div>

            <div className="rounded-lg border border-outline-variant/30 bg-surface-container-lowest p-3 text-[11px] text-on-surface-variant space-y-1">
              <div><strong className="text-primary">Lịch sử xe:</strong> {accidentLabel} · {floodLabel} · {serviceLabel}</div>
              <div>{vehicleHistory.ownerCount ? `${vehicleHistory.ownerCount} đời chủ · ` : ''}{vehicleHistory.repaintedPartsCount} chi tiết sơn lại{vehicleHistory.engineRepaired ? ' · Đã sửa động cơ' : ''}{vehicleHistory.transmissionRepaired ? ' · Đã sửa hộp số' : ''}</div>
              {vehicleHistory.replacedParts && <div><strong className="text-primary">Đã thay:</strong> {vehicleHistory.replacedParts}</div>}
            </div>

            {/* Commitments Badges */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {commitments.isOwner && (
                <span className="px-2 py-0.5 rounded bg-surface-container-lowest text-[10px] font-semibold text-secondary border border-secondary/30 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px]">check</span>
                  <span>Chính chủ cá nhân</span>
                </span>
              )}
              {commitments.maintenanceHistory && (
                <span className="px-2 py-0.5 rounded bg-surface-container-lowest text-[10px] font-semibold text-secondary border border-secondary/30 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px]">check</span>
                  <span>Lịch sử hãng</span>
                </span>
              )}
              {commitments.noAccidentFlood && (
                <span className="px-2 py-0.5 rounded bg-surface-container-lowest text-[10px] font-semibold text-secondary border border-secondary/30 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px]">check</span>
                  <span>Không đâm đụng / thủy kích</span>
                </span>
              )}
              {commitments.readyInspection && (
                <span className="px-2 py-0.5 rounded bg-surface-container-lowest text-[10px] font-semibold text-secondary border border-secondary/30 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px]">check</span>
                  <span>Sẵn sàng test hãng</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Nội dung mô tả chi tiết của chủ xe */}
        {description && (
          <div className="p-5 border-t border-outline-variant/30 bg-surface-container-lowest/70 space-y-1">
            <span className="text-xs font-semibold text-secondary uppercase tracking-wider block">
              Mô tả từ chủ xe:
            </span>
            <p className="text-xs text-on-surface-variant leading-relaxed whitespace-pre-line">
              {description}
            </p>
          </div>
        )}
      </div>

      {/* Thông tin liên hệ & Bảo mật */}
      <div className="p-6 rounded-2xl bg-surface-container-low border border-surface-container-high/60 space-y-4">
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-2 text-primary font-semibold text-sm font-display">
            <span className="material-symbols-outlined text-[20px] text-secondary">
              {sellerType === 'SHOWROOM' ? 'storefront' : 'badge'}
            </span>
            <span>
              {sellerType === 'SHOWROOM' ? 'Thông tin đại diện Showroom / Đại lý:' : 'Thông tin liên hệ người bán:'}
            </span>
          </div>

          <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-secondary-container text-secondary">
            {sellerType === 'SHOWROOM' ? 'Doanh nghiệp / Showroom' : 'Chủ xe cá nhân'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-xs text-on-surface-variant block">
              {sellerType === 'SHOWROOM' ? 'Tên Showroom / Đại lý:' : 'Chủ xe:'}
            </span>
            <strong className="text-primary font-semibold text-sm">
              {sellerType === 'SHOWROOM' ? (showroomName || 'Showroom Auto') : sellerName}
            </strong>
          </div>
          <div>
            <span className="text-xs text-on-surface-variant block">Hotline / Số điện thoại:</span>
            <strong className="text-primary font-semibold text-sm">
              {sellerType === 'SHOWROOM' && showroomPhone ? showroomPhone : sellerPhone}
            </strong>
          </div>
        </div>

        <div className="pt-2 border-t border-surface-container-high/60 flex items-start gap-3">
          <input
            id="privacy-shield-step5"
            type="checkbox"
            checked={privacyShield}
            onChange={(e) => onTogglePrivacyShield(e.target.checked)}
            className="mt-1 w-5 h-5 rounded accent-secondary cursor-pointer"
          />
          <label htmlFor="privacy-shield-step5" className="cursor-pointer space-y-0.5">
            <span className="block text-xs font-semibold text-primary">
              Kích hoạt chế độ bảo mật số điện thoại trước môi giới trung gian
            </span>
            <span className="block text-xs text-outline leading-relaxed">
              Chỉ khách mua thực tế đã định danh mới có thể xem số điện thoại liên hệ trực tiếp.
            </span>
          </label>
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-space-md border-t border-surface-container-high flex flex-col sm:flex-row items-center justify-between gap-space-md">
        <button
          type="button"
          onClick={onPrev}
          disabled={submitting}
          className="w-full sm:w-auto px-space-xl py-space-md rounded-lg bg-surface text-primary font-label-lg text-label-lg font-medium hover:bg-surface-container transition-colors cursor-pointer disabled:opacity-60"
        >
          ← Quay lại chỉnh sửa
        </button>

        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting}
          className="w-full sm:w-auto px-space-xl py-space-md rounded-lg bg-primary text-on-primary font-label-lg text-label-lg font-semibold hover:bg-primary-container transition-colors shadow-lg shadow-primary/10 flex items-center justify-center gap-space-xs cursor-pointer disabled:opacity-60"
        >
          {submitting ? (
            <>
              <span className="material-symbols-outlined text-[18px] animate-spin">
                progress_activity
              </span>
              <span>{submitStatusText}</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[18px]">publish</span>
              <span>Xác nhận &amp; Nộp duyệt tin bán xe</span>
            </>
          )}
        </button>
      </div>
    </section>
  );
}
