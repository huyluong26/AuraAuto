'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ListingDetail } from '@/types';

interface SellerContactCardProps {
  listing: ListingDetail;
  onOpenChat: () => void;
}

export function SellerContactCard({
  listing,
  onOpenChat,
}: SellerContactCardProps) {
  const [phoneRevealed, setPhoneRevealed] = useState(false);

  const isShowroom = listing.seller_type === 'SHOWROOM' || Boolean(listing.seller?.showroom_name);
  const sellerName = isShowroom
    ? (listing.seller?.showroom_name || listing.seller?.display_name || 'Showroom Auto')
    : (listing.seller?.display_name || listing.seller_name || 'Chủ xe cá nhân');
  const rawPhone = listing.seller?.phone || listing.seller?.phone_number || '0988234888';
  const maskedPhone =
    rawPhone.length > 6
      ? rawPhone.slice(0, 4) + ' ' + rawPhone.slice(4, 7) + ' xxx'
      : rawPhone;

  const sellerId = listing.showroom_id || listing.seller?.id || (listing as any).seller_id;
  const profileHref = sellerId ? `/nguoi-ban/${sellerId}` : '#';

  const handleCall = () => {
    setPhoneRevealed(true);
    if (phoneRevealed && typeof window !== 'undefined') {
      window.location.href = `tel:${rawPhone}`;
    }
  };

  return (
    <div className="p-5 rounded-xl bg-surface-container-lowest shadow-xs border border-surface-container flex flex-col gap-3.5">
      {/* Seller Identity Header */}
      <div className="flex items-start justify-between gap-2.5">
        <Link
          href={profileHref}
          className="flex items-center gap-3 group/seller cursor-pointer transition-opacity hover:opacity-90"
          title={`Xem hồ sơ của ${sellerName}`}
        >
          {listing.seller?.avatar_url ? (
            <img
              src={listing.seller.avatar_url}
              alt={sellerName}
              className="w-11 h-11 rounded-full object-cover shadow-2xs group-hover/seller:ring-2 ring-secondary/50 transition-all"
            />
          ) : (
            <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-base shadow-2xs uppercase group-hover/seller:ring-2 ring-secondary/50 transition-all ${
              isShowroom ? 'bg-[#b89b72] text-white' : 'bg-secondary text-on-secondary'
            }`}>
              {isShowroom ? (
                <span className="material-symbols-outlined text-[20px]">storefront</span>
              ) : (
                sellerName.slice(0, 2)
              )}
            </div>
          )}

          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="text-sm sm:text-base font-bold font-display text-primary group-hover/seller:text-secondary transition-colors">
                {sellerName}
              </h4>
              <span
                className="material-symbols-outlined text-secondary text-[16px]"
                title={isShowroom ? 'Showroom đối tác xác thực' : 'Chủ sở hữu cá nhân xác thực'}
              >
                verified
              </span>
            </div>
            <div className="flex items-center gap-1 text-on-surface-variant text-xs">
              <span className="text-secondary font-bold">5.0</span>
              <div className="flex text-secondary text-[12px]">
                {[1, 2, 3, 4, 5].map((s) => (
                  <span
                    key={s}
                    className="material-symbols-outlined text-[13px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    star
                  </span>
                ))}
              </div>
              <span className="text-[11px]">(18 đánh giá)</span>
            </div>
          </div>
        </Link>

        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
          isShowroom
            ? 'bg-secondary/15 text-secondary border border-secondary/30'
            : 'bg-secondary-container text-on-secondary-container'
        }`}>
          {isShowroom ? 'Đại lý / Showroom' : 'Chính chủ'}
        </span>
      </div>

      {/* Button xem trang profile người bán / showroom */}
      {sellerId && (
        <Link
          href={profileHref}
          className={`w-full py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-between transition-all group ${
            isShowroom
              ? 'border-secondary/40 bg-secondary/5 hover:bg-secondary/10 text-secondary'
              : 'border-surface-container-high bg-surface-container-low hover:bg-surface-container text-on-surface'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[17px]">
              {isShowroom ? 'storefront' : 'badge'}
            </span>
            <span>
              {isShowroom ? 'Xem gian hàng & kho xe Showroom' : 'Xem trang người bán & xe đang đăng'}
            </span>
          </div>
          <span className="material-symbols-outlined text-[15px] group-hover:translate-x-0.5 transition-transform">
            arrow_forward
          </span>
        </Link>
      )}

      {/* Verified Status Tag */}
      <div className="p-2.5 rounded-lg bg-surface-container-low text-secondary text-xs flex items-center gap-2 border border-secondary/20">
        <span className="material-symbols-outlined text-[16px] text-secondary">
          {isShowroom ? 'verified' : 'verified_user'}
        </span>
        <span className="font-medium">
          {isShowroom
            ? 'Showroom đối tác được xác thực pháp lý & giấy phép'
            : 'Đã xác minh danh tính & giấy tờ xe chính chủ'}
        </span>
      </div>

      {/* Location */}
      <div className="p-2.5 rounded-lg bg-surface-container text-on-surface-variant text-xs flex items-start gap-2">
        <span className="material-symbols-outlined text-[16px] text-secondary flex-shrink-0 mt-0.5">
          location_on
        </span>
        <div>
          <span className="font-semibold text-primary block">
            {listing.location_address || 'Hà Nội / TP. Hồ Chí Minh'}
          </span>
          <span className="text-[11px] text-on-surface-variant">
            Hỗ trợ xem xe tại nhà riêng hoặc tại trung tâm AuraAuto
          </span>
        </div>
      </div>

      {/* Main Direct Contact Actions */}
      <div className="flex flex-col gap-2 pt-0.5">
        {/* Call button */}
        <button
          type="button"
          onClick={handleCall}
          className="w-full py-2.5 px-3 rounded-lg bg-primary text-on-primary text-xs sm:text-sm font-semibold text-center hover:bg-primary-container transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">phone_in_talk</span>
          <span>
            {phoneRevealed ? rawPhone : `${maskedPhone} (Bấm hiện số)`}
          </span>
        </button>

        {/* Chat In-App button */}
        <button
          type="button"
          onClick={onOpenChat}
          className="w-full py-2.5 px-3 rounded-lg bg-secondary text-on-secondary text-xs sm:text-sm font-semibold hover:opacity-95 transition-all shadow-2xs flex items-center justify-center gap-2 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">chat</span>
          <span>Nhắn tin với chủ xe</span>
        </button>
      </div>

      {/* Trust guarantees list */}
      <div className="p-2.5 rounded-lg bg-surface-container-low flex flex-col gap-1.5 text-[11px] text-on-surface-variant border border-surface-container">
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-secondary text-[14px]">verified</span>
          <span>Hỗ trợ thủ tục công chứng sang tên 24h</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-secondary text-[14px]">build_circle</span>
          <span>Bao check hãng / garage chuyên sâu</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-secondary text-[14px]">shield</span>
          <span>Bảo chứng an toàn bởi AuraAuto</span>
        </div>
      </div>
    </div>
  );
}
