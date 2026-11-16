'use client';

import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Navbar, Footer } from '@/components/layout';
import { CarCard } from '@/features/cars';
import { api } from '@/lib/api';
import { ListingItem } from '@/types';
import {
  Search,
  RotateCcw,
  Loader2,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  X,
} from 'lucide-react';

const BRANDS = [
  'Tất cả',
  'Mercedes Benz',
  'BMW',
  'Porsche',
  'Toyota',
  'Mazda',
  'Hyundai',
  'Kia',
  'Ford',
  'VinFast',
  'Audi',
  'Lexus',
  'Honda',
  'Mitsubishi',
];

const PROVINCES = [
  { label: 'Tất cả khu vực (Toàn quốc)', code: '' },
  { label: 'Hà Nội', code: '01' },
  { label: 'TP. Hồ Chí Minh', code: '79' },
  { label: 'Bắc Ninh', code: '27' },
  { label: 'Hải Phòng', code: '31' },
  { label: 'Đà Nẵng', code: '48' },
  { label: 'Bình Dương', code: 'BD' },
  { label: 'Cần Thơ', code: '92' },
];

const PRICE_RANGES = [
  { label: 'Tất cả mức giá', min: undefined, max: undefined },
  { label: 'Dưới 500 triệu', min: undefined, max: 500_000_000 },
  { label: '500 - 800 triệu', min: 500_000_000, max: 800_000_000 },
  { label: '800 triệu - 1.2 tỷ', min: 800_000_000, max: 1_200_000_000 },
  { label: '1.2 - 2 tỷ', min: 1_200_000_000, max: 2_000_000_000 },
  { label: 'Trên 2 tỷ', min: 2_000_000_000, max: undefined },
];

const YEAR_RANGES = [
  { label: 'Tất cả năm sản xuất', min: undefined, max: undefined },
  { label: '2022 - 2025 (Siêu lướt)', min: 2022, max: 2025 },
  { label: '2019 - 2021 (Đời gần)', min: 2019, max: 2021 },
  { label: '2015 - 2018 (Đời trung)', min: 2015, max: 2018 },
  { label: 'Trước 2015 (Đời sâu)', min: undefined, max: 2014 },
];

const BODY_TYPES = [
  { label: 'Tất cả kiểu dáng', value: '' },
  { label: 'Sedan', value: 'SEDAN' },
  { label: 'SUV gầm cao', value: 'SUV' },
  { label: 'Hatchback', value: 'HATCHBACK' },
  { label: 'Bán tải (Pickup)', value: 'PICKUP' },
  { label: 'MPV đa dụng', value: 'MPV' },
];

const TRANSMISSIONS = [
  { label: 'Tất cả hộp số', value: '' },
  { label: 'Tự động (AT)', value: 'AUTOMATIC' },
  { label: 'Số sàn (MT)', value: 'MANUAL' },
];

const FUEL_TYPES = [
  { label: 'Tất cả nhiên liệu', value: '' },
  { label: 'Xăng', value: 'GASOLINE' },
  { label: 'Dầu Diesel', value: 'DIESEL' },
  { label: 'Xe điện (EV)', value: 'ELECTRIC' },
];

const ODO_RANGES = [
  { label: 'Tất cả số km', max: undefined },
  { label: 'Dưới 15.000 km (Siêu lướt)', max: 15_000 },
  { label: 'Dưới 30.000 km', max: 30_000 },
  { label: 'Dưới 60.000 km', max: 60_000 },
  { label: 'Dưới 100.000 km', max: 100_000 },
];

// Yêu cầu: 4 xe 1 hàng x 8 hàng = 32 xe mỗi trang
const CARS_PER_ROW = 4;
const ROWS_PER_PAGE = 8;
const PAGE_SIZE = CARS_PER_ROW * ROWS_PER_PAGE; // 32

function getPaginationItems(current: number, total: number): (number | string)[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (current <= 4) {
    return [1, 2, 3, 4, 5, '...', total];
  }
  if (current >= total - 3) {
    return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
  }
  return [1, '...', current - 1, current, current + 1, '...', total];
}

function XeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');
  const [selectedBrand, setSelectedBrand] = useState(searchParams.get('brand') || 'Tất cả');
  const [selectedProvince, setSelectedProvince] = useState(searchParams.get('province_code') || '');
  const [priceIndex, setPriceIndex] = useState(0);
  const [yearIndex, setYearIndex] = useState(0);
  const [selectedBody, setSelectedBody] = useState(searchParams.get('body_type') || '');
  const [selectedTransmission, setSelectedTransmission] = useState(searchParams.get('transmission') || '');
  const [selectedFuel, setSelectedFuel] = useState(searchParams.get('fuel_type') || '');
  const [odoIndex, setOdoIndex] = useState(0);
  const [sortBy, setSortBy] = useState('NEWEST');
  const [showMobileFilter, setShowMobileFilter] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [listings, setListings] = useState<ListingItem[]>([]);
  const [loading, setLoading] = useState(true);

  const hasActiveFilters =
    Boolean(keyword.trim()) ||
    selectedBrand !== 'Tất cả' ||
    Boolean(selectedProvince) ||
    priceIndex !== 0 ||
    yearIndex !== 0 ||
    Boolean(selectedBody) ||
    Boolean(selectedTransmission) ||
    Boolean(selectedFuel) ||
    odoIndex !== 0 ||
    sortBy !== 'NEWEST';

  const resetFilters = () => {
    setKeyword('');
    setSelectedBrand('Tất cả');
    setSelectedProvince('');
    setPriceIndex(0);
    setYearIndex(0);
    setSelectedBody('');
    setSelectedTransmission('');
    setSelectedFuel('');
    setOdoIndex(0);
    setSortBy('NEWEST');
    setCurrentPage(1);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const priceChoice = PRICE_RANGES[priceIndex];
      const yearChoice = YEAR_RANGES[yearIndex];
      const odoChoice = ODO_RANGES[odoIndex];

      const sortParam =
        sortBy === 'PRICE_ASC'
          ? 'price_asc'
          : sortBy === 'PRICE_DESC'
          ? 'price_desc'
          : sortBy === 'ODO_ASC'
          ? 'km_asc'
          : 'newest';

      const searchKw = keyword.trim() || undefined;

      const res = await api.getListings({
        search: searchKw,
        body_type: selectedBody || undefined,
        fuel_type: selectedFuel || undefined,
        transmission: selectedTransmission || undefined,
        province_code: selectedProvince || undefined,
        min_price_vnd: priceChoice.min,
        max_price_vnd: priceChoice.max,
        min_year: yearChoice.min,
        max_year: yearChoice.max,
        max_km: odoChoice.max,
        sort_by: sortParam,
        page: currentPage,
        page_size: PAGE_SIZE,
      });

      if (res && res.items) {
        let items = res.items;
        if (selectedBrand !== 'Tất cả') {
          items = items.filter((c) =>
            c.title.toLowerCase().includes(selectedBrand.toLowerCase())
          );
        }
        setListings(items);
        const resolvedTotal = selectedBrand !== 'Tất cả' ? items.length : (res.total ?? items.length);
        setTotalItems(resolvedTotal);
        setTotalPages(Math.max(1, Math.ceil(resolvedTotal / PAGE_SIZE)));
      } else {
        setListings([]);
        setTotalItems(0);
        setTotalPages(1);
      }
    } catch {
      setListings([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [
    keyword,
    selectedBrand,
    selectedProvince,
    priceIndex,
    yearIndex,
    selectedBody,
    selectedTransmission,
    selectedFuel,
    odoIndex,
    sortBy,
    currentPage,
  ]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 100, behavior: 'smooth' });
  };

  return (
    <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Header & Sort Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-5 border-b border-[#eae8e3] gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-[#1a1c1a] tracking-tight">
            Bộ Sưu Tập Xe Tuyển Chọn
          </h1>
          <p className="text-xs sm:text-sm text-[#777777] mt-1">
            Hiển thị {totalItems} mẫu xe có chứng nhận thẩm định giá minh bạch (Trang {currentPage}/{totalPages})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Thanh tìm kiếm đưa lên vị trí sắp xếp theo yêu cầu */}
          <div className="relative w-full sm:w-64 md:w-80">
            <input
              type="text"
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value);
                setCurrentPage(1);
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
                  setCurrentPage(1);
                }}
                className="absolute right-2.5 top-2.5 p-0.5 text-outline hover:text-primary rounded-full cursor-pointer"
                title="Xóa tìm kiếm"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sắp xếp */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-outline hidden sm:inline font-medium">Sắp xếp:</span>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setCurrentPage(1);
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

      {/* Main Content Layout: Cố định phần lọc bên tay trái + Lưới 4 card 1 hàng */}
      <div className="flex flex-col lg:flex-row gap-7 items-start">
        {/* ============================================================== */}
        {/* PHẦN LỌC BÊN TAY TRÁI (LEFT SIDEBAR FILTER)                   */}
        {/* ============================================================== */}
        <aside
          className={`w-full lg:w-72 shrink-0 ${
            showMobileFilter
              ? 'fixed inset-0 z-50 bg-[#faf9f6] p-6 overflow-y-auto block'
              : 'hidden lg:block'
          }`}
        >
          {/* Mobile Drawer Header */}
          {showMobileFilter && (
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#eae8e3] lg:hidden">
              <span className="font-bold font-display text-base text-[#1a1c1a]">Bộ lọc tìm kiếm</span>
              <button
                type="button"
                onClick={() => setShowMobileFilter(false)}
                className="p-1 rounded-lg text-outline hover:text-primary cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          )}

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
                onChange={(e) => {
                  setSelectedProvince(e.target.value);
                  setCurrentPage(1);
                }}
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
                onChange={(e) => {
                  setSelectedBrand(e.target.value);
                  setCurrentPage(1);
                }}
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
                          name="price_range"
                          checked={isChecked}
                          onChange={() => {
                            setPriceIndex(idx);
                            setCurrentPage(1);
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
                          name="year_range"
                          checked={isChecked}
                          onChange={() => {
                            setYearIndex(idx);
                            setCurrentPage(1);
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
                          name="body_type"
                          checked={isChecked}
                          onChange={() => {
                            setSelectedBody(bt.value);
                            setCurrentPage(1);
                          }}
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
                          name="transmission"
                          checked={isChecked}
                          onChange={() => {
                            setSelectedTransmission(t.value);
                            setCurrentPage(1);
                          }}
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
                          name="fuel_type"
                          checked={isChecked}
                          onChange={() => {
                            setSelectedFuel(f.value);
                            setCurrentPage(1);
                          }}
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
                          name="odo_range"
                          checked={isChecked}
                          onChange={() => {
                            setOdoIndex(idx);
                            setCurrentPage(1);
                          }}
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
            {showMobileFilter && (
              <button
                type="button"
                onClick={() => setShowMobileFilter(false)}
                className="w-full py-2.5 rounded-xl bg-primary text-white font-semibold text-xs border border-primary cursor-pointer mt-4"
              >
                Áp dụng bộ lọc
              </button>
            )}
          </div>
        </aside>

        {/* ============================================================== */}
        {/* LƯỚI XE BÊN PHẢI: 4 XE / 1 HÀNG - 8 HÀNG / TRANG (32 XE)       */}
        {/* ============================================================== */}
        <section className="flex-1 min-w-0 w-full space-y-6">
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
                      setCurrentPage(1);
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
                      setCurrentPage(1);
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
                      setCurrentPage(1);
                    }}
                    className="hover:text-red-600"
                  >
                    ×
                  </button>
                </span>
              )}
              {priceIndex !== 0 && (
                <span className="px-2.5 py-1 rounded-lg bg-surface-container-low text-xs font-medium text-primary flex items-center gap-1 border border-surface-container-high">
                  <span>Giá: {PRICE_RANGES[priceIndex].label}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setPriceIndex(0);
                      setCurrentPage(1);
                    }}
                    className="hover:text-red-600"
                  >
                    ×
                  </button>
                </span>
              )}
              {yearIndex !== 0 && (
                <span className="px-2.5 py-1 rounded-lg bg-surface-container-low text-xs font-medium text-primary flex items-center gap-1 border border-surface-container-high">
                  <span>Năm: {YEAR_RANGES[yearIndex].label}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setYearIndex(0);
                      setCurrentPage(1);
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
                      setCurrentPage(1);
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
                      setCurrentPage(1);
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
                      setCurrentPage(1);
                    }}
                    className="hover:text-red-600"
                  >
                    ×
                  </button>
                </span>
              )}
              {odoIndex !== 0 && (
                <span className="px-2.5 py-1 rounded-lg bg-surface-container-low text-xs font-medium text-primary flex items-center gap-1 border border-surface-container-high">
                  <span>ODO: {ODO_RANGES[odoIndex].label}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setOdoIndex(0);
                      setCurrentPage(1);
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

          {loading ? (
            <div className="py-24 text-center">
              <Loader2 className="w-8 h-8 text-[#b89b72] animate-spin mx-auto mb-3" />
              <p className="text-sm font-semibold text-[#444748]">Đang tải danh sách xe...</p>
            </div>
          ) : listings.length > 0 ? (
            <div className="space-y-10">
              {/* Lưới hiển thị danh sách xe cân đối với sidebar bên trái */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5 sm:gap-6">
                {listings.map((car) => (
                  <CarCard key={car.id} listing={car} />
                ))}
              </div>

              {/* Phân trang: Mỗi trang tối đa 8 hàng (32 xe) */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-[#eae8e3]">
                  <div className="text-xs text-outline">
                    Hiển thị{' '}
                    <span className="font-semibold text-primary">
                      {(currentPage - 1) * PAGE_SIZE + 1}
                    </span>{' '}
                    -{' '}
                    <span className="font-semibold text-primary">
                      {Math.min(currentPage * PAGE_SIZE, totalItems)}
                    </span>{' '}
                    trong tổng số{' '}
                    <span className="font-semibold text-primary">{totalItems}</span> xe
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Trang trước */}
                    <button
                      type="button"
                      disabled={currentPage <= 1}
                      onClick={() => handlePageChange(currentPage - 1)}
                      className="px-3 py-2 rounded-xl border border-surface-container-high text-xs font-semibold bg-white text-primary hover:bg-[#faf9f6] disabled:opacity-35 disabled:cursor-not-allowed transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span className="hidden sm:inline">Trang trước</span>
                    </button>

                    {/* Danh sách các số trang */}
                    {getPaginationItems(currentPage, totalPages).map((item, idx) => {
                      if (item === '...') {
                        return (
                          <span key={`dots-${idx}`} className="w-8 text-center text-outline text-xs select-none">
                            ...
                          </span>
                        );
                      }
                      const pageNum = Number(item);
                      const isCurrent = pageNum === currentPage;
                      return (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => handlePageChange(pageNum)}
                          className={`w-9 h-9 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isCurrent
                              ? 'bg-primary text-white shadow-xs'
                              : 'border border-[#eae8e3] bg-white text-primary hover:bg-[#faf9f6]'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    {/* Trang sau */}
                    <button
                      type="button"
                      disabled={currentPage >= totalPages}
                      onClick={() => handlePageChange(currentPage + 1)}
                      className="px-3 py-2 rounded-xl border border-surface-container-high text-xs font-semibold bg-white text-primary hover:bg-[#faf9f6] disabled:opacity-35 disabled:cursor-not-allowed transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <span className="hidden sm:inline">Trang sau</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-20 text-center bg-white rounded-2xl border border-[#eae8e3] p-8 space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-[#faf9f6] border border-[#eae8e3] flex items-center justify-center text-[#777777]">
                <Search className="w-8 h-8 text-[#b89b72]" />
              </div>
              <h3 className="text-base font-semibold text-[#1a1c1a] font-display">
                Không tìm thấy xe phù hợp
              </h3>
              <p className="text-xs text-[#777777] max-w-sm mx-auto">
                Hãy thử điều chỉnh lại bộ lọc giá hoặc chọn hãng xe khác để xem thêm kết quả.
              </p>
              <button
                onClick={resetFilters}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#191919] hover:bg-black cursor-pointer transition-colors"
              >
                Xóa toàn bộ bộ lọc
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default function XePage() {
  return (
    <div className="min-h-screen bg-[#faf9f6] flex flex-col font-sans text-[#1a1c1a]">
      <Navbar />
      <main className="flex-1 pt-28 sm:pt-32 pb-16">
        <Suspense fallback={<div className="py-20 text-center text-[#777777]">Đang tải dữ liệu...</div>}>
          <XeContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
