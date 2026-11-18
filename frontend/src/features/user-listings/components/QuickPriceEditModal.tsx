'use client';

import React, { useState, useEffect } from 'react';
import { ListingItem } from '@/types';
import { formatVND } from '@/lib/api';

interface QuickPriceEditModalProps {
  listing: ListingItem | null;
  updating: boolean;
  onClose: () => void;
  onSave: (newPrice: number) => Promise<void>;
  onError: (msg: string) => void;
}

export const QuickPriceEditModal: React.FC<QuickPriceEditModalProps> = ({
  listing,
  updating,
  onClose,
  onSave,
  onError,
}) => {
  const [newPriceRaw, setNewPriceRaw] = useState('');

  useEffect(() => {
    if (listing) {
      setNewPriceRaw(listing.price_vnd ? listing.price_vnd.toLocaleString('vi-VN') : '');
    }
  }, [listing]);

  if (!listing) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPrice = parseInt(newPriceRaw.replace(/\D/g, ''), 10);
    if (!cleanPrice || cleanPrice < 10_000_000) {
      onError('Giá xe tối thiểu phải từ 10.000.000 ₫');
      return;
    }
    await onSave(cleanPrice);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-[#e8e6e1] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#f0ede6]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1c1a17]/5 flex items-center justify-center text-[#8c6d3b]">
              <span className="material-symbols-outlined text-[18px]">sell</span>
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#111827] font-headline">
                Cập nhật giá bán
              </h3>
              <p className="text-[11px] text-[#6b7280]">Điều chỉnh giá niêm yết tức thì trên sàn</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg hover:bg-neutral-100 flex items-center justify-center text-[#9ca3af] hover:text-[#111827] transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3 rounded-xl bg-[#faf9f6] border border-[#e8e6e1]">
            <p className="text-[10px] uppercase font-bold tracking-wider text-[#888]">
              Phương tiện điều chỉnh:
            </p>
            <p className="text-xs sm:text-sm font-semibold text-[#111827] line-clamp-1 mt-0.5">
              {listing.title}
            </p>
            <p className="text-xs text-[#666] mt-1">
              Giá hiện tại: <strong className="text-[#111827]">{formatVND(listing.price_vnd)}</strong>
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-1.5">
              Giá bán niêm yết mới (VNĐ):
            </label>
            <input
              type="text"
              required
              autoFocus
              value={newPriceRaw}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                setNewPriceRaw(val ? parseInt(val, 10).toLocaleString('vi-VN') : '');
              }}
              placeholder="Ví dụ: 850.000.000"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#dcd9d2] text-[#111827] font-bold text-base focus:bg-white focus:outline-none focus:border-[#8c6d3b] focus:ring-1 focus:ring-[#8c6d3b]/20 transition-all shadow-2xs font-mono"
            />
            {newPriceRaw && (
              <p className="text-xs text-[#8c6d3b] font-semibold mt-1.5 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">calculate</span>
                <span>Quy đổi: {formatVND(parseInt(newPriceRaw.replace(/\D/g, ''), 10))}</span>
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#f0ede6]">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-md text-xs font-medium border border-[#d8d6d0] bg-white text-[#334155] hover:bg-[#faf9f6] transition-colors cursor-pointer shadow-2xs active:scale-[0.99]"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={updating}
              className="px-4 py-1.5 rounded-md text-xs font-semibold bg-[#0f172a] text-white hover:bg-black border border-neutral-800 transition-all cursor-pointer disabled:opacity-50 shadow-2xs active:scale-[0.99]"
            >
              {updating ? 'Đang cập nhật...' : 'Lưu giá mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
