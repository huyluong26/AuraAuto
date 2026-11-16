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
    <div className="w-full bg-surface-container-lowest rounded-2xl border border-surface-container-high shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-low border-b border-surface-container-high text-outline text-[11px] font-semibold uppercase tracking-wider">
              {isSelectable && (
                <th className="py-3.5 px-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = Boolean(isPartiallySelected);
                    }}
                    onChange={(e) => onSelectAll && onSelectAll(e.target.checked)}
                    className="w-4 h-4 rounded border-outline/50 text-secondary accent-secondary cursor-pointer focus:ring-secondary/30"
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
                    className={`py-3.5 px-4 ${alignClass}`}
                  >
                    {col.header}
                  </th>
                );
              })}

              {rowActions && (
                <th className="py-3.5 px-4 text-right w-44">{rowActionsHeader}</th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-surface-container-high text-on-surface text-sm">
            {loading ? (
              // Loading skeleton rows
              Array.from({ length: 5 }).map((_, index) => (
                <tr key={index} className="animate-pulse">
                  {isSelectable && (
                    <td className="py-4 px-4 text-center">
                      <div className="w-4 h-4 bg-surface-container-high rounded mx-auto" />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.key} className="py-4 px-4">
                      <div className="h-4 bg-surface-container-high rounded w-3/4" />
                    </td>
                  ))}
                  {rowActions && (
                    <td className="py-4 px-4 text-right">
                      <div className="h-8 bg-surface-container-high rounded-xl w-24 ml-auto" />
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
                    <div className="w-14 h-14 rounded-2xl bg-surface-container-low border border-surface-container-high flex items-center justify-center text-outline mb-3">
                      <span className="material-symbols-outlined text-[32px]">{emptyIcon}</span>
                    </div>
                    <span className="font-headline-sm text-sm font-semibold text-primary">
                      {emptyMessage}
                    </span>
                    <span className="font-body-sm text-xs text-outline mt-1">
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
                        ? 'bg-secondary-container/20'
                        : 'hover:bg-surface-container-low'
                    } ${onRowClick ? 'cursor-pointer' : ''}`}
                  >
                    {isSelectable && (
                      <td
                        className="py-4 px-4 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onToggleSelect && onToggleSelect(id)}
                          className="w-4 h-4 rounded border-outline/50 text-secondary accent-secondary cursor-pointer focus:ring-secondary/30"
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
                        <td key={col.key} className={`py-4 px-4 ${alignClass}`}>
                          {col.render ? col.render(item) : (item as any)[col.key]}
                        </td>
                      );
                    })}

                    {rowActions && (
                      <td
                        className="py-4 px-4 text-right whitespace-nowrap"
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
