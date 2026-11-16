'use client';

import React from 'react';
import { AdminButton } from '@/features/admin/components/ui/AdminButton';
import { AdminPromotionPackage } from '@/features/admin/types';

interface PackageFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingPackage: AdminPromotionPackage | null;
  formData: {
    code: string;
    name: string;
    days: number;
    amount_vnd: number;
    original_amount_vnd: number;
    badge: string;
    description: string;
    is_active: boolean;
    sort_order: number;
  };
  setFormData: React.Dispatch<React.SetStateAction<{
    code: string;
    name: string;
    days: number;
    amount_vnd: number;
    original_amount_vnd: number;
    badge: string;
    description: string;
    is_active: boolean;
    sort_order: number;
  }>>;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}

export const PackageFormModal: React.FC<PackageFormModalProps> = ({
  isOpen,
  onClose,
  editingPackage,
  formData,
  setFormData,
  onSubmit,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-surface-container-lowest w-full max-w-lg rounded-3xl border border-surface-container-high shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-surface-container-high flex items-center justify-between">
          <h3 className="font-bold text-base text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-secondary">
              {editingPackage ? 'edit_note' : 'add_box'}
            </span>
            <span>{editingPackage ? 'Cập Nhật Gói Khuyến Mãi' : 'Tạo Gói Khuyến Mãi Mới'}</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-outline hover:text-primary transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-primary block mb-1">Mã Gói (Code) *</label>
              <input
                type="text"
                required
                disabled={Boolean(editingPackage)}
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="VD: PROMO_7_DAYS"
                className="w-full px-3 py-2 rounded-xl border border-surface-container-high bg-surface-container-low text-primary focus:outline-none focus:border-secondary font-mono disabled:opacity-60"
              />
            </div>

            <div>
              <label className="font-semibold text-primary block mb-1">Tên Gói Hiển Thị *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="VD: Gói Nổi Bật 7 Ngày"
                className="w-full px-3 py-2 rounded-xl border border-surface-container-high bg-surface-container-low text-primary focus:outline-none focus:border-secondary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="font-semibold text-primary block mb-1">Thời hạn (Ngày) *</label>
              <input
                type="number"
                min={1}
                max={365}
                required
                value={formData.days}
                onChange={(e) => setFormData({ ...formData, days: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 rounded-xl border border-surface-container-high bg-surface-container-low text-primary focus:outline-none focus:border-secondary"
              />
            </div>

            <div>
              <label className="font-semibold text-primary block mb-1">Giá Bán Sau Ưu Đãi (VNĐ) *</label>
              <input
                type="number"
                step={1000}
                min={0}
                required
                value={formData.amount_vnd}
                onChange={(e) => setFormData({ ...formData, amount_vnd: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-xl border border-surface-container-high bg-surface-container-low text-primary focus:outline-none focus:border-secondary font-semibold text-secondary"
              />
            </div>

            <div>
              <label className="font-semibold text-primary block mb-1">Giá Gốc Gạch Ngang (VNĐ)</label>
              <input
                type="number"
                step={1000}
                min={0}
                value={formData.original_amount_vnd}
                onChange={(e) => setFormData({ ...formData, original_amount_vnd: parseInt(e.target.value) || 0 })}
                placeholder="Tùy chọn"
                className="w-full px-3 py-2 rounded-xl border border-surface-container-high bg-surface-container-low text-primary focus:outline-none focus:border-secondary line-through text-outline"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-primary block mb-1">Huy Hiệu (Badge)</label>
              <input
                type="text"
                value={formData.badge}
                onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                placeholder="VD: Phổ biến nhất, Tiết kiệm 30%"
                className="w-full px-3 py-2 rounded-xl border border-surface-container-high bg-surface-container-low text-primary focus:outline-none focus:border-secondary"
              />
            </div>

            <div>
              <label className="font-semibold text-primary block mb-1">Thứ tự sắp xếp</label>
              <input
                type="number"
                value={formData.sort_order}
                onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-xl border border-surface-container-high bg-surface-container-low text-primary focus:outline-none focus:border-secondary"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-primary block mb-1">Mô tả chi tiết quyền lợi</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Mô tả các quyền lợi hiển thị nổi bật dành cho người bán..."
              className="w-full px-3 py-2 rounded-xl border border-surface-container-high bg-surface-container-low text-primary focus:outline-none focus:border-secondary leading-relaxed resize-none"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="pkgActive"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 rounded border-outline/50 text-secondary accent-secondary cursor-pointer"
            />
            <label htmlFor="pkgActive" className="font-semibold text-primary cursor-pointer select-none">
              Kích hoạt mở bán ngay cho khách hàng trên sàn
            </label>
          </div>

          <div className="pt-4 border-t border-surface-container-high flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-surface-container-high text-outline hover:text-primary hover:bg-surface-container-high transition-colors font-medium cursor-pointer"
            >
              Hủy bỏ
            </button>
            <AdminButton type="submit" variant="primary" size="sm" icon="save">
              Lưu Cấu Hình Gói
            </AdminButton>
          </div>
        </form>
      </div>
    </div>
  );
};
