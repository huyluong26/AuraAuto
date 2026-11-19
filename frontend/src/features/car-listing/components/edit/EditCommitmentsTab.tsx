'use client';

import React from 'react';

interface EditCommitmentsTabProps {
  accidentStatus: 'UNKNOWN' | 'NONE' | 'MINOR' | 'MAJOR';
  setAccidentStatus: (status: 'UNKNOWN' | 'NONE' | 'MINOR' | 'MAJOR') => void;
  floodStatus: 'UNKNOWN' | 'NONE' | 'SUSPECTED' | 'CONFIRMED';
  setFloodStatus: (status: 'UNKNOWN' | 'NONE' | 'SUSPECTED' | 'CONFIRMED') => void;
  serviceHistory: 'UNKNOWN' | 'NONE' | 'PARTIAL' | 'FULL';
  setServiceHistory: (history: 'UNKNOWN' | 'NONE' | 'PARTIAL' | 'FULL') => void;
  ownerCount: number;
  setOwnerCount: (count: number) => void;
  repaintedPartsCount: number;
  setRepaintedPartsCount: (count: number) => void;
  replacedParts: string;
  setReplacedParts: (parts: string) => void;
  engineRepaired: boolean;
  setEngineRepaired: (repaired: boolean) => void;
  transmissionRepaired: boolean;
  setTransmissionRepaired: (repaired: boolean) => void;
}

export function EditCommitmentsTab({
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
  replacedParts,
  setReplacedParts,
  engineRepaired,
  setEngineRepaired,
  transmissionRepaired,
  setTransmissionRepaired,
}: EditCommitmentsTabProps) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Accident */}
        <div>
          <label className="block text-xs font-bold text-primary mb-1">Tình trạng tai nạn</label>
          <select
            value={accidentStatus}
            onChange={(e) => setAccidentStatus(e.target.value as any)}
            className="w-full px-3 py-2.5 rounded-xl bg-surface-container-low border border-surface-container-high text-xs text-primary focus:border-secondary outline-none font-medium"
          >
            <option value="NONE">Cam kết không tai nạn</option>
            <option value="MINOR">Va quẹt nhẹ bên ngoài</option>
            <option value="MAJOR">Tai nạn ảnh hưởng khung gầm</option>
            <option value="UNKNOWN">Chưa xác định</option>
          </select>
        </div>

        {/* Flood */}
        <div>
          <label className="block text-xs font-bold text-primary mb-1">Tình trạng ngập nước</label>
          <select
            value={floodStatus}
            onChange={(e) => setFloodStatus(e.target.value as any)}
            className="w-full px-3 py-2.5 rounded-xl bg-surface-container-low border border-surface-container-high text-xs text-primary focus:border-secondary outline-none font-medium"
          >
            <option value="NONE">Cam kết không thủy kích</option>
            <option value="SUSPECTED">Nghi vấn ngập nước</option>
            <option value="CONFIRMED">Đã từng ngập nước</option>
            <option value="UNKNOWN">Chưa xác định</option>
          </select>
        </div>

        {/* Service History */}
        <div>
          <label className="block text-xs font-bold text-primary mb-1">Lịch sử bảo dưỡng</label>
          <select
            value={serviceHistory}
            onChange={(e) => setServiceHistory(e.target.value as any)}
            className="w-full px-3 py-2.5 rounded-xl bg-surface-container-low border border-surface-container-high text-xs text-primary focus:border-secondary outline-none font-medium"
          >
            <option value="FULL">Bảo dưỡng hãng đầy đủ</option>
            <option value="PARTIAL">Bảo dưỡng định kỳ một phần</option>
            <option value="NONE">Không có sổ bảo dưỡng</option>
            <option value="UNKNOWN">Chưa xác định</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-primary mb-1">Số đời chủ sở hữu</label>
          <input
            type="number"
            min="1"
            max="10"
            value={ownerCount}
            onChange={(e) => setOwnerCount(parseInt(e.target.value, 10) || 1)}
            className="w-full px-3 py-2.5 rounded-xl bg-surface-container-low border border-surface-container-high text-xs text-primary focus:border-secondary outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-primary mb-1">Số chi tiết đã sơn lại</label>
          <input
            type="number"
            min="0"
            max="30"
            value={repaintedPartsCount}
            onChange={(e) => setRepaintedPartsCount(parseInt(e.target.value, 10) || 0)}
            className="w-full px-3 py-2.5 rounded-xl bg-surface-container-low border border-surface-container-high text-xs text-primary focus:border-secondary outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-primary mb-1">
          Phụ tùng, linh kiện đã thay thế (nếu có)
        </label>
        <input
          type="text"
          value={replacedParts}
          onChange={(e) => setReplacedParts(e.target.value)}
          placeholder="VD: Thay 4 lốp Michelin mới, thay ắc quy Varta chính hãng"
          className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-surface-container-high text-xs text-primary focus:border-secondary outline-none"
        />
      </div>

      {/* Engine & Transmission Repair Switches */}
      <div className="p-4 rounded-2xl bg-surface-container-low border border-surface-container-high space-y-3">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={engineRepaired}
            onChange={(e) => setEngineRepaired(e.target.checked)}
            className="w-4 h-4 rounded text-secondary focus:ring-secondary cursor-pointer"
          />
          <span className="text-xs text-primary font-medium">
            Động cơ đã từng hạ máy / bổ máy / đại tu
          </span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={transmissionRepaired}
            onChange={(e) => setTransmissionRepaired(e.target.checked)}
            className="w-4 h-4 rounded text-secondary focus:ring-secondary cursor-pointer"
          />
          <span className="text-xs text-primary font-medium">
            Hộp số đã từng sửa chữa hoặc thay thế
          </span>
        </label>
      </div>
    </div>
  );
}

