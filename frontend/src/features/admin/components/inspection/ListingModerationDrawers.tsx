'use client';

import React from 'react';
import { AdminButton } from '../ui/AdminButton';
import { REJECT_SUGGESTIONS } from '../../constants/inspectionTemplate';

interface ListingModerationDrawersProps {
  showRejectForm: boolean;
  onCloseRejectForm: () => void;
  rejectReason: string;
  onRejectReasonChange: (reason: string) => void;
  showTakedownForm: boolean;
  onCloseTakedownForm: () => void;
  takedownReason: string;
  onTakedownReasonChange: (reason: string) => void;
  actionLoading: boolean;
  onReject: () => void;
  onTakedown: () => void;
}

export function ListingModerationDrawers({
  showRejectForm,
  onCloseRejectForm,
  rejectReason,
  onRejectReasonChange,
  showTakedownForm,
  onCloseTakedownForm,
  takedownReason,
  onTakedownReasonChange,
  actionLoading,
  onReject,
  onTakedown,
}: ListingModerationDrawersProps) {
  return (
    <>
      {/* Rejection Form Drawer */}
      {showRejectForm && (
        <div className="p-4 rounded-xl bg-red-50/70 border border-red-200 space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-red-700 font-semibold text-sm">
              <span className="material-symbols-outlined text-[20px]">report</span>
              <span>Nhập lý do từ chối phê duyệt tin</span>
            </div>
            <button
              type="button"
              onClick={onCloseRejectForm}
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
                onClick={() => onRejectReasonChange(sug)}
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
            onChange={(e) => onRejectReasonChange(e.target.value)}
            placeholder="Nhập lý do từ chối cụ thể..."
            rows={3}
            className="w-full p-2.5 rounded-lg border border-red-200 bg-surface-container-lowest text-xs text-on-surface focus:outline-none focus:border-red-500"
          />

          <div className="flex justify-end gap-2">
            <AdminButton
              variant="outline"
              size="sm"
              onClick={onCloseRejectForm}
            >
              Hủy
            </AdminButton>
            <AdminButton
              variant="danger"
              size="sm"
              loading={actionLoading}
              onClick={onReject}
            >
              Xác nhận từ chối
            </AdminButton>
          </div>
        </div>
      )}

      {/* Takedown Form Drawer */}
      {showTakedownForm && (
        <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-800 font-semibold text-sm">
              <span className="material-symbols-outlined text-[20px]">block</span>
              <span>Nhập lý do gỡ tin đăng khỏi sàn</span>
            </div>
            <button
              type="button"
              onClick={onCloseTakedownForm}
              className="text-xs text-outline hover:text-primary cursor-pointer"
            >
              Đóng
            </button>
          </div>

          <textarea
            value={takedownReason}
            onChange={(e) => onTakedownReasonChange(e.target.value)}
            placeholder="Lý do gỡ tin khỏi sàn..."
            rows={3}
            className="w-full p-2.5 rounded-lg border border-amber-200 bg-surface-container-lowest text-xs text-on-surface focus:outline-none focus:border-amber-500"
          />

          <div className="flex justify-end gap-2">
            <AdminButton
              variant="outline"
              size="sm"
              onClick={onCloseTakedownForm}
            >
              Hủy
            </AdminButton>
            <AdminButton
              variant="danger"
              size="sm"
              loading={actionLoading}
              onClick={onTakedown}
            >
              Xác nhận gỡ tin
            </AdminButton>
          </div>
        </div>
      )}
    </>
  );
}

