'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '@/lib/api';
import { useAdminUI } from '../context/AdminUIContext';
import { AdminReportItem } from '../types';

export function useAdminReports() {
  const { toast } = useAdminUI();

  const [reports, setReports] = useState<AdminReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  // Selected report for resolution modal
  const [selectedReport, setSelectedReport] = useState<AdminReportItem | null>(null);
  const [resolutionAction, setResolutionAction] = useState<string>('WARNING');
  const [resolutionNote, setResolutionNote] = useState<string>('');
  const [submittingAction, setSubmittingAction] = useState(false);

  // Evidence preview modal
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const loadReports = useCallback(async () => {
    try {
      setRefreshing(true);
      const data = await api.getAdminReports({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
      });
      setReports(data || []);
    } catch (err: any) {
      toast.error('Lỗi tải báo cáo', err.message || 'Không thể tải danh sách khiếu nại');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter, toast]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const handleOpenResolveModal = (report: AdminReportItem) => {
    setSelectedReport(report);
    setResolutionAction('WARNING');
    setResolutionNote('');
  };

  const handleResolveSubmit = async () => {
    if (!selectedReport) return;
    if (!resolutionNote.trim()) {
      toast.warning('Thiếu ghi chú', 'Vui lòng nhập ghi chú phán quyết xử lý.');
      return;
    }

    try {
      setSubmittingAction(true);
      await api.resolveAdminReport(selectedReport.id, {
        action: resolutionAction,
        note: resolutionNote.trim(),
      });
      toast.success(
        'Xử lý thành công',
        `Đã áp dụng phán quyết đối với báo cáo #${selectedReport.id.slice(0, 8)}`
      );
      setSelectedReport(null);
      loadReports();
    } catch (err: any) {
      toast.error('Lỗi xử lý', err.message || 'Không thể cập nhật phán quyết báo cáo');
    } finally {
      setSubmittingAction(false);
    }
  };

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      if (!searchKeyword.trim()) return true;
      const kw = searchKeyword.toLowerCase();
      return (
        (r.reporter_name && r.reporter_name.toLowerCase().includes(kw)) ||
        (r.reporter_email && r.reporter_email.toLowerCase().includes(kw)) ||
        (r.description && r.description.toLowerCase().includes(kw)) ||
        (r.target_id && r.target_id.toLowerCase().includes(kw)) ||
        (r.reason_code && r.reason_code.toLowerCase().includes(kw))
      );
    });
  }, [reports, searchKeyword]);

  return {
    reports,
    filteredReports,
    loading,
    refreshing,
    statusFilter,
    setStatusFilter,
    searchKeyword,
    setSearchKeyword,
    selectedReport,
    setSelectedReport,
    resolutionAction,
    setResolutionAction,
    resolutionNote,
    setResolutionNote,
    submittingAction,
    previewImage,
    setPreviewImage,
    loadReports,
    handleOpenResolveModal,
    handleResolveSubmit,
  };
}
