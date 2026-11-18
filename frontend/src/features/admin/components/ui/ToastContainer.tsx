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
          container: 'bg-[#121315]/95 border-[#2c2d30] text-white shadow-[0_16px_40px_rgba(0,0,0,0.4)] backdrop-blur-md',
          iconColor: 'text-[#d4af37] bg-[#d4af37]/10',
          accent: 'bg-gradient-to-b from-[#d4af37] to-[#8c6d3b]',
        };
      case 'error':
        return {
          icon: 'error',
          container: 'bg-[#1a0f0f]/95 border-rose-900/50 text-white shadow-[0_16px_40px_rgba(225,29,72,0.2)] backdrop-blur-md',
          iconColor: 'text-rose-400 bg-rose-500/10',
          accent: 'bg-rose-500',
        };
      case 'warning':
        return {
          icon: 'warning',
          container: 'bg-[#18140c]/95 border-amber-900/50 text-white shadow-[0_16px_40px_rgba(245,158,11,0.2)] backdrop-blur-md',
          iconColor: 'text-amber-400 bg-amber-500/10',
          accent: 'bg-amber-500',
        };
      case 'info':
      default:
        return {
          icon: 'info',
          container: 'bg-[#121315]/95 border-[#2c2d30] text-white shadow-[0_16px_40px_rgba(0,0,0,0.4)] backdrop-blur-md',
          iconColor: 'text-[#b89b72] bg-[#b89b72]/10',
          accent: 'bg-[#b89b72]',
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
              <div className="text-xs font-semibold text-white tracking-wide">
                {t.title}
              </div>
              {t.message && (
                <div className="text-[12px] text-neutral-300 mt-0.5 leading-relaxed line-clamp-3">
                  {t.message}
                </div>
              )}
            </div>

            {/* Dismiss Button */}
            <button
              type="button"
              onClick={() => onDismiss(t.id)}
              className="p-1 rounded-md text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
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
