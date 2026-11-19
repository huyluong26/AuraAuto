'use client';

import React from 'react';
import { Building } from 'lucide-react';
import { formatVND } from '@/lib/api';
import { QuickListingData } from '../../types';

interface ValuationPriceSummaryBannerProps {
  initialData: QuickListingData;
  sellerType: 'INDIVIDUAL' | 'SHOWROOM';
  showroomName?: string;
  isOwner: boolean;
  setIsOwner: (val: boolean) => void;
  maintenanceHistory: boolean;
  setMaintenanceHistory: (val: boolean) => void;
  noAccidentFlood: boolean;
  setNoAccidentFlood: (val: boolean) => void;
  readyInspection: boolean;
  setReadyInspection: (val: boolean) => void;
  priceVnd: number;
  setPriceVnd: (price: number) => void;
}

export function ValuationPriceSummaryBanner({
  initialData,
  sellerType,
  showroomName,
  isOwner,
  setIsOwner,
  maintenanceHistory,
  setMaintenanceHistory,
  noAccidentFlood,
  setNoAccidentFlood,
  readyInspection,
  setReadyInspection,
  priceVnd,
  setPriceVnd,
}: ValuationPriceSummaryBannerProps) {
  return (
    <>
      {/* Pre-filled Specs Summary Badge */}
      <div className="p-4 rounded-2xl bg-[#faf9f6] border border-[#eae8e3] space-y-2.5">
        <span className="text-[10px] font-bold text-[#b89b72] uppercase tracking-wider block">
          Thông số kỹ thuật xe đã được đồng bộ từ kết quả định giá
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          <div>
            <span className="text-[#888] block text-[10px]">Hãng &amp; Dòng xe</span>
            <span className="font-semibold text-[#1a1c1a]">{initialData.brand} {initialData.model}</span>
          </div>
          <div>
            <span className="text-[#888] block text-[10px]">Đời xe &amp; Số ODO</span>
            <span className="font-semibold text-[#1a1c1a]">{initialData.year} • {initialData.odometerKm.toLocaleString('vi-VN')} km</span>
          </div>
          <div>
            <span className="text-[#888] block text-[10px]">Kiểu dáng &amp; Hộp số</span>
            <span className="font-semibold text-[#1a1c1a]">
              {initialData.bodyType} • {initialData.transmission}
            </span>
          </div>
          <div>
            <span className="text-[#888] block text-[10px]">Nhiên liệu &amp; Xuất xứ</span>
            <span className="font-semibold text-[#1a1c1a]">
              {initialData.fuelType} • {initialData.origin}
            </span>
          </div>
        </div>
      </div>

      {/* Seller Account Badge if Showroom */}
      {sellerType === 'SHOWROOM' && (
        <div className="p-3.5 rounded-2xl bg-secondary-container/30 border border-secondary/30 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <Building className="w-4 h-4 text-[#725a37]" />
            <span className="font-semibold text-[#1a1c1a]">
              Đăng tin từ tài khoản Showroom: <span className="text-[#725a37] font-bold">{showroomName || 'Salon / Đối tác'}</span>
            </span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-white text-[10px] font-bold text-[#725a37] border border-[#b89b72]/30">
            Doanh nghiệp
          </span>
        </div>
      )}

      {/* Quality Commitments */}
      <div className="space-y-2.5">
        <label className="block text-xs font-bold text-[#1a1c1a]">
          2. Cam kết chất lượng của người bán xe
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <label className="flex items-center gap-2.5 p-3 rounded-xl border border-[#eae8e3] hover:bg-[#faf9f6] transition-colors cursor-pointer">
            <input
              type="checkbox"
              checked={isOwner}
              onChange={(e) => setIsOwner(e.target.checked)}
              className="w-4 h-4 rounded accent-[#b89b72] cursor-pointer"
            />
            <span className="text-xs">Xe chính chủ đứng tên cavet</span>
          </label>

          <label className="flex items-center gap-2.5 p-3 rounded-xl border border-[#eae8e3] hover:bg-[#faf9f6] transition-colors cursor-pointer">
            <input
              type="checkbox"
              checked={maintenanceHistory}
              onChange={(e) => setMaintenanceHistory(e.target.checked)}
              className="w-4 h-4 rounded accent-[#b89b72] cursor-pointer"
            />
            <span className="text-xs">Bảo dưỡng định kỳ hãng đầy đủ</span>
          </label>

          <label className="flex items-center gap-2.5 p-3 rounded-xl border border-[#eae8e3] hover:bg-[#faf9f6] transition-colors cursor-pointer">
            <input
              type="checkbox"
              checked={noAccidentFlood}
              onChange={(e) => setNoAccidentFlood(e.target.checked)}
              className="w-4 h-4 rounded accent-[#b89b72] cursor-pointer"
            />
            <span className="text-xs">Cam kết không đâm đụng, thủy kích</span>
          </label>

          <label className="flex items-center gap-2.5 p-3 rounded-xl border border-[#eae8e3] hover:bg-[#faf9f6] transition-colors cursor-pointer">
            <input
              type="checkbox"
              checked={readyInspection}
              onChange={(e) => setReadyInspection(e.target.checked)}
              className="w-4 h-4 rounded accent-[#b89b72] cursor-pointer"
            />
            <span className="text-xs">Sẵn sàng mang xe test hãng toàn quốc</span>
          </label>
        </div>
      </div>
    </>
  );
}
