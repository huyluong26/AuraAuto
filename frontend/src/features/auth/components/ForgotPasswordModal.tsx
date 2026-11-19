'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export function ForgotPasswordModal({
  isOpen,
  onClose,
  showToast,
}: ForgotPasswordModalProps) {
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);

  if (!isOpen) return null;

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    setForgotLoading(true);
    try {
      await api.forgotPassword(forgotEmail.trim());
      setForgotSuccess(true);
    } catch (err: any) {
      showToast(err?.message || 'Không thể gửi yêu cầu đặt lại mật khẩu', 'error');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleClose = () => {
    setForgotSuccess(false);
    setForgotEmail('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-surface-container-lowest border border-surface-container-high rounded-2xl shadow-2xl p-6 relative">
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 text-outline hover:text-primary transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>

        {forgotSuccess ? (
          <div className="text-center py-4">
            <div className="w-12 h-12 bg-secondary-container text-secondary rounded-full flex items-center justify-center mx-auto mb-3 border border-secondary/20">
              <span className="material-symbols-outlined text-2xl">mail</span>
            </div>
            <h3 className="text-lg font-bold text-primary mb-2">Đã gửi hướng dẫn!</h3>
            <p className="text-xs text-outline mb-6 leading-relaxed">
              Nếu email <strong className="text-primary">{forgotEmail}</strong> tồn tại trên hệ thống, chúng tôi đã gửi liên kết đặt lại mật khẩu. Vui lòng kiểm tra hộp thư đến (và thư mục Spam).
            </p>
            <button
              type="button"
              onClick={handleClose}
              className="w-full h-11 bg-primary text-on-primary rounded-xl font-medium text-sm hover:opacity-90 transition-opacity cursor-pointer"
            >
              Đã hiểu & Đóng
            </button>
          </div>
        ) : (
          <div>
            <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-xl">lock_reset</span>
            </div>
            <h3 className="text-lg font-bold text-primary mb-1">Quên mật khẩu?</h3>
            <p className="text-xs text-outline mb-5">
              Nhập địa chỉ email đăng ký tài khoản của bạn. Hệ thống sẽ gửi một liên kết bảo mật để thiết lập lại mật khẩu mới.
            </p>

            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-outline mb-1.5 uppercase tracking-wider">
                  Địa chỉ Email
                </label>
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="email@domain.com"
                  className="w-full h-11 px-3.5 bg-surface border border-surface-container-high rounded-xl text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 h-11 border border-surface-container-high text-outline hover:text-primary rounded-xl font-medium text-sm transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="flex-1 h-11 bg-primary text-on-primary rounded-xl font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2 cursor-pointer"
                >
                  {forgotLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      <span>Đang gửi...</span>
                    </>
                  ) : (
                    <span>Gửi liên kết</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

