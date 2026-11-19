'use client';

import React from 'react';
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
} from '../../constants';

interface CarSpecsSelectorGroupProps {
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
  errors: Record<string, string>;
}

export function CarSpecsSelectorGroup({
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
  errors,
}: CarSpecsSelectorGroupProps) {
  return (
    <>
      {/* Cụm 1: Tình trạng & Xuất xứ xe */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-primary font-semibold text-sm font-display">
          <span className="material-symbols-outlined text-secondary text-[20px]">verified</span>
          <span>1. Tình trạng sử dụng &amp; Xuất xứ</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tình trạng xe */}
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

          {/* Xuất xứ */}
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

        {/* Kiểu dáng thân xe */}
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
          {/* Hộp số */}
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

          {/* Nhiên liệu & Động lực */}
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
        </div>

        {/* Dung tích & Dẫn động */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2.5">
            <label className="block text-xs font-semibold text-primary">
              Dung tích động cơ (Lít)
            </label>
            <input
              type="text"
              value={engineDisplacement}
              onChange={(e) => onEngineDisplacementChange(e.target.value)}
              placeholder="VD: 1.5L, 2.0L Turbo, 2.5L, 3.0L..."
              className="w-full h-12 px-4 rounded-xl bg-surface text-primary text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary border border-surface-container-high"
            />
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-semibold text-outline uppercase tracking-wider block">
                Gợi ý phổ biến:
              </span>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {COMMON_ENGINE_DISPLACEMENTS.map((ed) => {
                  const isMatch = engineDisplacement.trim().toLowerCase() === ed.toLowerCase();
                  return (
                    <button
                      key={ed}
                      type="button"
                      onClick={() => onEngineDisplacementChange(ed)}
                      className={`h-8 px-2 rounded-lg text-xs font-medium border text-center transition-all cursor-pointer ${
                        isMatch
                          ? 'bg-secondary-container/50 text-secondary border-secondary font-semibold ring-1 ring-secondary'
                          : 'bg-surface border-surface-container-high text-on-surface hover:bg-surface-container-low'
                      }`}
                    >
                      {ed}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            <label className="block text-xs font-semibold text-primary">
              Hệ thống dẫn động
            </label>
            <input
              type="text"
              value={drivetrain}
              onChange={(e) => onDrivetrainChange(e.target.value)}
              placeholder="VD: Cầu trước (FWD), Cầu sau (RWD), Bốn bánh toàn thời gian (AWD/4WD)..."
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
                      className={`h-8 px-1.5 rounded-lg text-xs font-medium border text-center transition-all truncate cursor-pointer ${
                        isMatch
                          ? 'bg-secondary-container/50 text-secondary border-secondary font-semibold ring-1 ring-secondary'
                          : 'bg-surface border-surface-container-high text-on-surface hover:bg-surface-container-low'
                      }`}
                    >
                      {dt}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Số chỗ & Số cửa */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2.5">
            <label className="block text-xs font-semibold text-primary">
              Số chỗ ngồi <span className="text-error">*</span>
            </label>
            <input
              type="number"
              min="2"
              max="16"
              value={seats || ''}
              onChange={(e) => onSeatsChange(Number(e.target.value))}
              placeholder="Nhập số chỗ ngồi (VD: 5 chỗ)"
              className="w-full h-12 px-4 rounded-xl bg-surface text-primary text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary border border-surface-container-high"
            />
            <div className="flex gap-2 pt-1">
              {SUGGESTED_SEATS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => onSeatsChange(s)}
                  className={`flex-1 h-8 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                    seats === s
                      ? 'bg-secondary-container/50 text-secondary border-secondary font-semibold ring-1 ring-secondary'
                      : 'bg-surface border-surface-container-high text-on-surface hover:bg-surface-container-low'
                  }`}
                >
                  {s} chỗ
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2.5">
            <label className="block text-xs font-semibold text-primary">
              Số cửa xe <span className="text-error">*</span>
            </label>
            <input
              type="number"
              min="2"
              max="6"
              value={doors || ''}
              onChange={(e) => onDoorsChange(Number(e.target.value))}
              placeholder="Nhập số cửa (VD: 4 cửa, 5 cửa)"
              className="w-full h-12 px-4 rounded-xl bg-surface text-primary text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary border border-surface-container-high"
            />
            <div className="flex gap-2 pt-1">
              {SUGGESTED_DOORS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => onDoorsChange(d)}
                  className={`flex-1 h-8 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                    doors === d
                      ? 'bg-secondary-container/50 text-secondary border-secondary font-semibold ring-1 ring-secondary'
                      : 'bg-surface border-surface-container-high text-on-surface hover:bg-surface-container-low'
                  }`}
                >
                  {d} cửa
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

