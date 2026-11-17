'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useFavorites } from '@/hooks/useFavorites';
import { useCurrentUser } from '@/hooks/useCurrentUser';

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  const { favoriteCount } = useFavorites();
  const { user, isLoggedIn, isLoaded, logout } = useCurrentUser();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen]);

  // Close menus when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="h-16 sm:h-20 w-full px-3 sm:px-margin-mobile lg:px-margin flex items-center justify-between">
        {/* Brand Name */}
        <Link className="flex flex-col shrink-0 select-none mr-2" href="/">
          <span className="font-headline-sm text-lg sm:text-headline-sm text-primary tracking-tight font-semibold leading-tight">
            AuraAuto
          </span>
          <span className="font-label-sm text-[9px] sm:text-label-sm text-secondary tracking-widest uppercase leading-none font-medium">
            Luxury Mobility
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-space-xl">
          <Link
            className={`font-label-lg text-label-lg transition-colors py-1 ${
              pathname === '/'
                ? 'text-primary font-semibold relative after:content-[""] after:absolute after:-bottom-2 after:left-1/2 after:-translate-x-1/2 after:w-4 after:h-0.5 after:bg-secondary after:rounded-full'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
            href="/"
          >
            Trang chủ
          </Link>
          <Link
            className={`font-label-lg text-label-lg transition-colors py-1 ${
              pathname === '/xe'
                ? 'text-primary font-semibold relative after:content-[""] after:absolute after:-bottom-2 after:left-1/2 after:-translate-x-1/2 after:w-4 after:h-0.5 after:bg-secondary after:rounded-full'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
            href="/xe"
          >
            Khám phá xe
          </Link>
          <Link
            className={`font-label-lg text-label-lg transition-colors py-1 ${
              pathname === '/dinh-gia-ai'
                ? 'text-primary font-semibold relative after:content-[""] after:absolute after:-bottom-2 after:left-1/2 after:-translate-x-1/2 after:w-4 after:h-0.5 after:bg-secondary after:rounded-full'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
            href="/dinh-gia-ai"
          >
            Định giá xe AI
          </Link>
          <Link
            className={`font-label-lg text-label-lg transition-colors py-1 ${
              pathname === '/lich-hen'
                ? 'text-primary font-semibold relative after:content-[""] after:absolute after:-bottom-2 after:left-1/2 after:-translate-x-1/2 after:w-4 after:h-0.5 after:bg-secondary after:rounded-full'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
            href="/lich-hen"
          >
            Lịch xem xe
          </Link>
          <Link
            className={`font-label-lg text-label-lg transition-colors py-1 ${
              pathname === '/tin-tuc' || pathname?.startsWith('/tin-tuc/')
                ? 'text-primary font-semibold relative after:content-[""] after:absolute after:-bottom-2 after:left-1/2 after:-translate-x-1/2 after:w-4 after:h-0.5 after:bg-secondary after:rounded-full'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
            href="/tin-tuc"
          >
            Tin tức
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-1 sm:gap-2 lg:gap-space-md shrink-0">
          <Link
            className="relative p-1.5 sm:p-space-sm rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all flex items-center justify-center shrink-0"
            href="/xe-da-luu"
            title="Xe yêu thích"
          >
            <span className="material-symbols-outlined text-[20px] sm:text-[22px]">favorite</span>
            {favoriteCount > 0 && (
              <span className="absolute top-1 sm:top-1.5 right-1 sm:right-1.5 w-2 h-2 bg-secondary rounded-full ring-2 ring-surface-container-lowest" />
            )}
          </Link>

          <Link
            className="inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-primary text-on-primary font-semibold text-xs sm:text-label-md hover:bg-inverse-surface transition-all shadow-[0_2px_8px_rgba(0,0,0,0.08)] shrink-0"
            href="/dang-tin"
            title="Đăng tin bán xe"
          >
            <span className="material-symbols-outlined text-[16px] sm:text-[18px] text-secondary">add_circle</span>
            <span>Đăng tin</span>
            <span className="hidden sm:inline"> bán xe</span>
          </Link>

          {/* User Profile or Login Trigger */}
          {isLoaded && isLoggedIn && user ? (
            <div className="relative shrink-0" ref={userDropdownRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen((prev) => !prev)}
                className="flex items-center gap-1 sm:gap-space-xs p-1 sm:px-2.5 sm:py-1.5 rounded-full bg-surface-container hover:bg-surface-container-high transition-colors text-on-surface"
                title="Tài khoản cá nhân"
              >
                <div className="w-7 h-7 rounded-full bg-primary text-on-primary font-bold text-xs flex items-center justify-center uppercase overflow-hidden shrink-0">
                  {user.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.avatar_url}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                      crossOrigin="anonymous"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    (user.full_name || user.email || 'U')[0]
                  )}
                </div>
                <span className="hidden md:inline font-label-md text-label-md max-w-[120px] truncate text-primary font-medium">
                  {user.full_name || user.email.split('@')[0]}
                </span>
                <span
                  className="hidden sm:inline material-symbols-outlined text-[18px] text-on-surface-variant transition-transform duration-200"
                  style={{ transform: userMenuOpen ? 'rotate(180deg)' : 'none' }}
                >
                  expand_more
                </span>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl bg-surface-container-lowest border border-outline-variant/40 shadow-2xl py-2 z-50 text-left">
                  <div className="px-4 py-3 border-b border-surface-container-high">
                    <p className="font-label-lg text-label-lg font-semibold text-primary truncate">
                      {user.full_name || 'Khách hàng AuraAuto'}
                    </p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
                      {user.email || user.phone}
                    </p>
                    {user.province_name && (
                      <div className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-secondary bg-secondary-container/40 px-2 py-0.5 rounded">
                        <span className="material-symbols-outlined text-[13px]">location_on</span>
                        <span>{user.province_name}</span>
                      </div>
                    )}
                  </div>

                  <div className="py-1">
                    {user?.role === 'ADMIN' && (
                      <Link
                        href="/admin"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 font-label-md text-label-md text-on-secondary-container bg-secondary-container/40 font-bold hover:bg-secondary-container/70 transition-colors border-b border-surface-container-high"
                      >
                        <span className="material-symbols-outlined text-[18px] text-secondary">shield_person</span>
                        <span>Trang Quản trị Hệ thống</span>
                      </Link>
                    )}
                    <Link
                      href="/tai-khoan"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 font-label-md text-label-md text-on-surface hover:bg-surface-container transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px] text-secondary">manage_accounts</span>
                      <span>Hồ sơ & Tài khoản</span>
                    </Link>
                    <Link
                      href="/quan-ly-tin"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 font-label-md text-label-md text-on-surface hover:bg-surface-container transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px] text-secondary">directions_car</span>
                      <span>Quản lý tin đăng</span>
                    </Link>
                    <Link
                      href="/dang-tin"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 font-label-md text-label-md text-on-surface hover:bg-surface-container transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px] text-secondary">add_circle</span>
                      <span>Đăng tin bán xe</span>
                    </Link>
                    <Link
                      href="/lich-hen"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 font-label-md text-label-md text-on-surface hover:bg-surface-container transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px] text-secondary">calendar_today</span>
                      <span>Lịch xem xe của tôi</span>
                    </Link>
                  </div>

                  <div className="pt-1 border-t border-surface-container-high">
                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 font-label-md text-label-md text-error hover:bg-error-container/20 transition-colors text-left"
                    >
                      <span className="material-symbols-outlined text-[18px]">logout</span>
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1 sm:gap-space-xs shrink-0">
              <Link
                className="hidden md:inline-flex items-center px-3 py-1.5 rounded-lg font-label-md text-label-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all"
                href="/dang-nhap"
              >
                Đăng nhập
              </Link>
              <Link
                href="/dang-nhap"
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary flex items-center justify-center text-on-primary hover:bg-primary-container transition-colors shrink-0"
                title="Đăng nhập tài khoản"
              >
                <span className="material-symbols-outlined text-on-primary text-[17px] sm:text-[18px]">person</span>
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 sm:p-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors shrink-0"
            aria-label="Toggle Navigation Menu"
          >
            <span className="material-symbols-outlined text-[22px] sm:text-[24px]">
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-surface-container-high bg-surface-container-lowest/98 backdrop-blur-xl px-4 py-4 space-y-2 shadow-xl max-h-[calc(100vh-4rem)] overflow-y-auto">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 px-2.5 rounded-lg font-label-lg text-label-lg text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-colors"
          >
            Trang chủ
          </Link>
          <Link
            href="/xe"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 px-2.5 rounded-lg font-label-lg text-label-lg text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-colors"
          >
            Khám phá xe
          </Link>
          <Link
            href="/dinh-gia-ai"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 px-2.5 rounded-lg font-label-lg text-label-lg text-secondary hover:text-primary font-semibold hover:bg-surface-container-low transition-colors"
          >
            Định giá xe AI
          </Link>
          <Link
            href="/lich-hen"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 px-2.5 rounded-lg font-label-lg text-label-lg text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-colors"
          >
            Lịch xem xe
          </Link>
          <Link
            href="/tin-tuc"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 px-2.5 rounded-lg font-label-lg text-label-lg text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-colors"
          >
            Tin tức & Thị trường
          </Link>
          <Link
            href="/xe-da-luu"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center justify-between py-2 px-2.5 rounded-lg font-label-lg text-label-lg text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-colors"
          >
            <span>Xe đã lưu quan tâm</span>
            {favoriteCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-xs font-bold">
                {favoriteCount}
              </span>
            )}
          </Link>

          {isLoaded && isLoggedIn && user ? (
            <div className="pt-2 border-t border-surface-container-high flex flex-col gap-2">
              <div className="p-3 rounded-lg bg-surface-container-low flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary text-on-primary font-bold text-sm flex items-center justify-center uppercase overflow-hidden shrink-0">
                  {user.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.avatar_url}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                      crossOrigin="anonymous"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    (user.full_name || user.email || 'U')[0]
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-label-md text-label-md font-semibold text-primary truncate">
                    {user.full_name || 'Khách hàng AuraAuto'}
                  </p>
                  <p className="text-xs text-on-surface-variant truncate">
                    {user.email || user.phone}
                  </p>
                  {user.province_name && (
                    <p className="text-xs text-secondary mt-0.5 flex items-center gap-1 font-medium">
                      <span className="material-symbols-outlined text-[13px]">location_on</span>
                      {user.province_name}
                    </p>
                  )}
                </div>
              </div>
              {user?.role === 'ADMIN' && (
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 px-3 text-center rounded-lg bg-secondary-container hover:bg-secondary-fixed border border-secondary/30 text-on-secondary-container font-label-md text-label-md font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px] text-secondary">shield_person</span>
                  <span>Vào Trang Quản trị (Admin)</span>
                </Link>
              )}
              <Link
                href="/tai-khoan"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 px-3 text-center rounded-lg bg-surface-container-high text-primary font-label-md text-label-md font-semibold hover:bg-surface-container-highest transition-colors flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px] text-secondary">manage_accounts</span>
                <span>Hồ sơ & Tài khoản của tôi</span>
              </Link>
              <Link
                href="/quan-ly-tin"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 px-3 text-center rounded-lg bg-surface-container-high text-primary font-label-md text-label-md font-semibold hover:bg-surface-container-highest transition-colors flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px] text-secondary">directions_car</span>
                <span>Quản lý tin đăng</span>
              </Link>
              <Link
                href="/dang-tin"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 px-3 text-center rounded-lg bg-primary text-on-primary font-label-md text-label-md font-semibold hover:bg-inverse-surface transition-colors flex items-center justify-center gap-1.5 shadow-xs"
              >
                <span className="material-symbols-outlined text-[18px] text-secondary">add_circle</span>
                <span>Đăng tin bán xe</span>
              </Link>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="py-2.5 px-3 text-center rounded-lg bg-error-container text-on-error-container font-label-md text-label-md font-semibold hover:opacity-90 transition-opacity"
              >
                Đăng xuất
              </button>
            </div>
          ) : (
            <div className="pt-2 border-t border-surface-container-high flex flex-col gap-2">
              <Link
                href="/dang-nhap"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 px-3 text-center rounded-lg bg-surface-container-low font-label-md text-label-md font-semibold text-primary"
              >
                Đăng nhập / Đăng ký
              </Link>
              <Link
                href="/tai-khoan"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 px-3 text-center rounded-lg bg-surface-container-high text-primary font-label-md text-label-md font-semibold hover:bg-surface-container-highest transition-colors flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px] text-secondary">manage_accounts</span>
                <span>Hồ sơ & Tài khoản của tôi</span>
              </Link>
              <Link
                href="/quan-ly-tin"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 px-3 text-center rounded-lg bg-surface-container-high text-primary font-label-md text-label-md font-semibold hover:bg-surface-container-highest transition-colors flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px] text-secondary">directions_car</span>
                <span>Quản lý tin đăng</span>
              </Link>
              <Link
                href="/dang-tin"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 px-3 text-center rounded-lg bg-primary text-on-primary font-label-md text-label-md font-semibold hover:bg-inverse-surface transition-colors flex items-center justify-center gap-1.5 shadow-xs"
              >
                <span className="material-symbols-outlined text-[18px] text-secondary">add_circle</span>
                <span>Đăng tin bán xe</span>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
