'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Navbar, Footer } from '@/components/layout';
import { formatVND } from '@/lib/api';

function PaymentResultContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get('status') || 'failed';
  const isSuccess = status === 'success';
  const orderCode = searchParams.get('order_code') || '';
  const amount = parseInt(searchParams.get('amount') || '0', 10);
  const message = searchParams.get('message') || '';
  const listingId = searchParams.get('listing_id') || '';
  const days = parseInt(searchParams.get('days') || '0', 10);
  const bankCode = searchParams.get('vnp_bank_code') || '';
  const transactionNo = searchParams.get('vnp_transaction_no') || '';

  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6">
      <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/30 shadow-xl overflow-hidden p-6 sm:p-10 text-center">
        {/* Biểu tượng trạng thái */}
        {isSuccess ? (
          <div className="w-20 h-20 mx-auto rounded-3xl bg-secondary-container text-secondary flex items-center justify-center mb-6 shadow-md border border-secondary/20">
            <span className="material-symbols-outlined text-[44px]">check_circle</span>
          </div>
        ) : (
          <div className="w-20 h-20 mx-auto rounded-3xl bg-error-container text-on-error-container flex items-center justify-center mb-6 shadow-md border border-error/20">
            <span className="material-symbols-outlined text-[44px]">cancel</span>
          </div>
        )}

        {/* Tiêu đề */}
        <h1 className="text-2xl sm:text-3xl font-bold font-headline text-primary mb-2">
          {isSuccess ? 'Thanh Toán Thành Công!' : 'Giao Dịch Chưa Hoàn Tất'}
        </h1>
        <p className="text-sm text-on-surface-variant max-w-lg mx-auto leading-relaxed">
          {isSuccess
            ? 'Cảm ơn bạn! Vị trí Tin Nổi Bật cho xe của bạn đã được kích hoạt thành công trên hệ thống AuraAuto.'
            : message || 'Giao dịch thanh toán qua cổng VNPay đã bị hủy hoặc không thành công.'}
        </p>

        {/* Thẻ chi tiết giao dịch */}
        <div className="mt-8 p-5 sm:p-6 rounded-2xl bg-surface-container-low/60 border border-outline-variant/20 text-left space-y-3.5">
          <div className="flex items-center justify-between text-xs sm:text-sm border-b border-outline-variant/15 pb-2.5">
            <span className="text-on-surface-variant">Mã đơn hàng:</span>
            <span className="font-mono font-bold text-primary">{orderCode || 'Không xác định'}</span>
          </div>

          {amount > 0 && (
            <div className="flex items-center justify-between text-xs sm:text-sm border-b border-outline-variant/15 pb-2.5">
              <span className="text-on-surface-variant">Số tiền thanh toán:</span>
              <span className="font-extrabold text-secondary text-base sm:text-lg">
                {formatVND(amount)}
              </span>
            </div>
          )}

          {isSuccess && days > 0 && (
            <div className="flex items-center justify-between text-xs sm:text-sm border-b border-outline-variant/15 pb-2.5">
              <span className="text-on-surface-variant">Thời gian duy trì vị trí nổi bật:</span>
              <span className="font-bold text-secondary flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">schedule</span>
                <span>{days} ngày trên hệ thống</span>
              </span>
            </div>
          )}

          <div className="flex items-center justify-between text-xs sm:text-sm border-b border-outline-variant/15 pb-2.5">
            <span className="text-on-surface-variant">Cổng thanh toán:</span>
            <span className="font-semibold text-primary">
              VNPay Sandbox {bankCode ? `(${bankCode})` : ''}
            </span>
          </div>

          {transactionNo && (
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-on-surface-variant">Mã giao dịch VNPay:</span>
              <span className="font-mono text-on-surface-variant">{transactionNo}</span>
            </div>
          )}
        </div>

        {/* Thông báo đặc quyền nếu thành công */}
        {isSuccess && (
          <div className="mt-6 p-4 rounded-2xl bg-secondary-container/40 border border-secondary/25 text-xs text-on-surface flex items-center gap-3 text-left">
            <div className="w-8 h-8 rounded-xl bg-secondary-container text-secondary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[18px]">trending_up</span>
            </div>
            <div>
              <p className="font-bold text-primary">Tin đăng đã được ưu tiên hiển thị</p>
              <p className="text-[11px] text-on-surface-variant mt-0.5 leading-relaxed">
                Phương tiện của bạn hiện được ưu tiên xếp tại chuyên mục <strong>Tin Nổi Bật</strong> trang chủ và top kết quả tìm kiếm, tối ưu tỷ lệ tiếp cận khách mua tiềm năng.
              </p>
            </div>
          </div>
        )}

        {/* Điều hướng hành động */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          {isSuccess ? (
            <>
              <Link
                href="/"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-primary text-on-primary font-bold text-sm hover:bg-primary-container transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">home</span>
                <span>Về Trang chủ xem tin</span>
              </Link>

              {listingId && (
                <Link
                  href={`/xe/${listingId}`}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-secondary text-on-secondary font-bold text-sm hover:bg-on-secondary-fixed transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">hotel_class</span>
                  <span>Xem xe của bạn</span>
                </Link>
              )}

              <Link
                href="/quan-ly-tin"
                className="w-full sm:w-auto px-6 py-3 rounded-xl border border-outline-variant text-primary font-semibold text-sm hover:bg-surface-container transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">directions_car</span>
                <span>Quản lý tin đăng</span>
              </Link>
            </>
          ) : (
            <>
              {listingId ? (
                <Link
                  href={`/xe/${listingId}`}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-secondary text-on-secondary font-bold text-sm hover:bg-on-secondary-fixed transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">replay</span>
                  <span>Thử lại thanh toán</span>
                </Link>
              ) : null}

              <Link
                href="/"
                className="w-full sm:w-auto px-6 py-3 rounded-xl border border-outline-variant text-primary font-semibold text-sm hover:bg-surface-container transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">home</span>
                <span>Về Trang chủ</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PaymentResultPage() {
  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Navbar />
      <main className="flex-1 pt-28 pb-20 flex items-center justify-center">
        <Suspense
          fallback={
            <div className="py-20 text-center text-on-surface-variant text-sm">
              Đang tải kết quả giao dịch...
            </div>
          }
        >
          <PaymentResultContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
