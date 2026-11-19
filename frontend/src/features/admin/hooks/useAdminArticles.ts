'use client';

import { useState, useCallback, useEffect } from 'react';
import { api } from '@/lib/api';
import { AdminArticleItem } from '../types';
import { useAdminUI } from '../context/AdminUIContext';

export function useAdminArticles(initialStatus: string = 'ALL') {
  const { confirm, toast } = useAdminUI();

  const [articles, setArticles] = useState<AdminArticleItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus);
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({
    ALL: 0,
    PUBLISHED: 0,
    PENDING_REVIEW: 0,
    DRAFT: 0,
  });

  const loadCounts = useCallback(async () => {
    try {
      const counts = await api.getAdminArticleCounts();
      setTabCounts(counts);
    } catch {
      // fallback
    }
  }, []);

  const loadArticles = useCallback(async () => {
    try {
      setRefreshing(true);
      const [data] = await Promise.all([
        api.getAdminArticles({
          status_filter: statusFilter === 'ALL' ? undefined : statusFilter,
          search: searchKeyword.trim() || undefined,
        }),
        loadCounts(),
      ]);
      setArticles(data);
    } catch (err: any) {
      toast.error('Lỗi tải tin tức', err.message || 'Không thể tải danh sách bài viết');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter, searchKeyword, toast, loadCounts]);

  useEffect(() => {
    loadArticles();
    const timer = setInterval(() => {
      loadCounts();
    }, 15000);
    return () => clearInterval(timer);
  }, [loadArticles, loadCounts]);

  const handleCreateArticle = useCallback(
    async (payload: {
      title: string;
      summary?: string;
      content: string;
      thumbnail_url?: string;
      category: string;
      status: string;
    }): Promise<boolean> => {
      try {
        await api.createAdminArticle(payload);
        toast.success('Xuất bản thành công', 'Bài viết tin tức đã được tạo thành công.');
        loadArticles();
        return true;
      } catch (err: any) {
        toast.error('Lỗi đăng bài viết', err.message || 'Không thể tạo bài viết');
        return false;
      }
    },
    [toast, loadArticles]
  );

  const handleUpdateArticle = useCallback(
    async (
      id: string,
      payload: {
        title?: string;
        summary?: string;
        content?: string;
        thumbnail_url?: string;
        category?: string;
        status?: string;
      }
    ): Promise<boolean> => {
      try {
        await api.updateAdminArticle(id, payload);
        toast.success('Cập nhật thành công', 'Bài viết đã được lưu thay đổi.');
        loadArticles();
        return true;
      } catch (err: any) {
        toast.error('Lỗi cập nhật bài viết', err.message || 'Không thể lưu bài viết');
        return false;
      }
    },
    [toast, loadArticles]
  );

  const handleApproveArticle = useCallback(
    async (id: string, title: string): Promise<boolean> => {
      const isConfirmed = await confirm({
        title: 'Phê duyệt bài viết tin tức',
        message: `Phê duyệt và xuất bản bài viết "${title}" lên trang tin tức AuraAuto?`,
        confirmText: 'Phê duyệt ngay',
        cancelText: 'Hủy bỏ',
        variant: 'success',
        icon: 'verified',
      });

      if (!isConfirmed) return false;

      try {
        await api.approveAdminArticle(id);
        toast.success('Duyệt bài thành công', `Bài viết "${title}" đã được xuất bản.`);
        loadArticles();
        return true;
      } catch (err: any) {
        toast.error('Lỗi phê duyệt bài viết', err.message || 'Không thể duyệt');
        return false;
      }
    },
    [confirm, toast, loadArticles]
  );

  const handleDeleteArticle = useCallback(
    async (id: string, title: string): Promise<boolean> => {
      const isConfirmed = await confirm({
        title: 'CẢNH BÁO: XÓA BÀI VIẾT',
        message: `Bạn có chắc chắn muốn XÓA VĨNH VIỄN bài viết "${title}"?\nDữ liệu bài viết này sẽ bị xóa hoàn toàn.`,
        confirmText: 'Xác nhận xóa',
        cancelText: 'Giữ lại',
        variant: 'danger',
        icon: 'delete_forever',
      });

      if (!isConfirmed) return false;

      try {
        await api.deleteAdminArticle(id);
        toast.success('Đã xóa bài viết', `Bài viết "${title}" đã bị xóa khỏi hệ thống.`);
        loadArticles();
        return true;
      } catch (err: any) {
        toast.error('Lỗi xóa bài viết', err.message || 'Không thể xóa');
        return false;
      }
    },
    [confirm, toast, loadArticles]
  );

  return {
    articles,
    loading,
    refreshing,
    statusFilter,
    setStatusFilter,
    searchKeyword,
    setSearchKeyword,
    tabCounts,
    loadCounts,
    loadArticles,
    handleCreateArticle,
    handleUpdateArticle,
    handleApproveArticle,
    handleDeleteArticle,
  };
}
