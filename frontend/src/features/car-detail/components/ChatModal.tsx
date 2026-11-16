'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { api, formatFullVND } from '@/lib/api';
import { ListingDetail } from '@/types';
import { ChatMessage, ConversationInfo } from '../types';

interface ChatModalProps {
  isOpen: boolean;
  listing: ListingDetail;
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

export function ChatModal({
  isOpen,
  listing,
  onClose,
  onShowToast,
}: ChatModalProps) {
  const [conversation, setConversation] = useState<ConversationInfo | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const sellerName = listing.seller?.display_name || listing.seller_name || 'Chủ xe';

  // Load or create conversation on open
  useEffect(() => {
    let mounted = true;
    if (!isOpen) return;

    async function initChat() {
      setLoading(true);
      setAuthError(null);
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
        if (!token) {
          setAuthError('Vui lòng đăng nhập để nhắn tin trực tiếp với chủ xe.');
          setLoading(false);
          return;
        }

        const conv = await api.getOrCreateConversation(listing.id);
        if (!mounted) return;
        setConversation(conv);

        // Fetch messages for this conversation
        const msgs = await api.getConversationMessages(conv.id);
        if (mounted) {
          setMessages(msgs || []);
        }
      } catch (err: any) {
        if (mounted) {
          setAuthError(err.message || 'Không thể mở cuộc trò chuyện.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initChat();

    return () => {
      mounted = false;
    };
  }, [isOpen, listing.id]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !conversation || sending) return;

    const content = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      const newMsg = await api.sendChatMessage(conversation.id, content);
      setMessages((prev) => [...prev, newMsg]);
      onShowToast('Đã gửi tin nhắn đến chủ xe thành công!');
    } catch (err: any) {
      alert(err.message || 'Không thể gửi tin nhắn');
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-2xl bg-surface-container-lowest shadow-2xl flex flex-col h-[560px] overflow-hidden border border-surface-container-high animate-in fade-in duration-200">
        {/* Header */}
        <div className="p-4 bg-surface-container border-b border-surface-container-high flex items-center justify-between">
          <div className="flex items-center gap-3">
            {listing.seller?.avatar_url ? (
              <img
                src={listing.seller.avatar_url}
                alt={sellerName}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-secondary text-white font-bold flex items-center justify-center uppercase text-sm shadow-xs">
                {sellerName.slice(0, 2)}
              </div>
            )}
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-primary">{sellerName}</span>
                <span className="material-symbols-outlined text-secondary text-[16px]">
                  verified
                </span>
              </div>
              <div className="text-[11px] text-secondary font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                Đang trực tuyến • Sẵn sàng giải đáp
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-surface-container-high text-on-surface-variant transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Vehicle Mini Dossier Bar */}
        <div className="px-4 py-2 bg-surface-container-low border-b border-surface-container-high flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-lg overflow-hidden bg-surface-container-high shrink-0">
            {listing.primary_image_url ? (
              <img
                src={listing.primary_image_url}
                alt={listing.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-outline">
                <span className="material-symbols-outlined text-[18px]">directions_car</span>
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-primary truncate">{listing.title}</div>
            <div className="text-xs text-secondary font-bold">
              {formatFullVND(listing.price_vnd)}
            </div>
          </div>
        </div>

        {/* Messages Body */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-surface">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center gap-2 text-outline">
              <div className="w-6 h-6 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
              <span className="text-xs">Đang mở phiên chat an toàn...</span>
            </div>
          ) : authError ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
              <span className="material-symbols-outlined text-outline text-[36px]">
                lock
              </span>
              <p className="text-xs text-outline">{authError}</p>
              <Link
                href="/dang-nhap"
                className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-secondary transition-colors"
              >
                Đăng nhập ngay
              </Link>
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2 text-outline">
              <span className="material-symbols-outlined text-[36px]">forum</span>
              <p className="text-xs">
                Chưa có tin nhắn nào. Hãy gửi lời chào và đặt câu hỏi về tình trạng xe hoặc hẹn xem xe thực tế!
              </p>
              <div className="flex flex-wrap gap-1.5 justify-center pt-2">
                {[
                  'Xe còn sẵn không bạn?',
                  'Xe có thương lượng giá không?',
                  'Có thể hẹn xem xe cuối tuần này không?',
                ].map((quick, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setInputText(quick)}
                    className="text-[11px] px-2.5 py-1 rounded-full bg-surface-container-high hover:bg-secondary-container hover:text-secondary text-primary transition-colors cursor-pointer"
                  >
                    {quick}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m) => {
              const isMe = m.sender_user_id !== listing.seller?.id;
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[78%] px-3.5 py-2 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                      isMe
                        ? 'bg-primary text-white rounded-tr-none'
                        : 'bg-surface-container-high text-primary rounded-tl-none'
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

        {/* Input Bar */}
        {!authError && (
          <form
            onSubmit={handleSendMessage}
            className="p-3 bg-surface-container-lowest border-t border-surface-container-high flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Nhập tin nhắn gửi cho chủ xe..."
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-surface-container-high text-xs sm:text-sm text-primary placeholder:text-outline focus:outline-none focus:border-secondary transition-colors"
            />
            <button
              type="submit"
              disabled={sending || !inputText.trim()}
              className="px-4 py-2.5 rounded-xl bg-primary text-white text-xs sm:text-sm font-semibold hover:bg-secondary transition-colors disabled:opacity-40 flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">send</span>
              <span className="hidden sm:inline">Gửi</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
