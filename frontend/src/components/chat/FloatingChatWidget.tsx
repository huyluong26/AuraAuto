'use client';

import React, { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useChatConversations } from './hooks/useChatConversations';
import { useChatMessages } from './hooks/useChatMessages';
import { ChatConversationList } from './components/ChatConversationList';
import { PinnedCarBar } from './components/PinnedCarBar';
import { InChatAppointmentModal } from './components/InChatAppointmentModal';
import { InChatPriceOfferModal } from './components/InChatPriceOfferModal';
import { ChatMessageThread } from './components/ChatMessageThread';

export default function FloatingChatWidget() {
  const { user, isLoggedIn } = useCurrentUser();
  const [toast, setToast] = useState<string | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = useCallback((msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 4500);
  }, []);

  // 1. Conversations Manager Hook
  const {
    isOpen,
    setIsOpen,
    conversations,
    activeConv,
    setActiveConv,
    loadingConvs,
    loadConversations,
    selectConversation,
    totalUnread,
  } = useChatConversations({
    isLoggedIn,
    onToast: showToast,
  });

  // 2. Messages & Actions Manager Hook
  const {
    messages,
    loadingMsgs,
    sending,
    inputText,
    setInputText,
    showAppointmentForm,
    setShowAppointmentForm,
    apptDate,
    setApptDate,
    apptTime,
    setApptTime,
    apptLocation,
    setApptLocation,
    apptNote,
    setApptNote,
    submittingAppt,
    showOfferForm,
    setShowOfferForm,
    offerPriceText,
    setOfferPriceText,
    appointmentStatuses,
    messagesEndRef,
    handleSendMessage,
    handleCreateAppointment,
    handleConfirmAppointment,
    handleDeclineAppointment,
    handleCancelAppointment,
    handleSendOffer,
  } = useChatMessages({
    activeConv,
    isLoggedIn,
    onToast: showToast,
    onRefreshConversations: loadConversations,
  });

  return (
    <>
      {/* 1. FLOATING CHAT BUTTON */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5">
        {!isOpen && totalUnread > 0 && (
          <div
            onClick={() => {
              setIsOpen(true);
              if (isLoggedIn) loadConversations();
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white text-[#1a1c1a] border border-[#eae8e3] shadow-[0_8px_30px_rgba(0,0,0,0.12)] text-xs font-semibold cursor-pointer hover:border-[#b89b72] transition-all animate-in fade-in slide-in-from-right-3 duration-300 select-none"
          >
            <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
            <span>
              Bạn có <strong className="text-red-600 font-bold">{totalUnread}</strong> tin nhắn chờ
            </span>
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            setIsOpen(!isOpen);
            if (!isOpen && isLoggedIn) loadConversations();
          }}
          aria-label="Mở khung chat trao đổi mua bán xe"
          className="relative w-14 h-14 rounded-full bg-[#1a1c1a] hover:bg-black text-white flex items-center justify-center shadow-[0_10px_35px_rgba(0,0,0,0.25)] hover:scale-105 active:scale-95 transition-all duration-300 border border-white/20 ring-2 ring-[#b89b72]/40 cursor-pointer group"
        >
          {isOpen ? (
            <span className="material-symbols-outlined text-[24px] text-white">close</span>
          ) : (
            <span className="material-symbols-outlined text-[24px] text-white group-hover:text-secondary-fixed transition-colors">
              chat
            </span>
          )}

          {totalUnread > 0 && !isOpen && (
            <span className="absolute -top-1 -right-1 px-1.5 min-w-[22px] h-[22px] rounded-full bg-error text-on-error text-[11px] font-bold flex items-center justify-center border-2 border-white shadow-lg animate-pulse">
              {totalUnread > 9 ? '9+' : totalUnread}
            </span>
          )}
        </button>
      </div>

      {/* 2. CHAT DRAWER / WINDOW */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 sm:right-6 z-50 w-[95vw] sm:w-[440px] h-[620px] max-h-[85vh] rounded-2xl bg-white shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-[#eae8e3] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200 font-sans text-[#1a1c1a]">
          {/* Toast Notification */}
          {toast && (
            <div className="absolute top-16 inset-x-4 z-50 px-3.5 py-2.5 rounded-xl bg-[#1a1c1a] text-white text-xs font-semibold shadow-xl border border-white/10 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
              <span className="material-symbols-outlined text-secondary text-[18px]">info</span>
              <span className="flex-1">{toast}</span>
              <button
                type="button"
                onClick={() => setToast(null)}
                className="text-white/60 hover:text-white"
              >
                ✕
              </button>
            </div>
          )}

          {/* HEADER */}
          <div className="px-4 py-3 bg-[#faf9f6] border-b border-[#eae8e3] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              {activeConv ? (
                <>
                  <button
                    type="button"
                    onClick={() => setActiveConv(null)}
                    className="p-1 rounded-lg hover:bg-[#eae8e3] text-outline hover:text-[#1a1c1a] transition-colors cursor-pointer mr-0.5"
                    title="Quay lại danh sách trao đổi"
                  >
                    <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                  </button>
                  <div className="w-8 h-8 rounded-full bg-[#edebe6] text-[#1a1c1a] font-bold flex items-center justify-center uppercase text-xs border border-[#eae8e3] shrink-0">
                    {activeConv.other_participant.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={activeConv.other_participant.avatar_url}
                        alt={activeConv.other_participant.display_name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      activeConv.other_participant.display_name.slice(0, 2)
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-xs sm:text-sm text-[#1a1c1a] truncate flex items-center gap-1">
                      <span>{activeConv.other_participant.display_name}</span>
                      <span className="material-symbols-outlined text-secondary text-[14px]">
                        verified
                      </span>
                    </div>
                    <div className="text-[11px] text-secondary font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                      <span>Đang trực tuyến</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#edebe6] border border-[#eae8e3] flex items-center justify-center text-[#1a1c1a]">
                    <span className="material-symbols-outlined text-[18px]">forum</span>
                  </div>
                  <div>
                    <h2 className="font-bold text-xs sm:text-sm text-[#1a1c1a] font-display">
                      Trao đổi Mua Bán Xe
                    </h2>
                    <p className="text-[10px] text-outline">Liên hệ trực tiếp & Lên lịch xem xe</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1">
              <Link
                href="/lich-hen"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-[#eae8e3] text-outline hover:text-[#1a1c1a] transition-colors"
                title="Mở Quản Lý Lịch Hẹn Xem Xe"
              >
                <span className="material-symbols-outlined text-[18px]">calendar_month</span>
              </Link>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-[#eae8e3] text-outline hover:text-[#1a1c1a] transition-colors cursor-pointer"
                title="Đóng cửa sổ"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          </div>

          {/* VIEW A: CONVERSATION LIST */}
          {!activeConv && (
            <ChatConversationList
              isLoggedIn={isLoggedIn}
              loadingConvs={loadingConvs}
              conversations={conversations}
              totalUnread={totalUnread}
              onSelectConversation={selectConversation}
              onCloseWidget={() => setIsOpen(false)}
            />
          )}

          {/* VIEW B: ACTIVE CONVERSATION */}
          {activeConv && (
            <div className="flex-1 flex flex-col min-h-0 bg-[#faf9f6]">
              {/* Pinned Car Bar & Quick Actions */}
              <PinnedCarBar
                conversation={activeConv}
                onOpenAppointmentForm={() => setShowAppointmentForm(!showAppointmentForm)}
                onOpenOfferForm={() => setShowOfferForm(!showOfferForm)}
                onSendCallbackRequest={() =>
                  handleSendMessage(
                    '📞 Tôi rất quan tâm chiếc xe này và muốn trao đổi thêm. Bạn vui lòng gọi lại tư vấn giúp tôi nhé!'
                  )
                }
                onCloseWidget={() => setIsOpen(false)}
              />

              {/* Form: Lên lịch hẹn xem xe */}
              {showAppointmentForm && (
                <InChatAppointmentModal
                  apptDate={apptDate}
                  setApptDate={setApptDate}
                  apptTime={apptTime}
                  setApptTime={setApptTime}
                  apptLocation={apptLocation}
                  setApptLocation={setApptLocation}
                  apptNote={apptNote}
                  setApptNote={setApptNote}
                  submittingAppt={submittingAppt}
                  onClose={() => setShowAppointmentForm(false)}
                  onSubmit={handleCreateAppointment}
                />
              )}

              {/* Form: Đề xuất trả giá */}
              {showOfferForm && (
                <InChatPriceOfferModal
                  offerPriceText={offerPriceText}
                  setOfferPriceText={setOfferPriceText}
                  onClose={() => setShowOfferForm(false)}
                  onSubmit={handleSendOffer}
                />
              )}

              {/* Messages Body */}
              <ChatMessageThread
                messages={messages}
                loadingMsgs={loadingMsgs}
                currentUserId={user?.id ? String(user.id) : undefined}
                appointmentStatuses={appointmentStatuses}
                messagesEndRef={messagesEndRef}
                onSendMessage={handleSendMessage}
                onConfirmAppointment={handleConfirmAppointment}
                onDeclineAppointment={handleDeclineAppointment}
                onCancelAppointment={handleCancelAppointment}
                onCloseWidget={() => setIsOpen(false)}
              />

              {/* Input Bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="p-3 bg-white border-t border-[#eae8e3] flex items-center gap-2 shrink-0"
              >
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Nhập tin nhắn trao đổi về xe..."
                  className="flex-1 px-3.5 py-2 rounded-xl bg-[#faf9f6] border border-[#eae8e3] text-xs text-[#1a1c1a] placeholder:text-outline focus:outline-none focus:border-[#1a1c1a] transition-colors"
                />
                <button
                  type="submit"
                  disabled={sending || !inputText.trim()}
                  className="px-3.5 py-2 rounded-xl bg-[#1a1c1a] text-white text-xs font-semibold hover:bg-black transition-colors disabled:opacity-40 flex items-center gap-1 cursor-pointer shrink-0 shadow-xs"
                >
                  <span className="material-symbols-outlined text-[16px]">send</span>
                  <span className="hidden sm:inline">Gửi</span>
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </>
  );
}
