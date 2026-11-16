'use client';

import React from 'react';
import Link from 'next/link';
import { AdminTable } from '@/features/admin/components/ui/AdminTable';
import { AdminBadge } from '@/features/admin/components/ui/AdminBadge';
import { AdminSearchInput } from '@/features/admin/components/ui/AdminSearchInput';
import { AdminPaymentTransaction, TableColumn } from '@/features/admin/types';
import { formatFullVND } from '@/lib/api';

interface PaymentTransactionsTabProps {
  transactions: AdminPaymentTransaction[];
  loading: boolean;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  search: string;
  setSearch: (val: string) => void;
}

export const PaymentTransactionsTab: React.FC<PaymentTransactionsTabProps> = ({
  transactions,
  loading,
  statusFilter,
  setStatusFilter,
  search,
  setSearch,
}) => {
  const transactionColumns: TableColumn<AdminPaymentTransaction>[] = [
    {
      key: 'order',
      header: 'Đơn hàng & Mã GD',
      width: '24%',
      render: (tx) => (
        <div className="text-xs space-y-0.5">
          <div className="font-mono font-bold text-primary">{tx.order_code}</div>
          {tx.vnp_transaction_no && (
            <div className="text-[11px] text-outline font-mono">
              VNPay: {tx.vnp_transaction_no}
            </div>
          )}
          {tx.vnp_bank_code && (
            <div className="text-[10px] text-outline/80 uppercase">
              Ngân hàng: {tx.vnp_bank_code}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'car',
      header: 'Xe được nâng cấp',
      width: '26%',
      render: (tx) => (
        <div className="text-xs">
          <Link
            href={`/xe/${tx.listing_id}`}
            target="_blank"
            className="font-bold text-primary hover:text-secondary line-clamp-1"
          >
            {tx.listing_title}
          </Link>
          <div className="text-[11px] text-outline font-mono mt-0.5">
            ID: {tx.listing_id.slice(0, 8)}...
          </div>
        </div>
      ),
    },
    {
      key: 'user',
      header: 'Khách hàng',
      width: '20%',
      render: (tx) => (
        <div className="text-xs space-y-0.5">
          <div className="font-semibold text-primary truncate">{tx.user_name}</div>
          <div className="text-[11px] text-outline truncate">{tx.user_email}</div>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Số tiền & Gói',
      width: '16%',
      render: (tx) => (
        <div className="text-xs space-y-0.5">
          <div className="font-bold text-emerald-600">{formatFullVND(tx.amount_vnd)}</div>
          <div className="text-[11px] text-outline font-medium">
            Gói {tx.package_days} ngày ({tx.package_code})
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Trạng thái',
      width: '14%',
      align: 'center',
      render: (tx) => <AdminBadge status={tx.status} size="sm" />,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-container-lowest p-4 rounded-2xl border border-surface-container-high shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-surface-container-high bg-surface-container-low text-on-surface focus:outline-none focus:border-secondary cursor-pointer font-medium"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="SUCCESS">Thành công (SUCCESS)</option>
            <option value="PENDING">Đang chờ (PENDING)</option>
            <option value="FAILED">Thất bại (FAILED)</option>
            <option value="CANCELLED">Đã hủy (CANCELLED)</option>
          </select>
        </div>

        <div className="w-full md:w-80">
          <AdminSearchInput
            value={search}
            onChange={setSearch}
            placeholder="Tìm theo mã đơn AURA_..., mã VNPay..."
          />
        </div>
      </div>

      <AdminTable<AdminPaymentTransaction>
        columns={transactionColumns}
        data={transactions}
        keyExtractor={(item) => item.id}
        loading={loading}
        emptyMessage="Chưa có giao dịch nạp gói nổi bật nào"
        emptyIcon="receipt"
      />
    </div>
  );
};
