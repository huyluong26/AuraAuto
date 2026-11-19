'use client';

import React, { useState, useMemo } from 'react';
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
    tabCounts,
    loadArticles,
    handleCreateArticle,
    handleUpdateArticle,
    handleApproveArticle,
    handleDeleteArticle,
  } = useAdminArticles();

  const [showEditorModal, setShowEditorModal] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<AdminArticleItem | null>(null);

  const ARTICLE_TABS = useMemo(() => [
    { label: 'Tất cả bài viết', value: 'ALL', count: tabCounts.ALL },
    { label: 'Đã xuất bản', value: 'PUBLISHED', count: tabCounts.PUBLISHED },
    { label: 'Chờ duyệt', value: 'PENDING_REVIEW', count: tabCounts.PENDING_REVIEW, badgeVariant: 'warning' as const },
    { label: 'Bản nháp', value: 'DRAFT', count: tabCounts.DRAFT },
  ], [tabCounts]);

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
            <div className="flex items-center justify-end gap-1">
              <button
                type="button"
                onClick={() => {
                  setSelectedArticle(a);
                  setShowEditorModal(true);
                }}
                title="Chỉnh sửa bài viết & hình ảnh"
                className="w-6 h-6 rounded-md flex items-center justify-center bg-white hover:bg-slate-100 border border-[#d8d6d0] hover:border-slate-400 text-[#475569] hover:text-[#0f172a] active:scale-[0.98] transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[13px]">edit_note</span>
              </button>

              {a.status !== 'PUBLISHED' && (
                <button
                  type="button"
                  onClick={() => handleApproveArticle(a.id, a.title)}
                  title="Phê duyệt bài viết"
                  className="w-6 h-6 rounded-md flex items-center justify-center bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 hover:border-emerald-500 text-emerald-700 active:scale-[0.98] transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[13px]">check_circle</span>
                </button>
              )}

              {a.status === 'PUBLISHED' && (
                <Link
                  href={`/tin-tuc/${a.slug}`}
                  target="_blank"
                  title="Xem bài viết công khai"
                  className="w-6 h-6 rounded-md flex items-center justify-center bg-white hover:bg-slate-100 border border-[#d8d6d0] hover:border-slate-400 text-[#475569] hover:text-[#0f172a] active:scale-[0.98] transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                </Link>
              )}

              <button
                type="button"
                onClick={() => handleDeleteArticle(a.id, a.title)}
                title="Xóa bài viết"
                className="w-6 h-6 rounded-md flex items-center justify-center bg-white hover:bg-rose-50 border border-rose-200 hover:border-rose-300 text-rose-600 hover:text-rose-700 active:scale-[0.98] transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[13px]">delete_forever</span>
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
