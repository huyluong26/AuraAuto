'use client';

import React from 'react';
import { ListingStatus, UserRole, UserStatus, ArticleStatus } from '../../types';

type BadgeType = ListingStatus | UserRole | UserStatus | ArticleStatus | string;

interface AdminBadgeProps {
  status: BadgeType;
  size?: 'sm' | 'md';
  showDot?: boolean;
  className?: string;
}

export function AdminBadge({
  status,
  size = 'md',
  showDot = true,
  className = '',
}: AdminBadgeProps) {
  const getBadgeConfig = (val: string) => {
    switch (val) {
      // Listing Statuses
      case 'PUBLISHED':
        return {
          label: 'Đang hiển thị',
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
          dot: 'bg-emerald-500',
          pulse: false,
        };
      case 'PENDING_REVIEW':
        return {
          label: 'Chờ duyệt',
          bg: 'bg-secondary-container/50 text-secondary border-secondary/30',
          dot: 'bg-secondary',
          pulse: true,
        };
      case 'REJECTED':
        return {
          label: 'Bị từ chối',
          bg: 'bg-red-50 text-red-700 border-red-200/80',
          dot: 'bg-red-500',
          pulse: false,
        };
      case 'DRAFT':
        return {
          label: 'Bản nháp',
          bg: 'bg-surface-container-high/60 text-outline border-surface-container-highest',
          dot: 'bg-outline',
          pulse: false,
        };
      case 'SOLD':
        return {
          label: 'Đã giao dịch',
          bg: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
          dot: 'bg-indigo-500',
          pulse: false,
        };
      case 'HIDDEN':
      case 'REMOVED':
        return {
          label: 'Đã gỡ bài',
          bg: 'bg-zinc-100 text-zinc-600 border-zinc-200',
          dot: 'bg-zinc-400',
          pulse: false,
        };

      // User Roles
      case 'ADMIN':
        return {
          label: 'Quản trị viên',
          bg: 'bg-red-50 text-red-800 border-red-300 font-bold',
          dot: 'bg-red-600',
          pulse: false,
        };
      case 'INSPECTOR':
        return {
          label: 'Kiểm duyệt viên',
          bg: 'bg-amber-50 text-amber-900 border-amber-300 font-bold',
          dot: 'bg-amber-600',
          pulse: false,
        };
      case 'SUPPORT':
        return {
          label: 'CSKH & Hỗ trợ',
          bg: 'bg-blue-50 text-blue-800 border-blue-300 font-bold',
          dot: 'bg-blue-600',
          pulse: false,
        };
      case 'USER':
        return {
          label: 'Thành viên',
          bg: 'bg-surface-container text-on-surface-variant border-surface-container-high',
          dot: 'bg-outline',
          pulse: false,
        };

      // User Statuses
      case 'ACTIVE':
        return {
          label: 'Hoạt động',
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
          dot: 'bg-emerald-500',
          pulse: false,
        };
      case 'SUSPENDED':
        return {
          label: 'Tạm khóa',
          bg: 'bg-red-50 text-red-700 border-red-200/80',
          dot: 'bg-red-500',
          pulse: false,
        };
      case 'DELETED':
        return {
          label: 'Đã khóa',
          bg: 'bg-zinc-100 text-zinc-500 border-zinc-300',
          dot: 'bg-zinc-400',
          pulse: false,
        };

      // Article Statuses
      case 'ARCHIVED':
        return {
          label: 'Lưu trữ',
          bg: 'bg-zinc-100 text-zinc-600 border-zinc-200',
          dot: 'bg-zinc-400',
          pulse: false,
        };

      // Appointment Statuses
      case 'PENDING':
        return {
          label: 'Chờ xác nhận',
          bg: 'bg-amber-50 text-amber-800 border-amber-300 font-bold',
          dot: 'bg-amber-500',
          pulse: true,
        };
      case 'CONFIRMED':
        return {
          label: 'Đã xác nhận',
          bg: 'bg-blue-50 text-blue-700 border-blue-200/80 font-bold',
          dot: 'bg-blue-500',
          pulse: false,
        };
      case 'COMPLETED':
        return {
          label: 'Đã hoàn thành',
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold',
          dot: 'bg-emerald-500',
          pulse: false,
        };
      case 'DECLINED':
        return {
          label: 'Bị từ chối',
          bg: 'bg-zinc-100 text-zinc-600 border-zinc-200',
          dot: 'bg-zinc-400',
          pulse: false,
        };
      case 'CANCELLED':
        return {
          label: 'Đã hủy lịch',
          bg: 'bg-red-50 text-red-700 border-red-200/80 font-semibold',
          dot: 'bg-red-500',
          pulse: false,
        };

      default:
        return {
          label: val,
          bg: 'bg-surface-container text-on-surface border-surface-container-high',
          dot: 'bg-outline',
          pulse: false,
        };
    }
  };

  const config = getBadgeConfig(status);
  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-[10px] gap-1'
      : 'px-2.5 py-1 text-[11px] gap-1.5';

  return (
    <span
      className={`inline-flex items-center rounded-lg border font-semibold uppercase tracking-wider select-none shrink-0 ${config.bg} ${sizeClasses} ${className}`}
    >
      {showDot && (
        <span className="relative flex h-1.5 w-1.5">
          {config.pulse && (
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${config.dot}`}
            />
          )}
          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${config.dot}`} />
        </span>
      )}
      <span>{config.label}</span>
    </span>
  );
}
