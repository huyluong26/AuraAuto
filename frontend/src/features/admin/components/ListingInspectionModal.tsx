'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { AdminListingDetail } from '../types';
import { useAdminUI } from '../context/AdminUIContext';
import { AdminButton } from './ui/AdminButton';
import { DEFAULT_INSPECTION_CHECKLIST, InspectionChecklistState } from '../constants/inspectionTemplate';
import { ListingOverviewTab } from './inspection/ListingOverviewTab';
import { Inspection160ChecklistForm } from './inspection/Inspection160ChecklistForm';

interface ListingInspectionModalProps {
  listingId: string;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export function ListingInspectionModal({
  listingId,
  onClose,
  onSuccess,
}: ListingInspectionModalProps) {
  const { confirm, toast } = useAdminUI();

  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<AdminListingDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Tab: 'OVERVIEW' | 'INSPECTION_160'
  const [modalTab, setModalTab] = useState<'OVERVIEW' | 'INSPECTION_160'>('OVERVIEW');

  // Action states
  const [actionLoading, setActionLoading] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showTakedownForm, setShowTakedownForm] = useState(false);
  const [takedownReason, setTakedownReason] = useState('');

  // 160-Point Technical Inspection Form State
  const [inspectionScore, setInspectionScore] = useState<number>(95);
  const [inspectorName, setInspectorName] = useState<string>('KTV. Nguyễn Thành Trung');
  const [inspectionPdfUrl, setInspectionPdfUrl] = useState<string>('https://cdn.auraauto.vn/inspections/sample-report.pdf');
  const [inspectionChecklist, setInspectionChecklist] = useState<InspectionChecklistState>(DEFAULT_INSPECTION_CHECKLIST);
  const [savingInspection, setSavingInspection] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function fetchDetail() {
      try {
        setLoading(true);
        const data = await api.getAdminListingDetail(listingId);
        if (mounted) {
          setDetail(data);
          if (data.inspection_score) setInspectionScore(data.inspection_score);
          if (data.inspection_inspector_name) setInspectorName(data.inspection_inspector_name);
          if (data.inspection_report_pdf_url) setInspectionPdfUrl(data.inspection_report_pdf_url);
          if (data.inspection_checklist) setInspectionChecklist(data.inspection_checklist);
        }
      } catch (err: any) {
        if (mounted) {
          setError(err.message || 'Không thể tải chi tiết tin đăng');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchDetail();
    return () => {
      mounted = false;
    };
  }, [listingId]);

  const handleApprove = async () => {
    const isConfirmed = await confirm({
      title: 'Phê duyệt xuất bản xe',
      message: `Xác nhận phê duyệt bài đăng xe "${detail?.title}" để đưa lên sàn công khai?`,
      confirmText: 'Phê duyệt ngay',
      cancelText: 'Hủy bỏ',
      variant: 'success',
      icon: 'verified',
    });

    if (!isConfirmed) return;

    try {
      setActionLoading(true);
      await api.approveListing(listingId);
      toast.success('Phê duyệt thành công', `Tin "${detail?.title}" đã được xuất bản lên sàn công khai.`);
      onSuccess('Đã phê duyệt tin đăng thành công! Tin đã được xuất bản ra sàn công khai.');
      onClose();
    } catch (err: any) {
      toast.error('Lỗi phê duyệt', err.message || 'Không thể phê duyệt tin đăng');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.warning('Thiếu lý do', 'Vui lòng nhập hoặc chọn lý do từ chối.');
      return;
    }
    try {
      setActionLoading(true);
      await api.rejectListing(listingId, rejectReason.trim());
      toast.info('Đã từ chối tin đăng', `Lý do: "${rejectReason.trim()}"`);
      onSuccess('Đã từ chối tin đăng. Người bán đã nhận được thông báo phản hồi lý do.');
      onClose();
    } catch (err: any) {
      toast.error('Lỗi từ chối tin', err.message || 'Không thể từ chối tin đăng');
    } finally {
      setActionLoading(false);
    }
  };

  const handleTakedown = async () => {
    if (!takedownReason.trim()) {
      toast.warning('Thiếu lý do', 'Vui lòng nhập lý do gỡ tin khỏi sàn.');
      return;
    }
    try {
      setActionLoading(true);
      await api.takedownListing(listingId, takedownReason.trim());
      toast.info('Đã gỡ bài đăng', `Đã tạm ngừng hiển thị tin "${detail?.title}"`);
      onSuccess('Đã gỡ tin đăng khỏi sàn giao dịch thành công.');
      onClose();
    } catch (err: any) {
      toast.error('Lỗi gỡ tin', err.message || 'Không thể gỡ tin đăng');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    const isConfirmed = await confirm({
      title: 'CẢNH BÁO: XÓA VĨNH VIỄN TIN ĐĂNG',
      message: `Hành động này sẽ XÓA TOÀN BỘ dữ liệu của "${detail?.title}" khỏi hệ thống và không thể khôi phục lại.\n\nBạn có chắc chắn muốn tiếp tục?`,
      confirmText: 'Xác nhận xóa vĩnh viễn',
      cancelText: 'Giữ lại',
      variant: 'danger',
      icon: 'delete_forever',
    });

    if (!isConfirmed) return;

    try {
      setActionLoading(true);
      await api.deleteListing(listingId);
      toast.success('Đã xóa bài đăng', 'Bản ghi xe đã bị xóa hoàn toàn khỏi cơ sở dữ liệu');
      onSuccess('Đã xóa vĩnh viễn tin đăng thành công!');
      onClose();
    } catch (err: any) {
      toast.error('Lỗi xóa tin', err.message || 'Không thể xóa tin đăng');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveInspection = async () => {
    if (!inspectorName.trim()) {
      toast.warning('Thiếu thông tin', 'Vui lòng nhập tên chuyên viên thẩm định kỹ thuật.');
      return;
    }
    try {
      setSavingInspection(true);
      await api.submitListingInspection(listingId, {
        inspection_score: Number(inspectionScore),
        inspection_inspector_name: inspectorName.trim(),
        inspection_report_pdf_url: inspectionPdfUrl.trim() || undefined,
        inspection_checklist: inspectionChecklist,
      });
      toast.success('Thành công', 'Đã lưu biên bản kiểm định 160 điểm thành công!');
      onSuccess('Cập nhật hồ sơ kiểm định 160 điểm thành công!');
    } catch (err: any) {
      toast.error('Lỗi kiểm định', err.message || 'Không thể lưu biên bản kiểm định');
    } finally {
      setSavingInspection(false);
    }
  };

  const toggleChecklistItem = (catKey: string, itemIdx: number) => {
    setInspectionChecklist((prev: any) => {
      const cat = { ...prev[catKey] };
      const items = [...cat.items];
      items[itemIdx] = { ...items[itemIdx], passed: !items[itemIdx].passed };
      cat.items = items;
      return { ...prev, [catKey]: cat };
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-surface-container-lowest border border-surface-container-high rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-on-surface animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-surface-container-high flex items-center justify-between bg-surface-container-low">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary-container/50 border border-secondary/20 flex items-center justify-center text-secondary shrink-0">
              <span className="material-symbols-outlined text-[22px]">verified</span>
            </div>
            <div>
              <h2 className="font-headline-sm text-base text-primary font-bold">
                Thẩm định Kỹ thuật &amp; Phê duyệt Tin Đăng
              </h2>
              <span className="font-body-sm text-xs text-outline font-mono">
                ID: {listingId}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-surface-container-lowest hover:bg-surface-container-high text-outline hover:text-primary flex items-center justify-center transition-colors cursor-pointer border border-surface-container-high"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* View Tabs Header */}
        <div className="px-6 py-2.5 bg-surface-container-lowest border-b border-surface-container-high flex items-center gap-3">
          <button
            type="button"
            onClick={() => setModalTab('OVERVIEW')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              modalTab === 'OVERVIEW'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'bg-surface-container-low text-outline hover:text-primary hover:bg-surface-container-high'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">info</span>
            <span>Hồ sơ xe &amp; Hình ảnh</span>
          </button>

          <button
            type="button"
            onClick={() => setModalTab('INSPECTION_160')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              modalTab === 'INSPECTION_160'
                ? 'bg-secondary text-white shadow-xs'
                : 'bg-surface-container-low text-outline hover:text-primary hover:bg-surface-container-high'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">verified_user</span>
            <span>Biên bản thẩm định 160 điểm</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 text-white font-mono">
              {inspectionScore}/100
            </span>
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading && (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <div className="w-10 h-10 border-3 border-secondary/30 border-t-secondary rounded-full animate-spin" />
              <p className="font-body-sm text-xs text-outline">
                Đang tải hồ sơ thẩm định xe...
              </p>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          {detail && !loading && modalTab === 'OVERVIEW' && (
            <ListingOverviewTab
              detail={detail}
              activeImageIndex={activeImageIndex}
              setActiveImageIndex={setActiveImageIndex}
              showRejectForm={showRejectForm}
              setShowRejectForm={setShowRejectForm}
              rejectReason={rejectReason}
              setRejectReason={setRejectReason}
              showTakedownForm={showTakedownForm}
              setShowTakedownForm={setShowTakedownForm}
              takedownReason={takedownReason}
              setTakedownReason={setTakedownReason}
              actionLoading={actionLoading}
              onReject={handleReject}
              onTakedown={handleTakedown}
            />
          )}

          {/* TAB 2: 160-POINT TECHNICAL INSPECTION FORM */}
          {detail && !loading && modalTab === 'INSPECTION_160' && (
            <Inspection160ChecklistForm
              inspectionScore={inspectionScore}
              onInspectionScoreChange={setInspectionScore}
              inspectorName={inspectorName}
              onInspectorNameChange={setInspectorName}
              inspectionPdfUrl={inspectionPdfUrl}
              onInspectionPdfUrlChange={setInspectionPdfUrl}
              inspectionChecklist={inspectionChecklist}
              onToggleChecklistItem={toggleChecklistItem}
              savingInspection={savingInspection}
              onSave={handleSaveInspection}
            />
          )}
        </div>

        {/* Modal Action Footer */}
        {detail && !loading && (
          <div className="px-6 py-4 border-t border-surface-container-high bg-surface-container-low flex flex-wrap items-center justify-between gap-3">
            <AdminButton variant="outline" size="sm" onClick={onClose}>
              Đóng hồ sơ
            </AdminButton>

            <div className="flex flex-wrap items-center gap-2">
              <AdminButton
                variant="outline"
                size="sm"
                icon="delete_forever"
                disabled={actionLoading}
                onClick={handleDelete}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                title="Xóa vĩnh viễn tin đăng này khỏi cơ sở dữ liệu"
              >
                Xóa tin
              </AdminButton>

              {detail.status !== 'PUBLISHED' && detail.status !== 'SOLD' && (
                <>
                  <AdminButton
                    variant="outline"
                    size="sm"
                    icon="cancel"
                    disabled={actionLoading}
                    onClick={() => {
                      setShowRejectForm(true);
                      setShowTakedownForm(false);
                      setModalTab('OVERVIEW');
                    }}
                    className="text-red-600 hover:bg-red-50 border-red-200"
                  >
                    Từ chối duyệt
                  </AdminButton>

                  <AdminButton
                    variant="primary"
                    size="sm"
                    icon="check_circle"
                    disabled={actionLoading}
                    loading={actionLoading}
                    onClick={handleApprove}
                  >
                    Phê duyệt xuất bản
                  </AdminButton>
                </>
              )}

              {detail.status === 'PUBLISHED' && (
                <AdminButton
                  variant="danger"
                  size="sm"
                  icon="block"
                  disabled={actionLoading}
                  onClick={() => {
                    setShowTakedownForm(true);
                    setShowRejectForm(false);
                    setModalTab('OVERVIEW');
                  }}
                >
                  Gỡ tin khỏi sàn
                </AdminButton>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
