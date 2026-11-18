'use client';

import React from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import {
  PROVINCES,
  PRICE_RANGES,
  YEAR_RANGES,
  BODY_TYPES,
  TRANSMISSIONS,
  FUEL_TYPES,
  ODO_RANGES,
} from '../constants/catalog';

interface CarCatalogToolbarProps {
  totalItems: number;
  currentPage: number;
  totalPages: number;
  keyword: string;
  setKeyword: (val: string) => void;
  sortBy: string;
  setSortBy: (val: string) => void;
  showMobileFilter: boolean;
  setShowMobileFilter: (val: boolean) => void;
  hasActiveFilters: boolean;
  resetFilters: () => void;
  // Filter values for chips
  selectedProvince: string;
  setSelectedProvince: (val: string) => void;
  selectedBrand: string;
  setSelectedBrand: (val: string) => void;
  priceIndex: number;
  setPriceIndex: (idx: number) => void;
  yearIndex: number;
  setYearIndex: (idx: number) => void;
  selectedBody: string;
  setSelectedBody: (val: string) => void;
  selectedTransmission: string;
  setSelectedTransmission: (val: string) => void;
  selectedFuel: string;
  setSelectedFuel: (val: string) => void;
  odoIndex: number;
  setOdoIndex: (idx: number) => void;
  onFilterChangeResetPage: () => void;
}

export const CarCatalogToolbar: React.FC<CarCatalogToolbarProps> = ({
  totalItems,
  currentPage,
  totalPages,
  keyword,
  setKeyword,
  sortBy,
  setSortBy,
  showMobileFilter: _showMobileFilter,
  setShowMobileFilter,
  hasActiveFilters,
  resetFilters,
  selectedProvince,
  setSelectedProvince,
  selectedBrand,
  setSelectedBrand,
  priceIndex,
  setPriceIndex,
  yearIndex,
  setYearIndex,
  selectedBody,
  setSelectedBody,
  selectedTransmission,
  setSelectedTransmission,
  selectedFuel,
  setSelectedFuel,
  odoIndex,
  setOdoIndex,
  onFilterChangeResetPage,
}) => {
  return (
    <div className="space-y-4">
      {/* Top Header & Sort Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-5 border-b border-[#eae8e3] gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-[#1a1c1a] tracking-tight">
            Bộ Sưu Tập Xe Tuyển Chọn
          </h1>
          <p className="text-xs sm:text-sm text-[#777777] mt-1">
            Hiển thị {totalItems} mẫu xe có chứng nhận thẩm định giá minh bạch (Trang {currentPage}/
            {totalPages})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search box */}
          <div className="relative w-full sm:w-64 md:w-80">
            <input
              type="text"
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value);
                onFilterChangeResetPage();
              }}
              placeholder="Tìm kiếm xe, phiên bản..."
              className="w-full pl-9 pr-8 h-10 rounded-xl border border-[#eae8e3] text-xs bg-white text-[#1a1c1a] placeholder:text-[#858383] focus:ring-2 focus:ring-[#b89b72]/20 focus:border-[#b89b72] shadow-xs transition-all"
            />
            <Search className="w-4 h-4 text-[#858383] absolute left-3 top-3 pointer-events-none" />
            {keyword && (
              <button
                type="button"
                onClick={() => {
                  setKeyword('');
                  onFilterChangeResetPage();
                }}
                className="absolute right-2.5 top-2.5 p-0.5 text-outline hover:text-primary rounded-full cursor-pointer"
                title="Xóa tìm kiếm"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-outline hidden sm:inline font-medium">Sắp xếp:</span>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                onFilterChangeResetPage();
              }}
              className="px-3.5 h-10 rounded-xl border border-[#eae8e3] text-xs font-semibold text-[#1a1c1a] bg-white focus:border-[#b89b72] shadow-xs cursor-pointer"
            >
              <option value="NEWEST">Tin mới nhất</option>
              <option value="PRICE_ASC">Giá: Thấp đến cao</option>
              <option value="PRICE_DESC">Giá: Cao đến thấp</option>
              <option value="ODO_ASC">Số km (ODO) ít nhất</option>
            </select>
          </div>

          {/* Mobile Filter Button */}
          <button
            type="button"
            onClick={() => setShowMobileFilter(true)}
            className="lg:hidden inline-flex items-center gap-1.5 px-3.5 h-10 rounded-xl border border-[#eae8e3] text-xs font-semibold text-[#1a1c1a] bg-white shadow-xs cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4 text-[#b89b72]" />
            <span>Bộ lọc {hasActiveFilters && '• Đang lọc'}</span>
          </button>
        </div>
      </div>

      {/* Active Filter Chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 bg-white p-3 rounded-xl border border-[#eae8e3]">
          <span className="text-[11px] font-bold text-outline uppercase tracking-wider">
            Đang lọc:
          </span>
          {keyword && (
            <span className="px-2.5 py-1 rounded-lg bg-surface-container-low text-xs font-medium text-primary flex items-center gap-1 border border-surface-container-high">
              <span>Từ khóa: &ldquo;{keyword}&rdquo;</span>
              <button
                type="button"
                onClick={() => {
                  setKeyword('');
                  onFilterChangeResetPage();
                }}
                className="hover:text-red-600"
              >
                ×
              </button>
            </span>
          )}
          {selectedProvince && (
            <span className="px-2.5 py-1 rounded-lg bg-surface-container-low text-xs font-medium text-primary flex items-center gap-1 border border-surface-container-high">
              <span>Khu vực: {PROVINCES.find((x) => x.code === selectedProvince)?.label}</span>
              <button
                type="button"
                onClick={() => {
                  setSelectedProvince('');
                  onFilterChangeResetPage();
                }}
                className="hover:text-red-600"
              >
                ×
              </button>
            </span>
          )}
          {selectedBrand !== 'Tất cả' && (
            <span className="px-2.5 py-1 rounded-lg bg-surface-container-low text-xs font-medium text-primary flex items-center gap-1 border border-surface-container-high">
              <span>Hãng: {selectedBrand}</span>
              <button
                type="button"
                onClick={() => {
                  setSelectedBrand('Tất cả');
                  onFilterChangeResetPage();
                }}
                className="hover:text-red-600"
              >
                ×
              </button>
            </span>
          )}
          {priceIndex !== 0 && (
            <span className="px-2.5 py-1 rounded-lg bg-surface-container-low text-xs font-medium text-primary flex items-center gap-1 border border-surface-container-high">
              <span>Giá: {PRICE_RANGES[priceIndex]?.label}</span>
              <button
                type="button"
                onClick={() => {
                  setPriceIndex(0);
                  onFilterChangeResetPage();
                }}
                className="hover:text-red-600"
              >
                ×
              </button>
            </span>
          )}
          {yearIndex !== 0 && (
            <span className="px-2.5 py-1 rounded-lg bg-surface-container-low text-xs font-medium text-primary flex items-center gap-1 border border-surface-container-high">
              <span>Năm: {YEAR_RANGES[yearIndex]?.label}</span>
              <button
                type="button"
                onClick={() => {
                  setYearIndex(0);
                  onFilterChangeResetPage();
                }}
                className="hover:text-red-600"
              >
                ×
              </button>
            </span>
          )}
          {selectedBody && (
            <span className="px-2.5 py-1 rounded-lg bg-surface-container-low text-xs font-medium text-primary flex items-center gap-1 border border-surface-container-high">
              <span>Dáng: {BODY_TYPES.find((x) => x.value === selectedBody)?.label}</span>
              <button
                type="button"
                onClick={() => {
                  setSelectedBody('');
                  onFilterChangeResetPage();
                }}
                className="hover:text-red-600"
              >
                ×
              </button>
            </span>
          )}
          {selectedTransmission && (
            <span className="px-2.5 py-1 rounded-lg bg-surface-container-low text-xs font-medium text-primary flex items-center gap-1 border border-surface-container-high">
              <span>Hộp số: {TRANSMISSIONS.find((x) => x.value === selectedTransmission)?.label}</span>
              <button
                type="button"
                onClick={() => {
                  setSelectedTransmission('');
                  onFilterChangeResetPage();
                }}
                className="hover:text-red-600"
              >
                ×
              </button>
            </span>
          )}
          {selectedFuel && (
            <span className="px-2.5 py-1 rounded-lg bg-surface-container-low text-xs font-medium text-primary flex items-center gap-1 border border-surface-container-high">
              <span>Nhiên liệu: {FUEL_TYPES.find((x) => x.value === selectedFuel)?.label}</span>
              <button
                type="button"
                onClick={() => {
                  setSelectedFuel('');
                  onFilterChangeResetPage();
                }}
                className="hover:text-red-600"
              >
                ×
              </button>
            </span>
          )}
          {odoIndex !== 0 && (
            <span className="px-2.5 py-1 rounded-lg bg-surface-container-low text-xs font-medium text-primary flex items-center gap-1 border border-surface-container-high">
              <span>ODO: {ODO_RANGES[odoIndex]?.label}</span>
              <button
                type="button"
                onClick={() => {
                  setOdoIndex(0);
                  onFilterChangeResetPage();
                }}
                className="hover:text-red-600"
              >
                ×
              </button>
            </span>
          )}
          <button
            type="button"
            onClick={resetFilters}
            className="text-xs text-red-600 hover:underline font-semibold ml-auto"
          >
            Xóa tất cả
          </button>
        </div>
      )}
    </div>
  );
};
