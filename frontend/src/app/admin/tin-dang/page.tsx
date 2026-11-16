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
      { label: 'Tất cả bài đăng', value: 'ALL' },
      { label: 'Chờ duyệt', value: 'PENDING_REVIEW' },
      { label: 'Đang hiển thị', value: 'PUBLISHED' },
      { label: 'Bị từ chối', value: 'REJECTED' },
      { label: 'Đã giao dịch', value: 'SOLD' },
      { label: 'Bản nháp', value: 'DRAFT' },
    ];
  }, []);

  // Define Table Columns (Open for Extension)
  const columns: TableColumn<AdminListingItem>[] = [
    {
      key: 'vehicle',
      header: 'Thông tin phương tiện',
      width: '35%',
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-xl overflow-hidden bg-surface-container-high border border-surface-container-high shrink-0 relative">
            {item.primary_image_url ? (
              <img
                src={item.primary_image_url}
                alt={item.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-outline">
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
            <div className="font-semibold text-primary text-sm truncate leading-snug hover:text-secondary transition-colors">
              {item.title}
            </div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-outline mt-0.5">
              <span>Năm {item.manufacture_year}</span>
              <span>•</span>
              <span>{item.body_type}</span>
              <span>•</span>
              <span>{item.fuel_type}</span>
              <span>•</span>
              <span>{item.transmission}</span>
            </div>
            <div className="text-[10px] text-outline/80 font-mono mt-0.5">
              ID: {item.id.slice(0, 8)}...
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'price',
      header: 'Giá & Odometer',
      width: '18%',
      render: (item) => (
        <div>
          <div className="font-bold text-secondary text-sm">
            {formatVND(item.price_vnd)}
          </div>
          <div className="text-xs text-outline mt-0.5 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">speed</span>
            <span>{formatKm(item.odometer_km)}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'seller',
      header: 'Người bán & Địa điểm',
      width: '20%',
      render: (item) => (
        <div>
          <div className="font-medium text-primary text-xs flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[15px] text-outline">person</span>
            <span className="truncate">{item.seller_name}</span>
          </div>
          <div className="text-[11px] text-outline mt-0.5 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">location_on</span>
            <span>{item.province_code}</span>
            {item.seller_phone && <span>• {item.seller_phone}</span>}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Trạng thái',
      width: '14%',
      align: 'center',
      render: (item) => (
        <div className="flex flex-col items-center gap-1">
          <AdminBadge status={item.status} size="sm" />
          {item.has_pending_revision && (
            <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-300">
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
      width: '13%',
      render: (item) => (
        <div className="text-xs text-outline">
          <div>{new Date(item.created_at).toLocaleDateString('vi-VN')}</div>
          <div className="text-[10px] text-outline/80">
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
            <div className="flex items-center justify-end gap-1.5">
              {/* Quick Approve button if not published OR has pending revision */}
              {(item.status !== 'PUBLISHED' || item.has_pending_revision) && item.status !== 'SOLD' && (
                <button
                  type="button"
                  title={item.has_pending_revision ? "Phê duyệt bản sửa đổi" : "Phê duyệt nhanh"}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQuickApprove(item.id, item.title);
                  }}
                  className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 border border-emerald-200 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[17px]">check_circle</span>
                </button>
              )}

              {/* Quick Reject button if pending OR has pending revision */}
              {(item.status === 'PENDING_REVIEW' || item.has_pending_revision) && (
                <button
                  type="button"
                  title={item.has_pending_revision ? "Từ chối bản sửa đổi" : "Từ chối nhanh"}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQuickReject(item.id, item.title);
                  }}
                  className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 border border-red-200 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[17px]">cancel</span>
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
                  className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 border border-amber-200 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[17px]">block</span>
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
                className="p-1.5 rounded-lg text-outline hover:text-primary hover:bg-surface-container-high transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[17px]">edit</span>
              </button>

              {/* Inspection Drawer */}
              <button
                type="button"
                title="Thẩm định chi tiết"
                onClick={(e) => {
                  e.stopPropagation();
                  setInspectListingId(item.id);
                }}
                className="p-1.5 rounded-lg text-secondary hover:bg-secondary-container/40 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[17px]">visibility</span>
              </button>

              {/* Permanent Delete */}
              <button
                type="button"
                title="Xóa vĩnh viễn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteListing(item.id, item.title);
                }}
                className="p-1.5 rounded-lg text-outline hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[17px]">delete_forever</span>
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
