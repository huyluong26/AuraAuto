'use client';

import React, { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'luxury' | 'outline' | 'danger' | 'ghost' | 'success';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

interface AdminButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: string;
  iconRight?: string;
  loading?: boolean;
  children?: ReactNode;
}

export function AdminButton({
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  loading = false,
  disabled,
  children,
  className = '',
  ...props
}: AdminButtonProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-[#0f172a] hover:bg-black text-white border border-[#1e293b] active:scale-[0.98] font-semibold';
      case 'luxury':
        return 'bg-[#171614] hover:bg-black text-[#e8cf96] border border-[#8c6d3b]/50 hover:border-[#c5a880] active:scale-[0.98] font-semibold';
      case 'secondary':
        return 'bg-[#fcf9f2] hover:bg-[#f6efe0] text-[#7d5e23] border border-[#d8c5a2] hover:border-[#bfa26e] active:scale-[0.98] font-semibold';
      case 'outline':
        return 'bg-white hover:bg-slate-50 text-[#334155] hover:text-[#0f172a] border border-[#d8d6d0] hover:border-[#94a3b8] active:scale-[0.98] font-medium';
      case 'danger':
        return 'bg-white hover:bg-rose-50 text-rose-700 hover:text-rose-800 border border-rose-200 hover:border-rose-300 active:scale-[0.98] font-medium';
      case 'success':
        return 'bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-700 active:scale-[0.98] font-semibold';
      case 'ghost':
        return 'bg-transparent hover:bg-slate-100 text-[#475569] hover:text-[#0f172a] border border-transparent active:scale-[0.98] font-medium';
      default:
        return 'bg-[#0f172a] text-white';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'xs':
        return 'h-6 px-2 text-[10.5px] font-semibold gap-1 rounded-md';
      case 'sm':
        return 'h-7 px-2.5 text-xs font-semibold gap-1.5 rounded-md';
      case 'md':
        return 'h-8.5 px-3 py-1.5 text-xs sm:text-sm font-medium gap-2 rounded-lg';
      case 'lg':
        return 'h-10 px-4 py-2 text-sm sm:text-base font-semibold gap-2.5 rounded-lg';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'xs':
        return 'text-[13px]';
      case 'sm':
        return 'text-[15px]';
      case 'md':
        return 'text-[18px]';
      case 'lg':
        return 'text-[20px]';
    }
  };

  const isDisabled = disabled || loading;

  return (
    <button
      disabled={isDisabled}
      className={`inline-flex items-center justify-center font-label-md transition-all duration-150 border select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${getVariantStyles()} ${getSizeStyles()} ${className}`}
      {...props}
    >
      {loading ? (
        <span className={`material-symbols-outlined animate-spin ${getIconSize()}`}>
          progress_activity
        </span>
      ) : icon ? (
        <span className={`material-symbols-outlined ${getIconSize()}`}>{icon}</span>
      ) : null}

      {children && <span>{children}</span>}

      {!loading && iconRight && (
        <span className={`material-symbols-outlined ${getIconSize()}`}>{iconRight}</span>
      )}
    </button>
  );
}
