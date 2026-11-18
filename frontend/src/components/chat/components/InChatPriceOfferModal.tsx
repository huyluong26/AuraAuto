'use client';

import React from 'react';

interface InChatPriceOfferModalProps {
  offerPriceText: string;
  setOfferPriceText: (val: string) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const InChatPriceOfferModal: React.FC<InChatPriceOfferModalProps> = ({
  offerPriceText,
  setOfferPriceText,
  onClose,
  onSubmit,
}) => {
  return (
    <form
      onSubmit={onSubmit}
      className="p-3 bg-white border-b border-[#eae8e3] space-y-2 text-xs shrink-0 shadow-sm animate-in fade-in slide-in-from-top-2"
    >
      <div className="flex items-center justify-between font-bold text-[#1a1c1a]">
        <span className="flex items-center gap-1">
          <span className="material-symbols-outlined text-secondary text-[16px]">payments</span>
          <span>Đề xuất mức giá thương lượng</span>
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-outline hover:text-[#1a1c1a] cursor-pointer"
        >
          ✕
        </button>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="text"
          required
          value={offerPriceText}
          onChange={(e) => setOfferPriceText(e.target.value)}
          placeholder="Ví dụ: 500 triệu hoặc 510.000.000 đ..."
          className="flex-1 px-3 py-1.5 rounded-lg border border-[#eae8e3] text-xs bg-[#faf9f6] text-[#1a1c1a]"
        />
        <button
          type="submit"
          className="px-3.5 py-1.5 rounded-lg bg-[#1a1c1a] text-white text-[11px] font-semibold hover:bg-black transition-colors cursor-pointer"
        >
          Gửi giá
        </button>
      </div>
    </form>
  );
};
