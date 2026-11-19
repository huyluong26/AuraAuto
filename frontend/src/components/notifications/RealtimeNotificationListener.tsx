'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { api } from '@/lib/api';
import { NotificationItem } from '@/lib/api/notifications';

interface LiveStatusAlert {
  id: string;
  notificationId?: string;
  listingId?: string;
  status?: string;
  type: 'success' | 'error' | 'warning';
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
}

function getDismissedSet(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem('aura_dismissed_notifications');
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function addDismissedIds(ids: string[]) {
  if (typeof window === 'undefined') return;
  try {
    const set = getDismissedSet();
    ids.forEach((id) => set.add(id));
    localStorage.setItem('aura_dismissed_notifications', JSON.stringify(Array.from(set)));
  } catch {
    // ignore
  }
}

// Gentle luxury chime using Web Audio API
function playNotificationChime() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.45);
  } catch {
    // AudioContext blocked or not supported
  }
}

export function RealtimeNotificationListener() {
  const { user, isLoggedIn, isLoaded } = useCurrentUser();
  const [currentToast, setCurrentToast] = useState<LiveStatusAlert | null>(null);
  const autoDismissTimerRef = useRef<NodeJS.Timeout | null>(null);
  const initialFetchDone = useRef(false);
  const wsRef = useRef<WebSocket | null>(null);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleDismiss = useCallback(
    (alertToDismiss?: LiveStatusAlert) => {
      const target = alertToDismiss || currentToast;
      if (!target) return;

      const idsToMark: string[] = [target.id];
      if (target.notificationId) {
        idsToMark.push(target.notificationId);
        // Persist to PostgreSQL database so it is permanently read
        api.markNotificationRead(target.notificationId).catch(() => {});
      }
      if (target.listingId) {
        idsToMark.push(`listing_${target.listingId}`);
        if (target.status) {
          idsToMark.push(`listing_${target.listingId}_${target.status}`);
        }
      }

      // Persist to localStorage permanently so reload/re-login never shows it again
      addDismissedIds(idsToMark);

      if (autoDismissTimerRef.current) {
        clearTimeout(autoDismissTimerRef.current);
      }
      setCurrentToast(null);
    },
    [currentToast]
  );

  const showToast = useCallback(
    (alert: LiveStatusAlert) => {
      const dismissed = getDismissedSet();
      if (
        dismissed.has(alert.id) ||
        (alert.notificationId && dismissed.has(alert.notificationId)) ||
        (alert.listingId && alert.status && dismissed.has(`listing_${alert.listingId}_${alert.status}`))
      ) {
        return;
      }

      setCurrentToast(alert);
      playNotificationChime();

      if (autoDismissTimerRef.current) {
        clearTimeout(autoDismissTimerRef.current);
      }

      // Auto dismiss after 8 seconds
      autoDismissTimerRef.current = setTimeout(() => {
        handleDismiss(alert);
      }, 8000);
    },
    [handleDismiss]
  );

  // Process incoming notification payload (from WebSocket or Polling)
  const processNotificationData = useCallback(
    (notif: any) => {
      const notifId = String(notif.id || '');
      const refId = String(notif.reference_id || notif.listing_id || '');
      const dismissed = getDismissedSet();

      if (notif.is_read === true) return;
      if (notifId && dismissed.has(notifId)) return;
      if (refId && dismissed.has(`listing_${refId}`)) return;

      const title = notif.title || '';
      const body = notif.body || '';
      const status = notif.status || '';

      const isApproved =
        status === 'PUBLISHED' ||
        title.toLowerCase().includes('phê duyệt') ||
        title.toLowerCase().includes('duyệt');
      const isRejected =
        status === 'REJECTED' ||
        title.toLowerCase().includes('từ chối') ||
        title.toLowerCase().includes('chỉnh sửa');

      if (refId && status && dismissed.has(`listing_${refId}_${status}`)) return;

      let toastType: 'success' | 'error' | 'warning' = 'success';
      let actionUrl = '/quan-ly-tin';
      let actionLabel = 'Xem bài đăng';

      if (isApproved) {
        toastType = 'success';
        actionUrl = refId ? `/xe/${refId}` : '/quan-ly-tin';
        actionLabel = 'Xem tin ngay';
      } else if (isRejected) {
        toastType = 'error';
        actionUrl = '/quan-ly-tin';
        actionLabel = 'Chỉnh sửa ngay';
      } else {
        toastType = 'warning';
        actionUrl = '/quan-ly-tin';
        actionLabel = 'Xem chi tiết';
      }

      showToast({
        id: notifId || `toast_${Date.now()}`,
        notificationId: notifId,
        listingId: refId,
        status: status || (isApproved ? 'PUBLISHED' : isRejected ? 'REJECTED' : 'PENDING'),
        type: toastType,
        title: title || 'Thông báo từ AuraAuto',
        message: body || 'Trạng thái tin đăng của bạn đã được cập nhật.',
        actionUrl,
        actionLabel,
      });

      // Dispatch global event for other components if needed
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('aura:notification_received', { detail: notif }));
      }
    },
    [showToast]
  );

  // Channel 1: Live WebSocket Connection
  useEffect(() => {
    if (!isLoaded || !isLoggedIn || !user) return;

    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) return;

    let socket: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let isCancelled = false;

    const connectWebSocket = () => {
      if (isCancelled) return;
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host =
          window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? `${window.location.hostname}:8000`
            : window.location.host;

        const wsUrl = `${protocol}//${host}/api/v1/chats/ws?token=${token}`;
        socket = new WebSocket(wsUrl);
        wsRef.current = socket;

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'NOTIFICATION' && data.data) {
              processNotificationData(data.data);
            } else if (data.type === 'LISTING_STATUS_CHANGE') {
              processNotificationData(data);
            }
          } catch {
            // non-json message
          }
        };

        socket.onclose = () => {
          if (!isCancelled) {
            reconnectTimeout = setTimeout(connectWebSocket, 4000);
          }
        };

        socket.onerror = () => {
          socket?.close();
        };
      } catch {
        // fallback to polling
      }
    };

    connectWebSocket();

    return () => {
      isCancelled = true;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (socket) {
        socket.onclose = null;
        socket.close();
      }
    };
  }, [isLoaded, isLoggedIn, user, processNotificationData]);

  // Channel 2: Adaptive Polling Fallback (Tự động tạm dừng khi tab ẩn, polling 10s khi WS mở hoặc 5s khi dự phòng)
  useEffect(() => {
    if (!isLoaded || !isLoggedIn || !user) return;

    const poll = async () => {
      // Bỏ qua polling khi người dùng không nhìn vào tab trình duyệt để tiết kiệm CPU và tài nguyên mạng
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        return;
      }

      try {
        const notifs: NotificationItem[] = await api.getNotifications();
        if (!Array.isArray(notifs)) return;

        const dismissed = getDismissedSet();

        if (!initialFetchDone.current) {
          // On first page load, only pop up if there is an unread notification that hasn't been dismissed
          initialFetchDone.current = true;
          const freshUnread = notifs.find((n) => !n.is_read && !dismissed.has(n.id));
          if (freshUnread) {
            processNotificationData(freshUnread);
          }
          return;
        }

        // Detect any newly arrived unread notifications
        for (const n of notifs) {
          if (!n.is_read && !dismissed.has(n.id)) {
            processNotificationData(n);
          }
        }
      } catch {
        // silent fallback
      }
    };

    poll();

    // Check visibility change để poll ngay lập tức khi người dùng quay lại tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        poll();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const isWsOpen = wsRef.current && wsRef.current.readyState === WebSocket.OPEN;
    const intervalMs = isWsOpen ? 15000 : 6000;
    pollTimerRef.current = setInterval(poll, intervalMs);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [isLoaded, isLoggedIn, user, processNotificationData]);

  if (!currentToast) return null;

  const isSuccess = currentToast.type === 'success';

  return (
    <div className="fixed top-20 right-4 sm:right-6 z-50 animate-in slide-in-from-top-2 duration-300">
      <div
        className={`px-4 py-3 rounded-xl shadow-lg border flex items-center gap-3 text-body-sm transition-all ${
          isSuccess
            ? 'bg-surface-container-lowest border-secondary text-primary'
            : 'bg-error-container border-error text-on-error-container'
        }`}
      >
        <span
          className={`material-symbols-outlined text-[20px] shrink-0 ${
            isSuccess ? 'text-secondary' : 'text-error'
          }`}
        >
          {isSuccess ? 'check_circle' : 'error'}
        </span>

        <div className="flex items-center gap-2">
          <span className="font-medium">{currentToast.message || currentToast.title}</span>
          {currentToast.actionUrl && (
            <Link
              href={currentToast.actionUrl}
              onClick={() => handleDismiss(currentToast)}
              className="text-secondary font-semibold hover:underline flex items-center gap-0.5 ml-1 text-xs shrink-0"
            >
              <span>{currentToast.actionLabel || 'Xem tin'}</span>
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </Link>
          )}
        </div>

        <button
          type="button"
          onClick={() => handleDismiss(currentToast)}
          className="text-outline hover:text-primary transition-colors p-1 rounded-md ml-1 shrink-0"
          title="Đóng thông báo"
        >
          <span className="material-symbols-outlined text-[16px]">close</span>
        </button>
      </div>
    </div>
  );
}
