'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface SuggestiveInputProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  suggestions: string[];
  required?: boolean;
  type?: string;
  suffix?: string;
  maxSuggestions?: number;
}

export function SuggestiveInput({
  label,
  value,
  onChange,
  placeholder,
  suggestions,
  required = false,
  type = 'text',
  suffix,
  maxSuggestions = 12,
}: SuggestiveInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const removeDiacritics = (str: string) =>
    str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase();

  const filtered = useMemo(() => {
    if (!value || !value.trim()) {
      return suggestions.slice(0, maxSuggestions);
    }
    const q = value.trim().toLowerCase();
    const qNorm = removeDiacritics(q);
    const matches = suggestions.filter((s) => {
      const sLower = s.toLowerCase();
      const sNorm = removeDiacritics(sLower);
      return sLower.includes(q) || sNorm.includes(qNorm);
    });
    return matches.slice(0, maxSuggestions);
  }, [value, suggestions, maxSuggestions]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (item: string) => {
    onChange(item);
    setIsOpen(false);
  };

  const hasTyped = Boolean(value && value.trim().length > 0);
  const displayItems = hasTyped ? filtered : suggestions.slice(0, maxSuggestions);

  return (
    <div ref={containerRef} className={`space-y-1.5 relative ${isOpen ? 'z-30' : 'z-0'}`}>
      <label className="block text-xs font-semibold text-[#3a3a3a]">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            setIsOpen(true);
          }}
          onClick={() => {
            setIsOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setIsOpen(false);
            if (e.key === 'Enter' && isOpen && displayItems.length > 0) {
              e.preventDefault();
              handleSelect(displayItems[0]);
            }
          }}
          placeholder={placeholder}
          className={`w-full h-11 px-3.5 rounded-xl border border-[#e2e0da] bg-white text-xs sm:text-sm text-[#1a1c1a] focus:border-[#b89b72] focus:ring-2 focus:ring-[#b89b72]/20 transition-all outline-none font-medium cursor-pointer ${
            suffix ? 'pr-12' : (suggestions.length > 0 ? 'pr-9' : '')
          }`}
        />

        {suffix ? (
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#888] pointer-events-none">
            {suffix}
          </span>
        ) : suggestions.length > 0 ? (
          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen((prev) => !prev);
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#aaa] hover:text-[#b89b72] transition-colors cursor-pointer"
            title="Xem danh sách gợi ý"
          >
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        ) : null}
      </div>

      {isOpen && displayItems.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-white rounded-2xl shadow-xl border border-[#eae8e3] max-h-64 overflow-y-auto p-1.5 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-1.5 text-[10px] font-bold text-[#888] uppercase tracking-wider flex items-center justify-between border-b border-[#f4f3f0] mb-1">
            <span>Gợi ý lựa chọn ({displayItems.length})</span>
            <span className="text-[10px] text-[#b89b72]">Nhấn để chọn</span>
          </div>
          {displayItems.map((item) => {
            const displayLabel =
              suffix === 'KM' && !isNaN(Number(item))
                ? `${Number(item).toLocaleString('vi-VN')} KM`
                : item;

            return (
              <button
                key={item}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(item);
                }}
                className="w-full text-left px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-[#1a1c1a] hover:bg-[#b89b72]/15 hover:text-[#725a37] transition-colors flex items-center justify-between cursor-pointer group"
              >
                <span className="group-hover:translate-x-0.5 transition-transform">{displayLabel}</span>
                <span className="text-[11px] text-[#b89b72] opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                  Chọn
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default SuggestiveInput;
