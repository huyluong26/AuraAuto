'use client';

import React from 'react';
import Link from 'next/link';
import { getHighResImageUrl } from '@/lib/image';
import { PromoteListingModal } from '@/features/cars';

function formatVND(amount: number): string {
  if (!amount) return '0 ₫';
  if (amount >= 1_000_000_000) {
    const b = amount / 1_000_000_000;
    return `${b.toLocaleString('vi-VN', { maximumFractionDigits: 2 })} tỷ`;
  }
  if (amount >= 1_000_000) {
    const m = amount / 1_000_000;
    return `${m.toLocaleString('vi-VN', { maximumFractionDigits: 0 })} triệu`;
  }
  return `${amount.toLocaleString('vi-VN')} ₫`;
}

interface UserListingsTabProps {
  listings: any[];
  loadingListings: boolean;
  listingFilter: 'ALL' | 'PUBLISHED' | 'PENDING_REVIEW' | 'SOLD';
  setListingFilter: (val: 'ALL' | 'PUBLISHED' | 'PENDING_REVIEW' | 'SOLD') => void;
  listingActionId: string | null;
  selectedPromoteListing: any | null;
  setSelectedPromoteListing: (val: any | null) => void;
  handleMarkSold: (listingId: string) => Promise<void>;
  handleSubmitReview: (listingId: string) => Promise<void>;
  loadListings: () => Promise<void>;
}

export const UserListingsTab: React.FC<UserListingsTabProps> = ({
  listings,
  loadingListings,
  listingFilter,
  setListingFilter,
  listingActionId,
  selectedPromoteListing,
  setSelectedPromoteListing,
  handleMarkSold,
  handleSubmitReview,
  loadListings,
}) => {
  const filteredListings = listings.filter((l) => {
    if (listingFilter === 'ALL') return true;
    return l.status === listingFilter;
  });

  return (
    <div className="space-y-6">
      {/* Filter pills & Header */}
      <div className="bg-surface-container-lowest rounded-2xl p-6 border border-surface-container-high/80 shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-primary font-headline-sm">Quản lý tin đăng bán xe</h2>
          <p className="text-body-sm text-on-surface-variant mt-0.5">
            Theo dõi trạng thái duyệt tin, đánh dấu đã bán và cập nhật thông tin xe của bạn.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/quan-ly-tin"
            className="px-4 py-2 rounded-xl bg-primary text-on-primary font-bold text-xs hover:bg-inverse-surface transition-all flex items-center gap-1.5 shadow-xs"
          >
            <span className="material-symbols-outlined text-[16px]">open_in_new</span>
            <span>Mở Dashboard Quản lý tin đầy đủ</span>
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setListingFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              listingFilter === 'ALL'
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container-low text-on-surface-variant hover:text-primary'
            }`}
          >
            Tất cả ({listings.length})
          </button>
          <button
            type="button"
            onClick={() => setListingFilter('PUBLISHED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              listingFilter === 'PUBLISHED'
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container-low text-on-surface-variant hover:text-primary'
            }`}
          >
            Đang hiển thị ({listings.filter((l) => l.status === 'PUBLISHED').length})
          </button>
          <button
            type="button"
            onClick={() => setListingFilter('PENDING_REVIEW')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              listingFilter === 'PENDING_REVIEW'
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container-low text-on-surface-variant hover:text-primary'
            }`}
          >
            Chờ duyệt ({listings.filter((l) => l.status === 'PENDING_REVIEW').length})
          </button>
          <button
            type="button"
            onClick={() => setListingFilter('SOLD')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              listingFilter === 'SOLD'
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container-low text-on-surface-variant hover:text-primary'
            }`}
          >
            Đã bán ({listings.filter((l) => l.status === 'SOLD').length})
          </button>
        </div>
      </div>

      {/* Listings Grid */}
      {loadingListings ? (
        <div className="bg-surface-container-lowest rounded-2xl p-12 border border-surface-container-high text-center">
          <span className="material-symbols-outlined text-[32px] animate-spin text-secondary">
            progress_activity
          </span>
          <p className="text-sm text-on-surface-variant mt-2">Đang tải danh sách tin đăng...</p>
        </div>
      ) : filteredListings.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-2xl p-12 border border-surface-container-high text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-surface-container-high text-outline mx-auto flex items-center justify-center">
            <span className="material-symbols-outlined text-[32px]">directions_car</span>
          </div>
          <h3 className="text-base font-bold text-primary">Không có tin đăng nào</h3>
          <p className="text-sm text-on-surface-variant max-w-md mx-auto">
            {listingFilter === 'ALL'
              ? 'Bạn chưa đăng bán chiếc xe nào trên sàn AuraAuto. Hãy đăng tin đầu tiên để tiếp cận người mua!'
              : `Không có tin đăng nào thuộc trạng thái đã chọn.`}
          </p>
          <Link
            href="/dang-tin"
            className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-primary text-on-primary font-semibold text-sm hover:bg-inverse-surface transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>Đăng tin bán xe ngay</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredListings.map((item) => {
            const rawImg =
              item.primary_image_url ||
              'https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=800&q=80';
            const imgUrl = getHighResImageUrl(rawImg, 800, 85);
            const isActing = listingActionId === item.id;

            return (
              <div
                key={item.id}
                className="bg-surface-container-lowest rounded-2xl border border-surface-container-high overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="flex gap-4 p-4">
                  {/* Image */}
                  <div className="w-32 h-24 sm:w-40 sm:h-28 rounded-xl overflow-hidden bg-surface-container-high shrink-0 relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imgUrl}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {item.is_featured && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-secondary-container text-on-secondary-container border border-secondary/20 flex items-center gap-1 shadow-2xs">
                          <span className="material-symbols-outlined text-[13px] text-secondary">rocket_launch</span>
                          <span>Tin Nổi Bật</span>
                        </span>
                      )}
                      {item.status === 'PUBLISHED' && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-surface-container-high text-primary border border-outline-variant/60 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px] text-primary">check_circle</span>
                          <span>Đang hiển thị</span>
                        </span>
                      )}
                      {item.status === 'PENDING_REVIEW' && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-surface-container text-on-surface-variant border border-outline-variant/40 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px] text-on-surface-variant">schedule</span>
                          <span>Chờ duyệt</span>
                        </span>
                      )}
                      {item.status === 'SOLD' && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-surface-container-low text-outline border border-surface-container-high flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px] text-outline">task_alt</span>
                          <span>Đã bán</span>
                        </span>
                      )}
                      {item.status === 'DRAFT' && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-surface-container-high text-on-surface-variant border border-outline-variant/40 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px]">draft</span>
                          <span>Bản nháp</span>
                        </span>
                      )}
                      {item.status === 'REJECTED' && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-error-container text-on-error-container border border-error/20 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px] text-error">cancel</span>
                          <span>Từ chối duyệt</span>
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-primary text-sm sm:text-base truncate" title={item.title}>
                      {item.title}
                    </h3>

                    <p className="text-secondary font-bold text-base mt-1">
                      {formatVND(item.price_vnd)}
                    </p>

                    <div className="flex items-center gap-3 text-xs text-on-surface-variant mt-1.5">
                      <span>Năm {item.manufacture_year}</span>
                      <span>•</span>
                      <span>{(item.odometer_km || 0).toLocaleString('vi-VN')} km</span>
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="px-4 py-3 bg-surface-container-low/60 border-t border-surface-container-high flex items-center justify-between gap-2">
                  <Link
                    href={`/xe/${item.id}`}
                    className="text-xs font-semibold text-primary hover:text-secondary transition-colors flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">visibility</span>
                    <span>Xem tin đăng</span>
                  </Link>

                  <div className="flex items-center gap-2">
                    {item.status === 'PUBLISHED' && (
                      <>
                        <button
                          type="button"
                          onClick={() => setSelectedPromoteListing(item)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-secondary hover:bg-on-secondary-fixed text-on-secondary shadow-xs transition-all cursor-pointer flex items-center gap-1"
                          title="Đưa bài đăng xe lên vị trí nổi bật trang chủ"
                        >
                          <span className="material-symbols-outlined text-[15px]">campaign</span>
                          <span>{item.is_featured ? 'Gia hạn nổi bật' : 'Đưa lên nổi bật'}</span>
                        </button>
                        <button
                          type="button"
                          disabled={isActing}
                          onClick={() => handleMarkSold(item.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-surface-container-high text-primary hover:bg-surface-container-highest transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {isActing ? 'Đang xử lý...' : 'Đánh dấu đã bán'}
                        </button>
                      </>
                    )}
                    {(item.status === 'DRAFT' || item.status === 'REJECTED') && (
                      <button
                        type="button"
                        disabled={isActing}
                        onClick={() => handleSubmitReview(item.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-on-primary hover:bg-inverse-surface transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {isActing ? 'Đang gửi...' : 'Gửi duyệt lại'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Promote Featured Listing Modal */}
      {selectedPromoteListing && (
        <PromoteListingModal
          isOpen={!!selectedPromoteListing}
          onClose={() => setSelectedPromoteListing(null)}
          listingId={selectedPromoteListing.id}
          listingTitle={selectedPromoteListing.title}
          listingImageUrl={selectedPromoteListing.primary_image_url}
          listingPriceVnd={selectedPromoteListing.price_vnd}
          manufactureYear={selectedPromoteListing.manufacture_year}
          currentFeaturedUntil={selectedPromoteListing.featured_until}
          onSuccess={() => {
            setSelectedPromoteListing(null);
            loadListings();
          }}
        />
      )}
    </div>
  );
};
