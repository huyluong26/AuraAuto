'use client';

import React, { useState } from 'react';
import { CommitmentsState, VehicleHistoryState } from '../types';
import {
  SUGGESTED_BODY_TYPES,
  SUGGESTED_POWERTRAINS,
  SUGGESTED_TRANSMISSIONS,
  SUGGESTED_DRIVETRAINS,
  SUGGESTED_ORIGINS,
  SUGGESTED_CONDITIONS,
  SUGGESTED_SEATS,
  SUGGESTED_DOORS,
  COMMON_ENGINE_DISPLACEMENTS,
  SAMPLE_DESCRIPTIONS,
  UNIVERSAL_CAR_COLORS,
  POPULAR_INTERIOR_COLORS,
  getBrandColors,
} from '../constants';

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
  manufactureYear,
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
  const [colorMode, setColorMode] = useState<'brand' | 'universal'>('brand');

  const brandColors = getBrandColors(brandName);
  const displayedColors = colorMode === 'brand' && brandName ? brandColors : UNIVERSAL_CAR_COLORS;

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

      {/* Cụm 1: Tình trạng & Xuất xứ xe */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-primary font-semibold text-sm font-display">
          <span className="material-symbols-outlined text-secondary text-[20px]">verified</span>
          <span>1. Tình trạng sử dụng &amp; Xuất xứ</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tình trạng xe: INPUT Ở TRÊN, GỢI Ý Ở DƯỚI CÓ HÀNG LỐI */}
          <div className="space-y-2.5">
            <label className="block text-xs font-semibold text-primary">
              Tình trạng sử dụng <span className="text-error">*</span>
            </label>
            <input
              type="text"
              required
              value={condition}
              onChange={(e) => onConditionChange(e.target.value)}
              placeholder="Nhập hoặc chọn gợi ý bên dưới (VD: Xe lướt, Xe mới...)"
              className={`w-full h-12 px-4 rounded-xl bg-surface text-primary text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary transition-all ${
                errors.condition ? 'border-2 border-error' : 'border border-surface-container-high'
              }`}
            />
            {errors.condition && <p className="text-xs text-error font-medium">{errors.condition}</p>}

            {/* Gợi ý chọn nhanh sắp xếp dạng lưới cân đối */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-semibold text-outline uppercase tracking-wider block">
                Gợi ý chọn nhanh:
              </span>
              <div className="grid grid-cols-2 gap-2">
                {SUGGESTED_CONDITIONS.map((c) => {
                  const isMatch = condition.trim().toLowerCase() === c.toLowerCase();
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => onConditionChange(c)}
                      className={`h-9 px-3 rounded-lg text-xs font-medium border text-center transition-all flex items-center justify-center gap-1 cursor-pointer ${
                        isMatch
                          ? 'bg-secondary-container/50 text-secondary border-secondary font-semibold ring-1 ring-secondary shadow-xs'
                          : 'bg-surface border-surface-container-high text-on-surface hover:border-secondary/60 hover:bg-surface-container-low'
                      }`}
                    >
                      {isMatch && <span className="material-symbols-outlined text-[14px]">check</span>}
                      <span className="truncate">{c}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Xuất xứ: INPUT Ở TRÊN, GỢI Ý Ở DƯỚI CÓ HÀNG LỐI */}
          <div className="space-y-2.5">
            <label className="block text-xs font-semibold text-primary">
              Xuất xứ nguồn gốc <span className="text-error">*</span>
            </label>
            <input
              type="text"
              required
              value={origin}
              onChange={(e) => onOriginChange(e.target.value)}
              placeholder="Nhập hoặc chọn gợi ý bên dưới (VD: Nhập khẩu Đức, CKD...)"
              className={`w-full h-12 px-4 rounded-xl bg-surface text-primary text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary transition-all ${
                errors.origin ? 'border-2 border-error' : 'border border-surface-container-high'
              }`}
            />
            {errors.origin && <p className="text-xs text-error font-medium">{errors.origin}</p>}

            {/* Gợi ý chọn nhanh dạng lưới 2 cột đều */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-semibold text-outline uppercase tracking-wider block">
                Gợi ý chọn nhanh:
              </span>
              <div className="grid grid-cols-2 gap-2">
                {SUGGESTED_ORIGINS.slice(0, 6).map((o) => {
                  const isMatch = origin.trim().toLowerCase() === o.toLowerCase();
                  return (
                    <button
                      key={o}
                      type="button"
                      onClick={() => onOriginChange(o)}
                      className={`h-9 px-2.5 rounded-lg text-xs font-medium border text-center transition-all flex items-center justify-center gap-1 cursor-pointer ${
                        isMatch
                          ? 'bg-secondary-container/50 text-secondary border-secondary font-semibold ring-1 ring-secondary shadow-xs'
                          : 'bg-surface border-surface-container-high text-on-surface hover:border-secondary/60 hover:bg-surface-container-low'
                      }`}
                    >
                      {isMatch && <span className="material-symbols-outlined text-[14px]">check</span>}
                      <span className="truncate">{o}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cụm 2: Hệ truyền động & Động cơ */}
      <div className="space-y-6 pt-6 border-t border-surface-container-high/70">
        <div className="flex items-center gap-2 text-primary font-semibold text-sm font-display">
          <span className="material-symbols-outlined text-secondary text-[20px]">speed</span>
          <span>2. Kiểu dáng thân xe &amp; Hệ thống vận hành</span>
        </div>

        {/* Kiểu dáng thân xe (Body Type) */}
        <div className="space-y-2.5">
          <label className="block text-xs font-semibold text-primary">
            Kiểu dáng thân xe (Body Type) <span className="text-error">*</span>
          </label>
          <input
            type="text"
            required
            value={bodyType}
            onChange={(e) => onBodyTypeChange(e.target.value)}
            placeholder="VD: Sedan, SUV gầm cao, Crossover, Hatchback, MPV, Coupe..."
            className={`w-full h-12 px-4 rounded-xl bg-surface text-primary text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary ${
              errors.bodyType ? 'border-2 border-error' : 'border border-surface-container-high'
            }`}
          />
          {errors.bodyType && <p className="text-xs text-error font-medium">{errors.bodyType}</p>}

          {/* Gợi ý thân xe xếp thành hàng 3 - 5 cột thẳng tắp */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-semibold text-outline uppercase tracking-wider block">
              Gợi ý chọn nhanh:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {SUGGESTED_BODY_TYPES.map((b) => {
                const isMatch = bodyType.trim().toLowerCase() === b.toLowerCase();
                return (
                  <button
                    key={b}
                    type="button"
                    onClick={() => onBodyTypeChange(b)}
                    className={`h-9 px-2.5 rounded-lg text-xs font-medium border text-center transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      isMatch
                        ? 'bg-secondary-container/50 text-secondary border-secondary font-semibold ring-1 ring-secondary shadow-xs'
                        : 'bg-surface border-surface-container-high text-on-surface hover:border-secondary/60 hover:bg-surface-container-low'
                    }`}
                  >
                    {isMatch && <span className="material-symbols-outlined text-[14px]">check</span>}
                    <span className="truncate">{b}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Hộp số truyền động */}
          <div className="space-y-2.5">
            <label className="block text-xs font-semibold text-primary">
              Hộp số truyền động <span className="text-error">*</span>
            </label>
            <input
              type="text"
              required
              value={transmission}
              onChange={(e) => onTransmissionChange(e.target.value)}
              placeholder="VD: Tự động (AT), Vô cấp (CVT), Ly hợp kép (DCT), Số sàn (MT)..."
              className={`w-full h-12 px-4 rounded-xl bg-surface text-primary text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary ${
                errors.transmission ? 'border-2 border-error' : 'border border-surface-container-high'
              }`}
            />
            {errors.transmission && <p className="text-xs text-error font-medium">{errors.transmission}</p>}

            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-semibold text-outline uppercase tracking-wider block">
                Gợi ý chọn nhanh:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {SUGGESTED_TRANSMISSIONS.map((t) => {
                  const isMatch = transmission.trim().toLowerCase() === t.toLowerCase();
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => onTransmissionChange(t)}
                      className={`h-9 px-2 rounded-lg text-xs font-medium border text-center transition-all flex items-center justify-center gap-1 cursor-pointer ${
                        isMatch
                          ? 'bg-secondary-container/50 text-secondary border-secondary font-semibold ring-1 ring-secondary shadow-xs'
                          : 'bg-surface border-surface-container-high text-on-surface hover:border-secondary/60 hover:bg-surface-container-low'
                      }`}
                    >
                      {isMatch && <span className="material-symbols-outlined text-[14px]">check</span>}
                      <span className="truncate">{t}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Hệ thống nhiên liệu & Động lực */}
          <div className="space-y-2.5">
            <label className="block text-xs font-semibold text-primary">
              Hệ thống nhiên liệu &amp; Động lực <span className="text-error">*</span>
            </label>
            <input
              type="text"
              required
              value={powertrain}
              onChange={(e) => onPowertrainChange(e.target.value)}
              placeholder="VD: Xăng tăng áp Turbo, Diesel, Hybrid tự sạc, Thuần điện EV..."
              className={`w-full h-12 px-4 rounded-xl bg-surface text-primary text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary ${
                errors.powertrain ? 'border-2 border-error' : 'border border-surface-container-high'
              }`}
            />
            {errors.powertrain && <p className="text-xs text-error font-medium">{errors.powertrain}</p>}

            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-semibold text-outline uppercase tracking-wider block">
                Gợi ý chọn nhanh:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {SUGGESTED_POWERTRAINS.map((p) => {
                  const isMatch = powertrain.trim().toLowerCase() === p.toLowerCase();
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => onPowertrainChange(p)}
                      className={`h-9 px-2 rounded-lg text-xs font-medium border text-center transition-all flex items-center justify-center gap-1 cursor-pointer ${
                        isMatch
                          ? 'bg-secondary-container/50 text-secondary border-secondary font-semibold ring-1 ring-secondary shadow-xs'
                          : 'bg-surface border-surface-container-high text-on-surface hover:border-secondary/60 hover:bg-surface-container-low'
                      }`}
                    >
                      {isMatch && <span className="material-symbols-outlined text-[14px]">check</span>}
                      <span className="truncate">{p}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Hệ dẫn động (Drivetrain) */}
          <div className="space-y-2.5">
            <label className="block text-xs font-semibold text-primary">
              Hệ dẫn động (Drivetrain)
            </label>
            <input
              type="text"
              value={drivetrain}
              onChange={(e) => onDrivetrainChange(e.target.value)}
              placeholder="VD: Cầu trước (FWD), Cầu sau (RWD), 4 bánh toàn thời gian (AWD)..."
              className="w-full h-12 px-4 rounded-xl bg-surface text-primary text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary border border-surface-container-high"
            />

            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-semibold text-outline uppercase tracking-wider block">
                Gợi ý chọn nhanh:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {SUGGESTED_DRIVETRAINS.map((dt) => {
                  const isMatch = drivetrain.trim().toLowerCase() === dt.toLowerCase();
                  return (
                    <button
                      key={dt}
                      type="button"
                      onClick={() => onDrivetrainChange(dt)}
                      className={`h-9 px-2 rounded-lg text-xs font-medium border text-center transition-all flex items-center justify-center gap-1 cursor-pointer ${
                        isMatch
                          ? 'bg-secondary-container/50 text-secondary border-secondary font-semibold ring-1 ring-secondary shadow-xs'
                          : 'bg-surface border-surface-container-high text-on-surface hover:border-secondary/60 hover:bg-surface-container-low'
                      }`}
                    >
                      {isMatch && <span className="material-symbols-outlined text-[14px]">check</span>}
                      <span className="truncate">{dt}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Dung tích động cơ */}
          <div className="space-y-2.5">
            <label className="block text-xs font-semibold text-primary">
              Dung tích động cơ xi-lanh
            </label>
            <input
              type="text"
              value={engineDisplacement}
              onChange={(e) => onEngineDisplacementChange(e.target.value)}
              placeholder="VD: 1.5L Turbo, 2.0L, 2.5L, 3.0L V6 hoặc Động cơ điện EV..."
              className="w-full h-12 px-4 rounded-xl bg-surface text-primary text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary border border-surface-container-high"
            />

            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-semibold text-outline uppercase tracking-wider block">
                Gợi ý chọn nhanh:
              </span>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {COMMON_ENGINE_DISPLACEMENTS.map((disp) => {
                  const isMatch = engineDisplacement.trim().toLowerCase() === disp.toLowerCase();
                  return (
                    <button
                      key={disp}
                      type="button"
                      onClick={() => onEngineDisplacementChange(disp)}
                      className={`h-9 px-1.5 rounded-lg text-xs font-medium border text-center transition-all flex items-center justify-center gap-0.5 cursor-pointer ${
                        isMatch
                          ? 'bg-secondary-container/50 text-secondary border-secondary font-semibold ring-1 ring-secondary shadow-xs'
                          : 'bg-surface border-surface-container-high text-on-surface hover:border-secondary/60 hover:bg-surface-container-low'
                      }`}
                    >
                      <span className="truncate">{disp}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cụm 3: Chỗ ngồi, Số cửa & Bảng màu */}
      <div className="space-y-6 pt-6 border-t border-surface-container-high/70">
        <div className="flex items-center gap-2 text-primary font-semibold text-sm font-display">
          <span className="material-symbols-outlined text-secondary text-[20px]">palette</span>
          <span>3. Quy cách Chỗ ngồi, Số cửa &amp; Màu sắc</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Số chỗ ngồi: INPUT TRÊN, GỢI Ý DƯỚI */}
          <div className="space-y-2.5">
            <label className="block text-xs font-semibold text-primary">
              Số chỗ ngồi <span className="text-error">*</span>
            </label>
            <div className="relative flex items-center">
              <input
                type="number"
                min={1}
                max={60}
                value={seats || ''}
                onChange={(e) => onSeatsChange(e.target.value ? parseInt(e.target.value, 10) : 0)}
                placeholder="Nhập hoặc chọn số chỗ bên dưới..."
                className="w-full h-12 pl-4 pr-16 rounded-xl bg-surface text-primary text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary border border-surface-container-high"
              />
              <span className="absolute right-4 text-xs font-semibold text-outline">chỗ ngồi</span>
            </div>

            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-semibold text-outline uppercase tracking-wider block">
                Gợi ý số chỗ phổ biến:
              </span>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {SUGGESTED_SEATS.map((s) => {
                  const isSelected = seats === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => onSeatsChange(s)}
                      className={`h-9 rounded-lg text-xs font-semibold border text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'border-secondary bg-secondary-container/50 text-secondary ring-1 ring-secondary'
                          : 'border-surface-container-high bg-surface text-on-surface hover:border-secondary/60 hover:bg-surface-container-low'
                      }`}
                    >
                      {s} chỗ
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Số cửa: INPUT TRÊN, GỢI Ý DƯỚI */}
          <div className="space-y-2.5">
            <label className="block text-xs font-semibold text-primary">
              Số cửa xe <span className="text-error">*</span>
            </label>
            <div className="relative flex items-center">
              <input
                type="number"
                min={1}
                max={10}
                value={doors || ''}
                onChange={(e) => onDoorsChange(e.target.value ? parseInt(e.target.value, 10) : 0)}
                placeholder="Nhập hoặc chọn số cửa bên dưới..."
                className="w-full h-12 pl-4 pr-16 rounded-xl bg-surface text-primary text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary border border-surface-container-high"
              />
              <span className="absolute right-4 text-xs font-semibold text-outline">cửa</span>
            </div>

            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-semibold text-outline uppercase tracking-wider block">
                Gợi ý số cửa phổ biến:
              </span>
              <div className="grid grid-cols-4 gap-2">
                {SUGGESTED_DOORS.map((d) => {
                  const isSelected = doors === d;
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => onDoorsChange(d)}
                      className={`h-9 rounded-lg text-xs font-semibold border text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'border-secondary bg-secondary-container/50 text-secondary ring-1 ring-secondary'
                          : 'border-surface-container-high bg-surface text-on-surface hover:border-secondary/60 hover:bg-surface-container-low'
                      }`}
                    >
                      {d} cửa
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Màu ngoại thất: INPUT TRÊN, BẢNG MÀU DƯỚI */}
        <div className="space-y-3 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="block text-xs font-semibold text-primary">
              Màu sơn ngoại thất xe <span className="text-error">*</span>
            </label>

            {brandName && (
              <div className="inline-flex p-0.5 bg-surface-container-low rounded-lg border border-surface-container-high text-xs font-semibold self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setColorMode('brand')}
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                    colorMode === 'brand'
                      ? 'bg-surface-container-lowest text-secondary shadow-xs font-bold'
                      : 'text-outline hover:text-primary'
                  }`}
                >
                  Theo hãng ({brandName})
                </button>
                <button
                  type="button"
                  onClick={() => setColorMode('universal')}
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                    colorMode === 'universal'
                      ? 'bg-surface-container-lowest text-secondary shadow-xs font-bold'
                      : 'text-outline hover:text-primary'
                  }`}
                >
                  Kinh điển phổ thông
                </button>
              </div>
            )}
          </div>

          <input
            type="text"
            required
            value={color}
            onChange={(e) => onColorChange(e.target.value)}
            placeholder="Tự gõ tên màu cụ thể hoặc click chọn ô màu gợi ý ngay bên dưới..."
            className={`w-full h-12 px-4 rounded-xl bg-surface text-primary text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary ${
              errors.color ? 'border-2 border-error' : 'border border-surface-container-high'
            }`}
          />
          {errors.color && <p className="text-xs text-error font-medium">{errors.color}</p>}

          {/* Bảng màu dạng lưới đều đặn 3 - 6 cột */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-semibold text-outline uppercase tracking-wider block">
              Bảng màu gợi ý chuẩn xác:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
              {displayedColors.map((c) => {
                const isMatch = color.trim().toLowerCase() === c.name.toLowerCase();
                return (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => onColorChange(c.name)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isMatch
                        ? 'border-secondary bg-secondary-container/40 ring-1 ring-secondary shadow-xs'
                        : 'border-surface-container-high bg-surface hover:border-secondary/60 hover:bg-surface-container-low'
                    }`}
                  >
                    <span
                      className="w-5 h-5 rounded-full shrink-0 shadow-xs flex items-center justify-center border border-black/10"
                      style={{ backgroundColor: c.hex }}
                    >
                      {isMatch && (
                        <span
                          className={`material-symbols-outlined text-[13px] font-bold ${
                            c.hex === '#FFFFFF' || c.hex === '#F8F9FA' || c.hex === '#FAFAFA' || c.hex === '#F8FAFC'
                              ? 'text-primary'
                              : 'text-white'
                          }`}
                        >
                          check
                        </span>
                      )}
                    </span>
                    <span className="text-xs font-medium text-primary truncate leading-tight">
                      {c.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Màu nội thất: INPUT TRÊN, GỢI Ý DƯỚI */}
        <div className="space-y-3 pt-2">
          <label className="block text-xs font-semibold text-primary">
            Màu da nội thất khoang lái
          </label>
          <input
            type="text"
            value={interiorColor}
            onChange={(e) => onInteriorColorChange(e.target.value)}
            placeholder="Tự gõ tên màu nội thất hoặc chọn bảng màu da bên dưới..."
            className="w-full h-12 px-4 rounded-xl bg-surface text-primary text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary border border-surface-container-high"
          />

          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-semibold text-outline uppercase tracking-wider block">
              Gợi ý màu nội thất da cao cấp:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
              {POPULAR_INTERIOR_COLORS.map((ic) => {
                const isMatch = interiorColor.trim().toLowerCase() === ic.name.toLowerCase();
                return (
                  <button
                    key={ic.name}
                    type="button"
                    onClick={() => onInteriorColorChange(ic.name)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isMatch
                        ? 'border-secondary bg-secondary-container/40 ring-1 ring-secondary shadow-xs'
                        : 'border-surface-container-high bg-surface hover:border-secondary/60 hover:bg-surface-container-low'
                    }`}
                  >
                    <span
                      className="w-5 h-5 rounded-full shrink-0 shadow-xs border border-black/10"
                      style={{ backgroundColor: ic.hex }}
                    />
                    <span className="text-xs font-medium text-primary truncate leading-tight">
                      {ic.name}
                    </span>
                    {isMatch && <span className="material-symbols-outlined text-[14px] text-secondary ml-auto">check</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Cụm 4: Lịch sử xe */}
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
              onChange={(e) => onVehicleHistoryChange({ accidentStatus: e.target.value as VehicleHistoryState['accidentStatus'] })}
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
              onChange={(e) => onVehicleHistoryChange({ floodStatus: e.target.value as VehicleHistoryState['floodStatus'] })}
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
              onChange={(e) => onVehicleHistoryChange({ serviceHistory: e.target.value as VehicleHistoryState['serviceHistory'] })}
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
              onChange={(e) => onVehicleHistoryChange({ repaintedPartsCount: Number(e.target.value) || 0 })}
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
