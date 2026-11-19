'use client';

import React from 'react';
import { AdminButton } from '../ui/AdminButton';
import { AdminReportItem } from '../../types';

export const ACTION_OPTIONS = [
  { value: 'WARNING', label: '⚠️ Cảnh cáo người bán / đối tượng vi phạm', desc: 'Gửi thông báo cảnh cáo nghiêm khắc đến tài khoản.' },
  { value: 'HIDE_LISTING', label: '👁️ Tạm ẩn tin đăng khỏi kết quả tìm kiếm', desc: 'Tạm ẩn tin đăng để chờ xác minh bổ sung từ chủ xe.' },
  { value: 'REMOVE_LISTING', label: '🚫 Gỡ bỏ bài đăng vi phạm vĩnh viễn', desc: 'Chuyển tin sang trạng thái REMOVED và hạ khỏi sàn hoàn toàn.' },
  { value: 'SUSPEND_USER', label: '🔒 Tạm khóa tài khoản người vi phạm', desc: 'Khóa đăng nhập tài khoản tạm thời để điều tra hành vi gian lận.' },
  { value: 'BAN_USER', label: '⛔ Cấm vĩnh viễn tài khoản khỏi hệ thống', desc: 'Vô hiệu hóa vĩnh viễn tài khoản và hủy toàn bộ tin đăng liên quan.' },
  { value: 'DISMISS', label: '✕ Bác bỏ tố cáo (Không đủ chứng cứ)', desc: 'Không có cơ sở kết luận vi phạm hoặc báo cáo sai lệch.' },
];

interface ReportResolutionModalProps {
  report: AdminReportItem | null;
  resolutionAction: string;
  onResolutionActionChange: (action: string) => void;
  resolutionNote: string;
  onResolutionNoteChange: (note: string) => void;
  submitting: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

export function ReportResolutionModal({
  report,
  resolutionAction,
  onResolutionActionChange,
  resolutionNote,
  onResolutionNoteChange,
  submitting,
  onClose,
  onSubmit,
}: ReportResolutionModalProps) {
  if (!report) return null;

  return (
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
                Báo cáo #{report.id.slice(0, 8)} • Mục tiêu: {report.target_type}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-surface-container-high flex items-center justify-center text-outline hover:text-primary cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container-high text-xs space-y-1">
            <span className="font-bold text-primary">Tố cáo:</span> {report.description}
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
                    onChange={(e) => onResolutionActionChange(e.target.value)}
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
              onChange={(e) => onResolutionNoteChange(e.target.value)}
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
            onClick={onClose}
          >
            Hủy bỏ
          </AdminButton>
          <AdminButton
            variant="danger"
            size="sm"
            loading={submitting}
            onClick={onSubmit}
          >
            Xác nhận thực thi chế tài
          </AdminButton>
        </div>
      </div>
    </div>
  );
}

