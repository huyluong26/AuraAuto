'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { AdminHeader } from '@/features/admin/components/AdminHeader';
import { AdminCard } from '@/features/admin/components/ui/AdminCard';
import { AdminButton } from '@/features/admin/components/ui/AdminButton';
import { AdminBadge } from '@/features/admin/components/ui/AdminBadge';
import { AdminSearchInput } from '@/features/admin/components/ui/AdminSearchInput';
import { useAdminUI } from '@/features/admin/context/AdminUIContext';
import { AdminReportItem } from '@/features/admin/types';

const REASON_LABELS: Record<string, { label: string; color: string }> = {
  FAKE_LISTING: { label: 'Tin xe giả mạo / Ảo', color: 'bg-red-50 text-red-700 border-red-200' },
  SCAM_DEPOSIT: { label: 'Lừa đảo tiền đặt cọc', color: 'bg-red-100 text-red-900 border-red-300 font-bold' },
  INACCURATE_DESCRIPTION: { label: 'Xe tai nạn / Ngập nước sai cam kết', color: 'bg-amber-50 text-amber-800 border-amber-200' },
  HARASSMENT: { label: 'Quấy rối / Giao tiếp thô lỗ', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  SPAM: { label: 'Spam tin trùng lặp / Số ảo', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  OTHER: { label: 'Vi phạm quy chế khác', color: 'bg-gray-50 text-gray-700 border-gray-200' },
};

const ACTION_OPTIONS = [
  { value: 'WARNING', label: '⚠️ Cảnh cáo người bán / đối tượng vi phạm', desc: 'Gửi thông báo cảnh cáo nghiêm khắc đến tài khoản.' },
  { value: 'HIDE_LISTING', label: '👁️ Tạm ẩn tin đăng khỏi kết quả tìm kiếm', desc: 'Tạm ẩn tin đăng để chờ xác minh bổ sung từ chủ xe.' },
  { value: 'REMOVE_LISTING', label: '🚫 Gỡ bỏ bài đăng vi phạm vĩnh viễn', desc: 'Chuyển tin sang trạng thái REMOVED và hạ khỏi sàn hoàn toàn.' },
  { value: 'SUSPEND_USER', label: '🔒 Tạm khóa tài khoản người vi phạm', desc: 'Khóa đăng nhập tài khoản tạm thời để điều tra hành vi gian lận.' },
  { value: 'BAN_USER', label: '⛔ Cấm vĩnh viễn tài khoản khỏi hệ thống', desc: 'Vô hiệu hóa vĩnh viễn tài khoản và hủy toàn bộ tin đăng liên quan.' },
  { value: 'DISMISS', label: '✕ Bác bỏ tố cáo (Không đủ chứng cứ)', desc: 'Không có cơ sở kết luận vi phạm hoặc báo cáo sai lệch.' },
];

export default function AdminReportsPage() {
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
      toast.success('Xử lý thành công', `Đã áp dụng phán quyết đối với báo cáo #${selectedReport.id.slice(0, 8)}`);
      setSelectedReport(null);
      loadReports();
    } catch (err: any) {
      toast.error('Lỗi xử lý', err.message || 'Không thể cập nhật phán quyết báo cáo');
    } finally {
      setSubmittingAction(false);
    }
  };

  const filteredReports = reports.filter((r) => {
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

  const pendingCount = reports.filter((r) => r.status === 'PENDING').length;

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-surface">
      <AdminHeader
        title="Khiếu nại & Báo cáo Vi phạm"
        subtitle={`Trung tâm Kiểm soát Gian lận & An toàn Sàn • ${pendingCount} việc cần xử lý`}
        onRefresh={loadReports}
        isRefreshing={refreshing}
      />

      <main className="p-8 space-y-6 flex-1">
        {/* Banner Alert if pending */}
        {pendingCount > 0 && (
          <div className="p-5 rounded-2xl bg-red-50/70 border border-red-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <span className="material-symbols-outlined text-[26px]">gavel</span>
              </div>
              <div>
                <h3 className="font-headline-sm text-base text-red-900 font-bold">
                  Có {pendingCount} báo cáo vi phạm đang chờ xử lý kỷ luật!
                </h3>
                <p className="font-body-sm text-xs text-red-700 mt-0.5">
                  Người mua và người bán đã gửi chứng cứ nghi vấn lừa đảo hoặc xe tai nạn. Hãy thẩm tra và giải quyết ngay.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setStatusFilter('PENDING')}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-label-md text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              Lọc riêng việc chờ xử lý
            </button>
          </div>
        )}

        {/* Filter & Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-container-lowest p-4 rounded-2xl border border-surface-container-high shadow-xs">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'ALL', label: 'Tất cả báo cáo', count: reports.length },
              { id: 'PENDING', label: 'Chờ giải quyết', count: pendingCount, highlight: true },
              { id: 'RESOLVED', label: 'Đã giải quyết', count: reports.filter((r) => r.status === 'RESOLVED').length },
              { id: 'DISMISSED', label: 'Đã bác bỏ', count: reports.filter((r) => r.status === 'DISMISSED').length },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === tab.id
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'bg-surface-container-low text-outline hover:text-primary hover:bg-surface-container-high'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    statusFilter === tab.id
                      ? 'bg-white/20 text-white'
                      : tab.highlight && tab.count > 0
                      ? 'bg-red-100 text-red-700 font-bold'
                      : 'bg-surface-container-high text-outline'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="w-full md:w-80">
            <AdminSearchInput
              value={searchKeyword}
              onChange={setSearchKeyword}
              placeholder="Tìm theo người gửi, ID mục tiêu, nội dung..."
            />
          </div>
        </div>

        {/* Reports Content List */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-3 border-secondary/30 border-t-secondary rounded-full animate-spin" />
            <p className="font-body-sm text-xs text-outline">Đang đồng bộ danh sách khiếu nại &amp; vi phạm...</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="p-16 rounded-2xl bg-surface-container-lowest border border-surface-container-high text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-surface-container-low text-outline mx-auto flex items-center justify-center">
              <span className="material-symbols-outlined text-[32px]">verified_user</span>
            </div>
            <h4 className="font-headline-sm text-base text-primary font-bold">Không có báo cáo nào</h4>
            <p className="font-body-sm text-xs text-outline max-w-sm mx-auto">
              Sàn giao dịch hiện tại không ghi nhận khiếu nại nào theo điều kiện tìm kiếm đã chọn.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReports.map((report) => {
              const reasonInfo = REASON_LABELS[report.reason_code] || {
                label: report.reason_code,
                color: 'bg-gray-50 text-gray-700 border-gray-200',
              };

              return (
                <div
                  key={report.id}
                  className={`p-6 rounded-2xl bg-surface-container-lowest border transition-all shadow-xs ${
                    report.status === 'PENDING'
                      ? 'border-secondary/40 ring-1 ring-secondary/20'
                      : 'border-surface-container-high'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    {/* Left: Report Main Details */}
                    <div className="space-y-3 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Target Tag */}
                        <span className="font-label-sm text-[10px] px-2 py-0.5 rounded-md bg-surface-container-high text-primary font-extrabold uppercase tracking-wider">
                          Mục tiêu: {report.target_type}
                        </span>

                        {/* Reason Code Badge */}
                        <span className={`font-label-sm text-[11px] px-2.5 py-0.5 rounded-lg border font-semibold ${reasonInfo.color}`}>
                          {reasonInfo.label}
                        </span>

                        {/* Status Badge */}
                        <span
                          className={`font-label-sm text-[11px] px-2.5 py-0.5 rounded-lg font-bold uppercase tracking-wider ${
                            report.status === 'PENDING'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : report.status === 'RESOLVED'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-gray-100 text-gray-700 border border-gray-300'
                          }`}
                        >
                          {report.status === 'PENDING'
                            ? '⏳ Chờ thẩm định'
                            : report.status === 'RESOLVED'
                            ? '✓ Đã xử lý kỷ luật'
                            : '✕ Đã bác bỏ'}
                        </span>

                        <span className="text-[11px] text-outline ml-auto">
                          Gửi lúc {new Date(report.created_at).toLocaleString('vi-VN')}
                        </span>
                      </div>

                      {/* Reporter & Target Information */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-surface-container-low text-xs border border-surface-container-high">
                        <div>
                          <span className="text-outline text-[11px] block">Người gửi tố cáo:</span>
                          <span className="font-semibold text-primary">
                            {report.reporter_name || 'Khách hàng ẩn danh'}{' '}
                            <span className="text-outline font-normal">({report.reporter_email || 'Chưa có email'})</span>
                          </span>
                        </div>

                        <div>
                          <span className="text-outline text-[11px] block">Mã đối tượng vi phạm:</span>
                          <span className="font-mono font-bold text-secondary text-xs">
                            {report.target_id}
                          </span>
                        </div>
                      </div>

                      {/* Complaint Description */}
                      <div className="space-y-1">
                        <span className="font-label-md text-xs font-bold text-primary">Nội dung khiếu nại từ người dùng:</span>
                        <p className="font-body-sm text-xs text-on-surface bg-surface-container-lowest p-3 rounded-xl border border-surface-container-high leading-relaxed whitespace-pre-line">
                          {report.description || 'Không có mô tả chi tiết'}
                        </p>
                      </div>

                      {/* Evidences Gallery */}
                      {report.evidences && report.evidences.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="font-label-md text-xs font-bold text-primary flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[16px] text-secondary">image</span>
                            <span>Bằng chứng đính kèm ({report.evidences.length} ảnh):</span>
                          </span>
                          <div className="flex flex-wrap gap-2 pt-1">
                            {report.evidences.map((ev, evIdx) => (
                              <button
                                key={ev.id || evIdx}
                                type="button"
                                onClick={() => setPreviewImage(ev.media_url)}
                                className="w-16 h-16 rounded-xl overflow-hidden border border-surface-container-high hover:border-secondary hover:ring-2 hover:ring-secondary/20 transition-all cursor-pointer relative group"
                              >
                                <img
                                  src={ev.media_url}
                                  alt="Bằng chứng"
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                                <span className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                                  <span className="material-symbols-outlined text-[18px]">zoom_in</span>
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Resolution note if already resolved */}
                      {report.resolution_note && (
                        <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900 space-y-0.5">
                          <div className="font-bold flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[15px]">verified</span>
                            <span>Phán quyết quản trị viên:</span>
                          </div>
                          <p className="leading-relaxed">{report.resolution_note}</p>
                          {report.resolved_at && (
                            <div className="text-[10px] text-emerald-700/80 mt-1">
                              Xử lý lúc: {new Date(report.resolved_at).toLocaleString('vi-VN')}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Right: Action Buttons */}
                    <div className="flex lg:flex-col items-center justify-end gap-2 shrink-0 pt-2 lg:pt-0">
                      {report.status === 'PENDING' ? (
                        <AdminButton
                          variant="danger"
                          size="sm"
                          icon="gavel"
                          onClick={() => handleOpenResolveModal(report)}
                        >
                          Ra phán quyết kỷ luật
                        </AdminButton>
                      ) : (
                        <div className="text-right text-xs text-outline">
                          <span className="material-symbols-outlined text-emerald-600 text-[20px] block">task_alt</span>
                          <span className="text-[11px] font-medium text-emerald-700">Hồ sơ đã đóng</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Resolution Decision Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-surface-container-lowest border border-surface-container-high rounded-2xl w-full max-w-xl flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="px-6 py-4 border-b border-surface-container-high bg-surface-container-low flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[22px]">gavel</span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-base text-primary font-bold">
                    Hội đồng Thẩm tra &amp; Kỷ luật
                  </h3>
                  <p className="font-body-sm text-xs text-outline">
                    Báo cáo #{selectedReport.id.slice(0, 8)} • Mục tiêu: {selectedReport.target_type}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="w-8 h-8 rounded-lg border border-surface-container-high flex items-center justify-center text-outline hover:text-primary cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container-high text-xs space-y-1">
                <span className="font-bold text-primary">Tố cáo:</span> {selectedReport.description}
              </div>

              {/* Action selection */}
              <div className="space-y-2">
                <label className="font-label-md text-xs font-bold text-primary block">
                  Chọn hình thức chế tài xử lý:
                </label>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {ACTION_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                        resolutionAction === opt.value
                          ? 'border-red-600 bg-red-50/70 ring-1 ring-red-600'
                          : 'border-surface-container-high bg-surface-container-lowest hover:bg-surface-container-low'
                      }`}
                    >
                      <input
                        type="radio"
                        name="resolution_action"
                        value={opt.value}
                        checked={resolutionAction === opt.value}
                        onChange={(e) => setResolutionAction(e.target.value)}
                        className="mt-0.5 text-red-600 focus:ring-red-500"
                      />
                      <div className="flex-1 text-xs">
                        <div className="font-bold text-primary">{opt.label}</div>
                        <div className="text-outline text-[11px] mt-0.5">{opt.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Resolution Note */}
              <div className="space-y-1.5">
                <label className="font-label-md text-xs font-bold text-primary block">
                  Ghi chú kết luận &amp; Căn cứ phán quyết (Bắt buộc):
                </label>
                <textarea
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  placeholder="Ghi rõ lý do đưa ra chế tài, kết quả điều tra và thời hạn xử phạt..."
                  rows={3}
                  className="w-full p-3 rounded-xl border border-surface-container-high bg-surface-container-lowest text-xs text-on-surface focus:outline-none focus:border-red-600"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-surface-container-high bg-surface-container-low flex items-center justify-end gap-3">
              <AdminButton
                variant="outline"
                size="sm"
                onClick={() => setSelectedReport(null)}
              >
                Hủy bỏ
              </AdminButton>
              <AdminButton
                variant="danger"
                size="sm"
                loading={submittingAction}
                onClick={handleResolveSubmit}
              >
                Xác nhận thực thi chế tài
              </AdminButton>
            </div>
          </div>
        </div>
      )}

      {/* Enlarged Evidence Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] rounded-2xl overflow-hidden border border-white/20 shadow-2xl bg-black">
            <img src={previewImage} alt="Phóng to bằng chứng" className="w-full h-full object-contain" />
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/90 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
