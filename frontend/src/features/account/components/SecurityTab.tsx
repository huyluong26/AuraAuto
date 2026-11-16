'use client';

import React from 'react';

interface SecurityTabProps {
  currentPassword: string;
  setCurrentPassword: (val: string) => void;
  newPassword: string;
  setNewPassword: (val: string) => void;
  confirmPassword: string;
  setConfirmPassword: (val: string) => void;
  savingPassword: boolean;
  handleChangePassword: (e: React.FormEvent) => Promise<void>;
}

export const SecurityTab: React.FC<SecurityTabProps> = ({
  currentPassword,
  setCurrentPassword,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  savingPassword,
  handleChangePassword,
}) => {
  return (
    <div className="bg-surface-container-lowest rounded-2xl p-6 sm:p-8 border border-surface-container-high/80 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
      <div className="max-w-md">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-primary font-headline-sm">Bảo mật & Đổi mật khẩu</h2>
          <p className="text-body-sm text-on-surface-variant mt-1">
            Đổi mật khẩu định kỳ giúp bảo vệ tài khoản và các tin đăng giao dịch xe của bạn.
          </p>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4">
          {/* Mật khẩu hiện tại */}
          <div className="space-y-1.5">
            <label htmlFor="sec-cur-pwd" className="block text-sm font-semibold text-primary">
              Mật khẩu hiện tại <span className="text-error">*</span>
            </label>
            <input
              type="password"
              id="sec-cur-pwd"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Nhập mật khẩu đang dùng"
              className="w-full h-11 px-3.5 bg-surface-container-lowest border border-surface-container-high rounded-xl text-primary placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </div>

          {/* Mật khẩu mới */}
          <div className="space-y-1.5">
            <label htmlFor="sec-new-pwd" className="block text-sm font-semibold text-primary">
              Mật khẩu mới <span className="text-error">*</span>
            </label>
            <input
              type="password"
              id="sec-new-pwd"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Tối thiểu 8 ký tự"
              className="w-full h-11 px-3.5 bg-surface-container-lowest border border-surface-container-high rounded-xl text-primary placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            />
            <p className="text-[11px] text-on-surface-variant">
              Yêu cầu: Tối thiểu 8 ký tự, có ít nhất 1 chữ hoa, 1 chữ thường và 1 chữ số.
            </p>
          </div>

          {/* Xác nhận mật khẩu mới */}
          <div className="space-y-1.5">
            <label htmlFor="sec-conf-pwd" className="block text-sm font-semibold text-primary">
              Nhập lại mật khẩu mới <span className="text-error">*</span>
            </label>
            <input
              type="password"
              id="sec-conf-pwd"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại chính xác mật khẩu mới"
              className="w-full h-11 px-3.5 bg-surface-container-lowest border border-surface-container-high rounded-xl text-primary placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </div>

          {/* Submit button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={savingPassword}
              className="h-12 w-full rounded-xl bg-primary hover:bg-inverse-surface text-on-primary font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-60 cursor-pointer"
            >
              {savingPassword && (
                <span className="material-symbols-outlined text-[18px] animate-spin">
                  progress_activity
                </span>
              )}
              <span>{savingPassword ? 'Đang cập nhật...' : 'Cập nhật mật khẩu mới'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
