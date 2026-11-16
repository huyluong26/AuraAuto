'use client';

import React from 'react';
import { ToastItem } from '../../types';

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  const getToastStyles = (type: ToastItem['type']) => {
    switch (type) {
      case 'success':
        return {
          icon: 'check_circle',
          container: 'bg-surface-container-lowest border-emerald-500/40 text-on-surface shadow-[0_8px_30px_rgb(16,185,129,0.12)]',
          iconColor: 'text-emerald-600 bg-emerald-50',
          accent: 'bg-emerald-500',
        };
      case 'error':
        return {
          icon: 'error',
          container: 'bg-surface-container-lowest border-rose-500/40 text-on-surface shadow-[0_8px_30px_rgb(225,29,72,0.12)]',
          iconColor: 'text-rose-600 bg-rose-50',
          accent: 'bg-rose-500',
        };
      case 'warning':
        return {
          icon: 'warning',
          container: 'bg-surface-container-lowest border-amber-500/40 text-on-surface shadow-[0_8px_30px_rgb(245,158,11,0.12)]',
          iconColor: 'text-amber-600 bg-amber-50',
          accent: 'bg-amber-500',
        };
      case 'info':
      default:
        return {
          icon: 'info',
          container: 'bg-surface-container-lowest border-secondary/40 text-on-surface shadow-[0_8px_30px_rgb(114,90,55,0.12)]',
          iconColor: 'text-secondary bg-secondary-container/40',
          accent: 'bg-secondary',
        };
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2.5 max-w-md w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((t) => {
        const style = getToastStyles(t.type);
        return (
          <div
            key={t.id}
            role="alert"
            className={`pointer-events-auto relative overflow-hidden rounded-xl border p-4 transition-all duration-300 animate-in slide-in-from-bottom-3 fade-in flex items-start gap-3 backdrop-blur-md ${style.container}`}
          >
            {/* Semantic Left Accent Bar */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${style.accent}`} />

            {/* Icon */}
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${style.iconColor}`}>
              <span className="material-symbols-outlined text-[20px]">{style.icon}</span>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pr-2">
              <div className="font-label-md text-label-md font-semibold text-primary leading-snug">
                {t.title}
              </div>
              {t.message && (
                <div className="font-body-sm text-[12px] text-on-surface-variant mt-0.5 leading-relaxed line-clamp-3">
                  {t.message}
                </div>
              )}
            </div>

            {/* Dismiss Button */}
            <button
              type="button"
              onClick={() => onDismiss(t.id)}
              className="p-1 rounded-md text-outline hover:text-primary hover:bg-surface-container-high transition-colors cursor-pointer shrink-0"
              title="Đóng thông báo"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
