'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import {
  ProfileInfoTab,
  ShowroomSettingsTab,
  UserListingsTab,
  SecurityTab,
} from '@/features/account/components';
import { useProfileInfo } from '@/features/account/hooks/useProfileInfo';
import { useShowroomSettings } from '@/features/account/hooks/useShowroomSettings';
import { useAccountListings } from '@/features/account/hooks/useAccountListings';
import { useAccountSecurity } from '@/features/account/hooks/useAccountSecurity';

type ProfileTab = 'info' | 'showroom' | 'listings' | 'security';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoggedIn, isLoaded, logout } = useCurrentUser();
  const [activeTab, setActiveTab] = useState<ProfileTab>('info');

  // Global Account Toast State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // Domain Hooks
  const profile = useProfileInfo({ user, showToast });
  const showroom = useShowroomSettings({ isLoggedIn, showToast });
  const listingsHook = useAccountListings({ isLoggedIn, showToast });
  const security = useAccountSecurity({ showToast });

  const isShowroomUser = user?.account_type === 'SHOWROOM' || Boolean(showroom.showroomData);

  // If auth is loaded and not logged in, show access guard
  if (isLoaded && !isLoggedIn) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full bg-surface-container-lowest p-8 rounded-2xl shadow-xl border border-surface-container-high text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-secondary/10 text-secondary mx-auto flex items-center justify-center">
            <span className="material-symbols-outlined text-[32px]">lock</span>
          </div>
          <h2 className="text-xl font-bold text-primary font-headline-sm">Yêu cầu đăng nhập</h2>
          <p className="text-body-sm text-on-surface-variant">
            Vui lòng đăng nhập vào tài khoản AuraAuto của bạn để xem và quản lý hồ sơ cá nhân cũng như các tin đăng xe.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <Link
              href="/dang-nhap"
              className="flex-1 py-3 px-4 rounded-xl bg-primary text-on-primary font-semibold text-center hover:bg-inverse-surface transition-colors shadow-sm"
            >
              Đăng nhập ngay
            </Link>
            <Link
              href="/dang-ky"
              className="flex-1 py-3 px-4 rounded-xl bg-surface-container-high text-primary font-semibold text-center hover:bg-surface-container-highest transition-colors"
            >
              Đăng ký tài khoản
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 pt-6">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed top-24 right-6 z-50 px-4 py-3 rounded-xl shadow-lg border flex items-center gap-2.5 text-body-sm transition-all duration-300 animate-in slide-in-from-top-4 ${
            toast.type === 'success'
              ? 'bg-surface-container-lowest border-secondary text-primary'
              : 'bg-error-container border-error text-on-error-container'
          }`}
        >
          <span
            className={`material-symbols-outlined text-[20px] ${
              toast.type === 'success' ? 'text-secondary' : 'text-error'
            }`}
          >
            {toast.type === 'success' ? 'check_circle' : 'error'}
          </span>
          <span className="font-medium leading-snug">{toast.message}</span>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-on-surface-variant font-label-sm text-label-sm">
          <Link href="/" className="hover:text-primary transition-colors flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">home</span> Trang chủ
          </Link>
          <span>/</span>
          <span className="text-primary font-medium">Hồ sơ & Tài khoản</span>
        </div>

        {/* Hero Profile Banner */}
        <div className="bg-surface-container-lowest rounded-2xl p-6 sm:p-8 border border-surface-container-high/80 shadow-[0_8px_32px_rgba(0,0,0,0.03)] mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              {/* Avatar circle with direct upload overlay */}
              <div className="relative group">
                <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-primary to-[#383838] text-on-primary font-bold text-2xl sm:text-3xl flex items-center justify-center uppercase shadow-md border-2 border-surface-container-lowest overflow-hidden">
                  {profile.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profile.avatarUrl} alt={profile.displayName} className="w-full h-full object-cover" />
                  ) : (
                    (profile.displayName || user?.email || 'U')[0]
                  )}
                </div>

                <input
                  type="file"
                  id="hero-avatar-file"
                  accept="image/*"
                  className="hidden"
                  onChange={profile.handleAvatarUpload}
                  disabled={profile.uploadingAvatar}
                />
                <label
                  htmlFor="hero-avatar-file"
                  className="absolute -bottom-1 -left-1 w-7 h-7 rounded-full bg-surface-container-lowest border border-surface-container-high shadow-md flex items-center justify-center cursor-pointer hover:bg-surface-container transition-colors text-primary"
                  title="Thay đổi ảnh đại diện"
                >
                  {profile.uploadingAvatar ? (
                    <span className="material-symbols-outlined text-[15px] animate-spin">progress_activity</span>
                  ) : (
                    <span className="material-symbols-outlined text-[15px]">photo_camera</span>
                  )}
                </label>

                {isShowroomUser && (
                  <span
                    className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-secondary text-on-secondary flex items-center justify-center shadow-xs"
                    title="Hồ sơ Showroom Đối Tác"
                  >
                    <span className="material-symbols-outlined text-[14px]">storefront</span>
                  </span>
                )}
              </div>

              {/* Identity summary */}
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-xl sm:text-2xl font-bold text-primary font-headline-sm">
                    {profile.displayName || 'Khách hàng AuraAuto'}
                  </h1>
                  {isShowroomUser ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#b89b72]/15 text-[#917548] border border-[#b89b72]/30">
                      <span className="material-symbols-outlined text-[13px]">verified</span>
                      <span>Showroom / Salon</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-surface-container-high text-on-surface-variant">
                      <span className="material-symbols-outlined text-[13px]">person</span>
                      <span>Tài khoản Cá nhân</span>
                    </span>
                  )}
                  {user?.role === 'ADMIN' && (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-secondary-container text-on-secondary-container">
                      Quản trị viên
                    </span>
                  )}
                </div>

                <p className="text-body-sm text-on-surface-variant mt-1">
                  {user?.email} • {profile.phone || 'Chưa cập nhật SĐT'}
                </p>

                <div className="flex items-center gap-3 mt-2 text-xs text-on-surface-variant">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-secondary">verified_user</span>
                    <span>{user?.email_verified_at ? 'Email đã xác thực' : 'Chưa xác thực email'}</span>
                  </span>
                  <span>•</span>
                  <span>Thành viên từ {user?.created_at ? new Date(user.created_at).toLocaleDateString('vi-VN') : '2025'}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full sm:w-auto">
              <Link
                href="/dang-tin"
                className="flex-1 sm:flex-none py-2.5 px-4 rounded-xl bg-primary text-on-primary font-semibold text-label-md flex items-center justify-center gap-2 hover:bg-inverse-surface transition-colors shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                <span>Đăng tin bán xe</span>
              </Link>
              {user?.role === 'ADMIN' && (
                <Link
                  href="/admin"
                  className="flex-1 sm:flex-none py-2.5 px-4 rounded-xl bg-secondary-container text-on-secondary-container font-semibold text-label-md flex items-center justify-center gap-1.5 hover:bg-secondary-fixed transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
                  <span>Trang Admin</span>
                </Link>
              )}
              <button
                type="button"
                onClick={() => {
                  logout();
                  router.push('/');
                }}
                className="py-2.5 px-3.5 rounded-xl border border-surface-container-high text-on-surface-variant hover:text-error hover:border-error/40 hover:bg-error-container/20 transition-colors text-label-md font-medium flex items-center justify-center gap-1.5 cursor-pointer"
                title="Đăng xuất khỏi hệ thống"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                <span className="hidden sm:inline">Đăng xuất</span>
              </button>
            </div>
          </div>

          {/* Navigation Tabs Bar */}
          <div className="flex items-center gap-2 mt-8 pt-6 border-t border-surface-container-high/60 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab('info')}
              className={`px-4 py-2 rounded-xl font-label-md text-label-md font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'info'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'bg-surface-container-low text-on-surface-variant hover:text-primary hover:bg-surface-container'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">person</span>
              <span>Thông tin cá nhân</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('showroom')}
              className={`px-4 py-2 rounded-xl font-label-md text-label-md font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'showroom'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'bg-surface-container-low text-on-surface-variant hover:text-primary hover:bg-surface-container'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">storefront</span>
              <span>Hồ sơ Showroom</span>
              {showroom.showroomData?.is_verified && (
                <span className="w-2 h-2 rounded-full bg-secondary" title="Đã xác minh" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('listings')}
              className={`px-4 py-2 rounded-xl font-label-md text-label-md font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'listings'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'bg-surface-container-low text-on-surface-variant hover:text-primary hover:bg-surface-container'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">directions_car</span>
              <span>Tin đăng của tôi</span>
              {listingsHook.listings.length > 0 && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    activeTab === 'listings' ? 'bg-on-primary/20 text-on-primary' : 'bg-surface-container-high text-primary'
                  }`}
                >
                  {listingsHook.listings.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('security')}
              className={`px-4 py-2 rounded-xl font-label-md text-label-md font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'security'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'bg-surface-container-low text-on-surface-variant hover:text-primary hover:bg-surface-container'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">lock</span>
              <span>Bảo mật & Mật khẩu</span>
            </button>
          </div>
        </div>

        {/* Tab Contents */}
        {activeTab === 'info' && (
          <ProfileInfoTab
            user={user}
            displayName={profile.displayName}
            setDisplayName={profile.setDisplayName}
            phone={profile.phone}
            setPhone={profile.setPhone}
            provinceCode={profile.provinceCode}
            setProvinceCode={profile.setProvinceCode}
            address={profile.address}
            setAddress={profile.setAddress}
            avatarUrl={profile.avatarUrl}
            uploadingAvatar={profile.uploadingAvatar}
            savingInfo={profile.savingInfo}
            handleAvatarUpload={profile.handleAvatarUpload}
            handleRemoveAvatar={profile.handleRemoveAvatar}
            handleSaveProfile={profile.handleSaveProfile}
          />
        )}

        {activeTab === 'showroom' && (
          <ShowroomSettingsTab
            isShowroomUser={isShowroomUser}
            showroomData={showroom.showroomData}
            srName={showroom.srName}
            setSrName={showroom.setSrName}
            srPhone={showroom.srPhone}
            setSrPhone={showroom.setSrPhone}
            srProvinceCode={showroom.srProvinceCode}
            setSrProvinceCode={showroom.setSrProvinceCode}
            srAddress={showroom.srAddress}
            setSrAddress={showroom.setSrAddress}
            srDescription={showroom.srDescription}
            setSrDescription={showroom.setSrDescription}
            srLogoUrl={showroom.srLogoUrl}
            srBannerUrl={showroom.srBannerUrl}
            uploadingLogo={showroom.uploadingLogo}
            uploadingBanner={showroom.uploadingBanner}
            savingShowroom={showroom.savingShowroom}
            handleLogoUpload={showroom.handleLogoUpload}
            handleBannerUpload={showroom.handleBannerUpload}
            handleSaveShowroom={showroom.handleSaveShowroom}
          />
        )}

        {activeTab === 'listings' && (
          <UserListingsTab
            listings={listingsHook.listings}
            loadingListings={listingsHook.loadingListings}
            listingFilter={listingsHook.listingFilter}
            setListingFilter={listingsHook.setListingFilter}
            listingActionId={listingsHook.listingActionId}
            selectedPromoteListing={listingsHook.selectedPromoteListing}
            setSelectedPromoteListing={listingsHook.setSelectedPromoteListing}
            handleMarkSold={listingsHook.handleMarkSold}
            handleSubmitReview={listingsHook.handleSubmitReview}
            loadListings={listingsHook.loadListings}
          />
        )}

        {activeTab === 'security' && (
          <SecurityTab
            currentPassword={security.currentPassword}
            setCurrentPassword={security.setCurrentPassword}
            newPassword={security.newPassword}
            setNewPassword={security.setNewPassword}
            confirmPassword={security.confirmPassword}
            setConfirmPassword={security.setConfirmPassword}
            savingPassword={security.savingPassword}
            handleChangePassword={security.handleChangePassword}
          />
        )}
      </div>
    </div>
  );
}
