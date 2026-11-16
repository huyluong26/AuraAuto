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
      className={`flex items-center gap-1.5 p-1 bg-surface-container-low rounded-xl border border-surface-container-high overflow-x-auto select-none ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = tab.value === activeValue;
        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => onChange(tab.value)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-label-md text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              isActive
                ? 'bg-surface-container-lowest text-primary shadow-2xs border border-surface-container-high'
                : 'text-outline hover:text-primary hover:bg-surface-container/60'
            }`}
          >
            {tab.icon && (
              <span
                className={`material-symbols-outlined text-[16px] ${
                  isActive ? 'text-secondary' : 'text-outline'
                }`}
              >
                {tab.icon}
              </span>
            )}
            <span>{tab.label}</span>
            {typeof tab.count === 'number' && (
              <span
                className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                  isActive
                    ? 'bg-secondary-container text-on-secondary-container'
                    : 'bg-surface-container-high text-outline'
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
