'use client';

import React from 'react';
import Link from 'next/link';

interface ListingSuccessModalProps {
  listingId: string | null;
  status?: string | null;
  onReset: () => void;
}

export function ListingSuccessModal({ listingId, status, onReset }: ListingSuccessModalProps) {
  const isPublished = status === 'PUBLISHED';

  return (
    <div className="bg-surface-container-lowest rounded-2xl p-8 sm:p-14 text-center border border-outline-variant/30 shadow-[0_20px_50px_rgba(0,0,0,0.06)] space-y-6 max-w-2xl mx-auto animate-in zoom-in-95 duration-200">
      <div className={`w-16 h-16 mx-auto rounded-2xl border flex items-center justify-center shadow-inner ${
        isPublished
          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600'
          : 'bg-secondary-container/50 border border-secondary/30 text-secondary'
      }`}>
        <span className="material-symbols-outlined text-[36px]">
          {isPublished ? 'verified' : 'check_circle'}
        </span>
      </div>

      <div className="space-y-2">
        <h2 className="font-headline-md text-headline-md font-bold text-primary">
          {isPublished ? 'Xuất Bản Tin Đăng Xe Thành Công!' : 'Gửi Duyệt Tin Đăng Thành Công!'}
        </h2>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-md mx-auto leading-relaxed">
          {isPublished
            ? 'Tin đăng xe của bạn đã được hệ thống phê duyệt tự động và xuất bản trực tiếp lên AuraAuto. Khách hàng trên toàn quốc hiện đã có thể tìm kiếm, xem chi tiết và liên hệ ngay.'
            : 'Hồ sơ xe đã được chuyển tới ban thẩm định AuraAuto theo quy trình chuẩn hóa SCR-12. Sau khi đối soát tính xác thực ODO và giấy tờ, tin đăng sẽ hiển thị công khai trên hệ thống.'}
        </p>
        {listingId && (
          <p className="font-label-sm text-label-sm text-on-surface-variant font-mono bg-surface-container-low py-1 px-3 rounded-lg inline-block mt-2">
            Mã định danh tin: {listingId}
          </p>
        )}
      </div>

      <div className="pt-4 flex flex-col sm:flex-row justify-center items-center gap-3">
        {isPublished && listingId ? (
          <Link
            href={`/xe/${listingId}`}
            className="w-full sm:w-auto px-6 h-12 rounded-xl font-label-lg text-label-lg font-semibold bg-primary text-on-primary hover:bg-primary-container transition-all flex items-center justify-center shadow-md gap-2"
          >
            <span className="material-symbols-outlined text-xl">visibility</span>
            Xem tin vừa đăng
          </Link>
        ) : (
          <Link
            href="/quan-ly-tin"
            className="w-full sm:w-auto px-6 h-12 rounded-xl font-label-lg text-label-lg font-semibold bg-primary text-on-primary hover:bg-primary-container transition-all flex items-center justify-center shadow-md gap-2"
          >
            <span className="material-symbols-outlined text-xl">inventory_2</span>
            Quản lý tin đăng
          </Link>
        )}

        <Link
          href="/quan-ly-tin"
          className="w-full sm:w-auto px-6 h-12 rounded-xl font-label-lg text-label-lg font-semibold bg-surface-container-low text-primary hover:bg-surface-container transition-all flex items-center justify-center"
        >
          Trang quản lý tin
        </Link>

        <button
          type="button"
          onClick={onReset}
          className="w-full sm:w-auto px-6 h-12 rounded-xl font-label-lg text-label-lg font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-all flex items-center justify-center cursor-pointer"
        >
          Đăng thêm tin khác
        </button>
      </div>
    </div>
  );
}
