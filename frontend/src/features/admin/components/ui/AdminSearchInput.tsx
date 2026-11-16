'use client';

import React from 'react';

interface AdminSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function AdminSearchInput({
  value,
  onChange,
  placeholder = 'Tìm kiếm dữ liệu...',
  className = '',
}: AdminSearchInputProps) {
  return (
    <div className={`relative flex items-center ${className}`}>
      <span className="material-symbols-outlined absolute left-3 text-[18px] text-outline pointer-events-none">
        search
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-8 py-2 text-sm bg-surface-container-lowest border border-surface-container-high rounded-xl text-on-surface placeholder:text-outline focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-2.5 p-0.5 rounded-full text-outline hover:text-primary transition-colors cursor-pointer"
          title="Xóa tìm kiếm"
        >
          <span className="material-symbols-outlined text-[16px]">cancel</span>
        </button>
      )}
    </div>
  );
}
