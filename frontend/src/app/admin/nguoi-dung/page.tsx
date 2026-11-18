'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AdminHeader } from '@/features/admin/components/AdminHeader';
import { AdminButton } from '@/features/admin/components/ui/AdminButton';
import { useAdminUsers } from '@/features/admin/hooks/useAdminUsers';
import { useAdminShowrooms } from '@/features/admin/hooks/useAdminShowrooms';
import { UsersManagementTab } from '@/features/admin/components/users/UsersManagementTab';
import { ShowroomsManagementTab } from '@/features/admin/components/users/ShowroomsManagementTab';

export default function AdminUsersPage() {
  const [activeTab, setActiveTab] = useState<'USERS' | 'SHOWROOMS'>('USERS');
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [showroomModalOpen, setShowroomModalOpen] = useState(false);

  // Users Management Hook
  const {
    users,
    loading: usersLoading,
    refreshing: usersRefreshing,
    searchKeyword: userSearchKeyword,
    setSearchKeyword: setUserSearchKeyword,
    statusFilter: userStatusFilter,
    setStatusFilter: setUserStatusFilter,
    loadUsers,
    handleToggleStatus,
  } = useAdminUsers({ initialStatusFilter: 'ACTIVE' });

  // Showrooms Management Hook
  const {
    showrooms,
    loading: showroomsLoading,
    search: showroomSearch,
    setSearch: setShowroomSearch,
    statusFilter: showroomStatusFilter,
    setStatusFilter: setShowroomStatusFilter,
    actionLoadingId: showroomActionLoadingId,
    selectedIds: selectedShowroomIds,
    bulkLoading: showroomBulkLoading,
    loadShowrooms,
    handleToggleSelect: handleToggleSelectShowroom,
    handleSelectAll: handleSelectAllShowrooms,
    handleVerifyShowroom,
    handleRevokeShowroom,
    handleToggleShowroomActive,
    handleDeleteShowroom,
    handleBulkShowroomStatus,
    handleBulkShowroomVerify,
    handleBulkShowroomDelete,
  } = useAdminShowrooms();

  const customerUsers = users.filter((u) => u.role === 'USER');

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-surface">
      <AdminHeader
        title="Quản trị Thành viên & Showroom Đối Tác"
        subtitle={
          activeTab === 'USERS'
            ? `${customerUsers.length} khách hàng & thành viên trên sàn xe`
            : `${showrooms.length} đối tác Showroom kinh doanh`
        }
        onRefresh={activeTab === 'SHOWROOMS' ? loadShowrooms : loadUsers}
        isRefreshing={activeTab === 'SHOWROOMS' ? showroomsLoading : usersRefreshing}
      />

      <main className="p-8 space-y-6 flex-1">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-surface-container-high pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('USERS')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'USERS'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'bg-surface-container-low text-outline hover:text-primary hover:bg-surface-container-high'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">group</span>
              <span>Khách hàng &amp; Thành viên ({customerUsers.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('SHOWROOMS')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'SHOWROOMS'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'bg-surface-container-low text-outline hover:text-primary hover:bg-surface-container-high'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">store</span>
              <span>Showroom đối tác ({showrooms.length})</span>
            </button>

            <Link
              href="/admin/nhan-su"
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-surface-container-low text-outline hover:text-secondary hover:bg-secondary-container/20 transition-all flex items-center gap-1.5 border border-surface-container-high cursor-pointer ml-1"
            >
              <span className="material-symbols-outlined text-[17px] text-amber-600">shield_person</span>
              <span>Nhân sự nội bộ &amp; Kiểm duyệt</span>
              <span className="text-[10px] text-outline">↗</span>
            </Link>
          </div>

          {/* Action Button for each tab */}
          <div>
            {activeTab === 'USERS' && (
              <AdminButton
                variant="primary"
                size="sm"
                icon="person_add"
                onClick={() => setUserModalOpen(true)}
              >
                Thêm Thành Viên Mới
              </AdminButton>
            )}

            {activeTab === 'SHOWROOMS' && (
              <AdminButton
                variant="primary"
                size="sm"
                icon="add_business"
                onClick={() => setShowroomModalOpen(true)}
              >
                Thêm Showroom Mới
              </AdminButton>
            )}
          </div>
        </div>

        {/* Tab 1: Users */}
        {activeTab === 'USERS' && (
          <UsersManagementTab
            users={users}
            loading={usersLoading}
            searchKeyword={userSearchKeyword}
            setSearchKeyword={setUserSearchKeyword}
            statusFilter={userStatusFilter}
            setStatusFilter={setUserStatusFilter}
            loadUsers={loadUsers}
            handleToggleStatus={handleToggleStatus}
            modalOpen={userModalOpen}
            setModalOpen={setUserModalOpen}
          />
        )}

        {/* Tab 2: Showrooms */}
        {activeTab === 'SHOWROOMS' && (
          <ShowroomsManagementTab
            showrooms={showrooms}
            loading={showroomsLoading}
            search={showroomSearch}
            setSearch={setShowroomSearch}
            statusFilter={showroomStatusFilter}
            setStatusFilter={setShowroomStatusFilter}
            actionLoadingId={showroomActionLoadingId}
            selectedIds={selectedShowroomIds}
            bulkLoading={showroomBulkLoading}
            loadShowrooms={loadShowrooms}
            handleToggleSelect={handleToggleSelectShowroom}
            handleSelectAll={handleSelectAllShowrooms}
            handleVerifyShowroom={handleVerifyShowroom}
            handleRevokeShowroom={handleRevokeShowroom}
            handleToggleShowroomActive={handleToggleShowroomActive}
            handleDeleteShowroom={handleDeleteShowroom}
            handleBulkShowroomStatus={handleBulkShowroomStatus}
            handleBulkShowroomVerify={handleBulkShowroomVerify}
            handleBulkShowroomDelete={handleBulkShowroomDelete}
            modalOpen={showroomModalOpen}
            setModalOpen={setShowroomModalOpen}
          />
        )}
      </main>
    </div>
  );
}
