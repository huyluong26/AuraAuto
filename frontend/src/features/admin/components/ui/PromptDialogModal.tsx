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
          iconBg: 'bg-rose-50 text-rose-600 border border-rose-200',
          btnBg: 'bg-[#dc2626] hover:bg-[#b91c1c] text-white shadow-2xs',
        };
      case 'warning':
        return {
          icon: 'warning',
          iconBg: 'bg-amber-50 text-amber-700 border border-amber-200',
          btnBg: 'bg-amber-600 hover:bg-amber-700 text-white shadow-2xs',
        };
      case 'primary':
      default:
        return {
          icon: 'edit_note',
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
        className="w-full max-w-lg bg-white rounded-2xl border border-[#e8e6e1] shadow-[0_24px_60px_rgba(0,0,0,0.18)] p-6 relative overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${style.iconBg}`}>
            <span className="material-symbols-outlined text-[24px]">{style.icon}</span>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-[#111827] leading-tight font-headline">
              {title}
            </h3>
            {message && (
              <p className="mt-1 text-[#4b5563] text-xs sm:text-[13px] leading-relaxed">
                {message}
              </p>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Quick Suggestions Chips */}
          {suggestions.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-[#888] uppercase tracking-wider">
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
                        ? 'bg-[#1c1a17] text-[#e5c78a] border-[#8c6d3b]/50 font-semibold'
                        : 'bg-[#faf9f6] border-[#e8e6e1] text-[#374151] hover:border-[#b89b72]'
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
              className="w-full rounded-xl border border-[#dcd9d2] bg-white p-3 text-xs sm:text-sm text-[#111827] placeholder:text-[#9ca3af] focus:outline-none focus:border-[#8c6d3b] focus:ring-1 focus:ring-[#8c6d3b]/20 transition-all resize-none shadow-2xs"
            />
            <div className="text-right text-[11px] text-[#9ca3af]">
              {value.length} ký tự
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#f0ede6]">
            <button
              type="button"
              onClick={onCancel}
              className="px-3.5 py-1.5 rounded-md border border-[#d8d6d0] bg-white hover:bg-[#faf9f6] text-[#334155] text-xs font-medium transition-colors cursor-pointer shadow-2xs active:scale-[0.99]"
            >
              {cancelText}
            </button>
            <button
              type="submit"
              disabled={!value.trim()}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs active:scale-[0.99] ${style.btnBg}`}
            >
              {confirmText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
