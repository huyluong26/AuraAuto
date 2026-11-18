'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '@/lib/api';
import { ConversationItem } from '../types';

interface UseChatConversationsOptions {
  isLoggedIn: boolean;
  onToast: (msg: string) => void;
  onOpenConversation?: (conv: ConversationItem) => void;
}

export function useChatConversations({
  isLoggedIn,
  onToast,
  onOpenConversation,
}: UseChatConversationsOptions) {
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConv, setActiveConv] = useState<ConversationItem | null>(null);
  const [loadingConvs, setLoadingConvs] = useState(false);

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

  const selectConversation = useCallback(
    async (conv: ConversationItem) => {
      setActiveConv(conv);
      try {
        await api.markConversationAsRead(conv.id);
        setConversations((prev) =>
          prev.map((c) => (c.id === conv.id ? { ...c, unread_count: 0 } : c))
        );
        if (onOpenConversation) {
          onOpenConversation(conv);
        }
      } catch {
        // Ignore read mark errors
      }
    },
    [onOpenConversation]
  );

  // Global custom event listener
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
        selectConversation(conv);
        await loadConversations();
      } catch (err: any) {
        onToast(err.message || 'Không thể mở cuộc trò chuyện');
      } finally {
        setLoadingConvs(false);
      }
    };

    window.addEventListener('open-car-chat', handleOpenChat as EventListener);
    return () => {
      window.removeEventListener('open-car-chat', handleOpenChat as EventListener);
    };
  }, [isLoggedIn, loadConversations, selectConversation, onToast]);

  const totalUnread = useMemo(
    () => conversations.reduce((acc, c) => acc + (c.unread_count || 0), 0),
    [conversations]
  );

  return {
    isOpen,
    setIsOpen,
    conversations,
    setConversations,
    activeConv,
    setActiveConv,
    loadingConvs,
    loadConversations,
    selectConversation,
    totalUnread,
  };
}
