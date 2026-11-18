'use client';

import React, { ReactNode } from 'react';
import { TableColumn } from '../../types';

interface AdminTableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  selectedIds?: string[];
  onSelectAll?: (checked: boolean) => void;
  onToggleSelect?: (id: string) => void;
  loading?: boolean;
  emptyMessage?: string;
  emptyIcon?: string;
  rowActions?: (item: T) => ReactNode;
  rowActionsHeader?: string;
  onRowClick?: (item: T) => void;
}

export function AdminTable<T>({
  columns,
  data,
  keyExtractor,
  selectedIds,
  onSelectAll,
  onToggleSelect,
  loading = false,
  emptyMessage = 'Không tìm thấy dữ liệu phù hợp',
  emptyIcon = 'inbox',
  rowActions,
  rowActionsHeader = 'Thao tác',
  onRowClick,
}: AdminTableProps<T>) {
  const isSelectable = Boolean(selectedIds && onToggleSelect);
  const isAllSelected =
    data.length > 0 && selectedIds && data.every((item) => selectedIds.includes(keyExtractor(item)));
  const isPartiallySelected =
    data.length > 0 &&
    selectedIds &&
    !isAllSelected &&
    data.some((item) => selectedIds.includes(keyExtractor(item)));

  return (
    <div className="w-full bg-white rounded-xl border border-[#e8e6e1] shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#faf9f6] border-b border-[#e8e6e1] text-[#6b7280] text-[11px] font-semibold uppercase tracking-wider">
              {isSelectable && (
                <th className="py-3 px-3.5 w-10 text-center shrink-0">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = Boolean(isPartiallySelected);
                    }}
                    onChange={(e) => onSelectAll && onSelectAll(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-[#d1d5db] text-[#111827] accent-[#111827] cursor-pointer"
                  />
                </th>
              )}

              {columns.map((col) => {
                const alignClass =
                  col.align === 'center'
                    ? 'text-center'
                    : col.align === 'right'
                    ? 'text-right'
                    : 'text-left';
                return (
                  <th
                    key={col.key}
                    style={{ width: col.width }}
                    className={`py-3 px-3.5 ${alignClass}`}
                  >
                    {col.header}
                  </th>
                );
              })}

              {rowActions && (
                <th className="py-3 px-3.5 text-right w-40 whitespace-nowrap">{rowActionsHeader}</th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-[#f0ede6] text-[#1a1c1a] text-sm">
            {loading ? (
              // Loading skeleton rows
              Array.from({ length: 5 }).map((_, index) => (
                <tr key={index} className="animate-pulse">
                  {isSelectable && (
                    <td className="py-3.5 px-3.5 text-center">
                      <div className="w-4 h-4 bg-neutral-200 rounded mx-auto" />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.key} className="py-3.5 px-3.5">
                      <div className="h-4 bg-neutral-200 rounded w-3/4" />
                    </td>
                  ))}
                  {rowActions && (
                    <td className="py-3.5 px-3.5 text-right">
                      <div className="h-8 bg-neutral-200 rounded-lg w-24 ml-auto" />
                    </td>
                  )}
                </tr>
              ))
            ) : data.length === 0 ? (
              // Empty State
              <tr>
                <td
                  colSpan={columns.length + (isSelectable ? 1 : 0) + (rowActions ? 1 : 0)}
                  className="py-16 text-center"
                >
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-12 h-12 rounded-xl bg-neutral-100 border border-[#e8e6e1] flex items-center justify-center text-neutral-400 mb-3">
                      <span className="material-symbols-outlined text-[28px]">{emptyIcon}</span>
                    </div>
                    <span className="text-sm font-semibold text-[#111827]">
                      {emptyMessage}
                    </span>
                    <span className="text-xs text-[#6b7280] mt-1">
                      Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              // Data Rows
              data.map((item) => {
                const id = keyExtractor(item);
                const isSelected = selectedIds ? selectedIds.includes(id) : false;

                return (
                  <tr
                    key={id}
                    onClick={() => onRowClick && onRowClick(item)}
                    className={`transition-colors group ${
                      isSelected
                        ? 'bg-amber-50/30'
                        : 'hover:bg-[#fbfaf8]'
                    } ${onRowClick ? 'cursor-pointer' : ''}`}
                  >
                    {isSelectable && (
                      <td
                        className="py-3.5 px-3.5 text-center shrink-0 align-middle"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onToggleSelect && onToggleSelect(id)}
                          className="w-3.5 h-3.5 rounded border-[#d1d5db] text-[#111827] accent-[#111827] cursor-pointer"
                        />
                      </td>
                    )}

                    {columns.map((col) => {
                      const alignClass =
                        col.align === 'center'
                          ? 'text-center'
                          : col.align === 'right'
                          ? 'text-right'
                          : 'text-left';

                      return (
                        <td key={col.key} className={`py-3.5 px-3.5 align-middle ${alignClass}`}>
                          {col.render ? col.render(item) : (item as any)[col.key]}
                        </td>
                      );
                    })}

                    {rowActions && (
                      <td
                        className="py-3.5 px-3.5 text-right whitespace-nowrap align-middle"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {rowActions(item)}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
