'use client';

import React from 'react';

interface ToastNotificationProps {
  message: string | null;
}

export function ToastNotification({ message }: ToastNotificationProps) {
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 transform transition-all duration-300 pointer-events-none ${
        message ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'
      }`}
    >
      <div className="px-4 py-3 rounded-lg bg-primary text-on-primary shadow-2xl flex items-center gap-2 font-label-md text-label-md">
        <span className="material-symbols-outlined text-secondary-fixed text-[20px]">
          check_circle
        </span>
        <span>{message}</span>
      </div>
    </div>
  );
}
