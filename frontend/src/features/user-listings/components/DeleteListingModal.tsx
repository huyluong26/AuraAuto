'use client';

import React from 'react';
import { ListingItem } from '@/types';

interface DeleteListingModalProps {
  listing: ListingItem | null;
  deleting: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export const DeleteListingModal: React.FC<DeleteListingModalProps> = ({
  listing,
  deleting,
  onClose,
  onConfirm,
}) => {
  if (!listing) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl border border-[#e8e6e1] space-y-4">
        <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto">
          <span className="material-symbols-outlined text-[22px]">delete</span>
        </div>
        <div className="text-center space-y-1">
          <h3 className="text-base font-bold text-[#111827] font-headline">Xóa tin đăng xe này?</h3>
          <p className="text-xs text-[#6b7280] leading-relaxed">
            Bạn có chắc chắn muốn xóa tin <strong>&ldquo;{listing.title}&rdquo;</strong>? Tin xe và toàn bộ dữ liệu đi kèm sẽ bị xóa vĩnh viễn khỏi hệ thống AuraAuto.
          </p>
        </div>
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-md text-xs font-medium border border-[#d8d6d0] bg-white text-[#334155] hover:bg-[#faf9f6] transition-colors cursor-pointer shadow-2xs active:scale-[0.99]"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={onConfirm}
            className="px-4 py-1.5 rounded-md text-xs font-semibold bg-[#dc2626] text-white hover:bg-[#b91c1c] transition-all cursor-pointer disabled:opacity-50 shadow-2xs active:scale-[0.99]"
          >
            {deleting ? 'Đang xóa...' : 'Xác nhận xóa'}
          </button>
        </div>
      </div>
    </div>
  );
};
