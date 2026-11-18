'use client';

import React from 'react';
import Link from 'next/link';
import { ConversationItem } from '../types';
import { formatFullVND } from '@/lib/api';

interface PinnedCarBarProps {
  conversation: ConversationItem;
  onOpenAppointmentForm: () => void;
  onOpenOfferForm: () => void;
  onSendCallbackRequest: () => void;
  onCloseWidget: () => void;
}

export const PinnedCarBar: React.FC<PinnedCarBarProps> = ({
  conversation,
  onOpenAppointmentForm,
  onOpenOfferForm,
  onSendCallbackRequest,
  onCloseWidget,
}) => {
  return (
    <>
      {/* 1. PINNED CAR DOSSIER BAR */}
      <div className="px-3.5 py-2.5 bg-white border-b border-[#eae8e3] flex items-center justify-between gap-3 shrink-0 shadow-2xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-lg overflow-hidden bg-surface-container shrink-0 border border-surface-container-high">
            {conversation.listing.primary_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={conversation.listing.primary_image_url}
                alt={conversation.listing.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-outline">
                <span className="material-symbols-outlined text-[18px]">directions_car</span>
              </div>
            )}
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-secondary uppercase tracking-wider block">
              Xe đang trao đổi
            </span>
            <h4 className="text-xs font-bold text-[#1a1c1a] truncate">
              {conversation.listing.title}
            </h4>
            <span className="text-xs font-bold text-[#b89b72]">
              {formatFullVND(conversation.listing.price_vnd)}
            </span>
          </div>
        </div>

        <Link
          href={`/xe/${conversation.listing.id}`}
          className="px-2.5 py-1.5 rounded-lg bg-[#faf9f6] hover:bg-[#edebe6] text-[#1a1c1a] text-[11px] font-semibold transition-colors border border-[#eae8e3] shrink-0 flex items-center gap-1"
        >
          <span>Xem xe</span>
          <span className="material-symbols-outlined text-[13px]">open_in_new</span>
        </Link>
      </div>

      {/* 2. QUICK ACTION TOOLBAR */}
      <div className="px-3 py-1.5 bg-[#f4f2ee] border-b border-[#eae8e3] flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
        <button
          type="button"
          onClick={onOpenAppointmentForm}
          className="px-2.5 py-1 rounded-full bg-white hover:bg-[#1a1c1a] hover:text-white text-[#1a1c1a] text-[11px] font-semibold border border-[#eae8e3] transition-colors flex items-center gap-1 shrink-0 shadow-2xs cursor-pointer"
        >
          <span className="material-symbols-outlined text-[14px] text-secondary">
            calendar_month
          </span>
          <span>Lên lịch xem xe</span>
        </button>

        <button
          type="button"
          onClick={onOpenOfferForm}
          className="px-2.5 py-1 rounded-full bg-white hover:bg-[#1a1c1a] hover:text-white text-[#1a1c1a] text-[11px] font-semibold border border-[#eae8e3] transition-colors flex items-center gap-1 shrink-0 shadow-2xs cursor-pointer"
        >
          <span className="material-symbols-outlined text-[14px] text-secondary">payments</span>
          <span>Đề xuất trả giá</span>
        </button>

        <button
          type="button"
          onClick={onSendCallbackRequest}
          className="px-2.5 py-1 rounded-full bg-white hover:bg-[#1a1c1a] hover:text-white text-[#1a1c1a] text-[11px] font-semibold border border-[#eae8e3] transition-colors flex items-center gap-1 shrink-0 shadow-2xs cursor-pointer"
        >
          <span className="material-symbols-outlined text-[14px] text-blue-600">call</span>
          <span>Yêu cầu gọi lại</span>
        </button>

        <Link
          href="/lich-hen"
          onClick={onCloseWidget}
          className="px-2.5 py-1 rounded-full bg-white hover:bg-[#1a1c1a] hover:text-white text-[#1a1c1a] text-[11px] font-semibold border border-[#eae8e3] transition-colors flex items-center gap-1 shrink-0 shadow-2xs"
        >
          <span className="material-symbols-outlined text-[14px] text-purple-600">
            event_available
          </span>
          <span>Quản lý lịch hẹn</span>
        </Link>
      </div>
    </>
  );
};
