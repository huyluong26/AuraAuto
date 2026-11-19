'use client';

import React, { useState } from 'react';
import {
  UNIVERSAL_CAR_COLORS,
  POPULAR_INTERIOR_COLORS,
  getBrandColors,
} from '../../constants';

interface CarColorPickerGroupProps {
  brandName?: string;
  color: string;
  onColorChange: (val: string) => void;
  interiorColor: string;
  onInteriorColorChange: (val: string) => void;
  errors: Record<string, string>;
}

export function CarColorPickerGroup({
  brandName = '',
  color,
  onColorChange,
  interiorColor,
  onInteriorColorChange,
  errors,
}: CarColorPickerGroupProps) {
  const [colorMode, setColorMode] = useState<'brand' | 'universal'>('brand');

  const brandColors = getBrandColors(brandName);
  const displayedColors = colorMode === 'brand' && brandName ? brandColors : UNIVERSAL_CAR_COLORS;

  return (
    <div className="space-y-6 pt-6 border-t border-surface-container-high/70">
      <div className="flex items-center gap-2 text-primary font-semibold text-sm font-display">
        <span className="material-symbols-outlined text-secondary text-[20px]">palette</span>
        <span>3. Màu sắc ngoại thất &amp; Nội thất</span>
      </div>

      {/* Màu ngoại thất */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold text-primary">
            Màu sơn ngoại thất <span className="text-error">*</span>
          </label>
          {brandName && brandColors.length > 0 && (
            <div className="flex items-center gap-1 bg-surface-container-low p-0.5 rounded-lg border border-surface-container-high text-[11px]">
              <button
                type="button"
                onClick={() => setColorMode('brand')}
                className={`px-2 py-0.5 rounded-md font-medium transition-colors cursor-pointer ${
                  colorMode === 'brand'
                    ? 'bg-secondary text-on-secondary shadow-xs font-semibold'
                    : 'text-outline hover:text-primary'
                }`}
              >
                Màu theo hãng {brandName}
              </button>
              <button
                type="button"
                onClick={() => setColorMode('universal')}
                className={`px-2 py-0.5 rounded-md font-medium transition-colors cursor-pointer ${
                  colorMode === 'universal'
                    ? 'bg-secondary text-on-secondary shadow-xs font-semibold'
                    : 'text-outline hover:text-primary'
                }`}
              >
                Bảng màu chung
              </button>
            </div>
          )}
        </div>

        <input
          type="text"
          required
          value={color}
          onChange={(e) => onColorChange(e.target.value)}
          placeholder="Tự gõ tên màu cụ thể hoặc click chọn ô màu gợi ý ngay bên dưới..."
          className={`w-full h-12 px-4 rounded-xl bg-surface text-primary text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary ${
            errors.color ? 'border-2 border-error' : 'border border-surface-container-high'
          }`}
        />
        {errors.color && <p className="text-xs text-error font-medium">{errors.color}</p>}

        {/* Bảng màu dạng lưới đều đặn 3 - 6 cột */}
        <div className="space-y-1.5 pt-1">
          <span className="text-[11px] font-semibold text-outline uppercase tracking-wider block">
            Bảng màu gợi ý chuẩn xác:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
            {displayedColors.map((c) => {
              const isMatch = color.trim().toLowerCase() === c.name.toLowerCase();
              return (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => onColorChange(c.name)}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    isMatch
                      ? 'border-secondary bg-secondary-container/40 ring-1 ring-secondary shadow-xs'
                      : 'border-surface-container-high bg-surface hover:border-secondary/60 hover:bg-surface-container-low'
                  }`}
                >
                  <span
                    className="w-5 h-5 rounded-full shrink-0 shadow-xs flex items-center justify-center border border-black/10"
                    style={{ backgroundColor: c.hex }}
                  >
                    {isMatch && (
                      <span
                        className={`material-symbols-outlined text-[13px] font-bold ${
                          c.hex === '#FFFFFF' || c.hex === '#F8F9FA' || c.hex === '#FAFAFA' || c.hex === '#F8FAFC'
                            ? 'text-primary'
                            : 'text-white'
                        }`}
                      >
                        check
                      </span>
                    )}
                  </span>
                  <span className="text-xs font-medium text-primary truncate leading-tight">
                    {c.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Màu nội thất */}
      <div className="space-y-3 pt-2">
        <label className="block text-xs font-semibold text-primary">
          Màu da nội thất khoang lái
        </label>
        <input
          type="text"
          value={interiorColor}
          onChange={(e) => onInteriorColorChange(e.target.value)}
          placeholder="Tự gõ tên màu nội thất hoặc chọn bảng màu da bên dưới..."
          className="w-full h-12 px-4 rounded-xl bg-surface text-primary text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary border border-surface-container-high"
        />

        <div className="space-y-1.5 pt-1">
          <span className="text-[11px] font-semibold text-outline uppercase tracking-wider block">
            Gợi ý màu nội thất da cao cấp:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
            {POPULAR_INTERIOR_COLORS.map((ic) => {
              const isMatch = interiorColor.trim().toLowerCase() === ic.name.toLowerCase();
              return (
                <button
                  key={ic.name}
                  type="button"
                  onClick={() => onInteriorColorChange(ic.name)}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    isMatch
                      ? 'border-secondary bg-secondary-container/40 ring-1 ring-secondary shadow-xs'
                      : 'border-surface-container-high bg-surface hover:border-secondary/60 hover:bg-surface-container-low'
                  }`}
                >
                  <span
                    className="w-5 h-5 rounded-full shrink-0 shadow-xs border border-black/10"
                    style={{ backgroundColor: ic.hex }}
                  />
                  <span className="text-xs font-medium text-primary truncate leading-tight">
                    {ic.name}
                  </span>
                  {isMatch && <span className="material-symbols-outlined text-[14px] text-secondary ml-auto">check</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

