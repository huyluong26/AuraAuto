'use client';

import React from 'react';
import { AdminButton } from '@/features/admin/components/ui/AdminButton';

interface GrantFeaturedModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetListingId: string;
  setTargetListingId: (val: string) => void;
  targetListingTitle: string;
  grantDays: number;
  setGrantDays: (val: number) => void;
  grantNote: string;
  setGrantNote: (val: string) => void;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}

export const GrantFeaturedModal: React.FC<GrantFeaturedModalProps> = ({
  isOpen,
  onClose,
  targetListingId,
  setTargetListingId,
  targetListingTitle,
  grantDays,
  setGrantDays,
  grantNote,
  setGrantNote,
  loading,
  onSubmit,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-surface-container-lowest w-full max-w-md rounded-3xl border border-surface-container-high shadow-2xl overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-surface-container-high flex items-center justify-between">
          <h3 className="font-bold text-base text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-amber-600">stars</span>
            <span>Cấp / Gia Hạn Tin Nổi Bật Thủ Công</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-outline hover:text-primary transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="font-semibold text-primary block mb-1">
              ID Tin Đăng Xe (UUID) *
            </label>
            <input
              type="text"
              required
              value={targetListingId}
              onChange={(e) => setTargetListingId(e.target.value.trim())}
              placeholder="Nhập ID tin đăng xe..."
              className="w-full px-3 py-2 rounded-xl border border-surface-container-high bg-surface-container-low text-primary focus:outline-none focus:border-secondary font-mono"
            />
            {targetListingTitle && (
              <p className="text-[11px] text-secondary font-semibold mt-1">
                Xe: {targetListingTitle}
              </p>
            )}
          </div>

          <div>
            <label className="font-semibold text-primary block mb-1">
              Số ngày muốn cấp / gia hạn thêm *
            </label>
            <div className="grid grid-cols-4 gap-2 mb-2">
              {[1, 3, 7, 30].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setGrantDays(d)}
                  className={`py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                    grantDays === d
                      ? 'bg-secondary text-on-secondary border-secondary'
                      : 'bg-surface-container-low border-surface-container-high text-outline hover:text-primary'
                  }`}
                >
                  +{d} ngày
                </button>
              ))}
            </div>
            <input
              type="number"
              min={1}
              max={365}
              required
              value={grantDays}
              onChange={(e) => setGrantDays(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 rounded-xl border border-surface-container-high bg-surface-container-low text-primary focus:outline-none focus:border-secondary font-bold"
            />
          </div>

          <div>
            <label className="font-semibold text-primary block mb-1">
              Ghi chú lý do cấp (Admin Note)
            </label>
            <input
              type="text"
              value={grantNote}
              onChange={(e) => setGrantNote(e.target.value)}
              placeholder="VD: Hỗ trợ đối tác Showroom chiến dịch tuần..."
              className="w-full px-3 py-2 rounded-xl border border-surface-container-high bg-surface-container-low text-primary focus:outline-none focus:border-secondary"
            />
          </div>

          <div className="pt-4 border-t border-surface-container-high flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-surface-container-high text-outline hover:text-primary hover:bg-surface-container-high transition-colors font-medium cursor-pointer"
            >
              Hủy
            </button>
            <AdminButton
              type="submit"
              variant="primary"
              size="sm"
              icon="verified"
              loading={loading}
            >
              Xác Nhận Kích Hoạt VIP
            </AdminButton>
          </div>
        </form>
      </div>
    </div>
  );
};
