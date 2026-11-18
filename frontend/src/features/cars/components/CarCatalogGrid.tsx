'use client';

import React from 'react';
import { Loader2, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { ListingItem } from '@/types';
import { CarCard } from './CarCard';
import { PAGE_SIZE, getPaginationItems } from '../constants/catalog';

interface CarCatalogGridProps {
  listings: ListingItem[];
  loading: boolean;
  totalItems: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  resetFilters: () => void;
}

export const CarCatalogGrid: React.FC<CarCatalogGridProps> = ({
  listings,
  loading,
  totalItems,
  currentPage,
  totalPages,
  onPageChange,
  resetFilters,
}) => {
  if (loading) {
    return (
      <div className="py-24 text-center">
        <Loader2 className="w-8 h-8 text-[#b89b72] animate-spin mx-auto mb-3" />
        <p className="text-sm font-semibold text-[#444748]">Đang tải danh sách xe...</p>
      </div>
    );
  }

  if (listings.length === 0) {
    return (
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
    );
  }

  return (
    <div className="space-y-10">
      {/* 4 CARS PER ROW GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5 sm:gap-6">
        {listings.map((car) => (
          <CarCard key={car.id} listing={car} />
        ))}
      </div>

      {/* Pagination Footer */}
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
            trong tổng số <span className="font-semibold text-primary">{totalItems}</span> xe
          </div>

          <div className="flex items-center gap-1.5">
            {/* Previous page */}
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => onPageChange(currentPage - 1)}
              className="px-3 py-2 rounded-xl border border-surface-container-high text-xs font-semibold bg-white text-primary hover:bg-[#faf9f6] disabled:opacity-35 disabled:cursor-not-allowed transition-all flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Trang trước</span>
            </button>

            {/* Page numbers */}
            {getPaginationItems(currentPage, totalPages).map((item, idx) => {
              if (item === '...') {
                return (
                  <span
                    key={`dots-${idx}`}
                    className="w-8 text-center text-outline text-xs select-none"
                  >
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
                  onClick={() => onPageChange(pageNum)}
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

            {/* Next page */}
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => onPageChange(currentPage + 1)}
              className="px-3 py-2 rounded-xl border border-surface-container-high text-xs font-semibold bg-white text-primary hover:bg-[#faf9f6] disabled:opacity-35 disabled:cursor-not-allowed transition-all flex items-center gap-1 cursor-pointer"
            >
              <span className="hidden sm:inline">Trang sau</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
