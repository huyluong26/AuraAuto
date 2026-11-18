'use client';

import React, { useEffect } from 'react';
import { ConfirmDialogOptions } from '../../types';

interface ConfirmDialogModalProps {
  isOpen: boolean;
  options: ConfirmDialogOptions | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialogModal({
  isOpen,
  options,
  onConfirm,
  onCancel,
}: ConfirmDialogModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen || !options) return null;

  const {
    title,
    message,
    confirmText = 'Xác nhận',
    cancelText = 'Hủy bỏ',
    variant = 'primary',
    icon,
  } = options;

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: icon || 'warning',
          iconBg: 'bg-rose-50 text-rose-600 border border-rose-200',
          btnBg: 'bg-[#dc2626] hover:bg-[#b91c1c] text-white shadow-2xs',
        };
      case 'warning':
        return {
          icon: icon || 'priority_high',
          iconBg: 'bg-amber-50 text-amber-700 border border-amber-200',
          btnBg: 'bg-amber-600 hover:bg-amber-700 text-white shadow-2xs',
        };
      case 'success':
        return {
          icon: icon || 'check_circle',
          iconBg: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
          btnBg: 'bg-[#166534] hover:bg-[#14532d] text-white shadow-2xs',
        };
      case 'primary':
      default:
        return {
          icon: icon || 'help_outline',
          iconBg: 'bg-[#fcf9f2] text-[#8c6d3b] border border-[#d8c5a2]',
          btnBg: 'bg-[#0f172a] hover:bg-black text-white border border-neutral-800 shadow-2xs',
        };
    }
  };

  const style = getVariantStyles();

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl border border-[#e8e6e1] shadow-[0_24px_60px_rgba(0,0,0,0.18)] p-6 relative overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${style.iconBg}`}>
            <span className="material-symbols-outlined text-[22px]">{style.icon}</span>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-[#111827] leading-tight font-headline">
              {title}
            </h3>
            <div className="mt-2 text-[#4b5563] text-xs sm:text-[13px] leading-relaxed whitespace-pre-line">
              {message}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-end gap-2 pt-4 border-t border-[#f0ede6]">
          {cancelText && (
            <button
              type="button"
              onClick={onCancel}
              className="px-3.5 py-1.5 rounded-md border border-[#d8d6d0] bg-white hover:bg-[#faf9f6] text-[#334155] text-xs font-medium transition-colors cursor-pointer shadow-2xs active:scale-[0.99]"
            >
              {cancelText}
            </button>
          )}
          <button
            type="button"
            onClick={onConfirm}
            autoFocus
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer shadow-2xs active:scale-[0.99] ${style.btnBg}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
