'use client';

import React, { useState, useEffect } from 'react';
import { api, formatVND, formatKm } from '@/lib/api';
import { AdminListingDetail } from '../types';
import { useAdminUI } from '../context/AdminUIContext';
import { AdminButton } from './ui/AdminButton';
import { AdminBadge } from './ui/AdminBadge';

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
  const [inspectionChecklist, setInspectionChecklist] = useState<any>({
    engine_transmission: {
      title: '1. Động cơ & Hộp số (40 điểm)',
      items: [
        { label: 'Khởi động êm ái, không có tiếng gõ kim loại lạ', passed: true },
        { label: 'Không rò rỉ dầu máy, đáy carte khô ráo', passed: true },
        { label: 'Hộp số sang số mượt mà, không giật cục', passed: true },
        { label: 'Cao su chân máy & chân hộp số nguyên bản', passed: true },
        { label: 'Hệ thống turbo tăng áp (nếu có) không hú rít', passed: true },
      ],
    },
    chassis_suspension: {
      title: '2. Khung gầm & Hệ thống treo (35 điểm)',
      items: [
        { label: 'Khung gầm sắt xi không gỉ sét mục mọt, không nắn uốn', passed: true },
        { label: 'Thước lái đầm chắc, rotuyn cân bằng không rơ lắc', passed: true },
        { label: 'Hệ thống giảm xóc đàn hồi chuẩn, không xì dầu', passed: true },
        { label: 'Đĩa phanh và má phanh đạt độ dày an toàn > 70%', passed: true },
        { label: 'Lốp xe mòn đều, date lốp đồng bộ', passed: true },
      ],
    },
    body_paint: {
      title: '3. Thân vỏ & Nước sơn (30 điểm)',
      items: [
        { label: 'Đo độ dày sơn bằng máy chuyên dụng đạt chuẩn zin', passed: true },
        { label: 'Keo chỉ nắp capo, cốp sau và 4 cánh cửa nguyên bản', passed: true },
        { label: 'Các khe hở thân xe đều tăm tắp, không lệch mí', passed: true },
        { label: 'Kính chắn gió và toàn bộ kính xe nguyên bản nhà sản xuất', passed: true },
      ],
    },
    interior_comfort: {
      title: '4. Nội thất & Tiện nghi (30 điểm)',
      items: [
        { label: 'Ghế da zin, độ đàn hồi tốt, không nứt rách', passed: true },
        { label: 'Vô lăng, củ số, bàn đạp đúng độ hao mòn theo số km', passed: true },
        { label: 'Điều hòa 2 vùng làm mát sâu và khử mùi tốt', passed: true },
        { label: 'Không có dấu hiệu ẩm mốc ngập nước hay thủy kích sàn', passed: true },
      ],
    },
    electrical_safety: {
      title: '5. An toàn & Hệ thống điện (25 điểm)',
      items: [
        { label: 'Hệ thống túi khí SRS nguyên vẹn, không có mã lỗi OBD-II', passed: true },
        { label: 'Phanh ABS, cân bằng điện tử ESP hoạt động hoàn hảo', passed: true },
        { label: 'Cụm đèn pha Full LED, đèn hậu chiếu sáng chuẩn', passed: true },
        { label: 'Màn hình trung tâm, camera lùi & cảm biến an toàn nhạy bén', passed: true },
      ],
    },
  });
  const [savingInspection, setSavingInspection] = useState(false);

  const REJECT_SUGGESTIONS = [
    'Hình ảnh mờ, không rõ biển số hoặc không đủ góc chụp theo tiêu chuẩn.',
    'Giá bán không hợp lý hoặc chênh lệch quá lớn so với thị trường.',
    'Thông số kỹ thuật không khớp với dòng xe thực tế.',
    'Nghi vấn phương tiện từng bị tai nạn hoặc thiếu giấy tờ hợp lệ.',
  ];

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
            <>
              {/* Status Header Banner */}
              <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container-high flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="font-label-sm text-[11px] text-outline block mb-1">Trạng thái tin đăng</span>
                  <div className="flex items-center gap-2">
                    <AdminBadge status={detail.status} />
                    {detail.has_pending_revision && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-300 animate-pulse">
                        Bản sửa đổi #{detail.revision_no} chờ duyệt
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-label-sm text-[11px] text-outline block mb-0.5">Giá niêm yết</span>
                  <span className="font-headline-md text-xl text-secondary font-bold">
                    {formatVND(detail.price_vnd)}
                  </span>
                </div>
              </div>

              {/* Pending Revision Comparison Alert if applicable */}
              {detail.has_pending_revision && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 space-y-2.5">
                  <div className="flex items-center gap-2 font-bold text-sm text-amber-700">
                    <span className="material-symbols-outlined text-[20px]">edit_note</span>
                    <span>BẢN CHỈNH SỬA TIN ĐĂNG (LẦN #{detail.revision_no}) ĐANG CHỜ PHÊ DUYỆT</span>
                  </div>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    Tin này hiện vẫn đang hiển thị công khai trên sàn với dữ liệu trước đó. Dưới đây là thông tin mới do chủ xe cập nhật. Khi bạn duyệt, phiên bản mới này sẽ được xuất bản thay thế bản cũ.
                  </p>
                  {detail.published_revision && (
                    <div className="p-3 bg-white/80 rounded-xl border border-amber-200/80 text-xs space-y-2">
                      <div className="font-bold text-primary flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[15px] text-secondary">compare_arrows</span>
                        <span>So sánh với phiên bản đang chạy ngoài sàn:</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="text-outline">Giá bán cũ:</span>{' '}
                          <span className="line-through text-outline font-medium">{formatVND(detail.published_revision.price_vnd)}</span>{' '}
                          → <strong className="text-secondary">{formatVND(detail.price_vnd)}</strong>
                        </div>
                        <div>
                          <span className="text-outline">ODO cũ:</span>{' '}
                          <span className="line-through text-outline font-medium">{formatKm(detail.published_revision.odometer_km)}</span>{' '}
                          → <strong className="text-primary">{formatKm(detail.odometer_km)}</strong>
                        </div>
                        {detail.published_revision.title !== detail.title && (
                          <div className="sm:col-span-2">
                            <span className="text-outline">Tiêu đề cũ:</span> {detail.published_revision.title}
                          </div>
                        )}
                        {detail.published_revision.location_address !== detail.location_address && (
                          <div className="sm:col-span-2">
                            <span className="text-outline">Địa chỉ cũ:</span> {detail.published_revision.location_address || 'Toàn quốc'}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Photo Gallery with slot labels */}
              <div className="space-y-2">
                <h3 className="font-label-md text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-secondary text-[18px]">photo_library</span>
                  <span>Hình ảnh thực tế & góc chụp ({detail.images.length} ảnh)</span>
                </h3>

                {detail.images.length > 0 ? (
                  <div className="space-y-2">
                    <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-surface-container-high border border-surface-container-high flex items-center justify-center">
                      <img
                        src={detail.images[activeImageIndex] || detail.images[0]}
                        alt="Xe thẩm định"
                        className="w-full h-full object-contain"
                      />
                      {/* Badge slot label on active photo */}
                      <div className="absolute top-3 left-3 flex items-center gap-1.5">
                        <span className="px-2.5 py-1 rounded-md bg-black/75 text-white font-label-sm text-xs backdrop-blur-xs flex items-center gap-1 font-semibold">
                          <span className="material-symbols-outlined text-[13px] text-secondary">label</span>
                          <span>
                            {detail.media?.[activeImageIndex]?.label ||
                              (detail.media?.[activeImageIndex]?.is_primary ? 'Ảnh đại diện' : `Góc chụp #${activeImageIndex + 1}`)}
                          </span>
                        </span>
                      </div>
                      <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded-md bg-primary/70 text-on-primary font-label-sm text-xs backdrop-blur-xs">
                        Ảnh {activeImageIndex + 1} / {detail.images.length}
                      </span>
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {detail.images.map((img, idx) => {
                        const mLabel = detail.media?.[idx]?.label;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setActiveImageIndex(idx)}
                            className={`w-24 rounded-lg overflow-hidden shrink-0 border-2 transition-all cursor-pointer flex flex-col ${
                              activeImageIndex === idx
                                ? 'border-secondary ring-2 ring-secondary/30 bg-surface-container'
                                : 'border-surface-container-high opacity-70 hover:opacity-100 bg-surface-container-low'
                            }`}
                          >
                            <div className="w-full h-14 overflow-hidden">
                              <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                            </div>
                            <span className="text-[10px] text-center font-medium py-0.5 px-1 truncate w-full text-on-surface">
                              {mLabel || `Ảnh #${idx + 1}`}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="p-6 rounded-xl bg-surface-container-low border border-surface-container-high text-center font-body-sm text-xs text-outline">
                    Tin đăng này chưa tải lên hình ảnh.
                  </div>
                )}
              </div>

              {/* Complete Technical Specifications Grid */}
              <div className="space-y-2">
                <h3 className="font-label-md text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-secondary text-[18px]">tune</span>
                  <span>Thông số kỹ thuật phương tiện</span>
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high">
                    <span className="font-label-sm text-[11px] text-outline block">Hãng xe</span>
                    <span className="font-semibold text-primary text-xs">{detail.brand_name || 'N/A'}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high">
                    <span className="font-label-sm text-[11px] text-outline block">Dòng xe (Model)</span>
                    <span className="font-semibold text-primary text-xs">{detail.model_name || 'N/A'}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high">
                    <span className="font-label-sm text-[11px] text-outline block">Năm sản xuất</span>
                    <span className="font-semibold text-primary text-xs">{detail.manufacture_year}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high">
                    <span className="font-label-sm text-[11px] text-outline block">Số km đã đi (ODO)</span>
                    <span className="font-semibold text-primary text-xs">{formatKm(detail.odometer_km)}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high">
                    <span className="font-label-sm text-[11px] text-outline block">Kiểu dáng thân xe</span>
                    <span className="font-semibold text-primary text-xs">{detail.body_type}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high">
                    <span className="font-label-sm text-[11px] text-outline block">Nhiên liệu</span>
                    <span className="font-semibold text-primary text-xs">{detail.fuel_type}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high">
                    <span className="font-label-sm text-[11px] text-outline block">Hộp số</span>
                    <span className="font-semibold text-primary text-xs">{detail.transmission}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high">
                    <span className="font-label-sm text-[11px] text-outline block">Xuất xứ</span>
                    <span className="font-semibold text-primary text-xs">{detail.origin || 'Lắp ráp trong nước'}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high">
                    <span className="font-label-sm text-[11px] text-outline block">Màu ngoại thất</span>
                    <span className="font-semibold text-primary text-xs">{detail.color || 'Không rõ'}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high">
                    <span className="font-label-sm text-[11px] text-outline block">Màu nội thất</span>
                    <span className="font-semibold text-primary text-xs">{detail.interior_color || 'Không rõ'}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high">
                    <span className="font-label-sm text-[11px] text-outline block">Số chỗ / Số cửa</span>
                    <span className="font-semibold text-primary text-xs">{detail.seats || 5} chỗ • {detail.doors || 4} cửa</span>
                  </div>

                  <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high">
                    <span className="font-label-sm text-[11px] text-outline block">Tình trạng xe</span>
                    <span className="font-semibold text-primary text-xs">{detail.condition === 'NEW' ? 'Xe mới' : 'Đã qua sử dụng'}</span>
                  </div>

                  {detail.license_plate && (
                    <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high">
                      <span className="font-label-sm text-[11px] text-outline block">Biển số</span>
                      <span className="font-semibold text-primary text-xs font-mono">{detail.license_plate}</span>
                    </div>
                  )}

                  {detail.vin && (
                    <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high">
                      <span className="font-label-sm text-[11px] text-outline block">Số khung (VIN)</span>
                      <span className="font-semibold text-primary text-xs font-mono">{detail.vin}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Technical Commitments & Vehicle History */}
              <div className="space-y-2">
                <h3 className="font-label-md text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-secondary text-[18px]">verified_user</span>
                  <span>Cam kết chất lượng & Lịch sử xe</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high">
                    <span className="font-label-sm text-[11px] text-outline block">Tai nạn / Va chạm</span>
                    <span className={`font-semibold text-xs ${detail.accident_status === 'NONE' ? 'text-emerald-700' : detail.accident_status === 'MINOR' ? 'text-amber-700' : 'text-primary'}`}>
                      {detail.accident_status === 'NONE'
                        ? 'Cam kết không tai nạn'
                        : detail.accident_status === 'MINOR'
                        ? 'Va quẹt nhẹ bên ngoài'
                        : detail.accident_status === 'MAJOR'
                        ? 'Tai nạn ảnh hưởng kết cấu'
                        : 'Chưa xác định'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high">
                    <span className="font-label-sm text-[11px] text-outline block">Ngập nước / Thủy kích</span>
                    <span className={`font-semibold text-xs ${detail.flood_status === 'NONE' ? 'text-emerald-700' : 'text-primary'}`}>
                      {detail.flood_status === 'NONE'
                        ? 'Cam kết không thủy kích'
                        : detail.flood_status === 'CONFIRMED'
                        ? 'Đã từng ngập nước'
                        : detail.flood_status === 'SUSPECTED'
                        ? 'Nghi vấn ngập nước'
                        : 'Chưa xác định'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high">
                    <span className="font-label-sm text-[11px] text-outline block">Lịch sử bảo dưỡng</span>
                    <span className="font-semibold text-primary text-xs">
                      {detail.service_history === 'FULL'
                        ? 'Bảo dưỡng hãng đầy đủ'
                        : detail.service_history === 'PARTIAL'
                        ? 'Bảo dưỡng một phần'
                        : 'Không có sổ bảo dưỡng'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high">
                    <span className="font-label-sm text-[11px] text-outline block">Số đời chủ</span>
                    <span className="font-semibold text-primary text-xs">{detail.owner_count || 1} đời chủ</span>
                  </div>

                  <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high">
                    <span className="font-label-sm text-[11px] text-outline block">Sơn lại / Thay thế phụ tùng</span>
                    <span className="font-semibold text-primary text-xs">
                      Sơn {detail.repainted_parts_count || 0} chi tiết • {detail.replaced_parts ? `Thay: ${detail.replaced_parts}` : 'Chưa thay thế'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high">
                    <span className="font-label-sm text-[11px] text-outline block">Động cơ & Hộp số đã đại tu</span>
                    <span className="font-semibold text-primary text-xs">
                      {detail.engine_repaired || detail.transmission_repaired ? 'Đã từng can thiệp/sửa chữa' : 'Nguyên bản chưa bổ máy'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Seller & Viewing Location Information */}
              <div className="space-y-2">
                <h3 className="font-label-md text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-secondary text-[18px]">person_pin_circle</span>
                  <span>Người bán & Địa điểm xem xe thực tế</span>
                </h3>

                <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container-high flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center font-bold text-sm text-primary uppercase">
                      {detail.seller.display_name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-primary text-xs">{detail.seller.display_name}</div>
                      <div className="text-[11px] text-outline">{detail.seller.email} • {detail.seller.phone || 'Chưa có SĐT'}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] text-outline block">Địa chỉ xem xe:</span>
                    <span className="font-semibold text-primary text-xs">
                      {detail.location_address || `Tỉnh/Thành phố mã ${detail.province_code}`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              {detail.description && (
                <div className="space-y-2">
                  <h3 className="font-label-md text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-secondary text-[18px]">description</span>
                    <span>Mô tả chi tiết từ chủ xe</span>
                  </h3>
                  <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container-high text-xs text-on-surface whitespace-pre-line leading-relaxed">
                    {detail.description}
                  </div>
                </div>
              )}

              {/* Rejection / Takedown Form Drawers */}
              {showRejectForm && (
                <div className="p-4 rounded-xl bg-red-50/70 border border-red-200 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-red-700 font-semibold text-sm">
                      <span className="material-symbols-outlined text-[20px]">report</span>
                      <span>Nhập lý do từ chối phê duyệt tin</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowRejectForm(false)}
                      className="text-xs text-outline hover:text-primary cursor-pointer"
                    >
                      Đóng
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {REJECT_SUGGESTIONS.map((sug, sIdx) => (
                      <button
                        key={sIdx}
                        type="button"
                        onClick={() => setRejectReason(sug)}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all text-left cursor-pointer ${
                          rejectReason === sug
                            ? 'bg-red-600 text-white border-red-600 font-medium'
                            : 'bg-surface-container-lowest border-red-200 text-red-800 hover:border-red-400'
                        }`}
                      >
                        {sug}
                      </button>
                    ))}
                  </div>

                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Nhập lý do từ chối cụ thể..."
                    rows={3}
                    className="w-full p-2.5 rounded-lg border border-red-200 bg-surface-container-lowest text-xs text-on-surface focus:outline-none focus:border-red-500"
                  />

                  <div className="flex justify-end gap-2">
                    <AdminButton
                      variant="outline"
                      size="sm"
                      onClick={() => setShowRejectForm(false)}
                    >
                      Hủy
                    </AdminButton>
                    <AdminButton
                      variant="danger"
                      size="sm"
                      loading={actionLoading}
                      onClick={handleReject}
                    >
                      Xác nhận từ chối
                    </AdminButton>
                  </div>
                </div>
              )}

              {showTakedownForm && (
                <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-amber-800 font-semibold text-sm">
                      <span className="material-symbols-outlined text-[20px]">block</span>
                      <span>Nhập lý do gỡ tin đăng khỏi sàn</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowTakedownForm(false)}
                      className="text-xs text-outline hover:text-primary cursor-pointer"
                    >
                      Đóng
                    </button>
                  </div>

                  <textarea
                    value={takedownReason}
                    onChange={(e) => setTakedownReason(e.target.value)}
                    placeholder="Lý do gỡ tin khỏi sàn..."
                    rows={3}
                    className="w-full p-2.5 rounded-lg border border-amber-200 bg-surface-container-lowest text-xs text-on-surface focus:outline-none focus:border-amber-500"
                  />

                  <div className="flex justify-end gap-2">
                    <AdminButton
                      variant="outline"
                      size="sm"
                      onClick={() => setShowTakedownForm(false)}
                    >
                      Hủy
                    </AdminButton>
                    <AdminButton
                      variant="danger"
                      size="sm"
                      loading={actionLoading}
                      onClick={handleTakedown}
                    >
                      Xác nhận gỡ tin
                    </AdminButton>
                  </div>
                </div>
              )}
            </>
          )}

          {/* TAB 2: 160-POINT TECHNICAL INSPECTION FORM */}
          {detail && !loading && modalTab === 'INSPECTION_160' && (
            <div className="space-y-6">
              {/* Inspection Summary Banner */}
              <div className="p-5 rounded-2xl bg-surface-container-low border border-surface-container-high flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-secondary text-white font-mono font-extrabold text-2xl flex items-center justify-center shrink-0 shadow-xs">
                    {inspectionScore}
                  </div>
                  <div>
                    <h3 className="font-headline-sm text-base text-primary font-bold">
                      Điểm Đánh Giá Thẩm Định Kỹ Thuật (Thang 100)
                    </h3>
                    <p className="font-body-sm text-xs text-outline mt-0.5">
                      {inspectionScore >= 90
                        ? '★ Đạt chuẩn xe lướt cao cấp AuraAuto Certified'
                        : inspectionScore >= 75
                        ? 'Đạt chuẩn lưu hành thị trường'
                        : 'Dưới tiêu chuẩn chất lượng'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <input
                    type="range"
                    min="50"
                    max="100"
                    value={inspectionScore}
                    onChange={(e) => setInspectionScore(Number(e.target.value))}
                    className="w-full sm:w-36 accent-secondary"
                  />
                  <span className="font-mono font-bold text-sm text-secondary min-w-[36px]">
                    {inspectionScore}/100
                  </span>
                </div>
              </div>

              {/* Inspector & PDF Meta */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-surface-container-low border border-surface-container-high text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-primary block">Chuyên viên / Đơn vị kiểm định:</label>
                  <input
                    type="text"
                    value={inspectorName}
                    onChange={(e) => setInspectorName(e.target.value)}
                    placeholder="Ví dụ: KTV. Nguyễn Thành Trung (Aura Inspection)"
                    className="w-full p-2.5 rounded-lg border border-surface-container-high bg-surface-container-lowest text-xs text-primary focus:outline-none focus:border-secondary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-primary block">Đường dẫn file PDF biên bản thẩm định:</label>
                  <input
                    type="text"
                    value={inspectionPdfUrl}
                    onChange={(e) => setInspectionPdfUrl(e.target.value)}
                    placeholder="https://cdn.auraauto.vn/inspections/report.pdf"
                    className="w-full p-2.5 rounded-lg border border-surface-container-high bg-surface-container-lowest text-xs text-primary focus:outline-none focus:border-secondary font-mono"
                  />
                </div>
              </div>

              {/* 5-Category 160-Point Inspection Checklist */}
              <div className="space-y-4">
                <h4 className="font-label-md text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-secondary text-[18px]">checklist</span>
                  <span>Hạng mục kiểm tra 160 điểm chuẩn kỹ thuật</span>
                </h4>

                <div className="space-y-3">
                  {Object.entries(inspectionChecklist).map(([catKey, cat]: [string, any]) => (
                    <div
                      key={catKey}
                      className="p-4 rounded-xl bg-surface-container-lowest border border-surface-container-high space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-primary">{cat.title}</span>
                        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          Đạt {cat.items.filter((i: any) => i.passed).length}/{cat.items.length} tiêu chí
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {cat.items.map((item: any, idx: number) => (
                          <label
                            key={idx}
                            className={`p-2.5 rounded-lg border flex items-center gap-2.5 cursor-pointer transition-colors ${
                              item.passed
                                ? 'bg-surface-container-low border-surface-container-high text-primary'
                                : 'bg-red-50/50 border-red-200 text-red-800'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={item.passed}
                              onChange={() => toggleChecklistItem(catKey, idx)}
                              className="accent-secondary rounded"
                            />
                            <span className="text-[11px] leading-tight select-none">{item.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <AdminButton
                  variant="primary"
                  size="sm"
                  icon="save"
                  loading={savingInspection}
                  onClick={handleSaveInspection}
                >
                  Lưu Biên Bản Thẩm Định 160 Điểm
                </AdminButton>
              </div>
            </div>
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
