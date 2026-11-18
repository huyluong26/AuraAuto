'use client';

import React from 'react';

export interface AdminTabItem {
  label: string;
  value: string;
  count?: number;
  icon?: string;
}

interface AdminTabsProps {
  tabs: AdminTabItem[];
  activeValue: string;
  onChange: (value: string) => void;
  className?: string;
}

export function AdminTabs({
  tabs,
  activeValue,
  onChange,
  className = '',
}: AdminTabsProps) {
  return (
    <div
      className={`flex items-center gap-1.5 p-1 bg-[#f4f3f0] rounded-xl border border-[#e8e6e1] overflow-x-auto select-none ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = tab.value === activeValue;
        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => onChange(tab.value)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              isActive
                ? 'bg-[#121316] text-[#faf9f6] shadow-xs border border-neutral-800'
                : 'text-[#6b7280] hover:text-[#111827] hover:bg-black/[0.03]'
            }`}
          >
            {tab.icon && (
              <span
                className={`material-symbols-outlined text-[16px] ${
                  isActive ? 'text-[#e5c78a]' : 'text-[#9ca3af]'
                }`}
              >
                {tab.icon}
              </span>
            )}
            <span>{tab.label}</span>
            {typeof tab.count === 'number' && (
              <span
                className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold leading-none ${
                  isActive
                    ? 'bg-white/20 text-[#faf9f6]'
                    : 'bg-[#e8e6e1] text-[#6b7280]'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
