'use client';

import React from 'react';
import { formatVND } from '@/lib/api';
import { POPULAR_PROVINCES } from '@/features/auth/constants/provinces';

interface EditPricingLocationTabProps {
  priceVnd: string;
  setPriceVnd: (price: string) => void;
  provinceCode: string;
  setProvinceCode: (code: string) => void;
  locationAddress: string;
  setLocationAddress: (addr: string) => void;
  description: string;
  setDescription: (desc: string) => void;
}

export function EditPricingLocationTab({
  priceVnd,
  setPriceVnd,
  provinceCode,
  setProvinceCode,
  locationAddress,
  setLocationAddress,
  description,
  setDescription,
}: EditPricingLocationTabProps) {
  const parsedPrice = parseInt(priceVnd.replace(/\D/g, ''), 10) || 0;

  return (
    <div className="space-y-4">
      {/* Price */}
      <div>
        <label className="block text-xs font-bold text-primary mb-1">
          Giá bán mong muốn (VNĐ) <span className="text-error">*</span>
        </label>
        <div className="relative">
          <input
            type="text"
            value={parsedPrice > 0 ? parsedPrice.toLocaleString('vi-VN') : ''}
            onChange={(e) => setPriceVnd(e.target.value.replace(/\D/g, ''))}
            className="w-full pl-3 pr-12 py-2.5 rounded-xl bg-surface-container-low border border-surface-container-high text-sm text-secondary font-black focus:border-secondary outline-none"
            placeholder="VD: 850.000.000"
            required
          />
          <span className="absolute right-3 top-2.5 text-xs text-secondary font-bold">VNĐ</span>
        </div>
        {parsedPrice > 0 && (
          <p className="text-[11px] text-secondary font-semibold mt-1">
            Hiển thị: {formatVND(parsedPrice)}
          </p>
        )}
      </div>

      {/* Province & Address */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-bold text-primary mb-1">Tỉnh / Thành phố xem xe *</label>
          <select
            value={provinceCode}
            onChange={(e) => setProvinceCode(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-surface-container-low border border-surface-container-high text-xs text-primary focus:border-secondary outline-none font-medium"
          >
            {POPULAR_PROVINCES.map((p) => (
              <option key={p.code} value={p.code}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-bold text-primary mb-1">Địa chỉ xem xe chi tiết</label>
          <input
            type="text"
            value={locationAddress}
            onChange={(e) => setLocationAddress(e.target.value)}
            placeholder="VD: Số 18 đường Phạm Hùng, Phường Mỹ Đình 2, Nam Từ Liêm"
            className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-surface-container-high text-xs text-primary focus:border-secondary outline-none"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-bold text-primary mb-1">Mô tả chi tiết phương tiện</label>
        <textarea
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Mô tả thêm về tình trạng sử dụng, trang bị nâng cấp, bảo dưỡng..."
          className="w-full p-3.5 rounded-xl bg-surface-container-low border border-surface-container-high text-xs text-primary focus:border-secondary outline-none leading-relaxed"
        />
      </div>
    </div>
  );
}

