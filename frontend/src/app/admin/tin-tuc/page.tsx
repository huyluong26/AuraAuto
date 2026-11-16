'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AdminHeader } from '@/features/admin/components/AdminHeader';
import { AdminTable } from '@/features/admin/components/ui/AdminTable';
import { AdminButton } from '@/features/admin/components/ui/AdminButton';
import { AdminBadge } from '@/features/admin/components/ui/AdminBadge';
import { AdminTabs } from '@/features/admin/components/ui/AdminTabs';
import { AdminSearchInput } from '@/features/admin/components/ui/AdminSearchInput';
import { ArticleEditorModal } from '@/features/admin/components/ArticleEditorModal';
import { useAdminArticles } from '@/features/admin/hooks/useAdminArticles';
import { AdminArticleItem, TableColumn } from '@/features/admin/types';

export default function AdminArticlesPage() {
  const {
    articles,
    loading,
    refreshing,
    statusFilter,
    setStatusFilter,
    searchKeyword,
    setSearchKeyword,
    loadArticles,
    handleCreateArticle,
    handleUpdateArticle,
    handleApproveArticle,
    handleDeleteArticle,
  } = useAdminArticles();

  const [showEditorModal, setShowEditorModal] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<AdminArticleItem | null>(null);

  const ARTICLE_TABS = [
    { label: 'Tất cả bài viết', value: 'ALL' },
    { label: 'Đã xuất bản', value: 'PUBLISHED' },
    { label: 'Chờ duyệt', value: 'PENDING_REVIEW' },
    { label: 'Bản nháp', value: 'DRAFT' },
  ];

  const columns: TableColumn<AdminArticleItem>[] = [
    {
      key: 'article',
      header: 'Bài viết & Chuyên mục',
      width: '42%',
      render: (a) => (
        <div className="flex items-start gap-3">
          <div className="w-16 h-12 rounded-lg bg-surface-container-high border border-surface-container-high overflow-hidden shrink-0">
            {a.thumbnail_url ? (
              <img
                src={a.thumbnail_url}
                alt={a.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-outline">
                <span className="material-symbols-outlined text-[20px]">newspaper</span>
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <span className="inline-block px-1.5 py-0.5 rounded bg-surface-container text-outline text-[10px] font-bold uppercase tracking-wider mb-1">
              {a.category}
            </span>
            <div className="font-semibold text-primary text-sm line-clamp-1 leading-snug">
              {a.title}
            </div>
            {a.summary && (
              <div className="text-xs text-outline line-clamp-1 mt-0.5">
                {a.summary}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'author',
      header: 'Tác giả & Lượt xem',
      width: '20%',
      render: (a) => (
        <div className="text-xs space-y-0.5">
          <div className="font-medium text-primary flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px] text-outline">edit</span>
            <span>{a.author.display_name}</span>
          </div>
          <div className="flex items-center gap-1 text-outline">
            <span className="material-symbols-outlined text-[14px]">visibility</span>
            <span>{a.views_count.toLocaleString()} lượt xem</span>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Trạng thái',
      width: '15%',
      align: 'center',
      render: (a) => <AdminBadge status={a.status} size="sm" />,
    },
    {
      key: 'date',
      header: 'Ngày đăng',
      width: '15%',
      render: (a) => (
        <div className="text-xs text-outline">
          <div>{new Date(a.created_at).toLocaleDateString('vi-VN')}</div>
          <div className="text-[10px] text-outline/80">
            {new Date(a.created_at).toLocaleTimeString('vi-VN', {
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
      <AdminHeader
        title="Quản lý tin tức & bài viết"
        subtitle={`${articles.length} bài viết`}
        onRefresh={loadArticles}
        isRefreshing={refreshing}
        actions={
          <AdminButton
            variant="primary"
            size="sm"
            icon="post_add"
            onClick={() => {
              setSelectedArticle(null);
              setShowEditorModal(true);
            }}
          >
            Viết bài mới
          </AdminButton>
        }
      />

      <main className="p-8 space-y-6 flex-1">
        {/* Tabs & Search Filter */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <AdminTabs
            tabs={ARTICLE_TABS}
            activeValue={statusFilter}
            onChange={setStatusFilter}
          />

          <div className="w-full md:w-80">
            <AdminSearchInput
              value={searchKeyword}
              onChange={setSearchKeyword}
              placeholder="Tìm theo tiêu đề bài viết..."
            />
          </div>
        </div>

        {/* Articles Table */}
        <AdminTable<AdminArticleItem>
          columns={columns}
          data={articles}
          keyExtractor={(a) => a.id}
          loading={loading}
          emptyMessage="Chưa có bài viết tin tức nào"
          emptyIcon="newspaper"
          rowActions={(a) => (
            <div className="flex items-center justify-end gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setSelectedArticle(a);
                  setShowEditorModal(true);
                }}
                title="Chỉnh sửa bài viết & hình ảnh"
                className="p-1.5 rounded-lg text-outline hover:text-secondary hover:bg-secondary-container/30 border border-surface-container-high transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[17px]">edit_note</span>
              </button>

              {a.status !== 'PUBLISHED' && (
                <button
                  type="button"
                  onClick={() => handleApproveArticle(a.id, a.title)}
                  title="Phê duyệt bài viết"
                  className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 border border-emerald-200 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[17px]">check_circle</span>
                </button>
              )}

              {a.status === 'PUBLISHED' && (
                <Link
                  href={`/tin-tuc/${a.slug}`}
                  target="_blank"
                  title="Xem bài viết công khai"
                  className="p-1.5 rounded-lg text-outline hover:text-primary hover:bg-surface-container-high border border-surface-container-high transition-colors"
                >
                  <span className="material-symbols-outlined text-[17px]">open_in_new</span>
                </Link>
              )}

              <button
                type="button"
                onClick={() => handleDeleteArticle(a.id, a.title)}
                title="Xóa bài viết"
                className="p-1.5 rounded-lg text-outline hover:text-red-600 hover:bg-red-50 border border-surface-container-high transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[17px]">delete_forever</span>
              </button>
            </div>
          )}
        />
      </main>

      {/* Editorial Article Composer & Editor Modal */}
      <ArticleEditorModal
        isOpen={showEditorModal}
        initialArticle={selectedArticle}
        onClose={() => {
          setShowEditorModal(false);
          setSelectedArticle(null);
        }}
        onSubmit={async (data) => {
          if (selectedArticle) {
            return await handleUpdateArticle(selectedArticle.id, data);
          } else {
            return await handleCreateArticle(data);
          }
        }}
      />
    </div>
  );
}
