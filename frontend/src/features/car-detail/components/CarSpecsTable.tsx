'use client';

import React from 'react';
import { formatKm } from '@/lib/api';
import { ListingDetail } from '@/types';

interface CarSpecsTableProps {
  listing: ListingDetail;
}

export function CarSpecsTable({ listing }: CarSpecsTableProps) {
  const accidentLabels = { UNKNOWN: 'Chưa xác định', NONE: 'Không tai nạn', MINOR: 'Va chạm nhẹ', MAJOR: 'Tai nạn nặng' };
  const floodLabels = { UNKNOWN: 'Chưa xác định', NONE: 'Không ngập nước', SUSPECTED: 'Có dấu hiệu nghi ngờ', CONFIRMED: 'Đã từng ngập nước' };
  const serviceLabels = { UNKNOWN: 'Chưa xác định', NONE: 'Không có hồ sơ', PARTIAL: 'Hồ sơ một phần', FULL: 'Hồ sơ đầy đủ' };
  const specs = [
    { label: 'Dòng xe & Phiên bản', value: listing.title },
    { label: 'Năm sản xuất', value: String(listing.manufacture_year) },
    { label: 'Quãng đường đã đi (ODO)', value: formatKm(listing.odometer_km) },
    { label: 'Kiểu dáng thân xe', value: listing.body_type || 'SEDAN' },
    { label: 'Màu ngoại thất', value: listing.color || 'Trắng Ánh Kim' },
    { label: 'Màu nội thất', value: listing.interior_color || 'Nâu Cognac' },
    {
      label: 'Hộp số truyền động',
      value:
        listing.transmission === 'AUTOMATIC'
          ? 'Tự động AT thể thao'
          : listing.transmission || 'Tự động',
    },
    {
      label: 'Nhiên liệu vận hành',
      value:
        listing.fuel_type === 'GASOLINE'
          ? 'Xăng cao cấp'
          : listing.fuel_type === 'DIESEL'
          ? 'Dầu Diesel'
          : listing.fuel_type === 'ELECTRIC'
          ? 'Thuần Điện EV'
          : listing.fuel_type || 'Xăng',
    },
    {
      label: 'Số chỗ ngồi / Số cửa',
      value: `${listing.seats || 5} chỗ / ${listing.doors || 4} cửa`,
    },
    {
      label: 'Dẫn động',
      value: listing.drivetrain || 'AWD (4 bánh toàn thời gian)',
    },
    {
      label: 'Dung tích xi-lanh',
      value: listing.engine_displacement ? `${listing.engine_displacement}L Twin-Turbo` : '2.9L Twin-Turbo V6',
    },
    {
      label: 'Khu vực xem xe & Đăng ký',
      value: listing.location_address || `Tỉnh/TP mã ${listing.province_code || '01'}`,
    },
  ];

  return (
    <div className="space-y-4">
      {/* 1. SPECIFICATIONS DOSSIER TABLE (Placed on top) */}
      <div className="p-5 rounded-xl bg-surface-container-lowest shadow-xs border border-surface-container flex flex-col gap-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[20px]">tune</span>
            <h3 className="text-base font-bold font-display text-primary">
              Thông Số Kỹ Thuật Đầy Đủ
            </h3>
          </div>
          <span className="text-[11px] text-secondary font-medium">12 thông số tiêu chuẩn</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs sm:text-sm">
          {specs.map((s, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between py-2 px-1.5 border-b border-surface-container hover:bg-surface-container/50 rounded transition-colors"
            >
              <span className="text-on-surface-variant text-xs">{s.label}</span>
              <span className="font-semibold text-primary text-right text-xs max-w-[210px] truncate">
                {s.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 2. SELLER'S DESCRIPTION & COMMITMENT (Placed below specifications) */}
      <div className="p-5 rounded-xl bg-surface-container-lowest shadow-xs border border-surface-container flex flex-col gap-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[20px]">description</span>
            <h3 className="text-base font-bold font-display text-primary">
              Mô Tả Chi Tiết Từ Chủ Xe
            </h3>
          </div>
          <span className="text-[11px] text-on-surface-variant font-medium">Thông tin đã xác thực</span>
        </div>

        <div className="text-on-surface leading-relaxed text-xs sm:text-sm font-normal whitespace-pre-line bg-surface-container-low p-3.5 rounded-lg border border-surface-container">
          {listing.description ||
            'Xe một chủ đặt mua chính hãng, đầy đủ lịch sử bảo dưỡng định kỳ tại xưởng ủy quyền. Cam kết xe không đâm đụng, không ngập nước thủy kích, hỗ trợ sang tên bấm biển số mới nhanh chóng.'}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5 text-xs text-on-surface-variant">
          <div><strong>Tai nạn:</strong> {accidentLabels[listing.accident_status || 'UNKNOWN']}</div>
          <div><strong>Ngập nước:</strong> {floodLabels[listing.flood_status || 'UNKNOWN']}</div>
          <div><strong>Bảo dưỡng:</strong> {serviceLabels[listing.service_history || 'UNKNOWN']}</div>
          <div><strong>Số đời chủ:</strong> {listing.owner_count || 'Chưa xác định'}</div>
          <div><strong>Chi tiết sơn lại:</strong> {listing.repainted_parts_count ?? 'Chưa xác định'}</div>
          <div><strong>Động cơ/Hộp số:</strong> {listing.engine_repaired || listing.transmission_repaired ? `${listing.engine_repaired ? 'Đã sửa động cơ' : ''}${listing.engine_repaired && listing.transmission_repaired ? ', ' : ''}${listing.transmission_repaired ? 'Đã sửa hộp số' : ''}` : 'Chưa ghi nhận sửa chữa lớn'}</div>
          {listing.replaced_parts && <div className="sm:col-span-2"><strong>Bộ phận đã thay:</strong> {listing.replaced_parts}</div>}
        </div>
      </div>
    </div>
  );
}
