'use client';

import React from 'react';

export interface AdminTabItem {
  label: string;
  value: string;
  count?: number;
  icon?: string;
  badgeVariant?: 'default' | 'warning' | 'danger' | 'success' | 'info';
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
        const hasCount = typeof tab.count === 'number';
        const isWarning = tab.badgeVariant === 'warning' || tab.value === 'PENDING_REVIEW' || tab.value === 'PENDING';
        const isDanger = tab.badgeVariant === 'danger' || tab.value === 'REJECTED';
        const count = tab.count ?? 0;

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
            {hasCount && (
              <span
                className={`inline-flex items-center justify-center min-w-[20px] px-1.5 py-0.5 rounded-full text-[10.5px] font-mono leading-none transition-transform ${
                  isActive
                    ? isWarning && count > 0
                      ? 'bg-amber-400 text-neutral-950 font-black'
                      : isDanger && count > 0
                      ? 'bg-rose-400 text-neutral-950 font-black'
                      : 'bg-white/20 text-[#faf9f6] font-semibold'
                    : isWarning && count > 0
                    ? 'bg-amber-50 text-amber-900 border border-amber-300 shadow-2xs font-bold'
                    : isDanger && count > 0
                    ? 'bg-rose-50 text-rose-800 border border-rose-300 shadow-2xs font-bold'
                    : count > 0
                    ? 'bg-[#e2e1dc] text-[#374151] font-bold'
                    : 'bg-black/[0.04] text-[#9ca3af] font-medium'
                }`}
              >
                {isWarning && count > 0 && !isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1 animate-pulse" />
                )}
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
