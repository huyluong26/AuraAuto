'use client';

import React from 'react';
import Link from 'next/link';
import { PublicSellerProfile } from '@/types';

interface SellerHeroBannerProps {
  profile: PublicSellerProfile;
  isShowroom: boolean;
  displayName: string;
  phone?: string | null;
  maskedPhone: string;
  locationText: string;
  phoneRevealed: boolean;
  onRevealPhone: () => void;
}

export function SellerHeroBanner({
  profile,
  isShowroom,
  displayName,
  phone,
  maskedPhone,
  locationText,
  phoneRevealed,
  onRevealPhone,
}: SellerHeroBannerProps) {
  return (
    <div className="w-full">
      {/* Breadcrumb Navigation */}
      <div className="w-full border-b border-surface-container-high/60 bg-surface-container-lowest">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-2 text-xs text-on-surface-variant">
          <Link href="/" className="hover:text-primary transition-colors">
            Trang chủ
          </Link>
          <span>/</span>
          <Link href="/xe" className="hover:text-primary transition-colors">
            {isShowroom ? 'Showroom đối tác' : 'Người bán'}
          </Link>
          <span>/</span>
          <span className="text-primary font-semibold truncate max-w-[200px] sm:max-w-none">
            {displayName}
          </span>
        </div>
      </div>

      {/* Profile Hero Header */}
      {isShowroom ? (
        /* ================= SHOWROOM HERO ================= */
        <div className="w-full relative bg-surface-container-low border-b border-surface-container-high/70 pb-6">
          {/* Banner Image */}
          <div className="w-full h-44 sm:h-64 lg:h-80 relative overflow-hidden bg-primary">
            <img
              src={
                profile.showroom?.banner_url ||
                'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1600&q=85'
              }
              alt={displayName}
              className="w-full h-full object-cover opacity-85"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

            {/* Verified Partner Top Badge */}
            <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-secondary border border-secondary/40 text-xs font-bold shadow-sm">
                <span className="material-symbols-outlined text-[16px]">verified</span>
                <span>Showroom Đối tác Chính thức</span>
              </span>
            </div>
          </div>

          {/* Showroom Identity Card */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 sm:-mt-20 relative z-10">
            <div className="bg-surface-container-lowest rounded-2xl p-5 sm:p-8 shadow-md border border-surface-container-high/80 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              {/* Left: Avatar & Info */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                {profile.showroom?.logo_url || profile.avatar_url ? (
                  <img
                    src={profile.showroom?.logo_url || profile.avatar_url}
                    alt={displayName}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-4 border-surface-container-lowest shadow-md shrink-0 bg-white"
                  />
                ) : (
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#b89b72] text-white flex items-center justify-center border-4 border-surface-container-lowest shadow-md shrink-0">
                    <span className="material-symbols-outlined text-[36px]">storefront</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="font-headline-md text-xl sm:text-2xl lg:text-3xl font-bold text-primary font-display">
                      {displayName}
                    </h1>
                    <span
                      className="material-symbols-outlined text-secondary text-[22px]"
                      title="Showroom được kiểm duyệt pháp lý & đối tác xác thực"
                    >
                      verified
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-on-surface-variant max-w-2xl leading-relaxed">
                    {profile.showroom?.description ||
                      'Hệ thống showroom kinh doanh và ký gửi các dòng xe ô tô đã qua sử dụng tuyển chọn, bảo hành động cơ và hộp số tiêu chuẩn.'}
                  </p>

                  {/* Meta Tags */}
                  <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-on-surface-variant pt-1">
                    <div className="flex items-center gap-1 text-secondary font-medium">
                      <span className="material-symbols-outlined text-[15px]">location_on</span>
                      <span className="text-primary font-medium">{locationText}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px] text-secondary">schedule</span>
                      <span>Giờ mở cửa: 08:00 - 19:00</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px] text-secondary">calendar_today</span>
                      <span>
                        Tham gia từ{' '}
                        {new Date(profile.created_at).toLocaleDateString('vi-VN', {
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Contact Actions */}
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-surface-container-high/60">
                {phone && (
                  <button
                    type="button"
                    onClick={() => {
                      onRevealPhone();
                      if (phoneRevealed && typeof window !== 'undefined') {
                        window.location.href = `tel:${phone}`;
                      }
                    }}
                    className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs sm:text-sm font-semibold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">call</span>
                    <span>{phoneRevealed ? phone : `${maskedPhone} (Hiện số)`}</span>
                  </button>
                )}

                <a
                  href={phone ? `https://zalo.me/${phone.replace(/[^0-9]/g, '')}` : '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-secondary-container hover:bg-secondary-fixed text-on-secondary-container text-xs sm:text-sm font-semibold border border-secondary/30 transition-all flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px] text-secondary">chat</span>
                  <span>Nhắn Zalo</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ================= INDIVIDUAL SELLER HERO ================= */
        <div className="w-full bg-surface-container-low border-b border-surface-container-high/70 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-surface-container-lowest rounded-2xl p-6 sm:p-8 shadow-sm border border-surface-container-high/80 flex flex-col md:flex-row md:items-center justify-between gap-6">
              {/* Left: Avatar & Info */}
              <div className="flex items-center gap-4 sm:gap-6">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={displayName}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-secondary/40 shadow-xs shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-secondary text-on-secondary flex items-center justify-center font-bold text-xl uppercase shadow-xs shrink-0">
                    {displayName.slice(0, 2)}
                  </div>
                )}

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h1 className="font-headline-md text-xl sm:text-2xl font-bold text-primary">
                      {displayName}
                    </h1>
                    <span className="px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[11px] font-bold">
                      Chính chủ
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-on-surface-variant">
                    <div className="flex items-center gap-1 text-secondary font-medium">
                      <span className="material-symbols-outlined text-[14px]">location_on</span>
                      <span className="text-primary font-medium">{locationText}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px] text-secondary">calendar_today</span>
                      <span>
                        Tham gia từ{' '}
                        {new Date(profile.created_at).toLocaleDateString('vi-VN', {
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 pt-1 text-xs">
                    <span className="text-secondary font-bold text-sm">5.0</span>
                    <div className="flex text-secondary text-[13px]">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <span
                          key={s}
                          className="material-symbols-outlined text-[14px]"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          star
                        </span>
                      ))}
                    </div>
                    <span className="text-on-surface-variant text-[11px]">
                      ({profile.reviews_count || 12} đánh giá giao dịch uy tín)
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Call Actions */}
              <div className="flex items-center gap-2.5 pt-2 md:pt-0 border-t md:border-t-0 border-surface-container-high/60">
                {phone && (
                  <button
                    type="button"
                    onClick={() => {
                      onRevealPhone();
                      if (phoneRevealed && typeof window !== 'undefined') {
                        window.location.href = `tel:${phone}`;
                      }
                    }}
                    className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs sm:text-sm font-semibold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">phone_in_talk</span>
                    <span>{phoneRevealed ? phone : `${maskedPhone} (Hiện số)`}</span>
                  </button>
                )}

                <a
                  href={phone ? `https://zalo.me/${phone.replace(/[^0-9]/g, '')}` : '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-xl bg-secondary-container hover:bg-secondary-fixed text-on-secondary-container text-xs sm:text-sm font-semibold border border-secondary/30 transition-all flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px] text-secondary">chat</span>
                  <span>Nhắn Zalo</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

