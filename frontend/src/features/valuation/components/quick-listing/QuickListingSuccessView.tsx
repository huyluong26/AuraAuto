'use client';

import React from 'react';
import Link from 'next/link';
import { CheckCircle2, ExternalLink } from 'lucide-react';
import { formatVND } from '@/lib/api';
import { QuickListingData } from '../../types';

interface QuickListingSuccessViewProps {
  createdListingId: string;
  title: string;
  priceVnd: number;
  initialData: QuickListingData;
  locationAddress: string;
  totalPhotosCount: number;
  onClose: () => void;
}

export function QuickListingSuccessView({
  createdListingId,
  title,
  priceVnd,
  initialData,
  locationAddress,
  totalPhotosCount,
  onClose,
}: QuickListingSuccessViewProps) {
  return (
    <div className="p-8 sm:p-10 text-center space-y-6 animate-in fade-in duration-300">
      <div className="w-16 h-16 rounded-2xl bg-secondary-container text-secondary mx-auto flex items-center justify-center shadow-xs">
        <CheckCircle2 className="w-9 h-9" />
      </div>

      <div className="space-y-1.5">
        <h4 className="font-display text-2xl font-bold text-[#1a1c1a]">
          Xuất Bản Tin Đăng Xe Thành Công!
        </h4>
        <p className="text-xs sm:text-sm text-[#666] max-w-md mx-auto">
          Chiếc xe <strong>{title}</strong> với giá{' '}
          <strong>{formatVND(priceVnd)}</strong> đã được đưa lên sàn AuraAuto.
        </p>
      </div>

      <div className="p-5 rounded-2xl bg-[#faf9f6] border border-[#eae8e3] max-w-md mx-auto text-xs text-left space-y-2.5">
        <div className="flex justify-between">
          <span className="text-[#777]">Dòng xe:</span>
          <span className="font-semibold">{initialData.brand} {initialData.model}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#777]">Năm &amp; ODO:</span>
          <span className="font-semibold">{initialData.year} • {initialData.odometerKm.toLocaleString('vi-VN')} km</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#777]">Màu sắc:</span>
          <span className="font-semibold">{initialData.color || 'Tiêu chuẩn'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#777]">Địa chỉ xem xe:</span>
          <span className="font-semibold truncate max-w-[200px]">{locationAddress}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#777]">Hình ảnh:</span>
          <span className="font-semibold text-secondary">{totalPhotosCount} ảnh thực tế có nhãn</span>
        </div>
      </div>

      <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href={`/xe/${createdListingId}`}
          className="px-6 py-3 rounded-xl bg-[#1a1c1a] hover:bg-[#b89b72] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-colors"
        >
          <span>Xem tin vừa đăng</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
        <button
          type="button"
          onClick={onClose}
          className="px-6 py-3 rounded-xl border border-[#eae8e3] bg-white hover:bg-[#f4f3f0] text-xs font-semibold text-[#555] transition-colors"
        >
          Đóng
        </button>
      </div>
    </div>
  );
}
