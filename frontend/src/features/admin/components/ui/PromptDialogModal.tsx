'use client';

import React, { useState, useEffect } from 'react';
import { PromptDialogOptions } from '../../types';

interface PromptDialogModalProps {
  isOpen: boolean;
  options: PromptDialogOptions | null;
  onSubmit: (value: string) => void;
  onCancel: () => void;
}

export function PromptDialogModal({
  isOpen,
  options,
  onSubmit,
  onCancel,
}: PromptDialogModalProps) {
  const [value, setValue] = useState('');

  useEffect(() => {
    if (options) {
      setValue(options.defaultValue || '');
    }
  }, [options]);

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
    placeholder = 'Nhập nội dung...',
    suggestions = [],
    confirmText = 'Gửi xác nhận',
    cancelText = 'Hủy bỏ',
    variant = 'primary',
  } = options;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    onSubmit(value.trim());
  };

  const handleSelectSuggestion = (suggestion: string) => {
    setValue(suggestion);
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: 'report_problem',
          iconBg: 'bg-red-50 text-red-600 border border-red-200',
          btnBg: 'bg-red-600 hover:bg-red-700 text-white shadow-xs',
        };
      case 'warning':
        return {
          icon: 'warning',
          iconBg: 'bg-amber-50 text-amber-600 border border-amber-200',
          btnBg: 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs',
        };
      case 'primary':
      default:
        return {
          icon: 'edit_note',
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
        className="w-full max-w-lg bg-surface-container-lowest rounded-2xl border border-surface-container-high shadow-2xl p-6 relative overflow-hidden animate-in zoom-in-95 duration-150"
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
            {message && (
              <p className="mt-1 text-on-surface-variant font-body-sm text-[13px] leading-relaxed">
                {message}
              </p>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Quick Suggestions Chips */}
          {suggestions.length > 0 && (
            <div className="space-y-1.5">
              <span className="font-label-sm text-[11px] font-semibold text-outline uppercase tracking-wider">
                Gợi ý lý do nhanh:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {suggestions.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectSuggestion(s)}
                    className={`text-[12px] px-2.5 py-1 rounded-lg border transition-all text-left cursor-pointer ${
                      value === s
                        ? 'bg-secondary-container text-on-secondary-container border-secondary font-semibold'
                        : 'bg-surface-container-low border-surface-container-high text-on-surface hover:border-secondary/50'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input field */}
          <div className="space-y-1">
            <textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder}
              rows={3}
              autoFocus
              className="w-full rounded-xl border border-surface-container-high bg-surface-container-lowest p-3 font-body-md text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all resize-none"
            />
            <div className="text-right text-[11px] text-outline">
              {value.length} ký tự
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-surface-container-high">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-xl border border-surface-container-high bg-surface-container hover:bg-surface-container-highest text-on-surface font-label-md text-label-md font-medium transition-colors cursor-pointer"
            >
              {cancelText}
            </button>
            <button
              type="submit"
              disabled={!value.trim()}
              className={`px-5 py-2 rounded-xl font-label-md text-label-md font-semibold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${style.btnBg}`}
            >
              {confirmText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
