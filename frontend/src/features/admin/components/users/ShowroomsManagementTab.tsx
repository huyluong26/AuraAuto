'use client';

import React, { useState } from 'react';
import { AdminButton } from '@/features/admin/components/ui/AdminButton';
import { AdminSearchInput } from '@/features/admin/components/ui/AdminSearchInput';
import { AdminShowroomItem } from '@/features/admin/types';
import { useAdminUI } from '@/features/admin/context/AdminUIContext';
import { ShowroomFormModal } from '@/features/admin/components/ShowroomFormModal';

interface ShowroomsManagementTabProps {
  showrooms: AdminShowroomItem[];
  loading: boolean;
  search: string;
  setSearch: (val: string) => void;
  statusFilter: 'ACTIVE' | 'INACTIVE' | 'ALL';
  setStatusFilter: (val: 'ACTIVE' | 'INACTIVE' | 'ALL') => void;
  actionLoadingId: string | null;
  selectedIds: string[];
  bulkLoading: boolean;
  loadShowrooms: () => void;
  handleToggleSelect: (id: string) => void;
  handleSelectAll: (checked: boolean) => void;
  handleVerifyShowroom: (sr: AdminShowroomItem) => Promise<void>;
  handleRevokeShowroom: (sr: AdminShowroomItem) => Promise<void>;
  handleToggleShowroomActive: (sr: AdminShowroomItem) => Promise<void>;
  handleDeleteShowroom: (sr: AdminShowroomItem) => Promise<void>;
  handleBulkShowroomStatus: (isActive: boolean) => Promise<void>;
  handleBulkShowroomVerify: (isVerified: boolean) => Promise<void>;
  handleBulkShowroomDelete: () => Promise<void>;
  modalOpen: boolean;
  setModalOpen: (open: boolean) => void;
}

export const ShowroomsManagementTab: React.FC<ShowroomsManagementTabProps> = ({
  showrooms,
  loading,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  actionLoadingId,
  selectedIds,
  bulkLoading,
  loadShowrooms,
  handleToggleSelect,
  handleSelectAll,
  handleVerifyShowroom,
  handleRevokeShowroom,
  handleToggleShowroomActive,
  handleDeleteShowroom,
  handleBulkShowroomStatus,
  handleBulkShowroomVerify,
  handleBulkShowroomDelete,
  modalOpen,
  setModalOpen,
}) => {
  const { toast } = useAdminUI();
  const [editingShowroom, setEditingShowroom] = useState<AdminShowroomItem | null>(null);

  return (
    <div className="space-y-6">
      {/* Search & Filter Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-container-lowest p-4 rounded-2xl border border-surface-container-high shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 text-xs rounded-xl border border-surface-container-high bg-surface-container-low text-on-surface focus:outline-none focus:border-secondary cursor-pointer font-medium"
          >
            <option value="ACTIVE">Đang hoạt động (ACTIVE)</option>
            <option value="INACTIVE">Đang tạm khóa (INACTIVE)</option>
            <option value="ALL">Tất cả trạng thái Showroom</option>
          </select>

          {showrooms.length > 0 && (
            <label className="flex items-center gap-2 text-xs font-semibold text-primary cursor-pointer px-3 py-2 rounded-xl bg-surface-container-low hover:bg-surface-container-high border border-surface-container-high transition-all">
              <input
                type="checkbox"
                checked={showrooms.length > 0 && selectedIds.length === showrooms.length}
                ref={(el) => {
                  if (el) {
                    el.indeterminate =
                      selectedIds.length > 0 && selectedIds.length < showrooms.length;
                  }
                }}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="w-4 h-4 rounded border-outline/50 text-secondary accent-secondary cursor-pointer"
              />
              <span>Chọn tất cả ({showrooms.length})</span>
            </label>
          )}
        </div>

        <div className="w-full md:w-80">
          <AdminSearchInput
            value={search}
            onChange={setSearch}
            placeholder="Tìm showroom theo tên, địa chỉ..."
          />
        </div>
      </div>

      {/* Bulk Action Toolbar for Showrooms */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-secondary-container/20 border border-secondary/30 p-3.5 rounded-2xl shadow-sm transition-all animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center font-bold text-xs">
              {selectedIds.length}
            </div>
            <div>
              <span className="text-xs font-bold text-primary">
                Đã chọn {selectedIds.length} / {showrooms.length} showroom
              </span>
              <span className="hidden sm:inline text-xs text-outline ml-2">
                (Chọn thao tác áp dụng đồng loạt)
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <AdminButton
              variant="primary"
              size="xs"
              icon="verified"
              loading={bulkLoading}
              onClick={() => handleBulkShowroomVerify(true)}
            >
              Cấp tích xanh
            </AdminButton>

            <AdminButton
              variant="outline"
              size="xs"
              icon="remove_moderator"
              loading={bulkLoading}
              onClick={() => handleBulkShowroomVerify(false)}
              className="text-amber-700 hover:bg-amber-50 border-amber-300"
            >
              Hủy tích xanh
            </AdminButton>

            <AdminButton
              variant="secondary"
              size="xs"
              icon="store"
              loading={bulkLoading}
              onClick={() => handleBulkShowroomStatus(true)}
            >
              Mở lại hoạt động
            </AdminButton>

            <AdminButton
              variant="outline"
              size="xs"
              icon="lock"
              loading={bulkLoading}
              onClick={() => handleBulkShowroomStatus(false)}
              className="text-amber-700 hover:bg-amber-50 border-amber-300"
            >
              Tạm khóa
            </AdminButton>

            <AdminButton
              variant="danger"
              size="xs"
              icon="delete"
              loading={bulkLoading}
              onClick={handleBulkShowroomDelete}
            >
              Xóa Showroom
            </AdminButton>

            <button
              type="button"
              onClick={() => handleSelectAll(false)}
              className="text-xs text-outline hover:text-primary px-2.5 py-1.5 rounded-lg border border-surface-container-high hover:bg-surface-container-high transition-colors cursor-pointer flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[15px]">close</span>
              <span>Bỏ chọn</span>
            </button>
          </div>
        </div>
      )}

      {/* Showroom Cards Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 border-3 border-secondary/30 border-t-secondary rounded-full animate-spin" />
          <p className="font-body-sm text-xs text-outline">Đang tải danh sách showroom...</p>
        </div>
      ) : showrooms.length === 0 ? (
        <div className="p-16 rounded-2xl bg-surface-container-lowest border border-surface-container-high text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-surface-container-low text-outline mx-auto flex items-center justify-center">
            <span className="material-symbols-outlined text-[32px]">store</span>
          </div>
          <h4 className="font-headline-sm text-base text-primary font-bold">Chưa có Showroom nào</h4>
          <p className="font-body-sm text-xs text-outline max-w-sm mx-auto">
            Hãy bấm &ldquo;Thêm Showroom Mới&rdquo; hoặc điều chỉnh bộ lọc để xem các đại lý đối tác.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {showrooms.map((sr) => {
            const isSelected = selectedIds.includes(sr.id);
            return (
              <div
                key={sr.id}
                onClick={() => handleToggleSelect(sr.id)}
                className={`p-5 rounded-2xl bg-surface-container-lowest border transition-all shadow-xs space-y-4 cursor-pointer select-none relative ${
                  isSelected
                    ? 'border-secondary ring-2 ring-secondary/30 bg-secondary-container/10'
                    : sr.is_verified
                    ? 'border-emerald-200 ring-1 ring-emerald-100'
                    : 'border-surface-container-high'
                } ${!sr.is_active ? 'opacity-70 bg-surface-container-low/50' : ''}`}
              >
                <div className="flex items-start gap-3.5">
                  {/* Checkbox */}
                  <div className="pt-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleSelect(sr.id)}
                      className="w-4 h-4 rounded border-outline/50 text-secondary accent-secondary cursor-pointer focus:ring-secondary/30"
                    />
                  </div>

                  {/* Logo */}
                  <div className="w-14 h-14 rounded-2xl bg-surface-container-high border border-surface-container-high overflow-hidden flex items-center justify-center shrink-0">
                    {sr.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={sr.logo_url} alt={sr.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-[28px] text-secondary">
                        store
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-headline-sm text-base text-primary font-bold truncate">
                        {sr.name}
                      </h3>
                      {sr.is_verified ? (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center gap-1 shrink-0">
                          <span className="material-symbols-outlined text-[14px]">verified</span>
                          <span>Tích xanh</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[11px] font-medium shrink-0">
                          Chờ xác minh
                        </span>
                      )}

                      {!sr.is_active && (
                        <span className="px-2 py-0.5 rounded-md bg-red-100 text-red-800 text-[11px] font-bold shrink-0">
                          Đang tạm khóa
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-outline mt-1 space-y-0.5">
                      <div className="flex items-center gap-1.5 text-primary">
                        <span className="material-symbols-outlined text-[14px] text-outline">call</span>
                        <span>Hotline: {sr.phone || 'Chưa cập nhật'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-outline">
                        <span className="material-symbols-outlined text-[14px]">location_on</span>
                        <span className="truncate">{sr.address || sr.province_code || 'Toàn quốc'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {sr.description && (
                  <p className="font-body-sm text-xs text-on-surface-variant bg-surface-container-low p-2.5 rounded-xl border border-surface-container-high line-clamp-2">
                    {sr.description}
                  </p>
                )}

                {/* Footer Actions (Flat Minimalist Luxury Buttons) */}
                <div
                  className="flex items-center justify-between pt-2 border-t border-surface-container-high text-xs"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="text-[11px] text-outline">
                    Gia nhập: {new Date(sr.created_at).toLocaleDateString('vi-VN')}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {/* Edit Showroom Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingShowroom(sr);
                        setModalOpen(true);
                      }}
                      className="w-6 h-6 rounded-md flex items-center justify-center bg-white hover:bg-slate-100 border border-[#d8d6d0] hover:border-slate-400 text-[#475569] hover:text-[#0f172a] active:scale-[0.98] transition-all cursor-pointer"
                      title="Sửa thông tin showroom"
                    >
                      <span className="material-symbols-outlined text-[13px]">edit</span>
                    </button>

                    {/* Toggle Active / Lock Showroom Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleShowroomActive(sr);
                      }}
                      className={`w-6 h-6 rounded-md flex items-center justify-center bg-white border active:scale-[0.98] transition-all cursor-pointer ${
                        sr.is_active
                          ? 'border-[#d8d6d0] hover:border-amber-400 text-[#64748b] hover:text-amber-700 hover:bg-amber-50'
                          : 'border-emerald-300 hover:border-emerald-500 text-emerald-700 hover:bg-emerald-50'
                      }`}
                      title={sr.is_active ? 'Tạm dừng hoạt động showroom' : 'Kích hoạt lại showroom'}
                    >
                      <span className="material-symbols-outlined text-[13px]">
                        {sr.is_active ? 'lock' : 'lock_open'}
                      </span>
                    </button>

                    {/* Verify / Revoke Badge */}
                    {sr.is_verified ? (
                      <AdminButton
                        variant="outline"
                        size="xs"
                        icon="remove_moderator"
                        loading={actionLoadingId === sr.id}
                        onClick={() => handleRevokeShowroom(sr)}
                        className="text-amber-700 hover:bg-amber-50 border-amber-300 h-6 px-2 text-[10.5px]"
                      >
                        Hủy tích xanh
                      </AdminButton>
                    ) : (
                      <AdminButton
                        variant="primary"
                        size="xs"
                        icon="verified"
                        loading={actionLoadingId === sr.id}
                        onClick={() => handleVerifyShowroom(sr)}
                        className="h-6 px-2 text-[10.5px]"
                      >
                        Cấp tích xanh
                      </AdminButton>
                    )}

                    {/* Delete Showroom Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteShowroom(sr);
                      }}
                      className="w-6 h-6 rounded-md flex items-center justify-center bg-white hover:bg-rose-50 border border-rose-200 hover:border-rose-300 text-rose-600 hover:text-rose-700 active:scale-[0.98] transition-all cursor-pointer"
                      title="Xóa showroom"
                    >
                      <span className="material-symbols-outlined text-[13px]">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Showroom Form Modal */}
      {modalOpen && (
        <ShowroomFormModal
          showroom={editingShowroom}
          onClose={() => {
            setModalOpen(false);
            setEditingShowroom(null);
          }}
          onSuccess={(msg) => {
            toast.success('Thành công', msg);
            loadShowrooms();
          }}
        />
      )}
    </div>
  );
};
