'use client';

import React from 'react';
import CarCard from '@/features/cars/components/CarCard';
import { PublicSellerProfile, ListingItem } from '@/types';

interface SellerListingsSectionProps {
  profile: PublicSellerProfile;
  isShowroom: boolean;
  filteredListings: ListingItem[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  sortBy: 'newest' | 'price_asc' | 'price_desc';
  onSortChange: (value: 'newest' | 'price_asc' | 'price_desc') => void;
}

export function SellerListingsSection({
  profile,
  isShowroom,
  filteredListings,
  searchTerm,
  onSearchChange,
  sortBy,
  onSortChange,
}: SellerListingsSectionProps) {
  return (
    <>
      {/* KPI Metrics Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-xl bg-surface-container-lowest border border-surface-container-high shadow-2xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]">directions_car</span>
            </div>
            <div>
              <span className="text-xs text-on-surface-variant font-medium block">Xe đang bán</span>
              <strong className="text-lg sm:text-xl font-bold text-primary font-display">
                {profile.active_listings_count}
              </strong>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-surface-container-lowest border border-surface-container-high shadow-2xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]">task_alt</span>
            </div>
            <div>
              <span className="text-xs text-on-surface-variant font-medium block">Xe đã bán</span>
              <strong className="text-lg sm:text-xl font-bold text-primary font-display">
                {profile.sold_listings_count}
              </strong>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-surface-container-lowest border border-surface-container-high shadow-2xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                star
              </span>
            </div>
            <div>
              <span className="text-xs text-on-surface-variant font-medium block">Đánh giá uy tín</span>
              <strong className="text-lg sm:text-xl font-bold text-primary font-display">
                {profile.rating_avg.toFixed(1)} / 5.0
              </strong>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-surface-container-lowest border border-surface-container-high shadow-2xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]">verified_user</span>
            </div>
            <div>
              <span className="text-xs text-on-surface-variant font-medium block">Tiêu chuẩn kiểm định</span>
              <strong className="text-xs sm:text-sm font-bold text-primary block mt-0.5">
                {isShowroom ? '100% Cam kết kiểm tra' : 'Chính chủ xác minh'}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Showroom Commitments Banner (Only for Showroom) */}
      {isShowroom && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div className="p-5 rounded-2xl bg-[#b89b72]/10 border border-[#b89b72]/30 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-secondary text-[22px] shrink-0 mt-0.5">
                verified
              </span>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-primary">Cam kết pháp lý &amp; Sang tên</h4>
                <p className="text-[11px] text-on-surface-variant mt-0.5">
                  Giấy tờ gốc hợp lệ, hỗ trợ rút hồ sơ và công chứng sang tên nhanh chóng.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-secondary text-[22px] shrink-0 mt-0.5">
                build_circle
              </span>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-primary">Bảo hành kỹ thuật Showroom</h4>
                <p className="text-[11px] text-on-surface-variant mt-0.5">
                  Cam kết xe không đâm đụng ảnh hưởng khung gầm, không ngập nước thủy kích.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-secondary text-[22px] shrink-0 mt-0.5">
                payments
              </span>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-primary">Hỗ trợ trả góp &amp; Lái thử</h4>
                <p className="text-[11px] text-on-surface-variant mt-0.5">
                  Hỗ trợ vay ngân hàng đến 70% giá trị xe, thủ tục duyệt hồ sơ linh hoạt.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Listings Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Section Header & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-surface-container-high/60">
          <div>
            <h2 className="font-headline-md text-lg sm:text-xl font-bold text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[22px]">
                {isShowroom ? 'garage' : 'directions_car'}
              </span>
              <span>
                {isShowroom
                  ? `Kho xe đang bán tại Showroom (${filteredListings.length})`
                  : `Danh sách xe đang bán (${filteredListings.length})`}
              </span>
            </h2>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Các dòng xe đang được mở bán công khai và sẵn sàng bàn giao ngay.
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative min-w-[220px]">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
                search
              </span>
              <input
                type="text"
                placeholder="Tìm dòng xe..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-container-lowest border border-surface-container-high text-xs text-primary placeholder:text-outline focus:border-primary outline-none transition-all"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-outline hover:text-primary text-xs"
                >
                  ×
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e: any) => onSortChange(e.target.value)}
              className="px-3 py-2 rounded-xl bg-surface-container-lowest border border-surface-container-high text-xs text-primary font-medium focus:border-primary outline-none transition-all cursor-pointer"
            >
              <option value="newest">Mới đăng nhất</option>
              <option value="price_asc">Giá: Thấp đến cao</option>
              <option value="price_desc">Giá: Cao đến thấp</option>
            </select>
          </div>
        </div>

        {/* Listings Grid */}
        {filteredListings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-6">
            {filteredListings.map((listing: ListingItem) => (
              <CarCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 px-4 bg-surface-container-lowest rounded-2xl border border-surface-container-high/60 my-6">
            <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center mx-auto text-outline mb-3">
              <span className="material-symbols-outlined text-[28px]">search_off</span>
            </div>
            <h3 className="text-base font-bold text-primary">Không tìm thấy xe phù hợp</h3>
            <p className="text-xs text-on-surface-variant mt-1 max-w-sm mx-auto">
              {searchTerm
                ? `Không có xe nào khớp với từ khóa "${searchTerm}". Bạn hãy thử tìm với từ khóa khác.`
                : 'Hiện tại người bán chưa có thêm xe nào đang mở bán.'}
            </p>
            {searchTerm && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="mt-4 px-4 py-2 rounded-xl bg-surface-container text-primary text-xs font-semibold hover:bg-surface-container-high transition-colors"
              >
                Xóa bộ lọc tìm kiếm
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}

