'use client';

import React, { useState, useEffect } from 'react';
import { AdminListingItem } from '../types';
import { formatVND } from '@/lib/api';
import { AdminButton } from './ui/AdminButton';

interface ListingQuickEditModalProps {
  item: AdminListingItem | null;
  onClose: () => void;
  onSave: (
    id: string,
    data: {
      title: string;
      price_vnd: number;
      odometer_km?: number | null;
      status: string;
      description?: string;
    }
  ) => Promise<boolean>;
}

export function ListingQuickEditModal({
  item,
  onClose,
  onSave,
}: ListingQuickEditModalProps) {
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [odo, setOdo] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setTitle(item.title);
      setPrice(item.price_vnd);
      setOdo(item.odometer_km ? String(item.odometer_km) : '');
      setStatus(item.status);
    }
  }, [item]);

  if (!item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const success = await onSave(item.id, {
      title: title.trim(),
      price_vnd: Number(price),
      odometer_km: odo ? Number(odo) : null,
      status: status,
    });
    setSaving(false);
    if (success) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-surface-container-lowest border border-surface-container-high rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden p-6 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-surface-container-high">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary-container/50 border border-secondary/20 flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-[20px]">edit_note</span>
            </div>
            <div>
              <h3 className="font-headline-sm text-base font-bold text-primary">
                Chỉnh sửa nhanh bài đăng
              </h3>
              <span className="font-body-sm text-[11px] text-outline font-mono">
                ID: {item.id}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-surface-container-low hover:bg-surface-container-high text-outline hover:text-primary flex items-center justify-center transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="space-y-1">
            <label className="font-label-sm text-xs font-semibold text-primary">
              Tiêu đề bài đăng
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm rounded-xl border border-surface-container-high bg-surface-container-lowest focus:border-secondary focus:ring-1 focus:ring-secondary focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-label-sm text-xs font-semibold text-primary">
                Giá niêm yết (VNĐ)
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                required
                className="w-full px-3 py-2 text-sm rounded-xl border border-surface-container-high bg-surface-container-lowest focus:border-secondary focus:ring-1 focus:ring-secondary focus:outline-none"
              />
              <span className="text-[11px] text-secondary font-semibold block">
                {formatVND(price)}
              </span>
            </div>

            <div className="space-y-1">
              <label className="font-label-sm text-xs font-semibold text-primary">
                Số ODO (km)
              </label>
              <input
                type="number"
                value={odo}
                onChange={(e) => setOdo(e.target.value)}
                placeholder="Ví dụ: 25000"
                className="w-full px-3 py-2 text-sm rounded-xl border border-surface-container-high bg-surface-container-lowest focus:border-secondary focus:ring-1 focus:ring-secondary focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-label-sm text-xs font-semibold text-primary">
              Trạng thái bài đăng
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-surface-container-high bg-surface-container-lowest focus:border-secondary focus:ring-1 focus:ring-secondary focus:outline-none cursor-pointer"
            >
              <option value="DRAFT">Bản nháp (DRAFT)</option>
              <option value="PENDING_REVIEW">Chờ kiểm duyệt (PENDING_REVIEW)</option>
              <option value="PUBLISHED">Đang hiển thị công khai (PUBLISHED)</option>
              <option value="REJECTED">Từ chối (REJECTED)</option>
              <option value="SOLD">Đã bán (SOLD)</option>
              <option value="REMOVED">Đã gỡ bài (REMOVED)</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-container-high">
            <AdminButton variant="outline" size="sm" type="button" onClick={onClose}>
              Hủy bỏ
            </AdminButton>
            <AdminButton
              variant="primary"
              size="sm"
              type="submit"
              loading={saving}
              icon="save"
            >
              Lưu thay đổi
            </AdminButton>
          </div>
        </form>
      </div>
    </div>
  );
}
