'use client';

import React from 'react';
import { formatFullVND, formatKm } from '@/lib/api';
import { ListingDetail } from '@/types';
import { POPULAR_PROVINCES } from '@/features/auth/constants/provinces';

const PROVINCE_MAP: Record<string, string> = {
  'HN': 'Hà Nội',
  'SG': 'TP. Hồ Chí Minh',
  'DN': 'Đà Nẵng',
  'ALL': 'Toàn quốc',
};
POPULAR_PROVINCES.forEach((p) => {
  PROVINCE_MAP[p.code] = p.name;
});

interface CarHeaderPricingProps {
  listing: ListingDetail;
  originalPriceEstimate?: number;
}

export function CarHeaderPricing({
  listing,
  originalPriceEstimate,
}: CarHeaderPricingProps) {
  return (
    <div className="p-5 rounded-xl bg-surface-container-lowest shadow-xs border border-surface-container flex flex-col gap-4">
      {/* Top Badges & Meta info */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          {listing.is_featured && (
            <span className="px-2.5 py-0.5 rounded-full bg-secondary text-on-secondary text-[11px] font-bold tracking-wider flex items-center gap-1 shadow-xs">
              <span className="material-symbols-outlined text-[14px] text-secondary-fixed">rocket_launch</span>
              <span>TIN NỔI BẬT</span>
            </span>
          )}
          <span className="px-2.5 py-0.5 rounded bg-secondary-container text-on-secondary-container text-[11px] uppercase font-bold tracking-wider">
            Chính Chủ Bán
          </span>
          <span className="px-2.5 py-0.5 rounded bg-surface-container text-on-surface-variant text-[11px] font-semibold">
            Năm {listing.manufacture_year}
          </span>
          <span className="px-2.5 py-0.5 rounded bg-surface-container text-on-surface-variant text-[11px] font-medium flex items-center gap-1">
            <span className="material-symbols-outlined text-[13px] text-secondary">location_on</span>
            <span>
              {listing.location_address ||
                (listing.province_code ? PROVINCE_MAP[listing.province_code] || listing.province_code : 'Toàn quốc')}
            </span>
          </span>
        </div>

        <div className="flex items-center gap-2 text-on-surface-variant text-xs">
          <span className="inline-flex items-center gap-1">
            <span className="material-symbols-outlined text-[15px]">visibility</span>
            <span>
              {typeof listing.views_count === 'number'
                ? listing.views_count.toLocaleString('vi-VN')
                : '1.420'}{' '}
              lượt xem
            </span>
          </span>
        </div>
      </div>

      {/* Main Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold font-display text-primary tracking-tight leading-snug">
          {listing.title}
        </h1>
        <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
          Bản chính hãng • Đầy đủ lịch sử bảo dưỡng định kỳ • Hồ sơ pháp lý minh bạch sẵn sàng sang tên
        </p>
      </div>

      {/* Price Highlight Bar (Without any loan/installment) */}
      <div className="p-3.5 sm:p-4 rounded-lg bg-surface-container-low border border-surface-container flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold">
              Giá bán niêm yết
            </span>
            <span className="px-2 py-0.5 rounded bg-surface-container-high text-secondary text-[10px] font-semibold">
              Bao phí sang tên chuẩn
            </span>
          </div>
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-2xl sm:text-3xl font-bold font-display text-primary tracking-tight">
              {formatFullVND(listing.price_vnd)}
            </span>
            {originalPriceEstimate && originalPriceEstimate > listing.price_vnd && (
              <span className="text-xs sm:text-sm text-on-surface-variant line-through">
                {formatFullVND(originalPriceEstimate)}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-secondary-fixed/30 text-on-secondary-fixed-variant text-xs font-semibold flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[15px] text-secondary">verified</span>
            <span>Giá chính chủ đề xuất</span>
          </span>
        </div>
      </div>

      {/* 6 Essential Specs Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
        <div className="p-2.5 sm:p-3 rounded-lg bg-surface-container flex flex-col">
          <span className="text-[10px] sm:text-[11px] text-on-surface-variant uppercase font-medium">
            Quãng đường đã đi
          </span>
          <span className="text-sm sm:text-base font-bold font-display text-primary mt-0.5">
            {formatKm(listing.odometer_km)}
          </span>
          <span className="text-[11px] text-secondary mt-0.5 font-medium">ODO nguyên bản</span>
        </div>

        <div className="p-2.5 sm:p-3 rounded-lg bg-surface-container flex flex-col">
          <span className="text-[10px] sm:text-[11px] text-on-surface-variant uppercase font-medium">
            Năm sản xuất
          </span>
          <span className="text-sm sm:text-base font-bold font-display text-primary mt-0.5">
            {listing.manufacture_year}
          </span>
          <span className="text-[11px] text-on-surface-variant mt-0.5">Đời xe chuẩn hãng</span>
        </div>

        <div className="p-2.5 sm:p-3 rounded-lg bg-surface-container flex flex-col">
          <span className="text-[10px] sm:text-[11px] text-on-surface-variant uppercase font-medium">
            Hộp số truyền động
          </span>
          <span className="text-sm sm:text-base font-bold font-display text-primary mt-0.5 truncate">
            {listing.transmission === 'AUTOMATIC'
              ? 'Tự động AT'
              : listing.transmission || 'Tự động'}
          </span>
          <span className="text-[11px] text-on-surface-variant mt-0.5">Chuyển số mượt</span>
        </div>

        <div className="p-2.5 sm:p-3 rounded-lg bg-surface-container flex flex-col">
          <span className="text-[10px] sm:text-[11px] text-on-surface-variant uppercase font-medium">
            Động cơ & Nhiên liệu
          </span>
          <span className="text-sm sm:text-base font-bold font-display text-primary mt-0.5 truncate">
            {listing.fuel_type === 'GASOLINE'
              ? 'Xăng cao cấp'
              : listing.fuel_type === 'DIESEL'
              ? 'Dầu Diesel'
              : listing.fuel_type === 'ELECTRIC'
              ? 'Thuần Điện EV'
              : listing.fuel_type || 'Xăng'}
          </span>
          <span className="text-[11px] text-on-surface-variant mt-0.5 truncate">
            {listing.engine_displacement ? `${listing.engine_displacement}L Twin-Turbo` : 'Hiệu suất cao'}
          </span>
        </div>

        <div className="p-2.5 sm:p-3 rounded-lg bg-surface-container flex flex-col">
          <span className="text-[10px] sm:text-[11px] text-on-surface-variant uppercase font-medium">
            Kiểu dáng thân xe
          </span>
          <span className="text-sm sm:text-base font-bold font-display text-primary mt-0.5 truncate">
            {listing.body_type || 'SEDAN'}
          </span>
          <span className="text-[11px] text-secondary mt-0.5 font-medium">
            {listing.seats || 5} chỗ ngồi
          </span>
        </div>

        <div className="p-2.5 sm:p-3 rounded-lg bg-surface-container flex flex-col">
          <span className="text-[10px] sm:text-[11px] text-on-surface-variant uppercase font-medium">
            Ngoại thất / Nội thất
          </span>
          <span className="text-sm sm:text-base font-bold font-display text-primary mt-0.5 truncate">
            {listing.color || 'Trắng Ánh Kim'}
          </span>
          <span className="text-[11px] text-on-surface-variant mt-0.5 truncate">
            {listing.interior_color || 'Nâu Cognac'}
          </span>
        </div>
      </div>
    </div>
  );
}
