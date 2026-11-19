'use client';

import React from 'react';
import { BrandItem, ModelItem } from '../../types';
import {
  SUGGESTED_BODY_TYPES,
  TRANSMISSION_OPTIONS,
  POWERTRAIN_OPTIONS,
} from '../../constants';

interface EditSpecsTabProps {
  title: string;
  setTitle: (title: string) => void;
  brandId: string;
  onBrandChange: (brandId: string) => void;
  modelId: string;
  setModelId: (modelId: string) => void;
  brands: BrandItem[];
  models: ModelItem[];
  manufactureYear: number;
  setManufactureYear: (year: number) => void;
  bodyType: string;
  setBodyType: (bt: string) => void;
  odometerKm: string;
  setOdometerKm: (km: string) => void;
  fuelType: string;
  setFuelType: (fuel: string) => void;
  transmission: string;
  setTransmission: (trans: string) => void;
  origin: string;
  setOrigin: (origin: string) => void;
  color: string;
  setColor: (color: string) => void;
  interiorColor: string;
  setInteriorColor: (color: string) => void;
  seats: number;
  setSeats: (seats: number) => void;
  doors: number;
  setDoors: (doors: number) => void;
  licensePlate: string;
  setLicensePlate: (plate: string) => void;
  vin: string;
  setVin: (vin: string) => void;
}

export function EditSpecsTab({
  title,
  setTitle,
  brandId,
  onBrandChange,
  modelId,
  setModelId,
  brands,
  models,
  manufactureYear,
  setManufactureYear,
  bodyType,
  setBodyType,
  odometerKm,
  setOdometerKm,
  fuelType,
  setFuelType,
  transmission,
  setTransmission,
  origin,
  setOrigin,
  color,
  setColor,
  interiorColor,
  setInteriorColor,
  seats,
  setSeats,
  doors,
  setDoors,
  licensePlate,
  setLicensePlate,
  vin,
  setVin,
}: EditSpecsTabProps) {
  return (
    <div className="space-y-4">
      {/* Title */}
      <div>
        <label className="block text-xs font-bold text-primary mb-1">
          Tiêu đề tin đăng <span className="text-error">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="VD: Mercedes-Benz C200 Exclusive 2021 siêu lướt"
          className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-surface-container-high text-xs text-primary focus:border-secondary focus:ring-1 focus:ring-secondary outline-none font-medium"
          required
        />
      </div>

      {/* Brand & Model */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-primary mb-1">Hãng sản xuất</label>
          <select
            value={brandId}
            onChange={(e) => onBrandChange(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-surface-container-low border border-surface-container-high text-xs text-primary focus:border-secondary outline-none"
          >
            <option value="">-- Chọn thương hiệu --</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-primary mb-1">Dòng xe (Model)</label>
          <select
            value={modelId}
            onChange={(e) => setModelId(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-surface-container-low border border-surface-container-high text-xs text-primary focus:border-secondary outline-none"
          >
            <option value="">-- Chọn dòng xe --</option>
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Year & Body Type & Odometer */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-bold text-primary mb-1">Năm sản xuất</label>
          <input
            type="number"
            min="1990"
            max="2027"
            value={manufactureYear}
            onChange={(e) => setManufactureYear(parseInt(e.target.value, 10) || 2020)}
            className="w-full px-3 py-2.5 rounded-xl bg-surface-container-low border border-surface-container-high text-xs text-primary focus:border-secondary outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-primary mb-1">Kiểu dáng thân xe</label>
          <select
            value={bodyType}
            onChange={(e) => setBodyType(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-surface-container-low border border-surface-container-high text-xs text-primary focus:border-secondary outline-none"
          >
            {SUGGESTED_BODY_TYPES.map((bt) => (
              <option key={bt} value={bt}>
                {bt}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-primary mb-1">Số km đã đi (ODO)</label>
          <div className="relative">
            <input
              type="text"
              value={Number(odometerKm.replace(/\D/g, '')).toLocaleString('vi-VN')}
              onChange={(e) => setOdometerKm(e.target.value.replace(/\D/g, ''))}
              className="w-full pl-3 pr-8 py-2.5 rounded-xl bg-surface-container-low border border-surface-container-high text-xs text-primary focus:border-secondary outline-none font-semibold"
            />
            <span className="absolute right-3 top-2.5 text-[11px] text-outline">km</span>
          </div>
        </div>
      </div>

      {/* Fuel & Transmission & Origin */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-bold text-primary mb-1">Nhiên liệu</label>
          <select
            value={fuelType}
            onChange={(e) => setFuelType(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-surface-container-low border border-surface-container-high text-xs text-primary focus:border-secondary outline-none"
          >
            {POWERTRAIN_OPTIONS.map((p) => (
              <option key={p.dbValue} value={p.dbValue}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-primary mb-1">Hộp số</label>
          <select
            value={transmission}
            onChange={(e) => setTransmission(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-surface-container-low border border-surface-container-high text-xs text-primary focus:border-secondary outline-none"
          >
            {TRANSMISSION_OPTIONS.map((t) => (
              <option key={t.id} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-primary mb-1">Xuất xứ</label>
          <select
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-surface-container-low border border-surface-container-high text-xs text-primary focus:border-secondary outline-none"
          >
            <option value="Lắp ráp trong nước">Lắp ráp trong nước (CKD)</option>
            <option value="Nhập khẩu nguyên chiếc">Nhập khẩu nguyên chiếc (CBU)</option>
          </select>
        </div>
      </div>

      {/* Colors & Seats & Doors */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs font-bold text-primary mb-1">Màu ngoại thất</label>
          <input
            type="text"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-surface-container-low border border-surface-container-high text-xs text-primary focus:border-secondary outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-primary mb-1">Màu nội thất</label>
          <input
            type="text"
            value={interiorColor}
            onChange={(e) => setInteriorColor(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-surface-container-low border border-surface-container-high text-xs text-primary focus:border-secondary outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-primary mb-1">Số chỗ ngồi</label>
          <input
            type="number"
            min="2"
            max="16"
            value={seats}
            onChange={(e) => setSeats(parseInt(e.target.value, 10) || 5)}
            className="w-full px-3 py-2.5 rounded-xl bg-surface-container-low border border-surface-container-high text-xs text-primary focus:border-secondary outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-primary mb-1">Số cửa</label>
          <input
            type="number"
            min="2"
            max="6"
            value={doors}
            onChange={(e) => setDoors(parseInt(e.target.value, 10) || 4)}
            className="w-full px-3 py-2.5 rounded-xl bg-surface-container-low border border-surface-container-high text-xs text-primary focus:border-secondary outline-none"
          />
        </div>
      </div>

      {/* License Plate & VIN */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-primary mb-1">Biển số xe (Tùy chọn)</label>
          <input
            type="text"
            value={licensePlate}
            onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
            placeholder="VD: 30H-888.88"
            className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-surface-container-high text-xs text-primary uppercase font-mono focus:border-secondary outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-primary mb-1">Số khung / VIN (Tùy chọn)</label>
          <input
            type="text"
            value={vin}
            onChange={(e) => setVin(e.target.value.toUpperCase())}
            placeholder="VD: WBA3A5C5..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-surface-container-high text-xs text-primary uppercase font-mono focus:border-secondary outline-none"
          />
        </div>
      </div>
    </div>
  );
}

