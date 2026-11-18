'use client';

import React from 'react';
import { SlidersHorizontal, RotateCcw } from 'lucide-react';
import {
  BRANDS,
  PROVINCES,
  PRICE_RANGES,
  YEAR_RANGES,
  BODY_TYPES,
  TRANSMISSIONS,
  FUEL_TYPES,
  ODO_RANGES,
} from '../constants/catalog';

interface CarCatalogSidebarProps {
  selectedProvince: string;
  setSelectedProvince: (val: string) => void;
  selectedBrand: string;
  setSelectedBrand: (val: string) => void;
  priceIndex: number;
  setPriceIndex: (idx: number) => void;
  setCustomPrice: (val: { min?: number; max?: number } | null) => void;
  yearIndex: number;
  setYearIndex: (idx: number) => void;
  setCustomYear: (val: { min?: number; max?: number } | null) => void;
  selectedBody: string;
  setSelectedBody: (val: string) => void;
  selectedTransmission: string;
  setSelectedTransmission: (val: string) => void;
  selectedFuel: string;
  setSelectedFuel: (val: string) => void;
  odoIndex: number;
  setOdoIndex: (idx: number) => void;
  hasActiveFilters: boolean;
  resetFilters: () => void;
  onFilterApplied?: () => void;
  isMobile?: boolean;
}

export const CarCatalogSidebar: React.FC<CarCatalogSidebarProps> = ({
  selectedProvince,
  setSelectedProvince,
  selectedBrand,
  setSelectedBrand,
  priceIndex,
  setPriceIndex,
  setCustomPrice,
  yearIndex,
  setYearIndex,
  setCustomYear,
  selectedBody,
  setSelectedBody,
  selectedTransmission,
  setSelectedTransmission,
  selectedFuel,
  setSelectedFuel,
  odoIndex,
  setOdoIndex,
  hasActiveFilters,
  resetFilters,
  onFilterApplied,
  isMobile,
}) => {
  return (
    <div className="bg-white p-5 rounded-2xl border border-[#eae8e3] shadow-[0_8px_30px_rgba(25,25,25,0.03)] space-y-6 lg:sticky lg:top-28">
      {/* Header sidebar */}
      <div className="flex items-center justify-between pb-3 border-b border-[#eae8e3]">
        <span className="font-semibold text-sm text-[#1a1c1a] flex items-center font-display gap-2">
          <SlidersHorizontal className="w-4 h-4 text-[#b89b72]" />
          <span>Bộ lọc xe</span>
        </span>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1 font-semibold cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Xóa lọc</span>
          </button>
        )}
      </div>

      {/* 1. Khu vực / Tỉnh thành */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-[#444748]">Khu vực / Tỉnh thành</label>
        <select
          value={selectedProvince}
          onChange={(e) => setSelectedProvince(e.target.value)}
          className="w-full px-3 h-10 rounded-xl border border-[#eae8e3] text-xs bg-[#faf9f6] text-[#1a1c1a] focus:border-[#b89b72] font-medium cursor-pointer"
        >
          {PROVINCES.map((p) => (
            <option key={p.code} value={p.code}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      {/* 2. Hãng sản xuất */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-[#444748]">Hãng sản xuất</label>
        <select
          value={selectedBrand}
          onChange={(e) => setSelectedBrand(e.target.value)}
          className="w-full px-3 h-10 rounded-xl border border-[#eae8e3] text-xs bg-[#faf9f6] text-[#1a1c1a] focus:border-[#b89b72] font-medium cursor-pointer"
        >
          {BRANDS.map((b) => (
            <option key={b} value={b}>
              {b === 'Tất cả' ? 'Tất cả các hãng xe' : b}
            </option>
          ))}
        </select>
      </div>

      {/* 3. Khoảng giá */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-[#444748]">Khoảng giá</label>
        <div className="space-y-1.5">
          {PRICE_RANGES.map((pr, idx) => {
            const isChecked = priceIndex === idx;
            return (
              <label
                key={idx}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer border ${
                  isChecked
                    ? 'bg-secondary-container/40 border-secondary text-secondary font-semibold'
                    : 'border-transparent text-[#444748] hover:bg-[#faf9f6]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={isMobile ? 'mobile_price_range' : 'price_range'}
                    checked={isChecked}
                    onChange={() => {
                      setPriceIndex(idx);
                      setCustomPrice(null);
                    }}
                    className="accent-[#b89b72] w-3.5 h-3.5"
                  />
                  <span>{pr.label}</span>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* 4. Năm sản xuất (Đời xe) */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-[#444748]">Năm sản xuất (Đời xe)</label>
        <div className="space-y-1.5">
          {YEAR_RANGES.map((yr, idx) => {
            const isChecked = yearIndex === idx;
            return (
              <label
                key={idx}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer border ${
                  isChecked
                    ? 'bg-secondary-container/40 border-secondary text-secondary font-semibold'
                    : 'border-transparent text-[#444748] hover:bg-[#faf9f6]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={isMobile ? 'mobile_year_range' : 'year_range'}
                    checked={isChecked}
                    onChange={() => {
                      setYearIndex(idx);
                      setCustomYear(null);
                    }}
                    className="accent-[#b89b72] w-3.5 h-3.5"
                  />
                  <span>{yr.label}</span>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* 5. Kiểu dáng xe */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-[#444748]">Kiểu dáng thân xe</label>
        <div className="space-y-1.5">
          {BODY_TYPES.map((bt) => {
            const isChecked = selectedBody === bt.value;
            return (
              <label
                key={bt.value}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer border ${
                  isChecked
                    ? 'bg-secondary-container/40 border-secondary text-secondary font-semibold'
                    : 'border-transparent text-[#444748] hover:bg-[#faf9f6]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={isMobile ? 'mobile_body_type' : 'body_type'}
                    checked={isChecked}
                    onChange={() => setSelectedBody(bt.value)}
                    className="accent-[#b89b72] w-3.5 h-3.5"
                  />
                  <span>{bt.label}</span>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* 6. Hộp số */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-[#444748]">Hộp số</label>
        <div className="space-y-1.5">
          {TRANSMISSIONS.map((t) => {
            const isChecked = selectedTransmission === t.value;
            return (
              <label
                key={t.value}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer border ${
                  isChecked
                    ? 'bg-secondary-container/40 border-secondary text-secondary font-semibold'
                    : 'border-transparent text-[#444748] hover:bg-[#faf9f6]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={isMobile ? 'mobile_transmission' : 'transmission'}
                    checked={isChecked}
                    onChange={() => setSelectedTransmission(t.value)}
                    className="accent-[#b89b72] w-3.5 h-3.5"
                  />
                  <span>{t.label}</span>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* 7. Nhiên liệu */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-[#444748]">Nhiên liệu</label>
        <div className="space-y-1.5">
          {FUEL_TYPES.map((f) => {
            const isChecked = selectedFuel === f.value;
            return (
              <label
                key={f.value}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer border ${
                  isChecked
                    ? 'bg-secondary-container/40 border-secondary text-secondary font-semibold'
                    : 'border-transparent text-[#444748] hover:bg-[#faf9f6]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={isMobile ? 'mobile_fuel_type' : 'fuel_type'}
                    checked={isChecked}
                    onChange={() => setSelectedFuel(f.value)}
                    className="accent-[#b89b72] w-3.5 h-3.5"
                  />
                  <span>{f.label}</span>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* 8. Số km đã đi (ODO) */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-[#444748]">Số km đã đi (ODO)</label>
        <div className="space-y-1.5">
          {ODO_RANGES.map((od, idx) => {
            const isChecked = odoIndex === idx;
            return (
              <label
                key={idx}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer border ${
                  isChecked
                    ? 'bg-secondary-container/40 border-secondary text-secondary font-semibold'
                    : 'border-transparent text-[#444748] hover:bg-[#faf9f6]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={isMobile ? 'mobile_odo_range' : 'odo_range'}
                    checked={isChecked}
                    onChange={() => setOdoIndex(idx)}
                    className="accent-[#b89b72] w-3.5 h-3.5"
                  />
                  <span>{od.label}</span>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* Mobile apply button */}
      {isMobile && onFilterApplied && (
        <button
          type="button"
          onClick={onFilterApplied}
          className="w-full py-2.5 rounded-xl bg-primary text-white font-semibold text-xs border border-primary cursor-pointer mt-4"
        >
          Áp dụng bộ lọc
        </button>
      )}
    </div>
  );
};
