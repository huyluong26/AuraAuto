'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { api, formatVND, formatFullVND } from '@/lib/api';
import { useCurrentUser } from '@/hooks/useCurrentUser';

interface ConversationItem {
  id: string;
  listing_id: string;
  last_message_at?: string;
  last_message_preview?: string;
  unread_count?: number;
  other_participant: {
    id: string;
    display_name: string;
    avatar_url?: string;
  };
  listing: {
    id: string;
    title: string;
    price_vnd: number;
    primary_image_url?: string;
    manufacture_year?: number;
  };
}

interface ChatMessageItem {
  id: string;
  conversation_id: string;
  sender_user_id: string;
  content: string;
  created_at: string;
}

interface ParsedAppointment {
  id: string;
  date: string;
  time: string;
  location: string;
  note: string;
  status: 'PENDING' | 'CONFIRMED' | 'DECLINED' | 'CANCELLED';
}

export default function FloatingChatWidget() {
  const { user, isLoggedIn } = useCurrentUser();
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConv, setActiveConv] = useState<ConversationItem | null>(null);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [inputText, setInputText] = useState('');
  const [loadingConvs, setLoadingConvs] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Quick Action: In-chat Appointment Modal
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [apptDate, setApptDate] = useState(() => {
    const d = new Date(Date.now() + 86400000);
    return d.toISOString().split('T')[0];
  });
  const [apptTime, setApptTime] = useState('09:30');
  const [apptLocation, setApptLocation] = useState('Xem xe tại showroom / địa chỉ người bán');
  const [apptNote, setApptNote] = useState('Tôi muốn kiểm tra máy móc và lái thử xe.');
  const [submittingAppt, setSubmittingAppt] = useState(false);

  // Quick Action: Price Offer
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [offerPriceText, setOfferPriceText] = useState('');

  // Local state cache for appointment statuses
  const [appointmentStatuses, setAppointmentStatuses] = useState<Record<string, string>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = useCallback((msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 4500);
  }, []);

  // 1. Fetch conversations with real unread counts
  const loadConversations = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      const data = await api.getUserConversations();
      setConversations(data || []);
    } catch {
      // Ignore background errors
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn) {
      loadConversations();
      const interval = setInterval(loadConversations, 8000);
      return () => clearInterval(interval);
    } else {
      setConversations([]);
      setActiveConv(null);
    }
  }, [isLoggedIn, loadConversations]);

  // 2. Fetch messages & mark conversation as read
  const loadMessages = useCallback(async (convId: string) => {
    if (!isLoggedIn) return;
    try {
      const msgs = await api.getConversationMessages(convId, 60);
      setMessages(msgs || []);
      // Auto-detect appointment statuses from confirmation/decline/cancellation notices
      const statusMap: Record<string, string> = {};
      (msgs || []).forEach((m: any) => {
        if (m.content.includes('✅ [XÁC NHẬN LỊCH HẸN]#ID:')) {
          const match = m.content.match(/#ID:([^#]+)/);
          if (match) statusMap[match[1]] = 'CONFIRMED';
        } else if (m.content.includes('❌ [TỪ CHỐI LỊCH HẸN]#ID:')) {
          const match = m.content.match(/#ID:([^#]+)/);
          if (match) statusMap[match[1]] = 'DECLINED';
        } else if (m.content.includes('🚫 [ĐÃ HỦY LỊCH HẸN]#ID:')) {
          const match = m.content.match(/#ID:([^#]+)/);
          if (match) statusMap[match[1]] = 'CANCELLED';
        }
      });
      if (Object.keys(statusMap).length > 0) {
        setAppointmentStatuses((prev) => ({ ...prev, ...statusMap }));
      }
    } catch {
      // Ignore background errors
    }
  }, [isLoggedIn]);

  const openConversation = async (conv: ConversationItem) => {
    setActiveConv(conv);
    setShowAppointmentForm(false);
    setShowOfferForm(false);
    setLoadingMsgs(true);

    try {
      await api.markConversationAsRead(conv.id);
      // Locally reset unread count
      setConversations((prev) =>
        prev.map((c) => (c.id === conv.id ? { ...c, unread_count: 0 } : c))
      );
      await loadMessages(conv.id);
    } finally {
      setLoadingMsgs(false);
    }
  };

  useEffect(() => {
    if (!activeConv || !isLoggedIn) return;
    const interval = setInterval(() => {
      loadMessages(activeConv.id);
    }, 4000);
    return () => clearInterval(interval);
  }, [activeConv, isLoggedIn, loadMessages]);

  // Auto-scroll messages
  useEffect(() => {
    if (activeConv && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeConv]);

  // 3. Global Custom Event Listener to open chat from any page
  useEffect(() => {
    const handleOpenChat = async (e: Event) => {
      const customEvent = e as CustomEvent<{ listingId: string }>;
      const listingId = customEvent.detail?.listingId;
      if (!listingId) return;

      setIsOpen(true);
      if (!isLoggedIn) return;

      try {
        setLoadingConvs(true);
        const conv = await api.getOrCreateConversation(listingId);
        openConversation(conv);
        await loadConversations();
      } catch (err: any) {
        showToast(err.message || 'Không thể mở cuộc trò chuyện');
      } finally {
        setLoadingConvs(false);
      }
    };

    window.addEventListener('open-car-chat', handleOpenChat as EventListener);
    return () => {
      window.removeEventListener('open-car-chat', handleOpenChat as EventListener);
    };
  }, [isLoggedIn, loadConversations, showToast]);

  // 4. Send Message
  const handleSendMessage = async (customContent?: string) => {
    const content = (customContent || inputText).trim();
    if (!content || !activeConv || sending) return;

    if (!customContent) setInputText('');
    setSending(true);

    try {
      const newMsg = await api.sendChatMessage(activeConv.id, content);
      setMessages((prev) => [...prev, newMsg]);
      loadConversations();
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi gửi tin nhắn');
    } finally {
      setSending(false);
    }
  };

  // 5. System Action: Create Appointment Proposal in Chat
  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConv || submittingAppt) return;

    setSubmittingAppt(true);
    try {
      const scheduledDateTime = new Date(`${apptDate}T${apptTime}:00`);
      const res = await api.createAppointment({
        listing_id: activeConv.listing_id,
        scheduled_at: scheduledDateTime.toISOString(),
        location: apptLocation,
        note: apptNote,
      });

      const apptId = res?.data?.id || '';
      setShowAppointmentForm(false);

      // Send structured system appointment message
      const structuredContent = `[LỊCH HẸN XEM XE]#ID:${apptId}#TIME:${apptTime}#DATE:${apptDate}#LOC:${apptLocation}#NOTE:${apptNote}`;
      await handleSendMessage(structuredContent);
      showToast('Đã gửi đề nghị hẹn xem xe! Lịch hẹn đang chờ người bán xác nhận.');
    } catch (err: any) {
      showToast(err.message || 'Không thể tạo lịch hẹn xem xe');
    } finally {
      setSubmittingAppt(false);
    }
  };

  // 6. Action: Agree / Confirm Appointment
  const handleConfirmAppointment = async (apptId: string, time: string, date: string, loc: string) => {
    try {
      await api.confirmAppointment(apptId);
      setAppointmentStatuses((prev) => ({ ...prev, [apptId]: 'CONFIRMED' }));
      const confirmNotice = `✅ [XÁC NHẬN LỊCH HẸN]#ID:${apptId}#MSG:Người bán đã đồng ý lịch hẹn xem xe vào lúc ${time} ngày ${date} tại ${loc}. Lịch hẹn đã được lưu vào Quản Lý Lịch Hẹn Xem Xe!`;
      await handleSendMessage(confirmNotice);
      showToast('Đã đồng ý lịch hẹn! Lịch xem xe đã được lưu vào Quản Lý Lịch Hẹn.');
    } catch (err: any) {
      showToast(err.message || 'Không thể xác nhận lịch hẹn');
    }
  };

  // 7. Action: Decline Appointment
  const handleDeclineAppointment = async (apptId: string) => {
    try {
      await api.declineAppointment(apptId, 'Người bán bận vào khung giờ này');
      setAppointmentStatuses((prev) => ({ ...prev, [apptId]: 'DECLINED' }));
      const declineNotice = `❌ [TỪ CHỐI LỊCH HẸN]#ID:${apptId}#MSG:Người bán bận vào khung giờ này. Vui lòng trao đổi lại để chọn khung giờ khác phù hợp hơn.`;
      await handleSendMessage(declineNotice);
      showToast('Đã từ chối lịch hẹn xem xe.');
    } catch (err: any) {
      showToast(err.message || 'Không thể từ chối lịch hẹn');
    }
  };

  // 8. Action: Cancel Appointment
  const handleCancelAppointment = async (apptId: string) => {
    const reason = prompt('Nhập lý do hủy lịch hẹn:', 'Thay đổi kế hoạch cá nhân');
    if (reason === null) return;
    try {
      await api.cancelAppointment(apptId, 'OTHER', reason || 'Thay đổi kế hoạch cá nhân');
      setAppointmentStatuses((prev) => ({ ...prev, [apptId]: 'CANCELLED' }));
      const cancelNotice = `🚫 [ĐÃ HỦY LỊCH HẸN]#ID:${apptId}#MSG:${reason || 'Thay đổi kế hoạch cá nhân'}`;
      await handleSendMessage(cancelNotice);
      showToast('Đã hủy lịch xem xe thành công.');
    } catch (err: any) {
      showToast(err.message || 'Không thể hủy lịch hẹn');
    }
  };

  // 8. Action: Send Price Offer
  const handleSendOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConv || !offerPriceText.trim()) return;

    const offerContent = `💰 [ĐỀ XUẤT TRẢ GIÁ]\nTôi muốn đề xuất mức giá: ${offerPriceText.trim()} cho xe "${activeConv.listing.title}".\nBạn có đồng ý thương lượng mức giá này không?`;
    setShowOfferForm(false);
    setOfferPriceText('');
    await handleSendMessage(offerContent);
    showToast('Đã gửi đề xuất trả giá!');
  };

  // Total unread messages across all conversations
  const totalUnread = conversations.reduce((acc, c) => acc + (c.unread_count || 0), 0);

  // Helper: Parse appointment message
  const parseAppointmentMessage = (content: string): ParsedAppointment | null => {
    if (!content.startsWith('[LỊCH HẸN XEM XE]')) return null;
    const parts = content.split('#');
    let id = '', time = '', date = '', location = '', note = '';
    parts.forEach((p) => {
      if (p.startsWith('ID:')) id = p.replace('ID:', '');
      else if (p.startsWith('TIME:')) time = p.replace('TIME:', '');
      else if (p.startsWith('DATE:')) date = p.replace('DATE:', '');
      else if (p.startsWith('LOC:')) location = p.replace('LOC:', '');
      else if (p.startsWith('NOTE:')) note = p.replace('NOTE:', '');
    });

    const status = (appointmentStatuses[id] as any) || 'PENDING';
    return { id, time, date, location, note, status };
  };

  return (
    <>
      {/* ============================================================== */}
      {/* 1. FLOATING CHAT BUTTON (Minimalist & Luxury)                   */}
      {/* ============================================================== */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5">
        {/* Unread Message Pill Toast when closed */}
        {!isOpen && totalUnread > 0 && (
          <div
            onClick={() => {
              setIsOpen(true);
              if (isLoggedIn) loadConversations();
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white text-[#1a1c1a] border border-[#eae8e3] shadow-[0_8px_30px_rgba(0,0,0,0.12)] text-xs font-semibold cursor-pointer hover:border-[#b89b72] transition-all animate-in fade-in slide-in-from-right-3 duration-300 select-none"
          >
            <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
            <span>Bạn có <strong className="text-red-600 font-bold">{totalUnread}</strong> tin nhắn chờ</span>
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

          {/* Badge: 1, 2, 9+ */}
          {totalUnread > 0 && !isOpen && (
            <span className="absolute -top-1 -right-1 px-1.5 min-w-[22px] h-[22px] rounded-full bg-error text-on-error text-[11px] font-bold flex items-center justify-center border-2 border-white shadow-lg animate-pulse">
              {totalUnread > 9 ? '9+' : totalUnread}
            </span>
          )}
        </button>
      </div>

      {/* ============================================================== */}
      {/* 2. CHAT DRAWER / WINDOW (Đơn giản, Tinh gọn, Hài hòa hệ thống) */}
      {/* ============================================================== */}
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

          {/* ------------------------------------------------------------ */}
          {/* HEADER (Giao diện sáng đơn giản, hài hòa với website)        */}
          {/* ------------------------------------------------------------ */}
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

          {/* ------------------------------------------------------------ */}
          {/* VIEW A: CONVERSATION LIST (Danh sách xe đang trao đổi)        */}
          {/* ------------------------------------------------------------ */}
          {!activeConv && (
            <div className="flex-1 flex flex-col overflow-y-auto bg-[#faf9f6]">
              {!isLoggedIn ? (
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
                    onClick={() => setIsOpen(false)}
                    className="inline-block px-4 py-2 rounded-xl bg-[#1a1c1a] text-white text-xs font-semibold hover:bg-black transition-colors shadow-2xs"
                  >
                    Đăng nhập ngay
                  </Link>
                </div>
              ) : loadingConvs ? (
                <div className="m-auto text-center space-y-2 text-outline">
                  <div className="w-5 h-5 border-2 border-[#1a1c1a] border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs font-medium">Đang tải cuộc trao đổi...</p>
                </div>
              ) : conversations.length === 0 ? (
                <div className="m-auto p-6 text-center space-y-3 max-w-sm">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-white border border-[#eae8e3] flex items-center justify-center text-outline shadow-2xs">
                    <span className="material-symbols-outlined text-[24px] text-outline">
                      directions_car
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-[#1a1c1a]">Chưa có cuộc trao đổi nào</h3>
                  <p className="text-xs text-outline leading-relaxed">
                    Bạn có thể bấm &ldquo;Nhắn tin với chủ xe&rdquo; trên bất kỳ tin đăng nào để bắt đầu trao đổi giá và lên lịch hẹn xem xe!
                  </p>
                  <Link
                    href="/xe"
                    onClick={() => setIsOpen(false)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1a1c1a] text-white text-xs font-semibold hover:bg-black transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">search</span>
                    <span>Khám phá xe sẵn có</span>
                  </Link>
                </div>
              ) : (
                <div className="p-3 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-outline uppercase tracking-wider px-1">
                    <span>Giao dịch xe đang trao đổi ({conversations.length})</span>
                    {totalUnread > 0 && (
                      <span className="text-red-600 font-bold lowercase">
                        {totalUnread} tin nhắn mới
                      </span>
                    )}
                  </div>
                  {conversations.map((conv) => (
                    <button
                      key={conv.id}
                      type="button"
                      onClick={() => openConversation(conv)}
                      className="w-full text-left p-3 rounded-xl bg-white border border-[#eae8e3] hover:border-[#b89b72] hover:shadow-xs transition-all flex items-center gap-3 cursor-pointer group"
                    >
                      {/* Car Thumbnail */}
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-surface-container shrink-0 border border-surface-container-high">
                        {conv.listing.primary_image_url ? (
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
              )}
            </div>
          )}

          {/* ------------------------------------------------------------ */}
          {/* VIEW B: ACTIVE CONVERSATION (Đoạn chat & Hệ thống lịch hẹn)  */}
          {/* ------------------------------------------------------------ */}
          {activeConv && (
            <div className="flex-1 flex flex-col min-h-0 bg-[#faf9f6]">
              {/* 1. PINNED CAR DOSSIER BAR (Xe muốn trao đổi) */}
              <div className="px-3.5 py-2.5 bg-white border-b border-[#eae8e3] flex items-center justify-between gap-3 shrink-0 shadow-2xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-surface-container shrink-0 border border-surface-container-high">
                    {activeConv.listing.primary_image_url ? (
                      <img
                        src={activeConv.listing.primary_image_url}
                        alt={activeConv.listing.title}
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
                      {activeConv.listing.title}
                    </h4>
                    <span className="text-xs font-bold text-[#b89b72]">
                      {formatFullVND(activeConv.listing.price_vnd)}
                    </span>
                  </div>
                </div>

                <Link
                  href={`/xe/${activeConv.listing.id}`}
                  className="px-2.5 py-1.5 rounded-lg bg-[#faf9f6] hover:bg-[#edebe6] text-[#1a1c1a] text-[11px] font-semibold transition-colors border border-[#eae8e3] shrink-0 flex items-center gap-1"
                >
                  <span>Xem xe</span>
                  <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                </Link>
              </div>

              {/* 2. QUICK ACTION TOOLBAR (Tính năng Lên lịch xem xe & Trả giá) */}
              <div className="px-3 py-1.5 bg-[#f4f2ee] border-b border-[#eae8e3] flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAppointmentForm(!showAppointmentForm)}
                  className="px-2.5 py-1 rounded-full bg-white hover:bg-[#1a1c1a] hover:text-white text-[#1a1c1a] text-[11px] font-semibold border border-[#eae8e3] transition-colors flex items-center gap-1 shrink-0 shadow-2xs cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[14px] text-secondary">
                    calendar_month
                  </span>
                  <span>Lên lịch xem xe</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowOfferForm(!showOfferForm)}
                  className="px-2.5 py-1 rounded-full bg-white hover:bg-[#1a1c1a] hover:text-white text-[#1a1c1a] text-[11px] font-semibold border border-[#eae8e3] transition-colors flex items-center gap-1 shrink-0 shadow-2xs cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[14px] text-secondary">
                    payments
                  </span>
                  <span>Đề xuất trả giá</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleSendMessage(
                      '📞 Tôi rất quan tâm chiếc xe này và muốn trao đổi thêm. Bạn vui lòng gọi lại tư vấn giúp tôi nhé!'
                    )
                  }
                  className="px-2.5 py-1 rounded-full bg-white hover:bg-[#1a1c1a] hover:text-white text-[#1a1c1a] text-[11px] font-semibold border border-[#eae8e3] transition-colors flex items-center gap-1 shrink-0 shadow-2xs cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[14px] text-blue-600">call</span>
                  <span>Yêu cầu gọi lại</span>
                </button>

                <Link
                  href="/lich-hen"
                  onClick={() => setIsOpen(false)}
                  className="px-2.5 py-1 rounded-full bg-white hover:bg-[#1a1c1a] hover:text-white text-[#1a1c1a] text-[11px] font-semibold border border-[#eae8e3] transition-colors flex items-center gap-1 shrink-0 shadow-2xs"
                >
                  <span className="material-symbols-outlined text-[14px] text-purple-600">
                    event_available
                  </span>
                  <span>Quản lý lịch hẹn</span>
                </Link>
              </div>

              {/* 3. MODAL / FORM: LÊN LỊCH XEM XE (Tạo lịch hẹn vào hệ thống) */}
              {showAppointmentForm && (
                <form
                  onSubmit={handleCreateAppointment}
                  className="p-3.5 bg-white border-b border-[#eae8e3] space-y-2.5 text-xs shrink-0 shadow-sm animate-in fade-in slide-in-from-top-2"
                >
                  <div className="flex items-center justify-between font-bold text-[#1a1c1a]">
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-secondary text-[16px]">
                        calendar_today
                      </span>
                      <span>Lên lịch hẹn xem xe với đối tác</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAppointmentForm(false)}
                      className="text-outline hover:text-[#1a1c1a]"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-outline uppercase mb-0.5">
                        Ngày xem xe
                      </label>
                      <input
                        type="date"
                        required
                        value={apptDate}
                        onChange={(e) => setApptDate(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-[#eae8e3] text-xs bg-[#faf9f6] text-[#1a1c1a]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-outline uppercase mb-0.5">
                        Khung giờ
                      </label>
                      <select
                        value={apptTime}
                        onChange={(e) => setApptTime(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-[#eae8e3] text-xs bg-[#faf9f6] text-[#1a1c1a]"
                      >
                        <option value="08:30">08:30 Sáng</option>
                        <option value="09:30">09:30 Sáng</option>
                        <option value="10:30">10:30 Sáng</option>
                        <option value="14:00">14:00 Chiều</option>
                        <option value="15:30">15:30 Chiều</option>
                        <option value="17:00">17:00 Chiều</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-outline uppercase mb-0.5">
                      Địa điểm hẹn gặp
                    </label>
                    <input
                      type="text"
                      required
                      value={apptLocation}
                      onChange={(e) => setApptLocation(e.target.value)}
                      placeholder="Showroom / Địa chỉ cụ thể..."
                      className="w-full px-2.5 py-1.5 rounded-lg border border-[#eae8e3] text-xs bg-[#faf9f6] text-[#1a1c1a]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-outline uppercase mb-0.5">
                      Ghi chú mong muốn
                    </label>
                    <input
                      type="text"
                      value={apptNote}
                      onChange={(e) => setApptNote(e.target.value)}
                      placeholder="Yêu cầu kiểm tra máy móc, lái thử..."
                      className="w-full px-2.5 py-1.5 rounded-lg border border-[#eae8e3] text-xs bg-[#faf9f6] text-[#1a1c1a]"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAppointmentForm(false)}
                      className="px-3 py-1.5 rounded-lg border border-[#eae8e3] text-[11px] font-semibold text-outline hover:bg-[#faf9f6]"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      disabled={submittingAppt}
                      className="px-4 py-1.5 rounded-lg bg-[#1a1c1a] text-white text-[11px] font-semibold hover:bg-black transition-colors disabled:opacity-50"
                    >
                      {submittingAppt ? 'Đang gửi...' : 'Gửi đề nghị lịch hẹn'}
                    </button>
                  </div>
                </form>
              )}

              {/* 4. MODAL: ĐỀ XUẤT TRẢ GIÁ */}
              {showOfferForm && (
                <form
                  onSubmit={handleSendOffer}
                  className="p-3 bg-white border-b border-[#eae8e3] space-y-2 text-xs shrink-0 shadow-sm animate-in fade-in slide-in-from-top-2"
                >
                  <div className="flex items-center justify-between font-bold text-[#1a1c1a]">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-secondary text-[16px]">
                        payments
                      </span>
                      <span>Đề xuất mức giá thương lượng</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowOfferForm(false)}
                      className="text-outline hover:text-[#1a1c1a]"
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
                      className="px-3.5 py-1.5 rounded-lg bg-[#1a1c1a] text-white text-[11px] font-semibold hover:bg-black transition-colors"
                    >
                      Gửi giá
                    </button>
                  </div>
                </form>
              )}

              {/* 5. MESSAGES BODY (Đơn giản, tinh gọn, tone sáng ấm) */}
              <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-[#faf9f6]">
                {loadingMsgs ? (
                  <div className="h-full flex items-center justify-center gap-2 text-outline text-xs">
                    <div className="w-5 h-5 border-2 border-[#1a1c1a] border-t-transparent rounded-full animate-spin" />
                    <span>Đang tải tin nhắn...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2 text-outline">
                    <span className="material-symbols-outlined text-[32px] text-[#b89b72]">
                      waving_hand
                    </span>
                    <p className="text-xs">
                      Hãy gửi lời chào đầu tiên hoặc bấm các nút hành động bên trên để trao đổi mua bán chiếc xe này!
                    </p>
                    <div className="flex flex-wrap gap-1.5 justify-center pt-2">
                      {[
                        'Xe còn sẵn không bạn?',
                        'Xe có thương lượng bớt giá không?',
                        'Hẹn xem xe cuối tuần này được không?',
                      ].map((t, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSendMessage(t)}
                          className="text-[11px] px-2.5 py-1 rounded-full bg-white hover:bg-[#edebe6] text-[#1a1c1a] transition-colors cursor-pointer border border-[#eae8e3]"
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  messages.map((m) => {
                    const isMe = m.sender_user_id === user?.id;
                    const appt = parseAppointmentMessage(m.content);
                    const isConfirmNotice = m.content.startsWith('✅ [XÁC NHẬN LỊCH HẸN]');
                    const isDeclineNotice = m.content.startsWith('❌ [TỪ CHỐI LỊCH HẸN]');
                    const isCancelNotice = m.content.startsWith('🚫 [ĐÃ HỦY LỊCH HẸN]');

                    // A) THẺ HỆ THỐNG: YÊU CẦU LỊCH HẸN XEM XE (Có nút Đồng ý / Từ chối / Hủy)
                    if (appt) {
                      const isConfirmed = appt.status === 'CONFIRMED';
                      const isDeclined = appt.status === 'DECLINED';
                      const isCancelled = appt.status === 'CANCELLED';
                      const isPending = !isConfirmed && !isDeclined && !isCancelled;

                      return (
                        <div key={m.id} className="w-full my-2">
                          <div className="max-w-[92%] mx-auto bg-white rounded-xl border border-[#eae8e3] p-3.5 shadow-xs space-y-2.5 border-l-4 border-l-[#b89b72]">
                            <div className="flex items-center justify-between pb-2 border-b border-[#eae8e3]">
                              <div className="flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[#b89b72] text-[18px]">
                                  calendar_month
                                </span>
                                <span className="font-bold text-xs text-[#1a1c1a]">
                                  Đề nghị Lịch Hẹn Xem Xe
                                </span>
                              </div>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  isConfirmed
                                    ? 'bg-secondary-container text-on-secondary-container border border-secondary/20'
                                    : isDeclined
                                    ? 'bg-error-container text-on-error-container border border-error/20'
                                    : isCancelled
                                    ? 'bg-surface-container-low text-outline border border-surface-container-high'
                                    : 'bg-surface-container text-on-surface-variant border border-outline-variant/40'
                                }`}
                              >
                                {isConfirmed
                                  ? 'Đã đồng ý lịch hẹn'
                                  : isDeclined
                                  ? 'Đã từ chối'
                                  : isCancelled
                                  ? 'Đã hủy lịch'
                                  : 'Chờ phản hồi'}
                              </span>
                            </div>

                            <div className="space-y-1 text-xs text-[#444748]">
                              <div className="flex items-center gap-1.5">
                                <span className="text-outline font-medium">Thời gian:</span>
                                <strong className="text-[#1a1c1a]">
                                  {appt.time} ngày {new Date(appt.date).toLocaleDateString('vi-VN')}
                                </strong>
                              </div>
                              <div className="flex items-start gap-1.5">
                                <span className="text-outline font-medium shrink-0">Địa điểm:</span>
                                <span className="text-[#1a1c1a] font-medium">{appt.location}</span>
                              </div>
                              {appt.note && (
                                <div className="flex items-start gap-1.5 text-[11px] text-outline">
                                  <span className="shrink-0">Ghi chú:</span>
                                  <span>{appt.note}</span>
                                </div>
                              )}
                            </div>

                            {/* Nút thao tác Đồng ý / Từ chối (Hiển thị cho đối tác nhận đề nghị khi Pending) */}
                            {isPending && !isMe && (
                              <div className="flex items-center gap-2 pt-2 border-t border-[#eae8e3]">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleConfirmAppointment(
                                      appt.id,
                                      appt.time,
                                      appt.date,
                                      appt.location
                                    )
                                  }
                                  className="flex-1 py-1.5 rounded-lg bg-secondary hover:bg-on-secondary-fixed text-on-secondary font-semibold text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                                >
                                  <span className="material-symbols-outlined text-[15px]">
                                    check
                                  </span>
                                  <span>Đồng ý lịch hẹn</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeclineAppointment(appt.id)}
                                  className="px-3 py-1.5 rounded-lg border border-[#eae8e3] hover:bg-[#faf9f6] text-outline hover:text-red-600 text-xs font-semibold transition-colors cursor-pointer"
                                >
                                  Từ chối
                                </button>
                              </div>
                            )}

                            {/* Nút hủy đề nghị lịch hẹn cho người gửi khi đang Pending */}
                            {isPending && isMe && (
                              <div className="flex items-center justify-end pt-2 border-t border-[#eae8e3]">
                                <button
                                  type="button"
                                  onClick={() => handleCancelAppointment(appt.id)}
                                  className="text-[11px] text-[#777777] hover:text-red-600 font-semibold cursor-pointer transition-colors"
                                >
                                  Hủy đề nghị lịch hẹn
                                </button>
                              </div>
                            )}

                            {/* Khi đã đồng ý: Link dẫn vào Quản Lý Lịch Hẹn Xem Xe + Nút Hủy */}
                            {isConfirmed && (
                              <div className="pt-1.5 border-t border-[#eae8e3] flex items-center justify-between">
                                <span className="text-[11px] text-secondary font-medium flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[14px]">
                                    verified
                                  </span>
                                  <span>Đã lưu vào Quản lý Lịch hẹn</span>
                                </span>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleCancelAppointment(appt.id)}
                                    className="text-[11px] text-[#777777] hover:text-red-600 transition-colors cursor-pointer"
                                    title="Hủy lịch hẹn"
                                  >
                                    Hủy lịch
                                  </button>
                                  <Link
                                    href="/lich-hen"
                                    onClick={() => setIsOpen(false)}
                                    className="text-[11px] text-primary hover:underline font-bold flex items-center gap-0.5"
                                  >
                                    <span>Chi tiết</span>
                                    <span className="material-symbols-outlined text-[12px]">
                                      arrow_forward
                                    </span>
                                  </Link>
                                </div>
                              </div>
                            )}

                            {/* Khi đã hủy */}
                            {isCancelled && (
                              <div className="pt-1.5 border-t border-[#eae8e3] text-left">
                                <span className="text-[11px] text-[#777777] font-medium flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[14px] text-red-500">
                                    cancel
                                  </span>
                                  <span>Lịch hẹn này đã được hủy</span>
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="text-[10px] text-outline text-center mt-1">
                            {new Date(m.created_at).toLocaleTimeString('vi-VN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                      );
                    }

                    // B) TIN NHẮN THÔNG BÁO XÁC NHẬN / TỪ CHỐI / HỦY LỊCH
                    if (isConfirmNotice || isDeclineNotice || isCancelNotice) {
                      return (
                        <div key={m.id} className="w-full my-1.5 text-center">
                          <div
                            className={`inline-block px-3.5 py-1.5 rounded-full text-xs font-medium border ${
                              isConfirmNotice
                                ? 'bg-secondary-container text-on-secondary-container border border-secondary/20'
                                : isCancelNotice
                                ? 'bg-surface-container text-on-surface-variant border border-outline-variant/40'
                                : 'bg-error-container text-on-error-container border border-error/20'
                            }`}
                          >
                            {m.content.replace(/#ID:.*?#MSG:/, '')}
                          </div>
                          <div className="text-[10px] text-outline mt-0.5">
                            {new Date(m.created_at).toLocaleTimeString('vi-VN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                      );
                    }

                    // C) TIN NHẮN CHAT BÌNH THƯỜNG (Tone màu đơn giản, hiện đại)
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-xs sm:text-[13px] leading-relaxed whitespace-pre-line shadow-2xs ${
                            isMe
                              ? 'bg-[#1a1c1a] text-white rounded-tr-xs'
                              : 'bg-white border border-[#eae8e3] text-[#1a1c1a] rounded-tl-xs'
                          }`}
                        >
                          {m.content}
                        </div>
                        <span className="text-[10px] text-outline mt-0.5 px-1">
                          {new Date(m.created_at).toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* 6. INPUT BAR */}
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
