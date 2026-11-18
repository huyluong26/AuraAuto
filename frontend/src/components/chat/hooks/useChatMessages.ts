'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '@/lib/api';
import { ChatMessageItem, ConversationItem } from '../types';

interface UseChatMessagesOptions {
  activeConv: ConversationItem | null;
  isLoggedIn: boolean;
  onToast: (msg: string) => void;
  onRefreshConversations?: () => void;
}

export function useChatMessages({
  activeConv,
  isLoggedIn,
  onToast,
  onRefreshConversations,
}: UseChatMessagesOptions) {
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [inputText, setInputText] = useState('');
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);

  // Quick Action Form states
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

  // Local cache for appointment statuses
  const [appointmentStatuses, setAppointmentStatuses] = useState<Record<string, string>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadMessages = useCallback(
    async (convId: string) => {
      if (!isLoggedIn) return;
      try {
        const msgs = await api.getConversationMessages(convId, 60);
        setMessages(msgs || []);

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
        // Ignore background polling errors
      }
    },
    [isLoggedIn]
  );

  // Initial load when activeConv changes
  useEffect(() => {
    if (!activeConv) {
      setMessages([]);
      setShowAppointmentForm(false);
      setShowOfferForm(false);
      return;
    }
    setLoadingMsgs(true);
    loadMessages(activeConv.id).finally(() => setLoadingMsgs(false));
  }, [activeConv, loadMessages]);

  // Periodic polling for active conversation
  useEffect(() => {
    if (!activeConv || !isLoggedIn) return;
    const interval = setInterval(() => {
      loadMessages(activeConv.id);
    }, 4000);
    return () => clearInterval(interval);
  }, [activeConv, isLoggedIn, loadMessages]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (activeConv && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeConv]);

  // Send message
  const handleSendMessage = async (customContent?: string) => {
    const content = (customContent || inputText).trim();
    if (!content || !activeConv || sending) return;

    if (!customContent) setInputText('');
    setSending(true);

    try {
      const newMsg = await api.sendChatMessage(activeConv.id, content);
      setMessages((prev) => [...prev, newMsg]);
      if (onRefreshConversations) {
        onRefreshConversations();
      }
    } catch (err: any) {
      onToast(err.message || 'Lỗi khi gửi tin nhắn');
    } finally {
      setSending(false);
    }
  };

  // Create Appointment Proposal
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

      const structuredContent = `[LỊCH HẸN XEM XE]#ID:${apptId}#TIME:${apptTime}#DATE:${apptDate}#LOC:${apptLocation}#NOTE:${apptNote}`;
      await handleSendMessage(structuredContent);
      onToast('Đã gửi đề nghị hẹn xem xe! Lịch hẹn đang chờ người bán xác nhận.');
    } catch (err: any) {
      onToast(err.message || 'Không thể tạo lịch hẹn xem xe');
    } finally {
      setSubmittingAppt(false);
    }
  };

  // Agree / Confirm Appointment
  const handleConfirmAppointment = async (
    apptId: string,
    time: string,
    date: string,
    loc: string
  ) => {
    try {
      await api.confirmAppointment(apptId);
      setAppointmentStatuses((prev) => ({ ...prev, [apptId]: 'CONFIRMED' }));
      const confirmNotice = `✅ [XÁC NHẬN LỊCH HẸN]#ID:${apptId}#MSG:Người bán đã đồng ý lịch hẹn xem xe vào lúc ${time} ngày ${date} tại ${loc}. Lịch hẹn đã được lưu vào Quản Lý Lịch Hẹn Xem Xe!`;
      await handleSendMessage(confirmNotice);
      onToast('Đã đồng ý lịch hẹn! Lịch xem xe đã được lưu vào Quản Lý Lịch Hẹn.');
    } catch (err: any) {
      onToast(err.message || 'Không thể xác nhận lịch hẹn');
    }
  };

  // Decline Appointment
  const handleDeclineAppointment = async (apptId: string) => {
    try {
      await api.declineAppointment(apptId, 'Người bán bận vào khung giờ này');
      setAppointmentStatuses((prev) => ({ ...prev, [apptId]: 'DECLINED' }));
      const declineNotice = `❌ [TỪ CHỐI LỊCH HẸN]#ID:${apptId}#MSG:Người bán bận vào khung giờ này. Vui lòng trao đổi lại để chọn khung giờ khác phù hợp hơn.`;
      await handleSendMessage(declineNotice);
      onToast('Đã từ chối lịch hẹn xem xe.');
    } catch (err: any) {
      onToast(err.message || 'Không thể từ chối lịch hẹn');
    }
  };

  // Cancel Appointment
  const handleCancelAppointment = async (apptId: string) => {
    const reason = prompt('Nhập lý do hủy lịch hẹn:', 'Thay đổi kế hoạch cá nhân');
    if (reason === null) return;
    try {
      await api.cancelAppointment(apptId, 'OTHER', reason || 'Thay đổi kế hoạch cá nhân');
      setAppointmentStatuses((prev) => ({ ...prev, [apptId]: 'CANCELLED' }));
      const cancelNotice = `🚫 [ĐÃ HỦY LỊCH HẸN]#ID:${apptId}#MSG:${
        reason || 'Thay đổi kế hoạch cá nhân'
      }`;
      await handleSendMessage(cancelNotice);
      onToast('Đã hủy lịch xem xe thành công.');
    } catch (err: any) {
      onToast(err.message || 'Không thể hủy lịch hẹn');
    }
  };

  // Send Price Offer
  const handleSendOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConv || !offerPriceText.trim()) return;

    const offerContent = `💰 [ĐỀ XUẤT TRẢ GIÁ]\nTôi muốn đề xuất mức giá: ${offerPriceText.trim()} cho xe "${
      activeConv.listing.title
    }".\nBạn có đồng ý thương lượng mức giá này không?`;
    setShowOfferForm(false);
    setOfferPriceText('');
    await handleSendMessage(offerContent);
    onToast('Đã gửi đề xuất trả giá!');
  };

  return {
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
    loadMessages,
  };
}
