'use client';

import React from 'react';
import Link from 'next/link';
import { ListingItem } from '@/types';
import { formatVND } from '@/lib/api';
import { getHighResImageUrl } from '@/lib/image';
import { ListingFilterStatus } from '../types';

interface ListingManagementTableProps {
  listings: ListingItem[];
  loading: boolean;
  actionLoadingId: string | null;
  selectedIds: string[];
  isAllSelected: boolean;
  isPartiallySelected: boolean;
  activeMenuId: string | null;
  setActiveMenuId: React.Dispatch<React.SetStateAction<string | null>>;
  onSelectAll: (checked: boolean) => void;
  onToggleSelect: (id: string) => void;
  onQuickEditPrice: (item: ListingItem) => void;
  onFullEdit: (id: string) => void;
  onPromote: (item: ListingItem) => void;
  onRelist: (id: string) => void;
  onSubmitReview: (id: string) => void;
  onToggleHide: (id: string) => void;
  onMarkSold: (id: string) => void;
  onDelete: (item: ListingItem) => void;
  filterStatus: ListingFilterStatus;
  searchQuery: string;
  onResetFilters: () => void;
  // Pagination
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
}

export const ListingManagementTable: React.FC<ListingManagementTableProps> = ({
  listings,
  loading,
  actionLoadingId,
  selectedIds,
  isAllSelected,
  isPartiallySelected,
  activeMenuId,
  setActiveMenuId,
  onSelectAll,
  onToggleSelect,
  onQuickEditPrice,
  onFullEdit,
  onPromote,
  onRelist,
  onSubmitReview,
  onToggleHide,
  onMarkSold,
  onDelete,
  filterStatus,
  searchQuery,
  onResetFilters,
  page,
  pageSize,
  totalItems,
  totalPages,
  onPageChange,
}) => {
  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#faf9f6] border-b border-[#e8e6e1] text-[#6b7280] text-[11px] font-semibold uppercase tracking-wider">
            <tr>
              <th className="py-3 px-3 w-9 text-center shrink-0">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = Boolean(isPartiallySelected);
                  }}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-[#d1d5db] text-[#111827] accent-[#111827] cursor-pointer"
                />
              </th>
              <th className="py-3 px-3 min-w-[240px]">Phương tiện & Chi tiết</th>
              <th className="py-3 px-3 w-[130px] whitespace-nowrap">Giá bán niêm yết</th>
              <th className="py-3 px-3 w-[145px] whitespace-nowrap">Trạng thái</th>
              <th className="py-3 px-3 w-[85px] whitespace-nowrap text-center">Tương tác</th>
              <th className="py-3 px-3 w-[105px] whitespace-nowrap">Thời gian</th>
              <th className="py-3 px-3 w-[190px] whitespace-nowrap text-right pr-4">Thao tác</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#f0ede6] text-[#1a1c1a] text-sm">
            {loading ? (
              // Skeleton loading rows
              Array.from({ length: 5 }).map((_, index) => (
                <tr key={index} className="animate-pulse">
                  <td className="py-4 px-3.5 text-center">
                    <div className="w-4 h-4 bg-neutral-200 rounded mx-auto" />
                  </td>
                  <td className="py-4 px-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-12 bg-neutral-200 rounded-lg shrink-0" />
                      <div className="space-y-1.5 flex-1">
                        <div className="h-4 bg-neutral-200 rounded w-3/4" />
                        <div className="h-3 bg-neutral-100 rounded w-1/2" />
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-3.5">
                    <div className="h-4 bg-neutral-200 rounded w-24 mb-1" />
                    <div className="h-3 bg-neutral-100 rounded w-16" />
                  </td>
                  <td className="py-4 px-3.5">
                    <div className="h-5 bg-neutral-200 rounded-full w-24" />
                  </td>
                  <td className="py-4 px-3.5">
                    <div className="h-3 bg-neutral-200 rounded w-14 mb-1" />
                    <div className="h-3 bg-neutral-100 rounded w-10" />
                  </td>
                  <td className="py-4 px-3.5">
                    <div className="h-3 bg-neutral-200 rounded w-16" />
                  </td>
                  <td className="py-4 px-3.5 text-right pr-5">
                    <div className="h-7 bg-neutral-200 rounded-lg w-20 ml-auto" />
                  </td>
                </tr>
              ))
            ) : listings.length === 0 ? (
              // Empty State
              <tr>
                <td colSpan={7} className="py-16 text-center">
                  <div className="w-12 h-12 rounded-xl bg-neutral-100 flex items-center justify-center mx-auto text-neutral-400 mb-3">
                    <span className="material-symbols-outlined text-[28px]">directions_car</span>
                  </div>
                  <h3 className="text-sm font-semibold text-[#111827]">Không tìm thấy tin xe nào</h3>
                  <p className="text-xs text-[#6b7280] max-w-sm mx-auto mt-1">
                    {searchQuery
                      ? `Không có kết quả nào khớp với từ khóa "${searchQuery}".`
                      : filterStatus !== 'ALL'
                      ? 'Bạn chưa có tin đăng nào ở trạng thái này.'
                      : 'Bạn chưa có tin đăng xe nào trên hệ thống.'}
                  </p>
                  <div className="pt-3">
                    {searchQuery || filterStatus !== 'ALL' ? (
                      <button
                        type="button"
                        onClick={onResetFilters}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-100 text-[#374151] hover:bg-neutral-200 transition-colors cursor-pointer"
                      >
                        Đặt lại bộ lọc
                      </button>
                    ) : (
                      <Link
                        href="/dang-tin"
                        className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#111827] text-white hover:bg-black transition-all inline-flex items-center gap-1.5 shadow-2xs"
                      >
                        <span className="material-symbols-outlined text-[16px]">add</span>
                        <span>Đăng tin bán xe ngay</span>
                      </Link>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              // Real Table Rows
              listings.map((item) => {
                const rawImg =
                  item.primary_image_url ||
                  'https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=800&q=80';
                const imgUrl = getHighResImageUrl(rawImg, 320, 80);
                const isActing = actionLoadingId === item.id;
                const isSelected = selectedIds.includes(item.id);
                const isMenuOpen = activeMenuId === item.id;

                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-[#fbfaf8] transition-colors ${
                      isSelected ? 'bg-amber-50/30' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="py-3 px-3 text-center shrink-0 align-middle">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelect(item.id)}
                        className="w-3.5 h-3.5 rounded border-[#d1d5db] text-[#111827] accent-[#111827] cursor-pointer"
                      />
                    </td>

                    {/* Vehicle Details */}
                    <td className="py-3 px-3 align-middle">
                      <div className="flex items-center gap-3">
                        {/* Thumbnail */}
                        <div className="relative w-14 h-11 rounded-lg overflow-hidden bg-neutral-100 border border-[#e8e6e1] shadow-2xs shrink-0 group">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={imgUrl}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          {item.is_featured && (
                            <div className="absolute top-0.5 left-0.5 px-1 py-0.2 rounded text-[7px] font-bold bg-[#8c6d3b] text-white tracking-widest leading-none shadow-xs">
                              VIP
                            </div>
                          )}
                        </div>

                        {/* Text Info */}
                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/xe/${item.id}`}
                            target="_blank"
                            className="font-semibold text-xs sm:text-sm text-[#111827] hover:text-[#8c6d3b] transition-colors truncate block leading-snug"
                            title={item.title}
                          >
                            {item.title}
                          </Link>
                          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] text-[#6b7280] mt-0.5">
                            <span>{item.manufacture_year}</span>
                            <span>•</span>
                            <span>{item.body_type || 'Sedan'}</span>
                            <span>•</span>
                            <span>{item.transmission || 'Tự động'}</span>
                            <span>•</span>
                            <span>{item.fuel_type || 'Xăng'}</span>
                          </div>
                          <div className="text-[10px] text-[#9ca3af] font-mono mt-0.5 flex items-center gap-2">
                            <span>ODO: {(item.odometer_km || 0).toLocaleString('vi-VN')} km</span>
                            <span>•</span>
                            <span>ID: #{item.id.slice(0, 8)}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Price & Quick Edit */}
                    <td className="py-3 px-3 whitespace-nowrap align-middle">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold font-headline text-xs sm:text-sm text-[#111827] tracking-tight">
                            {formatVND(item.price_vnd)}
                          </span>
                          <button
                            type="button"
                            onClick={() => onQuickEditPrice(item)}
                            className="p-1 rounded text-[#9ca3af] hover:text-[#111827] hover:bg-neutral-100 transition-colors cursor-pointer"
                            title="Sửa nhanh giá bán"
                          >
                            <span className="material-symbols-outlined text-[13px] block">edit</span>
                          </button>
                        </div>
                        {item.location_address && (
                          <div
                            className="text-[10px] text-[#888] truncate max-w-[130px] mt-0.5"
                            title={item.location_address}
                          >
                            {item.location_address}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Status (Guaranteed Single-Line Dot Badge) */}
                    <td className="py-3 px-3 whitespace-nowrap align-middle">
                      <div className="space-y-1">
                        <div>
                          {item.status === 'PUBLISHED' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap bg-emerald-50 text-emerald-800 border border-emerald-200/90">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                              <span>Đang hiển thị</span>
                            </span>
                          )}
                          {item.status === 'PENDING_REVIEW' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap bg-amber-50 text-amber-900 border border-amber-200/90">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0 animate-pulse" />
                              <span>Chờ kiểm duyệt</span>
                            </span>
                          )}
                          {item.status === 'SOLD' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap bg-neutral-100 text-neutral-700 border border-neutral-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 shrink-0" />
                              <span>Đã bán</span>
                            </span>
                          )}
                          {item.status === 'HIDDEN' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap bg-zinc-100 text-zinc-600 border border-zinc-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 shrink-0" />
                              <span>Đang tạm ẩn</span>
                            </span>
                          )}
                          {item.status === 'DRAFT' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap bg-neutral-50 text-neutral-600 border border-dashed border-neutral-300">
                              <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 shrink-0" />
                              <span>Bản nháp</span>
                            </span>
                          )}
                          {item.status === 'REJECTED' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap bg-rose-50 text-rose-800 border border-rose-200/90">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-600 shrink-0" />
                              <span>Bị từ chối</span>
                            </span>
                          )}
                        </div>

                        {item.is_featured && (
                          <div className="flex items-center gap-1 text-[10px] font-semibold text-[#8c6b32] whitespace-nowrap">
                            <span className="px-1.5 py-0.2 rounded bg-gradient-to-r from-[#1c1a17] to-[#2b2721] text-[#e5c78a] border border-[#8c6d3b]/40 font-bold uppercase tracking-wider text-[9px]">
                              ★ VIP
                            </span>
                            {item.featured_until && (
                              <span className="text-[#888] font-mono text-[9px]">
                                đến {new Date(item.featured_until).toLocaleDateString('vi-VN')}
                              </span>
                            )}
                          </div>
                        )}

                        {item.has_pending_revision && (
                          <div className="text-[10px] font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 whitespace-nowrap inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-spin" />
                            <span>Bản sửa #{item.pending_revision_no || 1} chờ duyệt</span>
                          </div>
                        )}

                        {item.status === 'REJECTED' && item.rejection_reason && (
                          <div
                            className="text-[10px] text-rose-600 line-clamp-1 max-w-[150px] whitespace-normal"
                            title={item.rejection_reason}
                          >
                            Lý do: {item.rejection_reason}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Interactions */}
                    <td className="py-3 px-3 whitespace-nowrap text-center align-middle">
                      <div className="space-y-0.5 text-xs text-[#6b7280] inline-block text-left">
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[14px] text-[#9ca3af]">
                            visibility
                          </span>
                          <span className="font-medium text-[#111827]">
                            {(item.views_count || 0).toLocaleString('vi-VN')}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[14px] text-rose-500/80">
                            favorite
                          </span>
                          <span className="font-medium text-[#111827]">
                            {item.favorites_count || 0}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="py-3 px-3 whitespace-nowrap align-middle">
                      <div className="text-xs text-[#374151]">
                        <div className="font-medium">
                          {new Date(item.created_at).toLocaleDateString('vi-VN')}
                        </div>
                        <div className="text-[10px] text-[#9ca3af]">
                          {new Date(item.created_at).toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    </td>

                    {/* Actions (Clean Flat Minimalist Luxury Toolbar) */}
                    <td className="py-3 px-3 text-right pr-4 whitespace-nowrap align-middle">
                      <div className="flex items-center justify-end gap-1 relative">
                        {/* Contextual Primary Action Button */}
                        {item.status === 'PUBLISHED' && (
                          <button
                            type="button"
                            onClick={() => onPromote(item)}
                            className="inline-flex items-center gap-1 h-6 px-2 rounded-md text-[10.5px] font-semibold bg-[#0f172a] hover:bg-black text-[#f8fafc] border border-[#1e293b] transition-all cursor-pointer active:scale-[0.98] shrink-0"
                            title="Đưa lên vị trí tin nổi bật VIP sàn AuraAuto"
                          >
                            <span className="material-symbols-outlined text-[13px] text-[#e5c78a]">
                              workspace_premium
                            </span>
                            <span>{item.is_featured ? 'Gia hạn VIP' : 'Đẩy VIP'}</span>
                          </button>
                        )}

                        {(item.status === 'DRAFT' || item.status === 'REJECTED') && (
                          <button
                            type="button"
                            disabled={isActing}
                            onClick={() => onSubmitReview(item.id)}
                            className="inline-flex items-center gap-1 h-6 px-2 rounded-md text-[10.5px] font-semibold bg-[#0f172a] hover:bg-black text-white border border-[#1e293b] transition-all cursor-pointer disabled:opacity-50 shrink-0 active:scale-[0.98]"
                            title="Gửi duyệt tin đăng"
                          >
                            <span className="material-symbols-outlined text-[13px] text-slate-300">send</span>
                            <span>{isActing ? '...' : 'Gửi duyệt'}</span>
                          </button>
                        )}

                        {(item.status === 'SOLD' || item.status === 'HIDDEN') && (
                          <button
                            type="button"
                            disabled={isActing}
                            onClick={() => onRelist(item.id)}
                            className="inline-flex items-center gap-1 h-6 px-2 rounded-md text-[10.5px] font-semibold bg-white border border-[#d8d6d0] hover:border-slate-400 text-[#334155] hover:bg-slate-50 transition-all cursor-pointer disabled:opacity-50 shrink-0 active:scale-[0.98]"
                            title="Mở bán lại xe trên sàn"
                          >
                            <span className="material-symbols-outlined text-[13px] text-slate-500">
                              restart_alt
                            </span>
                            <span>Mở lại</span>
                          </button>
                        )}

                        {/* Secondary Actions (Clean Flat Compact Tiles) */}
                        <div className="flex items-center gap-1">
                          <Link
                            href={`/xe/${item.id}`}
                            target="_blank"
                            className="w-6 h-6 rounded-md flex items-center justify-center border border-[#d8d6d0] bg-white hover:bg-slate-100 hover:border-slate-400 text-[#475569] hover:text-[#0f172a] transition-all cursor-pointer active:scale-[0.98]"
                            title="Xem tin trên sàn"
                          >
                            <span className="material-symbols-outlined text-[13px]">visibility</span>
                          </Link>

                          <button
                            type="button"
                            onClick={() => onFullEdit(item.id)}
                            className="w-6 h-6 rounded-md flex items-center justify-center border border-[#d8d6d0] bg-white hover:bg-slate-100 hover:border-slate-400 text-[#475569] hover:text-[#0f172a] transition-all cursor-pointer active:scale-[0.98]"
                            title="Sửa thông tin chi tiết"
                          >
                            <span className="material-symbols-outlined text-[13px]">edit_note</span>
                          </button>

                          <div className="relative">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuId((prev) => (prev === item.id ? null : item.id));
                              }}
                              className={`w-6 h-6 rounded-md flex items-center justify-center border transition-all cursor-pointer active:scale-[0.98] ${
                                isMenuOpen
                                  ? 'border-slate-500 bg-slate-100 text-[#0f172a]'
                                  : 'border-[#d8d6d0] bg-white hover:bg-slate-100 hover:border-slate-400 text-[#475569] hover:text-[#0f172a]'
                              }`}
                              title="Tùy chọn khác"
                            >
                              <span className="material-symbols-outlined text-[13px]">more_vert</span>
                            </button>

                            {/* Dropdown Menu */}
                            {isMenuOpen && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="absolute right-0 top-full mt-1.5 w-44 bg-white rounded-xl shadow-xl border border-[#e5e5e0] py-1.5 z-40 animate-in fade-in zoom-in-95"
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    onQuickEditPrice(item);
                                  }}
                                  className="w-full text-left px-3 py-1.5 text-xs text-[#374151] hover:bg-neutral-50 flex items-center gap-2 cursor-pointer"
                                >
                                  <span className="material-symbols-outlined text-[15px] text-[#888]">
                                    sell
                                  </span>
                                  <span>Sửa giá bán</span>
                                </button>

                                {item.status === 'PUBLISHED' && (
                                  <button
                                    type="button"
                                    disabled={isActing}
                                    onClick={() => {
                                      setActiveMenuId(null);
                                      onToggleHide(item.id);
                                    }}
                                    className="w-full text-left px-3 py-1.5 text-xs text-[#374151] hover:bg-neutral-50 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                                  >
                                    <span className="material-symbols-outlined text-[15px] text-[#888]">
                                      visibility_off
                                    </span>
                                    <span>Tạm ẩn tin này</span>
                                  </button>
                                )}

                                {item.status === 'PUBLISHED' && (
                                  <button
                                    type="button"
                                    disabled={isActing}
                                    onClick={() => {
                                      setActiveMenuId(null);
                                      onMarkSold(item.id);
                                    }}
                                    className="w-full text-left px-3 py-1.5 text-xs text-[#374151] hover:bg-neutral-50 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                                  >
                                    <span className="material-symbols-outlined text-[15px] text-[#888]">
                                      task_alt
                                    </span>
                                    <span>Đánh dấu đã bán</span>
                                  </button>
                                )}

                                <div className="my-1 border-t border-neutral-100" />

                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    onDelete(item);
                                  }}
                                  className="w-full text-left px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                                >
                                  <span className="material-symbols-outlined text-[15px]">delete</span>
                                  <span>Xóa tin đăng</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="p-3.5 sm:p-4 border-t border-[#e8e6e1] flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#fcfbf9]">
          <p className="text-xs text-[#6b7280]">
            Hiển thị{' '}
            <strong className="text-[#111827] font-semibold">
              {listings.length > 0 ? (page - 1) * pageSize + 1 : 0}
            </strong>{' '}
            -{' '}
            <strong className="text-[#111827] font-semibold">
              {Math.min(page * pageSize, totalItems)}
            </strong>{' '}
            trong tổng số <strong className="text-[#111827] font-semibold">{totalItems}</strong> tin xe
          </p>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => onPageChange(Math.max(page - 1, 1))}
              className="p-1.5 rounded-lg border border-[#d1d5db] bg-white hover:bg-[#f9fafb] disabled:opacity-30 transition-all cursor-pointer flex items-center justify-center text-[#374151]"
              title="Trang trước"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }).map((_, i) => {
                const pageNum = i + 1;
                if (
                  pageNum === 1 ||
                  pageNum === totalPages ||
                  (pageNum >= page - 1 && pageNum <= page + 1)
                ) {
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => onPageChange(pageNum)}
                      className={`w-7 h-7 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        page === pageNum
                          ? 'bg-[#111827] text-white font-semibold'
                          : 'bg-white border border-[#d1d5db] text-[#374151] hover:bg-[#f9fafb]'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                }
                if (pageNum === page - 2 || pageNum === page + 2) {
                  return (
                    <span key={pageNum} className="text-[#9ca3af] text-xs px-0.5">
                      ...
                    </span>
                  );
                }
                return null;
              })}
            </div>

            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => onPageChange(Math.min(page + 1, totalPages))}
              className="p-1.5 rounded-lg border border-[#d1d5db] bg-white hover:bg-[#f9fafb] disabled:opacity-30 transition-all cursor-pointer flex items-center justify-center text-[#374151]"
              title="Trang sau"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};
