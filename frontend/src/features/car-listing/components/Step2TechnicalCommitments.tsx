'use client';

import React from 'react';
import { CommitmentsState, VehicleHistoryState } from '../types';
import { CarSpecsSelectorGroup } from './technical-commitments/CarSpecsSelectorGroup';
import { CarColorPickerGroup } from './technical-commitments/CarColorPickerGroup';
import { VehicleHistorySurveyGroup } from './technical-commitments/VehicleHistorySurveyGroup';
import { CarDescriptionTemplateEditor } from './technical-commitments/CarDescriptionTemplateEditor';

interface Step2TechnicalCommitmentsProps {
  sellerType?: 'INDIVIDUAL' | 'SHOWROOM';
  brandName?: string;
  manufactureYear: number;
  condition: string;
  onConditionChange: (val: string) => void;
  origin: string;
  onOriginChange: (val: string) => void;
  bodyType: string;
  onBodyTypeChange: (val: string) => void;
  transmission: string;
  onTransmissionChange: (val: string) => void;
  powertrain: string;
  onPowertrainChange: (val: string) => void;
  engineDisplacement: string;
  onEngineDisplacementChange: (val: string) => void;
  drivetrain: string;
  onDrivetrainChange: (val: string) => void;
  seats: number;
  onSeatsChange: (val: number) => void;
  doors: number;
  onDoorsChange: (val: number) => void;
  color: string;
  onColorChange: (val: string) => void;
  interiorColor: string;
  onInteriorColorChange: (val: string) => void;
  description: string;
  onDescriptionChange: (val: string) => void;
  commitments: CommitmentsState;
  onToggleCommitment: (key: keyof CommitmentsState) => void;
  vehicleHistory: VehicleHistoryState;
  onVehicleHistoryChange: (patch: Partial<VehicleHistoryState>) => void;
  errors: Record<string, string>;
  onPrev: () => void;
  onNext: () => void;
}

export function Step2TechnicalCommitments({
  sellerType = 'INDIVIDUAL',
  brandName = '',
  condition,
  onConditionChange,
  origin,
  onOriginChange,
  bodyType,
  onBodyTypeChange,
  transmission,
  onTransmissionChange,
  powertrain,
  onPowertrainChange,
  engineDisplacement,
  onEngineDisplacementChange,
  drivetrain,
  onDrivetrainChange,
  seats,
  onSeatsChange,
  doors,
  onDoorsChange,
  color,
  onColorChange,
  interiorColor,
  onInteriorColorChange,
  description,
  onDescriptionChange,
  commitments,
  onToggleCommitment,
  vehicleHistory,
  onVehicleHistoryChange,
  errors,
  onPrev,
  onNext,
}: Step2TechnicalCommitmentsProps) {
  return (
    <section className="bg-surface-container-lowest p-6 sm:p-8 lg:p-10 rounded-2xl shadow-sm border border-surface-container-high/60 space-y-10 animate-in fade-in duration-200">
      {/* Step Header */}
      <div className="flex items-center justify-between border-b border-surface-container-high/70 pb-5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-secondary-container/40 text-secondary font-label-sm text-xs uppercase tracking-wider font-semibold">
            <span>Bước 02 / 05</span>
          </div>
          <h2 className="font-headline-md text-xl sm:text-2xl text-primary font-bold tracking-tight">
            Thông số kỹ thuật &amp; Mô tả chi tiết xe
          </h2>
          <p className="font-body-sm text-xs sm:text-sm text-on-surface-variant">
            Nhập tay trực tiếp vào ô dữ liệu hoặc bấm vào các nút gợi ý khoa học ngay bên dưới để điền nhanh.
          </p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-surface-container-low border border-surface-container-high flex items-center justify-center text-secondary shrink-0">
          <span className="material-symbols-outlined text-[28px]">tune</span>
        </div>
      </div>

      {/* 1. Tình trạng & Xuất xứ, Kiểu dáng, Hộp số, Nhiên liệu, Động cơ, Chỗ/Cửa */}
      <CarSpecsSelectorGroup
        condition={condition}
        onConditionChange={onConditionChange}
        origin={origin}
        onOriginChange={onOriginChange}
        bodyType={bodyType}
        onBodyTypeChange={onBodyTypeChange}
        transmission={transmission}
        onTransmissionChange={onTransmissionChange}
        powertrain={powertrain}
        onPowertrainChange={onPowertrainChange}
        engineDisplacement={engineDisplacement}
        onEngineDisplacementChange={onEngineDisplacementChange}
        drivetrain={drivetrain}
        onDrivetrainChange={onDrivetrainChange}
        seats={seats}
        onSeatsChange={onSeatsChange}
        doors={doors}
        onDoorsChange={onDoorsChange}
        errors={errors}
      />

      {/* 2. Màu ngoại thất & Màu da nội thất */}
      <CarColorPickerGroup
        brandName={brandName}
        color={color}
        onColorChange={onColorChange}
        interiorColor={interiorColor}
        onInteriorColorChange={onInteriorColorChange}
        errors={errors}
      />

      {/* 3. Lịch sử sử dụng & Kiểm định kỹ thuật */}
      <VehicleHistorySurveyGroup
        vehicleHistory={vehicleHistory}
        onVehicleHistoryChange={onVehicleHistoryChange}
      />

      {/* 4. Mô tả chi tiết & Cam kết người bán */}
      <CarDescriptionTemplateEditor
        sellerType={sellerType}
        description={description}
        onDescriptionChange={onDescriptionChange}
        commitments={commitments}
        onToggleCommitment={onToggleCommitment}
      />

      {/* Action Footer */}
      <div className="pt-6 border-t border-surface-container-high/70 flex flex-col sm:flex-row items-center justify-between gap-4">
        <button
          type="button"
          onClick={onPrev}
          className="w-full sm:w-auto px-7 py-3 rounded-xl bg-surface text-primary text-xs font-semibold hover:bg-surface-container border border-surface-container-high transition-colors cursor-pointer"
        >
          ← Quay lại
        </button>
        <button
          type="button"
          onClick={onNext}
          className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-primary text-on-primary text-sm font-semibold hover:bg-primary-container transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Tiếp tục: Tải ảnh xe</span>
          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
        </button>
      </div>
    </section>
  );
}
