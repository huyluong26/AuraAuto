'use client';

import { useState, useCallback, useEffect } from 'react';
import { api } from '@/lib/api';

interface UseShowroomSettingsProps {
  isLoggedIn: boolean;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export function useShowroomSettings({ isLoggedIn, showToast }: UseShowroomSettingsProps) {
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

  useEffect(() => {
    if (isLoggedIn) {
      loadShowroom();
    }
  }, [isLoggedIn, loadShowroom]);

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

  return {
    showroomData,
    loadingShowroom,
    srName,
    setSrName,
    srPhone,
    setSrPhone,
    srProvinceCode,
    setSrProvinceCode,
    srAddress,
    setSrAddress,
    srDescription,
    setSrDescription,
    srLogoUrl,
    srBannerUrl,
    uploadingLogo,
    uploadingBanner,
    savingShowroom,
    handleLogoUpload,
    handleBannerUpload,
    handleSaveShowroom,
    loadShowroom,
  };
}

