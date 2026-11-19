'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { POPULAR_PROVINCES } from '@/features/auth/constants/provinces';

interface UseProfileInfoProps {
  user: any;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export function useProfileInfo({ user, showToast }: UseProfileInfoProps) {
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [provinceCode, setProvinceCode] = useState('01');
  const [address, setAddress] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [savingInfo, setSavingInfo] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.display_name || user.full_name || '');
      setPhone(user.phone || user.phone_number || '');
      if (user.province_code) setProvinceCode(user.province_code);
      if (user.address) setAddress(user.address);
      if (user.avatar_url) setAvatarUrl(user.avatar_url);
    }
  }, [user]);

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

  return {
    displayName,
    setDisplayName,
    phone,
    setPhone,
    provinceCode,
    setProvinceCode,
    address,
    setAddress,
    avatarUrl,
    uploadingAvatar,
    savingInfo,
    handleAvatarUpload,
    handleRemoveAvatar,
    handleSaveProfile,
  };
}

