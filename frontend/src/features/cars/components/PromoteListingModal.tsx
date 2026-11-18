'use client';

import React, { useState, useEffect } from 'react';
import { api, formatVND } from '@/lib/api';
import { getHighResImageUrl } from '@/lib/image';

interface PromotionPackage {
  code: string;
  name: string;
  days: number;
  amount_vnd: number;
  description: string;
  badge?: string;
}

interface PromoteListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  listingId: string;
  listingTitle: string;
  listingImageUrl?: string | null;
  listingPriceVnd?: number | null;
  manufactureYear?: number | null;
  currentFeaturedUntil?: string | null;
  onSuccess?: () => void;
}

const DEFAULT_PACKAGES: PromotionPackage[] = [
  {
    code: 'PROMO_1_DAY',
    name: 'Gói Nổi Bật 1 Ngày',
    days: 1,
    amount_vnd: 49000,
    description: 'Hiển thị ưu tiên tại chuyên mục Tin Nổi Bật trang chủ trong 24 giờ.',
    badge: '24 Giờ',
  },
  {
    code: 'PROMO_3_DAYS',
    name: 'Gói Nổi Bật 3 Ngày',
    days: 3,
    amount_vnd: 129000,
    description: 'Tăng cường tần suất hiển thị vào các ngày cao điểm tìm kiếm xe.',
    badge: '3 Ngày',
  },
  {
    code: 'PROMO_7_DAYS',
    name: 'Gói Nổi Bật 7 Ngày',
    days: 7,
    amount_vnd: 249000,
    description: 'Duy trì vị trí ưu tiên suốt 1 tuần, tối ưu tỷ lệ tiếp cận người mua thực tế.',
    badge: 'Phổ biến nhất',
  },
  {
    code: 'PROMO_30_DAYS',
    name: 'Gói Nổi Bật 30 Ngày',
    days: 30,
    amount_vnd: 799000,
    description: 'Giải pháp hiển thị liên tục 1 tháng với chi phí trên mỗi ngày tối ưu nhất.',
    badge: 'Tiết kiệm nhất',
  },
];

export default function PromoteListingModal({
  isOpen,
  onClose,
  listingId,
  listingTitle,
  listingImageUrl,
  listingPriceVnd,
  manufactureYear,
  currentFeaturedUntil,
}: PromoteListingModalProps) {
  const [packages, setPackages] = useState<PromotionPackage[]>(DEFAULT_PACKAGES);
  const [selectedCode, setSelectedCode] = useState<string>('PROMO_7_DAYS');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    api.getPromotionPackages()
      .then((data) => {
        if (isMounted && data && data.length > 0) setPackages(data);
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    setError(null);
    onClose();
  };

  const selectedPackage = packages.find((p) => p.code === selectedCode) || packages[0];

  const handlePayment = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await api.createPromotionPayment({
        listing_id: listingId,
        package_code: selectedPackage.code,
      });

      if (res?.payment_url) {
        // Chuyển hướng trực tiếp sang cổng thanh toán VNPay Sandbox
        window.location.href = res.payment_url;
      } else {
        throw new Error('Không nhận được liên kết thanh toán từ máy chủ.');
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Không thể tạo đơn hàng thanh toán. Vui lòng thử lại.';
      setError(errMsg);
      setLoading(false);
    }
  };

  const previewImg = listingImageUrl
    ? getHighResImageUrl(listingImageUrl, 400, 80)
    : 'https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=400&q=80';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-surface-container-lowest rounded-3xl shadow-2xl border border-surface-container-high overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Modal - Clean, Executive Styling */}
        <div className="p-5 sm:p-6 bg-surface-container-lowest border-b border-surface-container-high flex items-start justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-widest text-secondary block">
              Dịch vụ quảng bá tin đăng
            </span>
            <h3 className="text-xl sm:text-2xl font-bold font-headline text-primary tracking-tight">
              Đăng Ký Tin Xe Nổi Bật
            </h3>
            <p className="text-xs text-on-surface-variant leading-relaxed max-w-lg">
              Đưa bài đăng xe lên vị trí ưu tiên tại Trang chủ và đầu trang Tìm kiếm, tối ưu khả năng tiếp cận người mua thiện chí.
            </p>
          </div>
          <button
            onClick={handleClose}
            className="w-9 h-9 rounded-full hover:bg-surface-container text-on-surface-variant hover:text-primary flex items-center justify-center transition-colors cursor-pointer shrink-0"
            aria-label="Đóng cửa sổ"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Thông tin xe đang áp dụng (Vehicle Card with Thumbnail) */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-surface-container-low border border-surface-container-high flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-16 h-12 rounded-xl overflow-hidden bg-surface-container shrink-0 border border-surface-container-high">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewImg}
                  alt={listingTitle}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider block">
                  Xe đang áp dụng:
                </span>
                <h4 className="font-bold text-primary truncate text-sm line-clamp-1" title={listingTitle}>
                  {listingTitle}
                </h4>
                <div className="flex items-center gap-2 text-[11px] text-on-surface-variant mt-0.5">
                  {listingPriceVnd ? (
                    <span className="font-bold text-secondary">
                      {formatVND(listingPriceVnd)}
                    </span>
                  ) : null}
                  {manufactureYear ? (
                    <>
                      <span>•</span>
                      <span>Năm {manufactureYear}</span>
                    </>
                  ) : null}
                </div>
              </div>
            </div>

            {currentFeaturedUntil && new Date(currentFeaturedUntil) > new Date() ? (
              <span className="px-3 py-1.5 rounded-xl bg-secondary-container text-on-secondary-container font-semibold text-[11px] shrink-0 flex items-center gap-1.5 border border-secondary/25">
                <span className="material-symbols-outlined text-[15px] text-secondary">schedule</span>
                <span>Nổi bật đến {new Date(currentFeaturedUntil).toLocaleDateString('vi-VN')}</span>
              </span>
            ) : (
              <span className="px-3 py-1.5 rounded-xl bg-surface-container text-on-surface-variant font-medium text-[11px] shrink-0 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px]">info</span>
                <span>Chưa kích hoạt nổi bật</span>
              </span>
            )}
          </div>

          {/* Danh sách các gói hiển thị nổi bật */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs font-bold text-primary uppercase tracking-wider">
                Chọn thời gian duy trì vị trí nổi bật:
              </label>
              <span className="text-[11px] text-on-surface-variant">
                Tự động cộng dồn nếu tin còn hạn
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {packages.map((pkg) => {
                const isSelected = pkg.code === selectedCode;
                const dailyRate = Math.round(pkg.amount_vnd / pkg.days / 1000) * 1000;

                return (
                  <div
                    key={pkg.code}
                    onClick={() => setSelectedCode(pkg.code)}
                    className={`relative p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                      isSelected
                        ? 'border-[#8c6d3b] bg-[#faf8f4] shadow-xs ring-1 ring-[#8c6d3b]/40'
                        : 'border-[#e8e6e1] hover:border-[#b89b72]/60 bg-white'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-[#111827]">{pkg.name}</span>
                          {pkg.badge && (
                            <span className="px-2 py-0.5 rounded-full bg-[#1c1a17] text-[#e5c78a] border border-[#8c6d3b]/40 text-[9px] font-bold uppercase tracking-wider">
                              {pkg.badge}
                            </span>
                          )}
                        </div>
                        <span
                          className={`material-symbols-outlined text-[20px] shrink-0 ${
                            isSelected ? 'text-[#8c6d3b] font-bold' : 'text-[#d1d5db]'
                          }`}
                        >
                          {isSelected ? 'radio_button_checked' : 'radio_button_unchecked'}
                        </span>
                      </div>
                      <p className="text-xs text-[#6b7280] leading-relaxed">
                        {pkg.description}
                      </p>
                    </div>

                    <div className="pt-2.5 border-t border-[#f0ede6] flex items-baseline justify-between">
                      <span className="text-[11px] text-[#6b7280]">
                        Chi phí trọn gói:
                      </span>
                      <div className="text-right">
                        <span className="text-base font-extrabold text-[#111827] block font-headline">
                          {formatVND(pkg.amount_vnd)}
                        </span>
                        {pkg.days > 1 && (
                          <span className="text-[10px] text-[#8c6d3b] block font-medium">
                            ~ {dailyRate.toLocaleString('vi-VN')} ₫ / ngày
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Đặc quyền hiển thị ưu tiên */}
          <div className="p-4 rounded-2xl bg-surface-container-low/60 border border-surface-container-high space-y-2.5">
            <span className="text-xs font-bold text-primary block uppercase tracking-wider">
              Đặc quyền khi đưa tin lên nổi bật:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-on-surface-variant">
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-[17px] text-secondary shrink-0 mt-0.5">
                  hotel_class
                </span>
                <div>
                  <strong className="text-primary block font-semibold">Top đầu Trang chủ:</strong>
                  <span>Ưu tiên hiển thị tại chuyên mục Tin Nổi Bật đầu trang chủ AuraAuto.</span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-[17px] text-secondary shrink-0 mt-0.5">
                  search
                </span>
                <div>
                  <strong className="text-primary block font-semibold">Ưu tiên Tìm kiếm:</strong>
                  <span>Luôn xếp trên các tin đăng thông thường khi người mua lọc tìm xe.</span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-[17px] text-secondary shrink-0 mt-0.5">
                  verified
                </span>
                <div>
                  <strong className="text-primary block font-semibold">Nhãn Nổi Bật:</strong>
                  <span>Huy hiệu nhận diện độc quyền gia tăng độ tin cậy và thu hút lượt click.</span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-[17px] text-secondary shrink-0 mt-0.5">
                  bolt
                </span>
                <div>
                  <strong className="text-primary block font-semibold">Kích hoạt tự động:</strong>
                  <span>Hệ thống cập nhật vị trí ưu tiên ngay sau khi xác nhận thanh toán.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Phương thức thanh toán VNPAY */}
          <div>
            <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-2">
              Phương thức thanh toán:
            </label>
            <div className="p-4 rounded-2xl border border-secondary/30 bg-secondary/5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-surface-container-lowest p-1.5 shadow-2xs border border-surface-container-high flex items-center justify-center font-bold text-xs text-primary">
                  VNPAY
                </div>
                <div>
                  <div className="text-sm font-bold text-primary flex items-center gap-1.5">
                    <span>Cổng thanh toán điện tử VNPAY</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-semibold">
                      Sandbox
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Hỗ trợ quét mã VNPAY-QR, Thẻ ATM/Internet Banking nội địa và Thẻ quốc tế Visa, Mastercard, JCB.
                  </p>
                </div>
              </div>
              <span className="material-symbols-outlined text-[20px] text-secondary shrink-0">
                check_circle
              </span>
            </div>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-error-container text-on-error-container border border-error/30 text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-error shrink-0">warning</span>
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-5 sm:p-6 bg-surface-container-low/40 border-t border-surface-container-high flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-left w-full sm:w-auto">
            <span className="text-[11px] text-on-surface-variant block font-medium">
              Gói đã chọn: {selectedPackage.name}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-xs text-on-surface-variant">Tổng thanh toán:</span>
              <span className="text-xl font-extrabold text-secondary font-headline">
                {formatVND(selectedPackage.amount_vnd)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 rounded-lg border border-[#d8d6d0] bg-white text-xs sm:text-sm font-medium text-[#334155] hover:bg-[#faf9f6] transition-colors w-1/2 sm:w-auto cursor-pointer shadow-2xs active:scale-[0.99]"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={handlePayment}
              disabled={loading}
              className="px-5 py-2 rounded-lg bg-[#0f172a] hover:bg-black text-[#faf9f6] border border-neutral-800 text-xs sm:text-sm font-medium inline-flex items-center justify-center gap-2 transition-all cursor-pointer w-1/2 sm:w-auto disabled:opacity-50 shadow-xs active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#e5c78a] border-t-transparent rounded-full animate-spin" />
                  <span>Đang kết nối VNPAY...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[17px] text-[#e5c78a]">lock</span>
                  <span>Thanh toán qua VNPAY</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
