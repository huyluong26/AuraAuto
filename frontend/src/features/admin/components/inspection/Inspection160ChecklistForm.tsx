'use client';

import React from 'react';
import { AdminButton } from '../ui/AdminButton';
import { InspectionChecklistState } from '../../constants/inspectionTemplate';

interface Inspection160ChecklistFormProps {
  inspectionScore: number;
  onInspectionScoreChange: (score: number) => void;
  inspectorName: string;
  onInspectorNameChange: (name: string) => void;
  inspectionPdfUrl: string;
  onInspectionPdfUrlChange: (url: string) => void;
  inspectionChecklist: InspectionChecklistState;
  onToggleChecklistItem: (categoryKey: string, itemIndex: number) => void;
  savingInspection: boolean;
  onSave: () => void;
}

export function Inspection160ChecklistForm({
  inspectionScore,
  onInspectionScoreChange,
  inspectorName,
  onInspectorNameChange,
  inspectionPdfUrl,
  onInspectionPdfUrlChange,
  inspectionChecklist,
  onToggleChecklistItem,
  savingInspection,
  onSave,
}: Inspection160ChecklistFormProps) {
  return (
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
            onChange={(e) => onInspectionScoreChange(Number(e.target.value))}
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
            onChange={(e) => onInspectorNameChange(e.target.value)}
            placeholder="Ví dụ: KTV. Nguyễn Thành Trung (Aura Inspection)"
            className="w-full p-2.5 rounded-lg border border-surface-container-high bg-surface-container-lowest text-xs text-primary focus:outline-none focus:border-secondary"
          />
        </div>

        <div className="space-y-1">
          <label className="font-bold text-primary block">Đường dẫn file PDF biên bản thẩm định:</label>
          <input
            type="text"
            value={inspectionPdfUrl}
            onChange={(e) => onInspectionPdfUrlChange(e.target.value)}
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
          {Object.entries(inspectionChecklist).map(([catKey, cat]) => (
            <div
              key={catKey}
              className="p-4 rounded-xl bg-surface-container-lowest border border-surface-container-high space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-primary">{cat.title}</span>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  Đạt {cat.items.filter((i) => i.passed).length}/{cat.items.length} tiêu chí
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {cat.items.map((item, idx) => (
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
                      onChange={() => onToggleChecklistItem(catKey, idx)}
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
          onClick={onSave}
        >
          Lưu Biên Bản Thẩm Định 160 Điểm
        </AdminButton>
      </div>
    </div>
  );
}

