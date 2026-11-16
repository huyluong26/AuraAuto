'use client';

import React from 'react';
import Link from 'next/link';
import { AdminTable } from '@/features/admin/components/ui/AdminTable';
import { AdminSearchInput } from '@/features/admin/components/ui/AdminSearchInput';
import { AdminFeaturedListing, TableColumn } from '@/features/admin/types';
import { formatVND } from '@/lib/api';

interface FeaturedListingsTabProps {
  listings: AdminFeaturedListing[];
  loading: boolean;
  statusFilter: 'ACTIVE' | 'EXPIRED' | 'ALL';
  setStatusFilter: (val: 'ACTIVE' | 'EXPIRED' | 'ALL') => void;
  search: string;
  setSearch: (val: string) => void;
  onOpenGrantModal: (listing?: AdminFeaturedListing) => void;
  onRevokeFeatured: (listing: AdminFeaturedListing) => Promise<void>;
}

export const FeaturedListingsTab: React.FC<FeaturedListingsTabProps> = ({
  listings,
  loading,
  statusFilter,
  setStatusFilter,
  search,
  setSearch,
  onOpenGrantModal,
  onRevokeFeatured,
}) => {
  const listingColumns: TableColumn<AdminFeaturedListing>[] = [
    {
      key: 'car',
      header: 'Xe đang Nổi Bật',
      width: '32%',
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-xl bg-surface-container-high border border-surface-container-high overflow-hidden shrink-0">
            {item.primary_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.primary_image_url} alt={item.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-outline">
                <span className="material-symbols-outlined text-[24px]">directions_car</span>
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <Link
              href={`/xe/${item.id}`}
              target="_blank"
              className="font-bold text-sm text-primary hover:text-secondary truncate block"
              title={item.title}
            >
              {item.title}
            </Link>
            <div className="text-xs font-bold text-secondary mt-0.5">{formatVND(item.price_vnd)}</div>
            <div className="text-[11px] text-outline flex items-center gap-1 mt-0.5">
              <span className="material-symbols-outlined text-[13px]">location_on</span>
              <span>{item.province_name || 'Toàn quốc'}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'seller',
      header: 'Chủ xe / Người bán',
      width: '22%',
      render: (item) => (
        <div className="text-xs space-y-1">
          <div className="font-semibold text-primary truncate">{item.seller_name}</div>
          <div className="text-outline flex items-center gap-1">
            <span className="material-symbols-outlined text-[13px]">call</span>
            <span>{item.seller_phone || 'Chưa cập nhật'}</span>
          </div>
          {item.seller_email && (
            <div className="text-outline truncate flex items-center gap-1 text-[11px]">
              <span className="material-symbols-outlined text-[13px]">mail</span>
              <span>{item.seller_email}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'package',
      header: 'Gói & Hạn Dùng VIP',
      width: '24%',
      render: (item) => {
        const until = item.featured_until ? new Date(item.featured_until) : null;
        return (
          <div className="text-xs space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-extrabold text-[11px] flex items-center gap-1 shrink-0">
                <span className="material-symbols-outlined text-[13px] text-amber-600">stars</span>
                <span>{item.featured_tier || 'Gói Nổi Bật'}</span>
              </span>
            </div>
            {until && (
              <div className="text-[11px] text-outline">
                Hết hạn: <span className="font-semibold text-primary">{until.toLocaleDateString('vi-VN')} {until.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            )}
            {item.is_active_featured ? (
              <div className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">timer</span>
                <span>Còn {item.days_remaining > 0 ? `${item.days_remaining} ngày` : `${item.hours_remaining} giờ`}</span>
              </div>
            ) : (
              <div className="text-[11px] font-medium text-outline flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">history</span>
                <span>Đã kết thúc</span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'metrics',
      header: 'Lượt xem & Thích',
      width: '12%',
      align: 'center',
      render: (item) => (
        <div className="text-xs space-y-0.5">
          <div className="text-primary font-medium flex items-center justify-center gap-1">
            <span className="material-symbols-outlined text-[14px] text-outline">visibility</span>
            <span>{item.views_count.toLocaleString()}</span>
          </div>
          <div className="text-outline flex items-center justify-center gap-1 text-[11px]">
            <span className="material-symbols-outlined text-[14px] text-red-500">favorite</span>
            <span>{item.favorites_count.toLocaleString()}</span>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-container-lowest p-4 rounded-2xl border border-surface-container-high shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          {(['ACTIVE', 'EXPIRED', 'ALL'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-secondary text-on-secondary shadow-xs'
                  : 'bg-surface-container-low text-outline hover:text-primary'
              }`}
            >
              {st === 'ACTIVE' && 'Đang hiển thị nổi bật'}
              {st === 'EXPIRED' && 'Đã hết hạn VIP'}
              {st === 'ALL' && 'Tất cả tin từng nổi bật'}
            </button>
          ))}
        </div>

        <div className="w-full md:w-80">
          <AdminSearchInput
            value={search}
            onChange={setSearch}
            placeholder="Tìm theo tên xe, người bán, SĐT..."
          />
        </div>
      </div>

      {/* Table */}
      <AdminTable<AdminFeaturedListing>
        columns={listingColumns}
        data={listings}
        keyExtractor={(item) => item.id}
        loading={loading}
        emptyMessage="Không có tin đăng xe nổi bật nào phù hợp"
        emptyIcon="campaign"
        rowActions={(item: AdminFeaturedListing) => (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onOpenGrantModal(item)}
              title="Gia hạn thêm số ngày nổi bật"
              className="p-1.5 rounded-lg border border-surface-container-high text-outline hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer flex items-center gap-1 text-xs"
            >
              <span className="material-symbols-outlined text-[17px]">more_time</span>
              <span className="hidden sm:inline font-semibold">Gia hạn</span>
            </button>

            {item.is_active_featured && (
              <button
                type="button"
                onClick={() => onRevokeFeatured(item)}
                title="Gỡ nổi bật trước hạn"
                className="p-1.5 rounded-lg border border-surface-container-high text-outline hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer flex items-center gap-1 text-xs"
              >
                <span className="material-symbols-outlined text-[17px]">cancel</span>
                <span className="hidden sm:inline font-semibold">Gỡ VIP</span>
              </button>
            )}
          </div>
        )}
      />
    </div>
  );
};
