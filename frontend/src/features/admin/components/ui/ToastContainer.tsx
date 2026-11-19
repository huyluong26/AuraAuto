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
          container: 'bg-surface-container-lowest border-secondary text-primary shadow-lg',
          iconColor: 'text-secondary',
          titleColor: 'text-primary',
          textColor: 'text-on-surface-variant',
          closeColor: 'text-outline hover:text-primary hover:bg-black/5',
        };
      case 'error':
        return {
          icon: 'error',
          container: 'bg-error-container border-error text-on-error-container shadow-lg',
          iconColor: 'text-error',
          titleColor: 'text-on-error-container font-bold',
          textColor: 'text-on-error-container/90',
          closeColor: 'text-on-error-container/70 hover:text-on-error-container hover:bg-black/5',
        };
      case 'warning':
        return {
          icon: 'warning',
          container: 'bg-surface-container-lowest border-secondary text-primary shadow-lg',
          iconColor: 'text-secondary',
          titleColor: 'text-primary',
          textColor: 'text-on-surface-variant',
          closeColor: 'text-outline hover:text-primary hover:bg-black/5',
        };
      case 'info':
      default:
        return {
          icon: 'info',
          container: 'bg-surface-container-lowest border-secondary text-primary shadow-lg',
          iconColor: 'text-secondary',
          titleColor: 'text-primary',
          textColor: 'text-on-surface-variant',
          closeColor: 'text-outline hover:text-primary hover:bg-black/5',
        };
    }
  };

  return (
    <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-2.5 max-w-md w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((t) => {
        const style = getToastStyles(t.type);
        return (
          <div
            key={t.id}
            role="alert"
            className={`pointer-events-auto relative overflow-hidden rounded-xl border p-3.5 transition-all duration-300 animate-in slide-in-from-top-2 fade-in flex items-start gap-3 ${style.container}`}
          >
            {/* Icon */}
            <span className={`material-symbols-outlined text-[20px] shrink-0 mt-0.5 ${style.iconColor}`}>
              {style.icon}
            </span>

            {/* Content */}
            <div className="flex-1 min-w-0 pr-2">
              <div className={`text-xs font-semibold tracking-wide ${style.titleColor}`}>
                {t.title}
              </div>
              {t.message && (
                <div className={`text-[12px] mt-0.5 leading-relaxed line-clamp-3 ${style.textColor}`}>
                  {t.message}
                </div>
              )}
            </div>

            {/* Dismiss Button */}
            <button
              type="button"
              onClick={() => onDismiss(t.id)}
              className={`p-1 rounded-md transition-colors cursor-pointer shrink-0 ${style.closeColor}`}
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
