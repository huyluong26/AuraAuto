'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { api } from '@/lib/api';
import { POPULAR_PROVINCES } from '@/features/auth/constants/provinces';
import {
  ProfileInfoTab,
  ShowroomSettingsTab,
  UserListingsTab,
  SecurityTab,
} from '@/features/account/components';

type ProfileTab = 'info' | 'showroom' | 'listings' | 'security';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoggedIn, isLoaded, logout } = useCurrentUser();

  const [activeTab, setActiveTab] = useState<ProfileTab>('info');

  // Tab 1: Profile Info States
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [provinceCode, setProvinceCode] = useState('01');
  const [address, setAddress] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [savingInfo, setSavingInfo] = useState(false);

  // Tab 2: Showroom States
  const [showroomData, setShowroomData] = useState<any | null>(null);
  const [loadingShowroom, setLoadingShowroom] = useState(false);
  const [srName, setSrName] = useState('');
  const [srPhone, setSrPhone] = useState('');
  const [srProvinceCode, setSrProvinceCode] = useState('01');
  const [srAddress, setSrAddress] = useState('');
  const [srDescription, setSrDescription] = useState('');
  const [srLogoUrl, setSrLogoUrl] = useState('');
  const [srBannerUrl, setSrBannerUrl] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [savingShowroom, setSavingShowroom] = useState(false);

  // Tab 3: My Listings States
  const [listings, setListings] = useState<any[]>([]);
  const [loadingListings, setLoadingListings] = useState(false);
  const [listingFilter, setListingFilter] = useState<'ALL' | 'PUBLISHED' | 'PENDING_REVIEW' | 'SOLD'>('ALL');
  const [listingActionId, setListingActionId] = useState<string | null>(null);
  const [selectedPromoteListing, setSelectedPromoteListing] = useState<any | null>(null);

  // Tab 4: Security / Password States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  // Toast State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // Sync state from current user
  useEffect(() => {
    if (user) {
      setDisplayName(user.display_name || user.full_name || '');
      setPhone(user.phone || user.phone_number || '');
      if (user.province_code) setProvinceCode(user.province_code);
      if (user.address) setAddress(user.address);
      if (user.avatar_url) setAvatarUrl(user.avatar_url);
    }
  }, [user]);

  // Load Showroom info if user has showroom or visits showroom tab
  const loadShowroom = useCallback(async () => {
    setLoadingShowroom(true);
    try {
      const sr = await api.getMyShowroom();
      if (sr) {
        setShowroomData(sr);
        setSrName(sr.name || '');
        setSrPhone(sr.phone || '');
        if (sr.province_code) setSrProvinceCode(sr.province_code);
        if (sr.address) setSrAddress(sr.address);
        if (sr.description) setSrDescription(sr.description);
        if (sr.logo_url) setSrLogoUrl(sr.logo_url);
        if (sr.banner_url) setSrBannerUrl(sr.banner_url);
      }
    } catch {
      // No showroom yet
    } finally {
      setLoadingShowroom(false);
    }
  }, []);

  // Load My Listings
  const loadListings = useCallback(async () => {
    setLoadingListings(true);
    try {
      const res = await api.getMyListings(1, 50);
      setListings(res.items || []);
    } catch (err: any) {
      console.warn('Failed to load listings:', err);
    } finally {
      setLoadingListings(false);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      loadShowroom();
      loadListings();
    }
  }, [isLoggedIn, loadShowroom, loadListings]);

  // Handle Avatar Upload
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Vui lòng chọn file hình ảnh (JPEG, PNG, WEBP).', 'error');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast('Kích thước ảnh không được vượt quá 10MB.', 'error');
      return;
    }

    setUploadingAvatar(true);
    try {
      const up = await api.uploadMedia(file, 'avatars');
      const url = up.secure_url;
      setAvatarUrl(url);
      await api.updateProfile({ avatar_url: url });
      showToast('Cập nhật ảnh đại diện thành công!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Không thể tải ảnh đại diện lên.', 'error');
    } finally {
      setUploadingAvatar(false);
      e.target.value = '';
    }
  };

  const handleRemoveAvatar = async () => {
    setUploadingAvatar(true);
    try {
      await api.updateProfile({ avatar_url: '' });
      setAvatarUrl('');
      showToast('Đã gỡ ảnh đại diện!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Không thể gỡ ảnh đại diện.', 'error');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Handle Showroom Logo Upload
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Vui lòng chọn file hình ảnh (JPEG, PNG, WEBP).', 'error');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast('Kích thước logo không được vượt quá 10MB.', 'error');
      return;
    }

    setUploadingLogo(true);
    try {
      const up = await api.uploadMedia(file, 'showrooms/logos');
      const url = up.secure_url;
      setSrLogoUrl(url);
      if (showroomData) {
        await api.updateMyShowroom({ logo_url: url });
        setShowroomData((prev: any) => ({ ...prev, logo_url: url }));
      }
      showToast('Tải lên logo Showroom thành công!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Không thể tải logo lên.', 'error');
    } finally {
      setUploadingLogo(false);
      e.target.value = '';
    }
  };

  // Handle Showroom Banner Upload
  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Vui lòng chọn file hình ảnh (JPEG, PNG, WEBP).', 'error');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      showToast('Kích thước ảnh bìa không được vượt quá 15MB.', 'error');
      return;
    }

    setUploadingBanner(true);
    try {
      const up = await api.uploadMedia(file, 'showrooms/banners');
      const url = up.secure_url;
      setSrBannerUrl(url);
      if (showroomData) {
        await api.updateMyShowroom({ banner_url: url });
        setShowroomData((prev: any) => ({ ...prev, banner_url: url }));
      }
      showToast('Tải lên ảnh bìa Showroom thành công!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Không thể tải ảnh bìa lên.', 'error');
    } finally {
      setUploadingBanner(false);
      e.target.value = '';
    }
  };

  // Handle Save Profile Info
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim() || displayName.trim().length < 2) {
      showToast('Họ và tên phải có tối thiểu 2 ký tự.', 'error');
      return;
    }

    const selectedProvince = POPULAR_PROVINCES.find((p) => p.code === provinceCode);
    const provinceName = selectedProvince ? selectedProvince.name : undefined;

    setSavingInfo(true);
    try {
      await api.updateProfile({
        display_name: displayName.trim(),
        phone: phone.trim() || undefined,
        province_code: provinceCode || undefined,
        province_name: provinceName,
        address: address.trim() || undefined,
        avatar_url: avatarUrl || undefined,
      });
      showToast('Cập nhật hồ sơ cá nhân thành công!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Không thể cập nhật hồ sơ.', 'error');
    } finally {
      setSavingInfo(false);
    }
  };

  // Handle Save / Register Showroom
  const handleSaveShowroom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!srName.trim() || srName.trim().length < 2) {
      showToast('Tên Showroom / Doanh nghiệp phải có tối thiểu 2 ký tự.', 'error');
      return;
    }
    if (!srPhone.trim()) {
      showToast('Vui lòng cung cấp Hotline / Số điện thoại Showroom.', 'error');
      return;
    }
    if (!srAddress.trim() || srAddress.trim().length < 5) {
      showToast('Vui lòng cung cấp địa chỉ trụ sở showroom rõ ràng.', 'error');
      return;
    }

    setSavingShowroom(true);
    try {
      if (showroomData) {
        const updated = await api.updateMyShowroom({
          name: srName.trim(),
          phone: srPhone.trim(),
          address: srAddress.trim(),
          province_code: srProvinceCode,
          description: srDescription.trim() || undefined,
          logo_url: srLogoUrl || undefined,
          banner_url: srBannerUrl || undefined,
        });
        setShowroomData(updated);
        showToast('Cập nhật thông tin Showroom thành công!', 'success');
      } else {
        const created = await api.registerShowroom({
          name: srName.trim(),
          phone: srPhone.trim(),
          address: srAddress.trim(),
          province_code: srProvinceCode,
          description: srDescription.trim() || undefined,
          logo_url: srLogoUrl || undefined,
          banner_url: srBannerUrl || undefined,
        });
        setShowroomData(created);
        showToast('Đăng ký hồ sơ Showroom thành công!', 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Không thể lưu hồ sơ Showroom.', 'error');
    } finally {
      setSavingShowroom(false);
    }
  };

  // Handle Mark Sold
  const handleMarkSold = async (listingId: string) => {
    if (!confirm('Bạn có chắc chắn muốn đánh dấu xe này đã bán?')) return;
    setListingActionId(listingId);
    try {
      await api.markListingSold(listingId);
      showToast('Đã đánh dấu xe đã bán thành công!', 'success');
      await loadListings();
    } catch (err: any) {
      showToast(err.message || 'Không thể đánh dấu đã bán.', 'error');
    } finally {
      setListingActionId(null);
    }
  };

  // Handle Submit for Review
  const handleSubmitReview = async (listingId: string) => {
    setListingActionId(listingId);
    try {
      await api.submitListingForReview(listingId);
      showToast('Gửi duyệt tin thành công! Tin sẽ được hiển thị sau khi Admin xét duyệt.', 'success');
      await loadListings();
    } catch (err: any) {
      showToast(err.message || 'Không thể gửi duyệt tin.', 'error');
    } finally {
      setListingActionId(null);
    }
  };

  // Handle Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      showToast('Vui lòng nhập mật khẩu hiện tại.', 'error');
      return;
    }
    if (newPassword.length < 8) {
      showToast('Mật khẩu mới phải có tối thiểu 8 ký tự.', 'error');
      return;
    }
    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      showToast('Mật khẩu mới phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Xác nhận mật khẩu mới không trùng khớp.', 'error');
      return;
    }

    setSavingPassword(true);
    try {
      await api.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      showToast('Đổi mật khẩu thành công! Mật khẩu mới đã có hiệu lực.', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      showToast(err.message || 'Không thể đổi mật khẩu. Vui lòng kiểm tra lại.', 'error');
    } finally {
      setSavingPassword(false);
    }
  };

  const isShowroomUser = user?.account_type === 'SHOWROOM' || Boolean(showroomData);

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
          className={`fixed top-24 right-6 z-50 px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 border transition-all duration-300 animate-in slide-in-from-top-4 ${
            toast.type === 'success'
              ? 'bg-inverse-surface text-inverse-on-surface border-outline/30'
              : 'bg-error-container text-on-error-container border-error/30'
          }`}
        >
          <span
            className={`material-symbols-outlined text-[20px] ${
              toast.type === 'success' ? 'text-secondary-fixed' : 'text-error'
            }`}
          >
            {toast.type === 'success' ? 'check_circle' : 'error'}
          </span>
          <span className="font-label-md text-label-md font-medium">{toast.message}</span>
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
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                  ) : (
                    (displayName || user?.email || 'U')[0]
                  )}
                </div>

                <input
                  type="file"
                  id="hero-avatar-file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                  disabled={uploadingAvatar}
                />
                <label
                  htmlFor="hero-avatar-file"
                  className="absolute -bottom-1 -left-1 w-7 h-7 rounded-full bg-surface-container-lowest border border-surface-container-high shadow-md flex items-center justify-center cursor-pointer hover:bg-surface-container transition-colors text-primary"
                  title="Thay đổi ảnh đại diện"
                >
                  {uploadingAvatar ? (
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
                    {displayName || 'Khách hàng AuraAuto'}
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
                  {user?.email} {phone && `• ${phone}`}
                </p>

                {user?.province_name && (
                  <p className="text-xs text-secondary mt-1 flex items-center gap-1 font-medium">
                    <span className="material-symbols-outlined text-[14px]">location_on</span>
                    {user.province_name}
                  </p>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Link
                href="/dang-tin"
                className="flex-1 sm:flex-none h-11 px-5 rounded-xl bg-primary text-on-primary font-semibold text-sm flex items-center justify-center gap-2 hover:bg-inverse-surface transition-all shadow-sm cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                <span>Đăng tin bán xe</span>
              </Link>
              <button
                type="button"
                onClick={logout}
                className="h-11 px-4 rounded-xl border border-error/30 text-error hover:bg-error/5 text-sm font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Đăng xuất khỏi tài khoản"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                <span className="hidden sm:inline">Đăng xuất</span>
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="mt-8 border-t border-surface-container-high/80 pt-4 flex flex-wrap gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setActiveTab('info')}
              className={`px-4 py-2 rounded-xl font-label-md text-label-md font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'info'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'bg-surface-container-low text-on-surface-variant hover:text-primary hover:bg-surface-container'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">badge</span>
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
              <span>{isShowroomUser ? 'Hồ sơ Showroom' : 'Nâng cấp Showroom'}</span>
              {isShowroomUser && (
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
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
              {listings.length > 0 && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    activeTab === 'listings' ? 'bg-on-primary/20 text-on-primary' : 'bg-surface-container-high text-primary'
                  }`}
                >
                  {listings.length}
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
            displayName={displayName}
            setDisplayName={setDisplayName}
            phone={phone}
            setPhone={setPhone}
            provinceCode={provinceCode}
            setProvinceCode={setProvinceCode}
            address={address}
            setAddress={setAddress}
            avatarUrl={avatarUrl}
            uploadingAvatar={uploadingAvatar}
            savingInfo={savingInfo}
            handleAvatarUpload={handleAvatarUpload}
            handleRemoveAvatar={handleRemoveAvatar}
            handleSaveProfile={handleSaveProfile}
          />
        )}

        {activeTab === 'showroom' && (
          <ShowroomSettingsTab
            isShowroomUser={isShowroomUser}
            showroomData={showroomData}
            srName={srName}
            setSrName={setSrName}
            srPhone={srPhone}
            setSrPhone={setSrPhone}
            srProvinceCode={srProvinceCode}
            setSrProvinceCode={setSrProvinceCode}
            srAddress={srAddress}
            setSrAddress={setSrAddress}
            srDescription={srDescription}
            setSrDescription={setSrDescription}
            srLogoUrl={srLogoUrl}
            srBannerUrl={srBannerUrl}
            uploadingLogo={uploadingLogo}
            uploadingBanner={uploadingBanner}
            savingShowroom={savingShowroom}
            handleLogoUpload={handleLogoUpload}
            handleBannerUpload={handleBannerUpload}
            handleSaveShowroom={handleSaveShowroom}
          />
        )}

        {activeTab === 'listings' && (
          <UserListingsTab
            listings={listings}
            loadingListings={loadingListings}
            listingFilter={listingFilter}
            setListingFilter={setListingFilter}
            listingActionId={listingActionId}
            selectedPromoteListing={selectedPromoteListing}
            setSelectedPromoteListing={setSelectedPromoteListing}
            handleMarkSold={handleMarkSold}
            handleSubmitReview={handleSubmitReview}
            loadListings={loadListings}
          />
        )}

        {activeTab === 'security' && (
          <SecurityTab
            currentPassword={currentPassword}
            setCurrentPassword={setCurrentPassword}
            newPassword={newPassword}
            setNewPassword={setNewPassword}
            confirmPassword={confirmPassword}
            setConfirmPassword={setConfirmPassword}
            savingPassword={savingPassword}
            handleChangePassword={handleChangePassword}
          />
        )}
      </div>
    </div>
  );
}
