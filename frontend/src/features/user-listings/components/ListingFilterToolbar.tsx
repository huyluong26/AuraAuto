'use client';

import React from 'react';
import { SortByOption } from '../types';

interface ListingFilterToolbarProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  sortBy: SortByOption;
  onSortChange: (val: SortByOption) => void;
  pageSize: number;
  onPageSizeChange: (val: number) => void;
  selectedCount: number;
  totalListingsCount: number;
  onBulkToggleHide: () => void;
  onClearSelection: () => void;
}

export const ListingFilterToolbar: React.FC<ListingFilterToolbarProps> = ({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  pageSize,
  onPageSizeChange,
  selectedCount,
  totalListingsCount,
  onBulkToggleHide,
  onClearSelection,
}) => {
  return (
    <>
      <div className="p-3.5 sm:p-4 border-b border-[#e8e6e1] bg-white flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Box */}
        <div className="relative flex-1 max-w-sm">
          <span className="material-symbols-outlined text-[18px] text-[#9ca3af] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm theo tên xe, phiên bản, ODO..."
            className="w-full pl-9 pr-8 py-2 rounded-lg bg-white border border-[#e5e5e0] text-xs sm:text-sm text-[#111827] placeholder:text-[#9ca3af] focus:outline-none focus:border-[#8c6d3b] focus:ring-1 focus:ring-[#8c6d3b]/30 transition-all shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#111827] cursor-pointer flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </div>

        {/* Sort & PageSize Controls */}
        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as SortByOption)}
            className="px-3 py-2 rounded-lg bg-white border border-[#e5e5e0] text-xs text-[#374151] font-medium focus:outline-none focus:border-[#8c6d3b] transition-all cursor-pointer shadow-2xs"
          >
            <option value="newest">Sắp xếp: Mới nhất</option>
            <option value="oldest">Sắp xếp: Cũ nhất</option>
            <option value="price_desc">Giá: Cao đến thấp</option>
            <option value="price_asc">Giá: Thấp đến cao</option>
            <option value="views_desc">Lượt xem nhiều nhất</option>
          </select>

          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="px-2.5 py-2 rounded-lg bg-white border border-[#e5e5e0] text-xs text-[#374151] font-medium focus:outline-none focus:border-[#8c6d3b] transition-all cursor-pointer shadow-2xs"
          >
            <option value={10}>10 tin/trang</option>
            <option value={20}>20 tin/trang</option>
            <option value={50}>50 tin/trang</option>
          </select>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedCount > 0 && (
        <div className="px-4 py-2.5 bg-neutral-50 border-b border-[#e8e6e1] flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2 text-xs font-medium text-[#111827]">
            <span className="material-symbols-outlined text-[17px] text-[#8c6d3b]">check_circle</span>
            <span>
              Đã chọn <strong>{selectedCount}</strong> / {totalListingsCount} tin trên trang này
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onBulkToggleHide}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white hover:bg-neutral-100 text-[#374151] border border-[#d1d5db] transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
            >
              <span className="material-symbols-outlined text-[15px]">visibility_off</span>
              <span>Tạm ẩn các tin đã chọn</span>
            </button>
            <button
              type="button"
              onClick={onClearSelection}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#6b7280] hover:text-[#111827] transition-colors cursor-pointer"
            >
              Bỏ chọn
            </button>
          </div>
        </div>
      )}
    </>
  );
};
