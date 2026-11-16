'use client';

import React, { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'success';
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
        return 'bg-primary text-on-primary hover:bg-primary/85 border-transparent shadow-xs';
      case 'secondary':
        return 'bg-secondary text-white hover:bg-secondary/90 border-transparent shadow-xs';
      case 'outline':
        return 'bg-surface-container-lowest text-on-surface border border-surface-container-high hover:bg-surface-container-low hover:border-outline/40 shadow-2xs';
      case 'danger':
        return 'bg-red-600 text-white hover:bg-red-700 border-transparent shadow-xs';
      case 'success':
        return 'bg-emerald-600 text-white hover:bg-emerald-700 border-transparent shadow-xs';
      case 'ghost':
        return 'bg-transparent text-on-surface hover:bg-surface-container-high border-transparent';
      default:
        return 'bg-primary text-on-primary';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'xs':
        return 'px-2 py-1 text-xs gap-1 rounded-md';
      case 'sm':
        return 'px-3 py-1.5 text-xs font-medium gap-1.5 rounded-lg';
      case 'md':
        return 'px-4 py-2 text-sm font-semibold gap-2 rounded-xl';
      case 'lg':
        return 'px-6 py-2.5 text-base font-semibold gap-2.5 rounded-xl';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'xs':
        return 'text-[14px]';
      case 'sm':
        return 'text-[16px]';
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
