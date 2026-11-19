'use client';

import React from 'react';
import { CommitmentsState } from '../../types';
import { SAMPLE_DESCRIPTIONS } from '../../constants';

interface CarDescriptionTemplateEditorProps {
  sellerType?: 'INDIVIDUAL' | 'SHOWROOM';
  description: string;
  onDescriptionChange: (val: string) => void;
  commitments: CommitmentsState;
  onToggleCommitment: (key: keyof CommitmentsState) => void;
}

export function CarDescriptionTemplateEditor({
  sellerType = 'INDIVIDUAL',
  description,
  onDescriptionChange,
  commitments,
  onToggleCommitment,
}: CarDescriptionTemplateEditorProps) {
  return (
    <>
      {/* Cụm 5: Mô tả chi tiết xe */}
      <div className="space-y-4 pt-6 border-t border-surface-container-high/70">
        <div>
          <div className="flex items-center gap-2 text-primary font-semibold text-sm font-display">
            <span className="material-symbols-outlined text-secondary text-[20px]">description</span>
            <span>5. Thông tin mô tả chi tiết từ chủ xe</span>
          </div>
          <p className="text-xs text-on-surface-variant mt-1">
            Gõ mô tả thực tế về xe hoặc bấm chọn các mẫu mô tả gợi ý bên dưới để chèn nhanh.
          </p>
        </div>

        {/* Ô nhập TEXTAREA Ở TRÊN */}
        <div className="relative">
          <textarea
            rows={5}
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Tự do gõ thông tin giới thiệu xe: tình trạng vận hành, phụ kiện kèm theo, lịch sử bảo dưỡng, thiện chí mua bán (hoặc bấm chọn mẫu bên dưới)..."
            className="w-full p-4 rounded-xl bg-surface text-primary text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary border border-surface-container-high leading-relaxed"
          />
          <div className="flex justify-between items-center text-[11px] text-outline pt-1.5 px-1">
            <span>Khuyến nghị từ 30 ký tự trở lên để khách mua nắm rõ thông tin</span>
            <span>{description.length} ký tự</span>
          </div>
        </div>

        {/* CÁC NÚT MẪU GỢI Ý ĐẶT Ở DƯỚI INPUT */}
        <div className="p-3.5 rounded-xl bg-surface-container-low/60 border border-surface-container-high/60 space-y-2">
          <span className="text-[11px] font-semibold text-outline uppercase tracking-wider block">
            Gợi ý mẫu văn bản mô tả sẵn:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {SAMPLE_DESCRIPTIONS.map((sample) => (
              <button
                key={sample.title}
                type="button"
                onClick={() => onDescriptionChange(sample.text)}
                className="px-3 py-2 rounded-lg text-xs font-medium bg-surface hover:bg-secondary-container/40 text-primary border border-surface-container-high hover:border-secondary transition-colors text-left flex items-center justify-between cursor-pointer"
              >
                <span>+ {sample.title}</span>
                <span className="material-symbols-outlined text-[14px] text-secondary">add</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Cụm 6: Cam kết uy tín từ người bán */}
      <div className="space-y-4 pt-6 border-t border-surface-container-high/70">
        <div className="flex items-center gap-2 text-primary font-semibold text-sm font-display">
          <span className="material-symbols-outlined text-secondary text-[20px]">shield_check</span>
          <span>
            {sellerType === 'SHOWROOM'
              ? '6. Cam kết bảo chứng từ Đại lý / Showroom (Gắn nhãn Showroom Uy tín)'
              : '6. Cam kết bảo chứng từ chủ xe (Gắn nhãn Tin cậy C2C)'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <label className="flex items-center gap-3.5 p-4 rounded-xl bg-surface-container-low/70 border border-surface-container-high/60 cursor-pointer hover:bg-surface-container-low transition-colors">
            <input
              type="checkbox"
              checked={commitments.isOwner}
              onChange={() => onToggleCommitment('isOwner')}
              className="w-5 h-5 rounded accent-secondary cursor-pointer"
            />
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-primary">
                {sellerType === 'SHOWROOM'
                  ? 'Pháp lý doanh nghiệp & Hóa đơn VAT'
                  : 'Chính chủ cá nhân đứng tên'}
              </span>
              <span className="text-[11px] text-outline">
                {sellerType === 'SHOWROOM'
                  ? 'Hợp đồng mua bán chuẩn mực, xuất hóa đơn VAT, hỗ trợ sang tên trọn gói'
                  : 'Cà-vẹt gốc, sẵn sàng ký công chứng sang tên trong ngày'}
              </span>
            </div>
          </label>

          <label className="flex items-center gap-3.5 p-4 rounded-xl bg-surface-container-low/70 border border-surface-container-high/60 cursor-pointer hover:bg-surface-container-low transition-colors">
            <input
              type="checkbox"
              checked={commitments.maintenanceHistory}
              onChange={() => onToggleCommitment('maintenanceHistory')}
              className="w-5 h-5 rounded accent-secondary cursor-pointer"
            />
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-primary">Lịch sử bảo dưỡng chính hãng</span>
              <span className="text-[11px] text-outline">Đầy đủ sổ theo dõi định kỳ tại trung tâm bảo hành ủy quyền</span>
            </div>
          </label>

          <label className="flex items-center gap-3.5 p-4 rounded-xl bg-surface-container-low/70 border border-surface-container-high/60 cursor-pointer hover:bg-surface-container-low transition-colors">
            <input
              type="checkbox"
              checked={commitments.noAccidentFlood}
              onChange={() => onToggleCommitment('noAccidentFlood')}
              className="w-5 h-5 rounded accent-secondary cursor-pointer"
            />
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-primary">Cam kết không đâm đụng, ngập nước</span>
              <span className="text-[11px] text-outline">Khung gầm và động cơ nguyên bản 100%, chưa từng đại tu</span>
            </div>
          </label>

          <label className="flex items-center gap-3.5 p-4 rounded-xl bg-surface-container-low/70 border border-surface-container-high/60 cursor-pointer hover:bg-surface-container-low transition-colors">
            <input
              type="checkbox"
              checked={commitments.readyInspection}
              onChange={() => onToggleCommitment('readyInspection')}
              className="w-5 h-5 rounded accent-secondary cursor-pointer"
            />
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-primary">Sẵn sàng cùng khách kiểm định xe</span>
              <span className="text-[11px] text-outline">Sẵn sàng đưa xe test tại hãng hoặc trung tâm kiểm định độc lập</span>
            </div>
          </label>
        </div>
      </div>
    </>
  );
}

