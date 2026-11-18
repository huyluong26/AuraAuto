'use client';

import React from 'react';
import { SuggestiveInput } from './SuggestiveInput';

interface ValuationConditionSectionProps {
  accidentStatus: string;
  setAccidentStatus: (val: string) => void;
  floodStatus: string;
  setFloodStatus: (val: string) => void;
  serviceHistory: string;
  setServiceHistory: (val: string) => void;
  ownerCount: string;
  setOwnerCount: (val: string) => void;
  repaintedPartsCount: string;
  setRepaintedPartsCount: (val: string) => void;
  engineRepaired: boolean;
  setEngineRepaired: (val: boolean) => void;
  transmissionRepaired: boolean;
  setTransmissionRepaired: (val: boolean) => void;
  replacedParts: string;
  setReplacedParts: (val: string) => void;
}

export const ValuationConditionSection: React.FC<ValuationConditionSectionProps> = ({
  accidentStatus,
  setAccidentStatus,
  floodStatus,
  setFloodStatus,
  serviceHistory,
  setServiceHistory,
  ownerCount,
  setOwnerCount,
  repaintedPartsCount,
  setRepaintedPartsCount,
  engineRepaired,
  setEngineRepaired,
  transmissionRepaired,
  setTransmissionRepaired,
  replacedParts,
  setReplacedParts,
}) => {
  return (
    <div className="space-y-4 pt-1">
      <div className="flex items-center gap-2 border-b border-[#f0eee9] pb-3 text-[#1a1c1a] font-bold text-xs uppercase tracking-wider font-display">
        <span className="material-symbols-outlined text-[#b89b72] text-[20px]">history_edu</span>
        <span>4. Lịch sử sử dụng &amp; Kiểm định kỹ thuật (Tùy chọn)</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <SuggestiveInput
          label="Lịch sử tai nạn"
          value={accidentStatus}
          onChange={setAccidentStatus}
          placeholder="Nhập hoặc chọn lịch sử tai nạn"
          suggestions={[
            'Chưa từng va chạm/tai nạn',
            'Va chạm xước sát nhẹ ngoài da',
            'Tai nạn ảnh hưởng khung gầm',
            'Chưa xác định',
          ]}
          maxSuggestions={4}
        />

        <SuggestiveInput
          label="Ngập nước / Thủy kích"
          value={floodStatus}
          onChange={setFloodStatus}
          placeholder="Nhập tình trạng ngập nước"
          suggestions={[
            'Cam kết không ngập nước',
            'Có dấu hiệu nghi ngờ',
            'Đã từng ngập/thủy kích',
            'Chưa xác định',
          ]}
          maxSuggestions={4}
        />

        <SuggestiveInput
          label="Lịch sử bảo dưỡng"
          value={serviceHistory}
          onChange={setServiceHistory}
          placeholder="Nhập lịch sử bảo dưỡng"
          suggestions={[
            'Đầy đủ sổ bảo dưỡng hãng 100%',
            'Có một phần sổ theo dõi',
            'Không có hồ sơ lưu',
            'Chưa xác định',
          ]}
          maxSuggestions={4}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <SuggestiveInput
          label="Số đời chủ sử dụng"
          value={ownerCount}
          onChange={setOwnerCount}
          placeholder="VD: 1 (Chính chủ đầu tiên)"
          suggestions={['1 (Chính chủ)', '2 đời chủ', '3 đời chủ', 'Trên 3 đời chủ']}
          maxSuggestions={4}
        />

        <SuggestiveInput
          label="Số chi tiết đã sơn tỉa lại"
          value={repaintedPartsCount}
          onChange={setRepaintedPartsCount}
          placeholder="0 (Sơn zin nguyên bản)"
          suggestions={['0 (Sơn zin 100%)', '1-2 chi tiết nhỏ', '3-5 chi tiết', 'Sơn lại toàn bộ']}
          maxSuggestions={4}
        />

        <div className="flex flex-col justify-end space-y-2 pt-2">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium">
            <input
              type="checkbox"
              checked={engineRepaired}
              onChange={(e) => setEngineRepaired(e.target.checked)}
              className="w-4 h-4 rounded accent-[#b89b72] cursor-pointer"
            />
            <span>Động cơ từng đại tu / sửa chữa</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium">
            <input
              type="checkbox"
              checked={transmissionRepaired}
              onChange={(e) => setTransmissionRepaired(e.target.checked)}
              className="w-4 h-4 rounded accent-[#b89b72] cursor-pointer"
            />
            <span>Hộp số từng đại tu / sửa chữa</span>
          </label>
        </div>
      </div>

      <SuggestiveInput
        label="Linh kiện / Phụ tùng chính đã thay thế (Tùy chọn)"
        value={replacedParts}
        onChange={setReplacedParts}
        placeholder="Gõ các món linh kiện đã thay thế nếu có (VD: 4 lốp Michelin 2024, ắc quy mới...)"
        suggestions={[
          '4 lốp Michelin mới',
          'Ắc quy mới thay',
          'Dàn gầm & phuộc nhún mới',
          'Má phanh & đĩa phanh mới',
        ]}
        maxSuggestions={4}
      />
    </div>
  );
};
