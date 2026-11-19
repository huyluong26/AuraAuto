'use client';

import React from 'react';
import { VehicleHistoryState } from '../../types';

interface VehicleHistorySurveyGroupProps {
  vehicleHistory: VehicleHistoryState;
  onVehicleHistoryChange: (patch: Partial<VehicleHistoryState>) => void;
}

export function VehicleHistorySurveyGroup({
  vehicleHistory,
  onVehicleHistoryChange,
}: VehicleHistorySurveyGroupProps) {
  return (
    <div className="space-y-6 pt-6 border-t border-surface-container-high/70">
      <div>
        <div className="flex items-center gap-2 text-primary font-semibold text-sm font-display">
          <span className="material-symbols-outlined text-secondary text-[20px]">history_edu</span>
          <span>4. Lịch sử sử dụng &amp; Kiểm định kỹ thuật</span>
        </div>
        <p className="text-xs text-on-surface-variant mt-1">
          Minh bạch lịch sử bảo dưỡng và tình trạng xe để tạo niềm tin tối đa với khách mua thực tế.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <label className="text-xs font-semibold text-primary">
          Lịch sử tai nạn
          <select
            value={vehicleHistory.accidentStatus}
            onChange={(e) =>
              onVehicleHistoryChange({
                accidentStatus: e.target.value as VehicleHistoryState['accidentStatus'],
              })
            }
            className="mt-1.5 w-full h-11 px-3 rounded-xl bg-surface border border-surface-container-high text-xs text-primary"
          >
            <option value="UNKNOWN">Chưa xác định</option>
            <option value="NONE">Chưa từng va chạm/tai nạn</option>
            <option value="MINOR">Va chạm xước sát nhẹ ngoài da</option>
            <option value="MAJOR">Tai nạn nặng ảnh hưởng khung gầm</option>
          </select>
        </label>

        <label className="text-xs font-semibold text-primary">
          Ngập nước / Thủy kích
          <select
            value={vehicleHistory.floodStatus}
            onChange={(e) =>
              onVehicleHistoryChange({
                floodStatus: e.target.value as VehicleHistoryState['floodStatus'],
              })
            }
            className="mt-1.5 w-full h-11 px-3 rounded-xl bg-surface border border-surface-container-high text-xs text-primary"
          >
            <option value="UNKNOWN">Chưa xác định</option>
            <option value="NONE">Cam kết không ngập nước</option>
            <option value="SUSPECTED">Có dấu hiệu nghi ngờ</option>
            <option value="CONFIRMED">Đã từng ngập/thủy kích</option>
          </select>
        </label>

        <label className="text-xs font-semibold text-primary">
          Lịch sử bảo dưỡng
          <select
            value={vehicleHistory.serviceHistory}
            onChange={(e) =>
              onVehicleHistoryChange({
                serviceHistory: e.target.value as VehicleHistoryState['serviceHistory'],
              })
            }
            className="mt-1.5 w-full h-11 px-3 rounded-xl bg-surface border border-surface-container-high text-xs text-primary"
          >
            <option value="UNKNOWN">Chưa xác định</option>
            <option value="NONE">Không có hồ sơ lưu</option>
            <option value="PARTIAL">Có một phần sổ theo dõi</option>
            <option value="FULL">Đầy đủ sổ bảo dưỡng hãng 100%</option>
          </select>
        </label>

        <label className="text-xs font-semibold text-primary">
          Số đời chủ sử dụng
          <input
            type="number"
            min={1}
            max={20}
            value={vehicleHistory.ownerCount || ''}
            onChange={(e) => onVehicleHistoryChange({ ownerCount: Number(e.target.value) || 0 })}
            className="mt-1.5 w-full h-11 px-3 rounded-xl bg-surface border border-surface-container-high text-xs text-primary"
            placeholder="VD: 1 (Chính chủ đầu tiên)"
          />
        </label>

        <label className="text-xs font-semibold text-primary">
          Số chi tiết đã sơn tỉa lại
          <input
            type="number"
            min={0}
            max={50}
            value={vehicleHistory.repaintedPartsCount}
            onChange={(e) =>
              onVehicleHistoryChange({ repaintedPartsCount: Number(e.target.value) || 0 })
            }
            className="mt-1.5 w-full h-11 px-3 rounded-xl bg-surface border border-surface-container-high text-xs text-primary"
            placeholder="0 (Sơn zin nguyên bản)"
          />
        </label>

        <label className="text-xs font-semibold text-primary sm:col-span-3">
          Linh kiện / Phụ tùng chính đã thay thế
          <textarea
            rows={2}
            maxLength={1000}
            value={vehicleHistory.replacedParts}
            onChange={(e) => onVehicleHistoryChange({ replacedParts: e.target.value })}
            className="mt-1.5 w-full p-3 rounded-xl bg-surface border border-surface-container-high text-xs text-primary"
            placeholder="VD: Đã thay 4 lốp Michelin mới, thay bình ắc quy GS chính hãng, bảo dưỡng gạt mưa..."
          />
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <label className="flex items-center gap-3 p-3.5 rounded-xl bg-surface-container-low/70 border border-surface-container-high/60 cursor-pointer hover:bg-surface-container-low transition-colors">
          <input
            type="checkbox"
            checked={vehicleHistory.engineRepaired}
            onChange={(e) => onVehicleHistoryChange({ engineRepaired: e.target.checked })}
            className="w-4 h-4 rounded accent-secondary cursor-pointer"
          />
          <span className="text-xs font-medium text-primary">Động cơ đã từng đại tu / sửa chữa lớn</span>
        </label>

        <label className="flex items-center gap-3 p-3.5 rounded-xl bg-surface-container-low/70 border border-surface-container-high/60 cursor-pointer hover:bg-surface-container-low transition-colors">
          <input
            type="checkbox"
            checked={vehicleHistory.transmissionRepaired}
            onChange={(e) => onVehicleHistoryChange({ transmissionRepaired: e.target.checked })}
            className="w-4 h-4 rounded accent-secondary cursor-pointer"
          />
          <span className="text-xs font-medium text-primary">Hộp số đã từng sửa chữa / bổ máy</span>
        </label>
      </div>
    </div>
  );
}

