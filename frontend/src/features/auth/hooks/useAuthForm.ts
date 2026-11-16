'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { AuthMode, AccountType } from '../types';
import { POPULAR_PROVINCES } from '../constants/provinces';

export function useAuthForm(initialMode: AuthMode = 'login') {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>(initialMode);

  // Login Form States
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginShowPassword, setLoginShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Register Form States
  const [accountType, setAccountType] = useState<AccountType>('INDIVIDUAL');
  const [regName, setRegName] = useState(''); // Họ tên cá nhân HOẶC Họ tên người đại diện Showroom
  const [regShowroomName, setRegShowroomName] = useState(''); // Tên Showroom / Doanh nghiệp
  const [regTaxCode, setRegTaxCode] = useState(''); // Mã số thuế / ĐKKD
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regProvinceCode, setRegProvinceCode] = useState('01'); // Default: Hà Nội
  const [regAddress, setRegAddress] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regShowPassword, setRegShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Feedback States
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  }, []);

  const handleLoginSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const identifier = loginIdentifier.trim();
      if (!identifier) {
        showToast('Vui lòng nhập email hoặc số điện thoại.', 'error');
        return;
      }
      if (!loginPassword) {
        showToast('Vui lòng nhập mật khẩu.', 'error');
        return;
      }

      setLoading(true);

      try {
        const res = await api.login(identifier, loginPassword);
        if (typeof window !== 'undefined') {
          localStorage.setItem('access_token', res.access_token);
          localStorage.setItem('user', JSON.stringify(res.user));
          // Lưu khu vực người dùng vào preference để tự động lọc xe phù hợp
          if (res.user?.province_code) {
            localStorage.setItem('user_province_code', res.user.province_code);
          }
          window.dispatchEvent(new Event('aura_auth_changed'));
        }

        showToast('Đăng nhập thành công! Đang chuyển hướng...', 'success');
        setTimeout(() => {
          router.push('/');
        }, 800);
      } catch (err: any) {
        showToast(err.message || 'Email/Số điện thoại hoặc mật khẩu không chính xác.', 'error');
      } finally {
        setLoading(false);
      }
    },
    [loginIdentifier, loginPassword, router, showToast]
  );

  const handleRegisterSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!agreeTerms) {
        showToast('Vui lòng đồng ý với Điều khoản dịch vụ và Chính sách bảo mật.', 'error');
        return;
      }

      const isShowroom = accountType === 'SHOWROOM';
      const name = regName.trim();
      const showroomName = regShowroomName.trim();
      const email = regEmail.trim().toLowerCase();
      const phone = regPhone.trim();
      const address = regAddress.trim();
      const password = regPassword;

      if (isShowroom) {
        if (!showroomName || showroomName.length < 2) {
          showToast('Vui lòng nhập tên Showroom / Doanh nghiệp (tối thiểu 2 ký tự).', 'error');
          return;
        }
        if (!name || name.length < 2) {
          showToast('Vui lòng nhập họ tên người đại diện Showroom.', 'error');
          return;
        }
        if (!phone) {
          showToast('Vui lòng cung cấp Hotline / Số điện thoại liên hệ của Showroom.', 'error');
          return;
        }
        if (!address || address.length < 5) {
          showToast('Vui lòng cung cấp địa chỉ trụ sở / salon cụ thể của Showroom.', 'error');
          return;
        }
      } else {
        if (name.length < 2) {
          showToast('Họ và tên phải có tối thiểu 2 ký tự.', 'error');
          return;
        }
      }

      if (!email || !email.includes('@')) {
        showToast('Vui lòng nhập địa chỉ email hợp lệ.', 'error');
        return;
      }

      // Kiểm tra độ mạnh mật khẩu phía client để báo sớm cho user
      if (password.length < 8) {
        showToast('Mật khẩu phải có tối thiểu 8 ký tự.', 'error');
        return;
      }
      if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
        showToast('Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số.', 'error');
        return;
      }

      const selectedProvince = POPULAR_PROVINCES.find((p) => p.code === regProvinceCode);
      const provinceName = selectedProvince ? selectedProvince.name : undefined;

      setLoading(true);

      try {
        await api.register({
          display_name: name,
          email,
          phone: phone || undefined,
          province_code: regProvinceCode || undefined,
          province_name: provinceName,
          address: address || undefined,
          password,
          account_type: accountType,
          showroom_name: isShowroom ? showroomName : undefined,
          tax_code: isShowroom && regTaxCode.trim() ? regTaxCode.trim() : undefined,
        });

        const successMsg = isShowroom
          ? 'Đăng ký tài khoản Doanh nghiệp / Showroom thành công! Vui lòng đăng nhập.'
          : 'Đăng ký tài khoản cá nhân thành công! Vui lòng đăng nhập.';

        showToast(successMsg, 'success');
        setTimeout(() => {
          setMode('login');
          setLoginIdentifier(email);
          setLoginPassword('');
        }, 1200);
      } catch (err: any) {
        showToast(err.message || 'Đăng ký không thành công. Vui lòng kiểm tra lại thông tin.', 'error');
      } finally {
        setLoading(false);
      }
    },
    [
      agreeTerms,
      accountType,
      regName,
      regShowroomName,
      regTaxCode,
      regEmail,
      regPhone,
      regPassword,
      regProvinceCode,
      regAddress,
      showToast,
    ]
  );

  return {
    mode,
    setMode,
    // Login
    loginIdentifier,
    setLoginIdentifier,
    loginPassword,
    setLoginPassword,
    loginShowPassword,
    setLoginShowPassword,
    rememberMe,
    setRememberMe,
    handleLoginSubmit,
    // Register
    accountType,
    setAccountType,
    regName,
    setRegName,
    regShowroomName,
    setRegShowroomName,
    regTaxCode,
    setRegTaxCode,
    regEmail,
    setRegEmail,
    regPhone,
    setRegPhone,
    regProvinceCode,
    setRegProvinceCode,
    regAddress,
    setRegAddress,
    regPassword,
    setRegPassword,
    regShowPassword,
    setRegShowPassword,
    agreeTerms,
    setAgreeTerms,
    handleRegisterSubmit,
    // Status & Feedback
    loading,
    toastMessage,
    toastType,
    showToast,
  };
}
