'use client';

import React, { useState, Suspense, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { formatVND, formatKm } from '@/lib/api';
import { AdminHeader } from '@/features/admin/components/AdminHeader';
import { AdminTable } from '@/features/admin/components/ui/AdminTable';
import { AdminButton } from '@/features/admin/components/ui/AdminButton';
import { AdminBadge } from '@/features/admin/components/ui/AdminBadge';
import { AdminTabs } from '@/features/admin/components/ui/AdminTabs';
import { AdminSearchInput } from '@/features/admin/components/ui/AdminSearchInput';
import { ListingInspectionModal } from '@/features/admin/components/ListingInspectionModal';
import { ListingQuickEditModal } from '@/features/admin/components/ListingQuickEditModal';
import { useAdminListings } from '@/features/admin/hooks/useAdminListings';
import { AdminListingItem, TableColumn } from '@/features/admin/types';

function AdminListingsContent() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get('status') || 'ALL';

  const {
    listings,
    loading,
    refreshing,
    statusFilter,
    setStatusFilter,
    searchKeyword,
    setSearchKeyword,
    selectedIds,
    setSelectedIds,
    tabCounts,
    loadListings,
    handleSelectAll,
    handleToggleSelect,
    handleQuickApprove,
    handleQuickReject,
    handleQuickTakedown,
    handleDeleteListing,
    handleBulkApprove,
    handleBulkDelete,
    handleSaveEdit,
  } = useAdminListings(initialStatus);

  const [inspectListingId, setInspectListingId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<AdminListingItem | null>(null);

  // Status Tab definition with dynamic counts
  const STATUS_TABS = useMemo(() => {
    return [
      { label: 'Tất cả bài đăng', value: 'ALL', count: tabCounts.ALL },
      { label: 'Chờ duyệt', value: 'PENDING_REVIEW', count: tabCounts.PENDING_REVIEW, badgeVariant: 'warning' as const },
      { label: 'Đang hiển thị', value: 'PUBLISHED', count: tabCounts.PUBLISHED },
      { label: 'Bị từ chối', value: 'REJECTED', count: tabCounts.REJECTED, badgeVariant: 'danger' as const },
      { label: 'Đã giao dịch', value: 'SOLD', count: tabCounts.SOLD },
      { label: 'Bản nháp', value: 'DRAFT', count: tabCounts.DRAFT },
    ];
  }, [tabCounts]);

  // Define Table Columns (Responsive, fits gracefully without horizontal clipping)
  const columns: TableColumn<AdminListingItem>[] = [
    {
      key: 'vehicle',
      header: 'Thông tin phương tiện',
      render: (item) => (
        <div className="flex items-center gap-3 min-w-[240px]">
          <div className="w-14 h-12 rounded-lg overflow-hidden bg-neutral-100 border border-[#e8e6e1] shrink-0 relative">
            {item.primary_image_url ? (
              <img
                src={item.primary_image_url}
                alt={item.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-neutral-400">
                <span className="material-symbols-outlined text-[20px]">directions_car</span>
              </div>
            )}
            {item.images_count > 0 && (
              <span className="absolute bottom-1 right-1 px-1 rounded bg-black/70 text-white text-[9px] font-mono leading-tight">
                {item.images_count}
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="font-semibold text-[#111827] text-xs sm:text-sm truncate leading-snug hover:text-[#8c6d3b] transition-colors" title={item.title}>
              {item.title}
            </div>
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] text-[#6b7280] mt-0.5">
              <span>{item.manufacture_year}</span>
              <span>•</span>
              <span>{item.body_type || 'Sedan'}</span>
              <span>•</span>
              <span>{item.fuel_type || 'Xăng'}</span>
              <span>•</span>
              <span>{item.transmission || 'Tự động'}</span>
            </div>
            <div className="text-[10px] text-[#9ca3af] font-mono mt-0.5">
              ID: #{item.id.slice(0, 8)}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'price',
      header: 'Giá & ODO',
      width: '135px',
      render: (item) => (
        <div className="whitespace-nowrap">
          <div className="font-bold text-[#111827] text-xs sm:text-sm font-headline">
            {formatVND(item.price_vnd)}
          </div>
          <div className="text-[11px] text-[#6b7280] mt-0.5 flex items-center gap-1">
            <span className="material-symbols-outlined text-[13px] text-[#9ca3af]">speed</span>
            <span>{formatKm(item.odometer_km)}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'seller',
      header: 'Người bán & Nơi bán',
      width: '170px',
      render: (item) => (
        <div className="whitespace-nowrap">
          <div className="font-medium text-[#111827] text-xs flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px] text-[#9ca3af]">person</span>
            <span className="truncate max-w-[130px]">{item.seller_name}</span>
          </div>
          <div className="text-[11px] text-[#6b7280] mt-0.5 flex items-center gap-1">
            <span className="material-symbols-outlined text-[13px] text-[#9ca3af]">location_on</span>
            <span>{item.province_code || 'Toàn quốc'}</span>
            {item.seller_phone && <span className="text-[#9ca3af]">• {item.seller_phone}</span>}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Trạng thái',
      width: '140px',
      align: 'center',
      render: (item) => (
        <div className="flex flex-col items-center gap-1 whitespace-nowrap">
          <AdminBadge status={item.status} size="sm" />
          {item.has_pending_revision && (
            <span className="px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 text-[10px] font-semibold border border-amber-300">
              Có bản sửa chờ duyệt
            </span>
          )}
          {item.rejection_reason && (
            <span
              className="text-[10px] text-red-600 line-clamp-1 max-w-[130px] text-center"
              title={item.rejection_reason}
            >
              {item.rejection_reason}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'date',
      header: 'Thời gian',
      width: '105px',
      render: (item) => (
        <div className="text-xs text-[#374151] whitespace-nowrap">
          <div className="font-medium">{new Date(item.created_at).toLocaleDateString('vi-VN')}</div>
          <div className="text-[10px] text-[#9ca3af]">
            {new Date(item.created_at).toLocaleTimeString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-surface">
      {/* Header */}
      <AdminHeader
        title="Quản lý tin đăng bán xe"
        subtitle={`${listings.length} tin`}
        onRefresh={loadListings}
        isRefreshing={refreshing}
        actions={
          <Link href="/dang-tin" target="_blank">
            <AdminButton variant="primary" size="sm" icon="add">
              Đăng tin mới
            </AdminButton>
          </Link>
        }
      />

      <main className="p-8 space-y-6 flex-1">
        {/* Navigation Tabs & Search Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <AdminTabs
            tabs={STATUS_TABS}
            activeValue={statusFilter}
            onChange={setStatusFilter}
          />

          <div className="w-full lg:w-72">
            <AdminSearchInput
              value={searchKeyword}
              onChange={setSearchKeyword}
              placeholder="Tìm theo tên xe, người bán, ID..."
            />
          </div>
        </div>

        {/* Bulk Actions Floating Bar */}
        {selectedIds.length > 0 && (
          <div className="p-3.5 rounded-2xl bg-primary text-on-primary border border-primary flex flex-wrap items-center justify-between gap-3 shadow-xl animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-on-primary/10 flex items-center justify-center font-bold text-sm text-secondary-fixed">
                {selectedIds.length}
              </span>
              <span className="font-label-md text-xs font-semibold">
                Bài đăng đã được chọn
              </span>
            </div>

            <div className="flex items-center gap-2">
              <AdminButton
                variant="secondary"
                size="xs"
                icon="check_circle"
                onClick={handleBulkApprove}
              >
                Phê duyệt hàng loạt
              </AdminButton>

              <AdminButton
                variant="danger"
                size="xs"
                icon="delete_sweep"
                onClick={handleBulkDelete}
              >
                Xóa vĩnh viễn
              </AdminButton>

              <AdminButton
                variant="ghost"
                size="xs"
                className="text-white hover:text-white hover:bg-white/10"
                onClick={() => setSelectedIds([])}
              >
                Bỏ chọn
              </AdminButton>
            </div>
          </div>
        )}

        {/* Main Data Table */}
        <AdminTable<AdminListingItem>
          columns={columns}
          data={listings}
          keyExtractor={(item) => item.id}
          selectedIds={selectedIds}
          onSelectAll={handleSelectAll}
          onToggleSelect={handleToggleSelect}
          loading={loading}
          emptyMessage="Không có tin đăng xe nào trong mục này"
          emptyIcon="directions_car"
          onRowClick={(item) => setInspectListingId(item.id)}
          rowActions={(item) => (
            <div className="flex items-center justify-end gap-1">
              {/* Quick Approve button if pending review or has revision */}
              {(item.status !== 'PUBLISHED' || item.has_pending_revision) && item.status !== 'SOLD' && (
                <button
                  type="button"
                  title={item.has_pending_revision ? "Phê duyệt bản sửa đổi" : "Phê duyệt bài đăng"}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQuickApprove(item.id, item.title);
                  }}
                  className="inline-flex items-center gap-1 h-6 px-2 rounded-md text-[10.5px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-700 active:scale-[0.98] transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[13px]">check_circle</span>
                  <span>Duyệt</span>
                </button>
              )}

              {/* Quick Reject button if pending or has revision */}
              {(item.status === 'PENDING_REVIEW' || item.has_pending_revision) && (
                <button
                  type="button"
                  title={item.has_pending_revision ? "Từ chối bản sửa đổi" : "Từ chối bài đăng"}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQuickReject(item.id, item.title);
                  }}
                  className="inline-flex items-center gap-1 h-6 px-2 rounded-md text-[10.5px] font-semibold bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 hover:border-rose-300 active:scale-[0.98] transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[13px]">cancel</span>
                  <span>Từ chối</span>
                </button>
              )}

              {/* Quick Takedown button if published */}
              {item.status === 'PUBLISHED' && (
                <button
                  type="button"
                  title="Gỡ tin khỏi sàn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQuickTakedown(item.id, item.title);
                  }}
                  className="w-6 h-6 rounded-md flex items-center justify-center bg-white hover:bg-amber-50 border border-[#d8d6d0] hover:border-amber-300 text-[#64748b] hover:text-amber-700 active:scale-[0.98] transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[13px]">block</span>
                </button>
              )}

              {/* Quick Edit */}
              <button
                type="button"
                title="Chỉnh sửa nhanh"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingItem(item);
                }}
                className="w-6 h-6 rounded-md flex items-center justify-center bg-white hover:bg-slate-100 border border-[#d8d6d0] hover:border-slate-400 text-[#475569] hover:text-[#0f172a] active:scale-[0.98] transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[13px]">edit</span>
              </button>

              {/* Inspection Drawer */}
              <button
                type="button"
                title="Thẩm định chi tiết"
                onClick={(e) => {
                  e.stopPropagation();
                  setInspectListingId(item.id);
                }}
                className="w-6 h-6 rounded-md flex items-center justify-center bg-white hover:bg-slate-100 border border-[#d8d6d0] hover:border-slate-400 text-[#475569] hover:text-[#0f172a] active:scale-[0.98] transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[13px]">visibility</span>
              </button>

              {/* Permanent Delete */}
              <button
                type="button"
                title="Xóa vĩnh viễn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteListing(item.id, item.title);
                }}
                className="w-6 h-6 rounded-md flex items-center justify-center bg-white hover:bg-rose-50 border border-rose-200 hover:border-rose-300 text-rose-600 hover:text-rose-700 active:scale-[0.98] transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[13px]">delete</span>
              </button>
            </div>
          )}
        />
      </main>

      {/* Full Inspection Modal */}
      {inspectListingId && (
        <ListingInspectionModal
          listingId={inspectListingId}
          onClose={() => setInspectListingId(null)}
          onSuccess={() => {
            loadListings();
          }}
        />
      )}

      {/* Quick Edit Modal */}
      {editingItem && (
        <ListingQuickEditModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
}

export default function AdminListingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center p-20">
          <div className="w-8 h-8 border-2 border-secondary/30 border-t-secondary rounded-full animate-spin" />
        </div>
      }
    >
      <AdminListingsContent />
    </Suspense>
  );
}
