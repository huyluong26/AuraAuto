'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { BrandItem, ModelItem, Coordinates } from '../types';
import { CarRecognitionResponse } from '@/types';
import {
  LOCATION_GROUPS,
  PROVINCE_COORDINATES,
  detectProvinceFromText,
  COMMON_DISTRICTS_BY_PROVINCE,
} from '../constants';
import { MiniLocationMap } from './MiniLocationMap';
import { CarAiRecognitionBanner } from './CarAiRecognitionBanner';

interface Step1BasicInfoProps {
  sellerType: 'INDIVIDUAL' | 'SHOWROOM';
  onSellerTypeChange: (type: 'INDIVIDUAL' | 'SHOWROOM') => void;
  showroomName: string;
  onShowroomNameChange: (val: string) => void;
  showroomPhone: string;
  onShowroomPhoneChange: (val: string) => void;
  brands: BrandItem[];
  models: ModelItem[];
  brandId: string;
  brandName: string;
  onBrandSelect: (id: string, name: string) => void;
  onCustomBrandInput: (name: string) => void;
  modelId: string;
  modelName: string;
  onModelSelect: (id: string, name: string) => void;
  onCustomModelInput: (name: string) => void;
  onApplyCarRecognition?: (data: CarRecognitionResponse, file: File) => void;
  trim: string;
  onTrimChange: (val: string) => void;
  manufactureYear: number;
  onYearChange: (val: number) => void;
  odometerKm: string;
  onOdometerChange: (val: string) => void;
  provinceCode: string;
  onProvinceChange: (val: string) => void;
  locationAddress: string;
  onAddressChange: (val: string) => void;
  coordinates: Coordinates;
  onCoordinatesChange: (coords: Coordinates) => void;
  errors: Record<string, string>;
  onNext: () => void;
}

export function Step1BasicInfo({
  sellerType,
  onSellerTypeChange,
  showroomName,
  onShowroomNameChange,
  showroomPhone,
  onShowroomPhoneChange,
  brands,
  models,
  brandId,
  brandName,
  onBrandSelect,
  onCustomBrandInput,
  modelId,
  modelName,
  onModelSelect,
  onCustomModelInput,
  onApplyCarRecognition,
  trim,
  onTrimChange,
  manufactureYear,
  onYearChange,
  odometerKm,
  onOdometerChange,
  provinceCode,
  onProvinceChange,
  locationAddress,
  onAddressChange,
  coordinates,
  onCoordinatesChange,
  errors,
  onNext,
}: Step1BasicInfoProps) {
  // Brand Combobox State
  const [brandSearch, setBrandSearch] = useState(brandName);
  const [isBrandDropdownOpen, setIsBrandDropdownOpen] = useState(false);
  const brandDropdownRef = useRef<HTMLDivElement>(null);

  // Model Combobox State
  const [modelSearch, setModelSearch] = useState(modelName);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const modelDropdownRef = useRef<HTMLDivElement>(null);

  // Address Geocoding state
  const [searchingAddress, setSearchingAddress] = useState(false);

  // Keep search inputs synced with external state
  useEffect(() => {
    setBrandSearch(brandName);
  }, [brandName]);

  useEffect(() => {
    setModelSearch(modelName);
  }, [modelName]);

  // Click outside to close dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (brandDropdownRef.current && !brandDropdownRef.current.contains(event.target as Node)) {
        setIsBrandDropdownOpen(false);
      }
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target as Node)) {
        setIsModelDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filtered Brands
  const filteredBrands = brands.filter((b) =>
    b.name.toLowerCase().includes(brandSearch.trim().toLowerCase())
  );

  // Filtered Models
  const filteredModels = models.filter((m) =>
    m.name.toLowerCase().includes(modelSearch.trim().toLowerCase())
  );

  // Handle ODO Input: Strictly numbers only, automatically formatted
  const handleOdoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numbersOnly = e.target.value.replace(/\D/g, '');
    if (!numbersOnly) {
      onOdometerChange('');
      return;
    }
    const parsed = parseInt(numbersOnly, 10);
    onOdometerChange(parsed.toLocaleString('vi-VN'));
  };

  // Year options
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 32 }, (_, i) => currentYear + 1 - i);

  // Current selected province metadata
  const currentProvince = PROVINCE_COORDINATES[provinceCode];
  const commonDistricts = provinceCode ? COMMON_DISTRICTS_BY_PROVINCE[provinceCode] || [] : [];

  // When user selects province from dropdown, update province and center coordinates
  const handleProvinceSelect = (code: string) => {
    onProvinceChange(code);
    if (PROVINCE_COORDINATES[code]) {
      onCoordinatesChange({
        lat: PROVINCE_COORDINATES[code].lat,
        lng: PROVINCE_COORDINATES[code].lng,
      });
    }
  };

  // Quick pick district: cleanly formats and appends to address
  const handleSelectDistrict = (districtName: string) => {
    const provName = currentProvince?.name || '';
    if (!locationAddress.trim()) {
      onAddressChange(`${districtName}, ${provName}`.trim());
    } else if (!locationAddress.toLowerCase().includes(districtName.toLowerCase())) {
      // Append district cleanly if not present
      onAddressChange(`${locationAddress.trim()}, ${districtName}`);
    }
  };

  // Forward Geocode function (address text -> coordinates & province)
  const geocodeAddressText = useCallback(
    async (text: string) => {
      if (!text || text.trim().length < 4) return;
      setSearchingAddress(true);
      try {
        const provName = currentProvince?.name || '';
        const query = `${text.trim()}${provName && !text.includes(provName) ? `, ${provName}` : ''}, Việt Nam`;
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            query
          )}&limit=1&accept-language=vi`
        );
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            const lat = parseFloat(data[0].lat);
            const lng = parseFloat(data[0].lon);
            if (!isNaN(lat) && !isNaN(lng)) {
              onCoordinatesChange({ lat, lng });

              // Chỉ tự cập nhật tỉnh nếu người dùng chưa chọn tỉnh từ trước
              if (!provinceCode) {
                const detected = detectProvinceFromText(data[0].display_name);
                if (detected) {
                  onProvinceChange(detected);
                }
              }
            }
          }
        }
      } catch (err) {
        console.warn('Geocoding error:', err);
      } finally {
        setSearchingAddress(false);
      }
    },
    [onCoordinatesChange, onProvinceChange, provinceCode, currentProvince]
  );

  // Handle typing in Address input:
  // Không ghi đè provinceCode tự động khi người dùng đã chủ động chọn tỉnh!
  const handleAddressInputChange = (val: string) => {
    onAddressChange(val);

    // Chỉ tự động suy đoán tỉnh nếu người dùng chưa chọn tỉnh nào
    if (!provinceCode) {
      const detectedProv = detectProvinceFromText(val);
      if (detectedProv) {
        onProvinceChange(detectedProv);
      }
    }
  };

  return (
    <section className="bg-surface-container-lowest p-6 sm:p-8 lg:p-10 rounded-2xl shadow-sm border border-surface-container-high/60 space-y-8 animate-in fade-in duration-200">
      {/* Step Header */}
      <div className="flex items-center justify-between border-b border-surface-container-high/70 pb-5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-secondary-container/40 text-secondary font-label-sm text-xs uppercase tracking-wider font-semibold">
            <span>Bước 01 / 05</span>
          </div>
          <h2 className="font-headline-md text-xl sm:text-2xl text-primary font-bold tracking-tight">
            Thông tin xuất xưởng &amp; Vị trí xem xe
          </h2>
          <p className="font-body-sm text-xs sm:text-sm text-on-surface-variant">
            Điền các thông số cơ bản về dòng xe và địa chỉ xem xe thực tế để người mua dễ dàng liên hệ.
          </p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-surface-container-low border border-surface-container-high flex items-center justify-center text-secondary shrink-0">
          <span className="material-symbols-outlined text-[28px]">directions_car</span>
        </div>
      </div>

      {/* Thông tin tư cách người đăng (Tự động nhận diện từ tài khoản người dùng) */}
      {sellerType === 'SHOWROOM' && (
        <div className="p-4 rounded-2xl bg-secondary-container/20 border border-secondary/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary-container text-secondary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]">storefront</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-secondary uppercase tracking-wider">
                  Tài khoản Doanh nghiệp / Showroom
                </span>
                <span className="px-2 py-0.5 rounded-full bg-secondary text-on-secondary text-[10px] font-bold">
                  Đã xác thực
                </span>
              </div>
              <p className="text-sm font-bold text-primary mt-0.5">
                {showroomName || 'Salon / Đối tác ủy quyền'}
                {showroomPhone ? ` • Hotline: ${showroomPhone}` : ''}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* AI Vision Auto-Fill Image Recognition Banner */}
      {onApplyCarRecognition && (
        <CarAiRecognitionBanner onApplyRecognition={onApplyCarRecognition} />
      )}

      {/* Grid Inputs - Cụm thông số định danh xe */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-primary font-semibold text-sm font-display pb-1">
          <span className="material-symbols-outlined text-secondary text-[20px]">badge</span>
          <span>1. Nhận diện thương hiệu &amp; Dòng xe</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Thương hiệu xe */}
          <div className="space-y-2 relative" ref={brandDropdownRef}>
            <label className="block text-xs font-semibold text-primary">
              Thương hiệu xe <span className="text-error">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={brandSearch}
                onChange={(e) => {
                  setBrandSearch(e.target.value);
                  onCustomBrandInput(e.target.value);
                  setIsBrandDropdownOpen(true);
                }}
                onFocus={() => setIsBrandDropdownOpen(true)}
                placeholder="VD: Mercedes-Benz, BMW, Toyota, Porsche..."
                className={`w-full h-12 pl-4 pr-10 rounded-xl bg-surface text-primary text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary transition-all ${
                  errors.brand ? 'border-2 border-error' : 'border border-surface-container-high'
                }`}
              />
              <button
                type="button"
                aria-label="Chọn thương hiệu xe"
                onClick={() => setIsBrandDropdownOpen(!isBrandDropdownOpen)}
                className="absolute right-3 top-3 text-outline hover:text-primary transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[22px]">arrow_drop_down</span>
              </button>
            </div>
            {errors.brand && <p className="text-xs text-error font-medium">{errors.brand}</p>}

            {/* Combobox Dropdown Menu */}
            {isBrandDropdownOpen && (
              <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-xl bg-surface-container-lowest border border-surface-container-high shadow-xl py-1">
                {filteredBrands.length > 0 ? (
                  filteredBrands.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => {
                        onBrandSelect(b.id, b.name);
                        setBrandSearch(b.name);
                        setIsBrandDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-2.5 text-left text-xs sm:text-sm flex items-center justify-between hover:bg-surface-container-low transition-colors cursor-pointer ${
                        brandId === b.id ? 'bg-secondary-container/30 font-semibold text-secondary' : 'text-primary'
                      }`}
                    >
                      <span>{b.name}</span>
                      {brandId === b.id && (
                        <span className="material-symbols-outlined text-[18px] text-secondary">check</span>
                      )}
                    </button>
                  ))
                ) : null}

                {brandSearch.trim() && !brands.some((b) => b.name.toLowerCase() === brandSearch.trim().toLowerCase()) && (
                  <button
                    type="button"
                    onClick={() => {
                      onCustomBrandInput(brandSearch.trim());
                      setIsBrandDropdownOpen(false);
                    }}
                    className="w-full px-4 py-3 text-left text-xs sm:text-sm text-secondary font-medium hover:bg-secondary-container/30 border-t border-surface-container-high flex items-center gap-2 bg-surface-container-low/50 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">add_circle</span>
                    <span>Sử dụng hãng mới: <strong>&ldquo;{brandSearch.trim()}&rdquo;</strong></span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Dòng xe (Model) */}
          <div className="space-y-2 relative" ref={modelDropdownRef}>
            <label className="block text-xs font-semibold text-primary">
              Dòng xe (Model) <span className="text-error">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={modelSearch}
                onChange={(e) => {
                  setModelSearch(e.target.value);
                  onCustomModelInput(e.target.value);
                  setIsModelDropdownOpen(true);
                }}
                onFocus={() => setIsModelDropdownOpen(true)}
                placeholder="VD: C-Class, Camry, VF8, Panamera, Tucson..."
                className={`w-full h-12 pl-4 pr-10 rounded-xl bg-surface text-primary text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary transition-all ${
                  errors.model ? 'border-2 border-error' : 'border border-surface-container-high'
                }`}
              />
              <button
                type="button"
                aria-label="Chọn dòng xe"
                onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                className="absolute right-3 top-3 text-outline hover:text-primary transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[22px]">arrow_drop_down</span>
              </button>
            </div>
            {errors.model && <p className="text-xs text-error font-medium">{errors.model}</p>}

            {/* Model Dropdown */}
            {isModelDropdownOpen && (
              <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-xl bg-surface-container-lowest border border-surface-container-high shadow-xl py-1">
                {filteredModels.length > 0 ? (
                  filteredModels.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        onModelSelect(m.id, m.name);
                        setModelSearch(m.name);
                        setIsModelDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-2.5 text-left text-xs sm:text-sm flex items-center justify-between hover:bg-surface-container-low transition-colors cursor-pointer ${
                        modelId === m.id ? 'bg-secondary-container/30 font-semibold text-secondary' : 'text-primary'
                      }`}
                    >
                      <div>
                        <span>{m.name}</span>
                        {m.body_type && (
                          <span className="text-xs text-outline ml-2">({m.body_type})</span>
                        )}
                      </div>
                      {modelId === m.id && (
                        <span className="material-symbols-outlined text-[18px] text-secondary">check</span>
                      )}
                    </button>
                  ))
                ) : null}

                {modelSearch.trim() && !models.some((m) => m.name.toLowerCase() === modelSearch.trim().toLowerCase()) && (
                  <button
                    type="button"
                    onClick={() => {
                      onCustomModelInput(modelSearch.trim());
                      setIsModelDropdownOpen(false);
                    }}
                    className="w-full px-4 py-3 text-left text-xs sm:text-sm text-secondary font-medium hover:bg-secondary-container/30 border-t border-surface-container-high flex items-center gap-2 bg-surface-container-low/50 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">add_circle</span>
                    <span>Sử dụng dòng xe mới: <strong>&ldquo;{modelSearch.trim()}&rdquo;</strong></span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Phiên bản (Trim) */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-primary" htmlFor="car-trim">
              Phiên bản chi tiết (Trim/Variant)
            </label>
            <input
              id="car-trim"
              type="text"
              value={trim}
              onChange={(e) => onTrimChange(e.target.value)}
              placeholder="VD: C200 Avantgarde Plus, 2.5Q, Premium, Turbo S..."
              className="w-full h-12 px-4 rounded-xl bg-surface text-primary text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary border border-surface-container-high"
            />
          </div>

          {/* Năm sản xuất */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-primary" htmlFor="car-year">
              Năm sản xuất xuất xưởng <span className="text-error">*</span>
            </label>
            <div className="relative">
              <select
                id="car-year"
                value={manufactureYear || ''}
                onChange={(e) => onYearChange(e.target.value ? parseInt(e.target.value, 10) : 0)}
                className={`w-full h-12 px-4 rounded-xl bg-surface text-primary text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary cursor-pointer border ${
                  errors.manufactureYear ? 'border-2 border-error' : 'border border-surface-container-high'
                }`}
              >
                <option value="">-- Chọn năm sản xuất xe --</option>
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    Năm {y}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-3 top-3 pointer-events-none text-outline">
                expand_more
              </span>
            </div>
            {errors.manufactureYear && <p className="text-xs text-error font-medium">{errors.manufactureYear}</p>}
          </div>

          {/* Odometer */}
          <div className="space-y-2 md:col-span-2">
            <label className="block text-xs font-semibold text-primary" htmlFor="car-odo">
              Số km đã lăn bánh thực tế (ODO) <span className="text-error">*</span>
            </label>
            <div className="relative flex items-center">
              <input
                id="car-odo"
                type="text"
                inputMode="numeric"
                required
                value={odometerKm}
                onChange={handleOdoChange}
                placeholder="VD: 25000 (chỉ nhập số, hệ thống tự định dạng)"
                className={`w-full h-12 pl-4 pr-14 rounded-xl bg-surface text-primary text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary transition-all ${
                  errors.odometer ? 'border-2 border-error' : 'border border-surface-container-high'
                }`}
              />
              <span className="absolute right-4 text-xs font-bold text-secondary uppercase tracking-wider">
                KM
              </span>
            </div>
            {errors.odometer && <p className="text-xs text-error font-medium">{errors.odometer}</p>}
          </div>
        </div>
      </div>

      {/* Cụm Địa chỉ & Vị trí xem xe */}
      <div className="space-y-6 pt-4 border-t border-surface-container-high/70">
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-2 text-primary font-semibold text-sm font-display">
            <span className="material-symbols-outlined text-secondary text-[20px]">location_on</span>
            <span>2. Vị trí &amp; Địa chỉ xem xe thực tế</span>
          </div>
          <span className="text-xs text-outline hidden sm:inline-block">
            Hiển thị chính xác khu vực cho người mua tiện sắp xếp lịch xem xe
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Tỉnh / Thành phố */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-primary" htmlFor="car-loc">
              Tỉnh / Thành phố xem xe <span className="text-error">*</span>
            </label>
            <div className="relative">
              <select
                id="car-loc"
                value={provinceCode || ''}
                onChange={(e) => handleProvinceSelect(e.target.value)}
                className={`w-full h-12 px-4 rounded-xl bg-surface text-primary text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary cursor-pointer border ${
                  errors.provinceCode ? 'border-2 border-error' : 'border border-surface-container-high'
                }`}
              >
                <option value="">-- Chọn Tỉnh / Thành phố xem xe (63 tỉnh thành) --</option>
                {LOCATION_GROUPS.map((group) => (
                  <optgroup
                    key={group.label}
                    label={group.label}
                    className="font-semibold text-primary bg-surface-container-low"
                  >
                    {group.options.map((loc) => (
                      <option key={loc.code} value={loc.code} className="font-normal text-on-surface bg-surface">
                        {loc.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-3 top-3 pointer-events-none text-outline">
                expand_more
              </span>
            </div>
            {errors.provinceCode && <p className="text-xs text-error font-medium">{errors.provinceCode}</p>}
          </div>

          {/* Địa chỉ chi tiết */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-primary" htmlFor="car-address">
              Địa chỉ xem xe chi tiết
            </label>
            <div className="relative flex items-center">
              <input
                id="car-address"
                type="text"
                value={locationAddress}
                onChange={(e) => handleAddressInputChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    geocodeAddressText(locationAddress);
                  }
                }}
                placeholder="VD: Số 68 Lê Văn Lương, Cầu Giấy (hoặc bấm chọn quận bên dưới)..."
                className="w-full h-12 pl-4 pr-24 rounded-xl bg-surface text-primary text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary border border-surface-container-high"
              />
              <button
                type="button"
                onClick={() => geocodeAddressText(locationAddress)}
                disabled={searchingAddress || !locationAddress.trim()}
                className="absolute right-2 px-3 py-1.5 rounded-lg bg-surface-container hover:bg-secondary-container/50 text-secondary text-xs font-semibold flex items-center gap-1 transition-all disabled:opacity-40 cursor-pointer"
                title="Định vị ngay trên bản đồ"
              >
                {searchingAddress ? (
                  <span className="material-symbols-outlined text-[15px] animate-spin">sync</span>
                ) : (
                  <span className="material-symbols-outlined text-[15px]">search</span>
                )}
                <span>Định vị</span>
              </button>
            </div>
          </div>
        </div>

        {/* Gợi ý Quận/Huyện chọn nhanh theo Tỉnh thành đã chọn */}
        {commonDistricts.length > 0 && (
          <div className="space-y-2 p-3.5 rounded-xl bg-surface-container-low/60 border border-surface-container-high/60">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant">
              <span className="material-symbols-outlined text-[15px] text-secondary">near_me</span>
              <span>Gợi ý khu vực / Quận Huyện tại {currentProvince?.name}:</span>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {commonDistricts.map((district) => (
                <button
                  key={district}
                  type="button"
                  onClick={() => handleSelectDistrict(district)}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-surface hover:bg-secondary-container/40 text-primary border border-surface-container-high hover:border-secondary transition-colors cursor-pointer"
                >
                  + {district}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Mini Location Map Component */}
        <MiniLocationMap
          provinceCode={provinceCode}
          locationAddress={locationAddress}
          coordinates={coordinates}
          onCoordinatesChange={onCoordinatesChange}
          onAddressDetected={(detectedAddr, detectedProv) => {
            onAddressChange(detectedAddr);
            if (detectedProv && !provinceCode) onProvinceChange(detectedProv);
          }}
          searchingAddress={searchingAddress}
        />
      </div>

      {/* Action Footer */}
      <div className="pt-6 border-t border-surface-container-high/70 flex justify-end">
        <button
          type="button"
          onClick={onNext}
          className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-primary text-on-primary text-sm font-semibold hover:bg-primary-container transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Tiếp tục: Thông số kỹ thuật</span>
          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
        </button>
      </div>
    </section>
  );
}
