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
          iconBg: 'bg-red-50 text-red-600 border border-red-200',
          btnBg: 'bg-red-600 hover:bg-red-700 text-white shadow-xs',
        };
      case 'warning':
        return {
          icon: icon || 'priority_high',
          iconBg: 'bg-amber-50 text-amber-600 border border-amber-200',
          btnBg: 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs',
        };
      case 'success':
        return {
          icon: icon || 'check_circle',
          iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
          btnBg: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs',
        };
      case 'primary':
      default:
        return {
          icon: icon || 'help_outline',
          iconBg: 'bg-secondary-container/50 text-secondary border border-secondary/20',
          btnBg: 'bg-primary hover:bg-primary/90 text-on-primary shadow-xs',
        };
    }
  };

  const style = getVariantStyles();

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-primary/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md bg-surface-container-lowest rounded-2xl border border-surface-container-high shadow-2xl p-6 relative overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${style.iconBg}`}>
            <span className="material-symbols-outlined text-[26px]">{style.icon}</span>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-headline-sm text-headline-sm font-semibold text-primary leading-tight">
              {title}
            </h3>
            <div className="mt-2 text-on-surface-variant font-body-sm text-[13px] leading-relaxed whitespace-pre-line">
              {message}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-surface-container-high">
          {cancelText && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-xl border border-surface-container-high bg-surface-container hover:bg-surface-container-highest text-on-surface font-label-md text-label-md font-medium transition-colors cursor-pointer"
            >
              {cancelText}
            </button>
          )}
          <button
            type="button"
            onClick={onConfirm}
            autoFocus
            className={`px-5 py-2 rounded-xl font-label-md text-label-md font-semibold transition-all cursor-pointer ${style.btnBg}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
