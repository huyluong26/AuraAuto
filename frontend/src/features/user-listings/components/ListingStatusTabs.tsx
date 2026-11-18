'use client';

import React from 'react';
import { ListingFilterStatus, StatusTabItem } from '../types';

interface ListingStatusTabsProps {
  statusTabs: StatusTabItem[];
  filterStatus: ListingFilterStatus;
  onSelectTab: (status: ListingFilterStatus) => void;
}

export const ListingStatusTabs: React.FC<ListingStatusTabsProps> = ({
  statusTabs,
  filterStatus,
  onSelectTab,
}) => {
  return (
    <div className="border-b border-[#e8e6e1] bg-[#fcfbf9] px-4 pt-1.5 overflow-x-auto no-scrollbar">
      <nav className="flex space-x-1 sm:space-x-3 -mb-px">
        {statusTabs.map((tab) => {
          const isActive = filterStatus === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onSelectTab(tab.key)}
              className={`group inline-flex items-center py-3 px-2.5 border-b-2 text-xs sm:text-sm font-medium whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'border-[#111827] text-[#111827] font-semibold'
                  : 'border-transparent text-[#6b7280] hover:text-[#111827] hover:border-[#d1d5db]'
              }`}
            >
              {tab.isVip && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#8c6d3b] mr-1.5 shrink-0" />
              )}
              <span>{tab.label}</span>
              <span
                className={`ml-2 px-1.5 py-0.5 rounded-full text-[11px] font-mono leading-none transition-colors ${
                  isActive
                    ? 'bg-[#111827] text-white font-semibold'
                    : 'bg-neutral-200/80 text-[#6b7280] group-hover:bg-neutral-300 group-hover:text-[#111827]'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
