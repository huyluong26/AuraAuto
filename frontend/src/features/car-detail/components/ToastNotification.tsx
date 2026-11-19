'use client';

import React from 'react';

interface ToastNotificationProps {
  message: string | null;
}

export function ToastNotification({ message }: ToastNotificationProps) {
  return (
    <div
      className={`fixed top-20 right-4 sm:right-6 z-50 transform transition-all duration-300 pointer-events-none ${
        message ? 'translate-y-0 opacity-100' : '-translate-y-6 opacity-0'
      }`}
    >
      <div className="px-4 py-3 rounded-xl shadow-lg border bg-surface-container-lowest border-secondary text-primary flex items-center gap-2.5 text-body-sm font-medium">
        <span className="material-symbols-outlined text-secondary text-[20px]">
          check_circle
        </span>
        <span>{message}</span>
      </div>
    </div>
  );
}
