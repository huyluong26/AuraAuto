'use client';

import React from 'react';
import Link from 'next/link';
import { ConversationItem } from '../types';
import { formatVND } from '@/lib/api';

interface ChatConversationListProps {
  isLoggedIn: boolean;
  loadingConvs: boolean;
  conversations: ConversationItem[];
  totalUnread: number;
  onSelectConversation: (conv: ConversationItem) => void;
  onCloseWidget: () => void;
}

export const ChatConversationList: React.FC<ChatConversationListProps> = ({
  isLoggedIn,
  loadingConvs,
  conversations,
  totalUnread,
  onSelectConversation,
  onCloseWidget,
}) => {
  if (!isLoggedIn) {
    return (
      <div className="flex-1 flex flex-col overflow-y-auto bg-[#faf9f6]">
        <div className="m-auto p-6 text-center space-y-3 max-w-xs">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-white border border-[#eae8e3] flex items-center justify-center text-outline shadow-2xs">
            <span className="material-symbols-outlined text-[24px] text-outline">lock</span>
          </div>
          <h3 className="font-bold text-sm text-[#1a1c1a]">Đăng nhập để trò chuyện</h3>
          <p className="text-xs text-outline leading-relaxed">
            Đăng nhập để gửi đề nghị mua bán, trao đổi và lên lịch hẹn xem xe trực tiếp.
          </p>
          <Link
            href="/dang-nhap"
            onClick={onCloseWidget}
            className="inline-block px-4 py-2 rounded-xl bg-[#1a1c1a] text-white text-xs font-semibold hover:bg-black transition-colors shadow-2xs"
          >
            Đăng nhập ngay
          </Link>
        </div>
      </div>
    );
  }

  if (loadingConvs) {
    return (
      <div className="flex-1 flex flex-col overflow-y-auto bg-[#faf9f6]">
        <div className="m-auto text-center space-y-2 text-outline">
          <div className="w-5 h-5 border-2 border-[#1a1c1a] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-medium">Đang tải cuộc trao đổi...</p>
        </div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex-1 flex flex-col overflow-y-auto bg-[#faf9f6]">
        <div className="m-auto p-6 text-center space-y-3 max-w-sm">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-white border border-[#eae8e3] flex items-center justify-center text-outline shadow-2xs">
            <span className="material-symbols-outlined text-[24px] text-outline">directions_car</span>
          </div>
          <h3 className="font-bold text-sm text-[#1a1c1a]">Chưa có cuộc trao đổi nào</h3>
          <p className="text-xs text-outline leading-relaxed">
            Bạn có thể bấm &ldquo;Nhắn tin với chủ xe&rdquo; trên bất kỳ tin đăng nào để bắt đầu trao
            đổi giá và lên lịch hẹn xem xe!
          </p>
          <Link
            href="/xe"
            onClick={onCloseWidget}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1a1c1a] text-white text-xs font-semibold hover:bg-black transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">search</span>
            <span>Khám phá xe sẵn có</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-[#faf9f6] p-3 space-y-2">
      <div className="flex items-center justify-between text-[11px] font-bold text-outline uppercase tracking-wider px-1">
        <span>Giao dịch xe đang trao đổi ({conversations.length})</span>
        {totalUnread > 0 && (
          <span className="text-red-600 font-bold lowercase">{totalUnread} tin nhắn mới</span>
        )}
      </div>

      {conversations.map((conv) => (
        <button
          key={conv.id}
          type="button"
          onClick={() => onSelectConversation(conv)}
          className="w-full text-left p-3 rounded-xl bg-white border border-[#eae8e3] hover:border-[#b89b72] hover:shadow-xs transition-all flex items-center gap-3 cursor-pointer group"
        >
          {/* Car Thumbnail */}
          <div className="w-12 h-12 rounded-lg overflow-hidden bg-surface-container shrink-0 border border-surface-container-high">
            {conv.listing.primary_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={conv.listing.primary_image_url}
                alt={conv.listing.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-outline">
                <span className="material-symbols-outlined text-[20px]">directions_car</span>
              </div>
            )}
          </div>

          {/* Content details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <h4 className="font-bold text-xs text-[#1a1c1a] truncate group-hover:text-[#b89b72] transition-colors">
                {conv.listing.title}
              </h4>
              {conv.last_message_at && (
                <span className="text-[10px] text-outline shrink-0">
                  {new Date(conv.last_message_at).toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-[#725a37] font-semibold mt-0.5">
              <span>{formatVND(conv.listing.price_vnd)}</span>
              <span className="text-outline font-normal">•</span>
              <span className="text-outline font-normal truncate">
                {conv.other_participant.display_name}
              </span>
            </div>

            <p className="text-[11px] text-outline truncate mt-0.5">
              {conv.last_message_preview || 'Bắt đầu cuộc trao đổi về chiếc xe này...'}
            </p>
          </div>

          {/* Unread badge: 1, 2, 9+ */}
          {Boolean(conv.unread_count && conv.unread_count > 0) && (
            <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-bold shadow-xs shrink-0">
              {conv.unread_count && conv.unread_count > 9 ? '9+' : conv.unread_count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};
