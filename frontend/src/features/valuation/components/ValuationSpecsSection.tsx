'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { SuggestiveInput } from './SuggestiveInput';
import {
  ALL_WORLD_CAR_BRANDS,
  ALL_YEARS,
  TRIM_SUGGESTIONS,
} from '../constants/carCatalog';
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
  UNIVERSAL_CAR_COLORS,
  POPULAR_INTERIOR_COLORS,
} from '@/features/car-listing/constants';

interface ValuationSpecsSectionProps {
  // 1. Identity
  brand: string;
  setBrand: (val: string) => void;
  model: string;
  setModel: (val: string) => void;
  variant: string;
  setVariant: (val: string) => void;
  year: string;
  setYear: (val: string) => void;
  odometerKm: string;
  setOdometerKm: (val: string) => void;
  modelSuggestions: string[];
  odoSuggestions: string[];
  aiScanSuccess: string | null;
  // 2. Technical specs
  bodyType: string;
  setBodyType: (val: string) => void;
  transmission: string;
  setTransmission: (val: string) => void;
  powertrain: string;
  setPowertrain: (val: string) => void;
  drivetrain: string;
  setDrivetrain: (val: string) => void;
  engineDisplacement: string;
  setEngineDisplacement: (val: string) => void;
  seats: string;
  setSeats: (val: string) => void;
  doors: string;
  setDoors: (val: string) => void;
  // 3. Condition & Colors
  condition: string;
  setCondition: (val: string) => void;
  origin: string;
  setOrigin: (val: string) => void;
  color: string;
  setColor: (val: string) => void;
  interiorColor: string;
  setInteriorColor: (val: string) => void;
}

export const ValuationSpecsSection: React.FC<ValuationSpecsSectionProps> = ({
  brand,
  setBrand,
  model,
  setModel,
  variant,
  setVariant,
  year,
  setYear,
  odometerKm,
  setOdometerKm,
  modelSuggestions,
  odoSuggestions,
  aiScanSuccess,
  bodyType,
  setBodyType,
  transmission,
  setTransmission,
  powertrain,
  setPowertrain,
  drivetrain,
  setDrivetrain,
  engineDisplacement,
  setEngineDisplacement,
  seats,
  setSeats,
  doors,
  setDoors,
  condition,
  setCondition,
  origin,
  setOrigin,
  color,
  setColor,
  interiorColor,
  setInteriorColor,
}) => {
  return (
    <>
      {/* 1. ĐỊNH DANH HÃNG XE, DÒNG XE, PHIÊN BẢN & NĂM SẢN XUẤT */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#f0eee9] pb-3">
          <div className="flex items-center gap-2 text-[#1a1c1a] font-bold text-xs uppercase tracking-wider font-display">
            <span className="material-symbols-outlined text-[#b89b72] text-[20px]">
              directions_car
            </span>
            <span>1. Định danh hãng xe, Dòng xe &amp; Năm sản xuất</span>
          </div>
          {aiScanSuccess && (
            <span className="px-2.5 py-0.5 rounded-full bg-secondary-container/50 border border-secondary/30 text-on-secondary-container text-[11px] font-semibold flex items-center gap-1">
              <Check className="w-3 h-3 text-secondary" />
              <span>Đã nhận diện từ ảnh</span>
            </span>
          )}
        </div>

        {/* Row 1: Brand & Model */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <SuggestiveInput
            label="Hãng xe (Thương hiệu)"
            required
            value={brand}
            onChange={setBrand}
            placeholder="Nhập tên hãng xe (VD: Toyota, Mazda, Mercedes-Benz, BMW, VinFast...)"
            suggestions={ALL_WORLD_CAR_BRANDS}
            maxSuggestions={15}
          />

          <SuggestiveInput
            label="Dòng xe (Model)"
            required
            value={model}
            onChange={setModel}
            placeholder="Nhập tên dòng xe (VD: Vios, CX-5, Camry, VF 8, C200...)"
            suggestions={modelSuggestions}
            maxSuggestions={15}
          />
        </div>

        {/* Row 2: Trim & Year */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <SuggestiveInput
            label="Phiên bản (Trim / Phiên bản máy)"
            value={variant}
            onChange={setVariant}
            placeholder="Nhập phiên bản (VD: 1.5G, 2.0 Premium, C200 Exclusive...)"
            suggestions={TRIM_SUGGESTIONS}
            maxSuggestions={8}
          />

          <SuggestiveInput
            label="Năm sản xuất (Đời xe)"
            required
            value={year}
            onChange={setYear}
            placeholder="Nhập năm sản xuất (VD: 2023, 2022, 2021...)"
            suggestions={ALL_YEARS}
            maxSuggestions={10}
          />
        </div>

        {/* Row 3: Odometer (ODO) */}
        <SuggestiveInput
          label="Số km đã lăn bánh thực tế (ODO)"
          required
          value={odometerKm}
          onChange={setOdometerKm}
          placeholder="Nhập số km ODO (VD: 45000, 30000...)"
          suffix="KM"
          suggestions={odoSuggestions}
          maxSuggestions={6}
        />
      </div>

      {/* 2. KIỂU DÁNG & HỆ THỐNG VẬN HÀNH */}
      <div className="space-y-4 pt-1">
        <div className="flex items-center gap-2 border-b border-[#f0eee9] pb-3 text-[#1a1c1a] font-bold text-xs uppercase tracking-wider font-display">
          <span className="material-symbols-outlined text-[#b89b72] text-[20px]">speed</span>
          <span>2. Kiểu dáng &amp; Hệ thống vận hành</span>
        </div>

        {/* 4 columns: Body, Transmission, Powertrain, Drivetrain */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <SuggestiveInput
            label="Kiểu dáng thân xe"
            value={bodyType}
            onChange={setBodyType}
            placeholder="VD: Sedan, SUV, Hatchback..."
            suggestions={SUGGESTED_BODY_TYPES}
            maxSuggestions={8}
          />

          <SuggestiveInput
            label="Hộp số truyền động"
            value={transmission}
            onChange={setTransmission}
            placeholder="VD: Tự động (AT), Số sàn (MT)..."
            suggestions={SUGGESTED_TRANSMISSIONS}
            maxSuggestions={6}
          />

          <SuggestiveInput
            label="Nhiên liệu / Động lực"
            value={powertrain}
            onChange={setPowertrain}
            placeholder="VD: Xăng tăng áp, Diesel, EV..."
            suggestions={SUGGESTED_POWERTRAINS}
            maxSuggestions={8}
          />

          <SuggestiveInput
            label="Hệ dẫn động (Drivetrain)"
            value={drivetrain}
            onChange={setDrivetrain}
            placeholder="VD: Cầu trước (FWD), AWD..."
            suggestions={SUGGESTED_DRIVETRAINS}
            maxSuggestions={6}
          />
        </div>

        {/* 3 columns: Engine Displacement, Seats, Doors */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <SuggestiveInput
            label="Dung tích động cơ xi-lanh"
            value={engineDisplacement}
            onChange={setEngineDisplacement}
            placeholder="VD: 1.5, 2.0, 2.5L..."
            suggestions={COMMON_ENGINE_DISPLACEMENTS}
            maxSuggestions={10}
          />

          <SuggestiveInput
            label="Số chỗ ngồi"
            value={seats}
            onChange={setSeats}
            placeholder="VD: 5, 7, 4 chỗ..."
            suggestions={SUGGESTED_SEATS.map((s) => `${s} chỗ`)}
            maxSuggestions={8}
          />

          <SuggestiveInput
            label="Số cửa xe"
            value={doors}
            onChange={setDoors}
            placeholder="VD: 4, 5, 2 cửa..."
            suggestions={SUGGESTED_DOORS.map((d) => `${d} cửa`)}
            maxSuggestions={6}
          />
        </div>
      </div>

      {/* 3. TÌNH TRẠNG SỬ DỤNG, XUẤT XỨ & MÀU SẮC */}
      <div className="space-y-4 pt-1">
        <div className="flex items-center gap-2 border-b border-[#f0eee9] pb-3 text-[#1a1c1a] font-bold text-xs uppercase tracking-wider font-display">
          <span className="material-symbols-outlined text-[#b89b72] text-[20px]">palette</span>
          <span>3. Tình trạng sử dụng, Xuất xứ &amp; Màu sắc</span>
        </div>

        {/* 2 columns: Condition & Origin */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <SuggestiveInput
            label="Tình trạng sử dụng xe"
            value={condition}
            onChange={setCondition}
            placeholder="Nhập hoặc chọn tình trạng (VD: Xe lướt, Đã qua sử dụng...)"
            suggestions={SUGGESTED_CONDITIONS}
            maxSuggestions={6}
          />

          <SuggestiveInput
            label="Nguồn gốc xuất xứ"
            value={origin}
            onChange={setOrigin}
            placeholder="Nhập nguồn gốc (VD: Lắp ráp CKD, Nhập CBU...)"
            suggestions={SUGGESTED_ORIGINS}
            maxSuggestions={8}
          />
        </div>

        {/* 2 columns: Exterior Color & Interior Color */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div className="space-y-2">
            <SuggestiveInput
              label="Màu sơn ngoại thất xe"
              value={color}
              onChange={setColor}
              placeholder="Tự gõ tên màu (VD: Trắng ngọc trai, Đen, Xám...)"
              suggestions={UNIVERSAL_CAR_COLORS.map((c) => c.name)}
              maxSuggestions={8}
            />
            {/* Visual Swatches Palette */}
            <div className="grid grid-cols-5 gap-2 pt-1">
              {UNIVERSAL_CAR_COLORS.map((c) => {
                const isSelected = color.trim().toLowerCase() === c.name.toLowerCase();
                return (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setColor(c.name)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#b89b72] bg-[#b89b72]/10 ring-1 ring-[#b89b72] font-bold text-[#1a1c1a]'
                        : 'border-[#eae8e3] bg-white text-[#666] hover:border-[#b89b72]/50 hover:bg-[#faf9f6]'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-full shrink-0 shadow-xs ${
                        c.border ? 'border border-black/20' : ''
                      }`}
                      style={{ backgroundColor: c.hex }}
                    />
                    <span className="text-[10px] truncate max-w-full">{c.name.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <SuggestiveInput
              label="Màu da nội thất khoang lái"
              value={interiorColor}
              onChange={setInteriorColor}
              placeholder="Tự gõ màu da (VD: Đen da Nappa, Nâu bò...)"
              suggestions={POPULAR_INTERIOR_COLORS.map((ic) => ic.name)}
              maxSuggestions={8}
            />
            {/* Visual Leather Swatches */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              {POPULAR_INTERIOR_COLORS.map((ic) => {
                const isSelected = interiorColor.trim().toLowerCase() === ic.name.toLowerCase();
                return (
                  <button
                    key={ic.name}
                    type="button"
                    onClick={() => setInteriorColor(ic.name)}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#b89b72] bg-[#b89b72]/10 ring-1 ring-[#b89b72] font-bold text-[#1a1c1a]'
                        : 'border-[#eae8e3] bg-white text-[#666] hover:border-[#b89b72]/50 hover:bg-[#faf9f6]'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-full shrink-0 shadow-xs ${
                        ic.border ? 'border border-black/20' : ''
                      }`}
                      style={{ backgroundColor: ic.hex }}
                    />
                    <span className="text-[11px] truncate">{ic.name.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
