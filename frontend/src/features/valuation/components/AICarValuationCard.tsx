'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  Info,
  Loader2,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  Calendar,
  Gauge,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  RotateCcw,
  Upload,
  Plus,
  Trash2,
  Image as ImageIcon,
  Check,
  ChevronDown,
} from 'lucide-react';
import { api, formatVND, formatKm } from '@/lib/api';
import { ValuationResponse, CarRecognitionResponse } from '@/types';
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
import {
  QuickListingModal,
  normalizeAccidentStatus,
  normalizeFloodStatus,
  normalizeServiceHistory,
  normalizeIntCount,
} from './QuickListingModal';
import { ValuationResultModal } from './ValuationResultModal';
import {
  ALL_WORLD_CAR_BRANDS,
  BRAND_MODEL_CATALOG,
  MASTER_ALL_MODELS,
  ALL_YEARS,
  TRIM_SUGGESTIONS,
} from '../constants/carCatalog';

export { ALL_WORLD_CAR_BRANDS };

function formatVietnameseTextPrice(vnd: number | null | undefined): string {
  if (!vnd) return '---';
  if (vnd >= 1_000_000_000) {
    const bil = vnd / 1_000_000_000;
    return `${bil % 1 === 0 ? bil : bil.toFixed(2).replace(/\.?0+$/, '')} tỷ VNĐ`;
  }
  const mil = Math.round(vnd / 1_000_000);
  return `${mil} triệu VNĐ`;
}

export default function AICarValuationCard() {
  const router = useRouter();

  // ========================================================
  // KHÔNG TỰ ĐIỀN THÔNG TIN (CLEAN INITIAL STATE)
  // ========================================================
  // 1. Định danh xe & Đời xe (Khởi tạo rỗng)
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [variant, setVariant] = useState('');
  const [year, setYear] = useState<string>('');
  const [odometerKm, setOdometerKm] = useState<string>('');

  // 2. Quy cách kỹ thuật & Vận hành (Khởi tạo rỗng)
  const [bodyType, setBodyType] = useState('');
  const [transmission, setTransmission] = useState('');
  const [powertrain, setPowertrain] = useState('');
  const [engineDisplacement, setEngineDisplacement] = useState('');
  const [drivetrain, setDrivetrain] = useState('');
  const [seats, setSeats] = useState<string>('');
  const [doors, setDoors] = useState<string>('');

  // 3. Tình trạng, Xuất xứ & Màu sắc (Khởi tạo rỗng)
  const [condition, setCondition] = useState('');
  const [origin, setOrigin] = useState('');
  const [color, setColor] = useState('');
  const [interiorColor, setInteriorColor] = useState('');

  // 4. Lịch sử xe & Kiểm định kỹ thuật (Tùy chọn)
  const [accidentStatus, setAccidentStatus] = useState('');
  const [floodStatus, setFloodStatus] = useState('');
  const [serviceHistory, setServiceHistory] = useState('');
  const [ownerCount, setOwnerCount] = useState('');
  const [repaintedPartsCount, setRepaintedPartsCount] = useState('');
  const [replacedParts, setReplacedParts] = useState('');
  const [engineRepaired, setEngineRepaired] = useState(false);
  const [transmissionRepaired, setTransmissionRepaired] = useState(false);

  // ========================================================
  // KHUNG TẢI ẢNH (Ở ĐẦU TRANG) - 100% TÙY CHỌN
  // ========================================================
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadedPreviews, setUploadedPreviews] = useState<string[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Gemini Vision AI Scanner State
  const [aiScanLoading, setAiScanLoading] = useState(false);
  const [aiScanSuccess, setAiScanSuccess] = useState<string | null>(null);

  // Valuation Request & Result State
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ValuationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Quick Listing Modal State
  const [quickModalOpen, setQuickModalOpen] = useState(false);
  const [resultModalOpen, setResultModalOpen] = useState(false);

  // Dynamic Models Suggestions based on selected or typed brand
  const modelSuggestions = useMemo(() => {
    if (brand.trim()) {
      const matchedBrandKey = Object.keys(BRAND_MODEL_CATALOG).find(
        (b) => b.toLowerCase() === brand.trim().toLowerCase()
      );
      if (matchedBrandKey && BRAND_MODEL_CATALOG[matchedBrandKey]) {
        return BRAND_MODEL_CATALOG[matchedBrandKey].models;
      }
    }
    return MASTER_ALL_MODELS;
  }, [brand]);

  // Dynamic ODO Suggestions generated based on user typing (hoặc mốc phổ biến khi trống)
  const odoSuggestions = useMemo(() => {
    if (!odometerKm || !odometerKm.trim()) {
      return ['10000', '30000', '50000', '80000', '100000'];
    }
    const clean = odometerKm.trim().replace(/\D/g, '');
    if (!clean) return ['10000', '30000', '50000', '80000', '100000'];
    const num = parseInt(clean, 10);
    const list: string[] = [];

    if (num < 10) {
      list.push(`${num * 1000}`);
      list.push(`${num * 10000}`);
      list.push(`${num * 10000 + 5000}`);
      list.push(`${num * 10000 + 10000}`);
      list.push(`${num * 100000}`);
    } else if (num < 100) {
      list.push(`${num * 1000}`);
      list.push(`${num * 1000 + 5000}`);
      list.push(`${num * 10000}`);
    } else if (num < 1000) {
      list.push(`${num * 100}`);
      list.push(`${num * 1000}`);
    } else {
      list.push(`${num}`);
      if (num < 50000) list.push(`${num + 5000}`);
      if (num < 100000) list.push(`${num + 10000}`);
      if (num < 200000) list.push(`${num + 20000}`);
    }

    return Array.from(new Set(list));
  }, [odometerKm]);

  // Handle Add Photos (Top Frame)
  const handleAddPhotos = async (files: File[]) => {
    const validFiles = files.filter((f) => f.type.startsWith('image/'));
    if (validFiles.length === 0) return;

    const newFiles = [...uploadedFiles, ...validFiles].slice(0, 8);
    setUploadedFiles(newFiles);

    const newPreviews = newFiles.map((f) => URL.createObjectURL(f));
    setUploadedPreviews(newPreviews);

    // Auto-trigger AI Vision Recognition on the first uploaded photo
    const fileToScan = validFiles[0];
    await runAiVisionRecognition(fileToScan);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleAddPhotos(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  const handleRemovePhoto = (index: number) => {
    const updated = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(updated);
    setUploadedPreviews(updated.map((f) => URL.createObjectURL(f)));
  };

  const handleClearAllPhotos = () => {
    setUploadedFiles([]);
    setUploadedPreviews([]);
    setAiScanSuccess(null);
  };

  // Run AI Vision Recognition
  const runAiVisionRecognition = async (file: File) => {
    setAiScanLoading(true);
    setError(null);
    setAiScanSuccess(null);

    try {
      const data: CarRecognitionResponse = await api.recognizeCarImage(file);

      // Auto-fill parameters if detected
      if (data.brand) setBrand(data.brand);
      if (data.model) setModel(data.model);
      if (data.trim) setVariant(data.trim);
      if (data.manufacture_year && data.manufacture_year >= 1990) setYear(String(data.manufacture_year));
      if (data.body_type) {
        const matchedBody = SUGGESTED_BODY_TYPES.find((b) => b.toLowerCase().includes(data.body_type!.toLowerCase()));
        if (matchedBody) setBodyType(matchedBody);
        else setBodyType(data.body_type);
      }
      if (data.fuel_type) {
        const f = data.fuel_type.toUpperCase();
        if (f.includes('GAS') || f.includes('XĂNG')) setPowertrain('Xăng tăng áp (Turbo)');
        else if (f.includes('DIESEL') || f.includes('DẦU')) setPowertrain('Diesel (Dầu)');
        else if (f.includes('ELECT') || f.includes('ĐIỆN')) setPowertrain('Thuần điện 100% (EV)');
        else if (f.includes('HYBRID')) setPowertrain('Hybrid tự sạc (HEV)');
        else setPowertrain(data.fuel_type);
      }
      if (data.transmission) {
        const t = data.transmission.toUpperCase();
        if (t.includes('AUTO') || t.includes('TỰ ĐỘNG')) setTransmission('Tự động (AT)');
        else if (t.includes('MAN') || t.includes('SÀN')) setTransmission('Số sàn thể thao (MT)');
        else setTransmission(data.transmission);
      }
      if (data.color) setColor(data.color);
      if (data.seats && data.seats > 0) setSeats(String(data.seats));
      if (data.odometer_km && data.odometer_km > 0) setOdometerKm(String(data.odometer_km));

      setAiScanSuccess(
        `AI Vision đã nhận diện: ${data.brand || ''} ${data.model || ''} (${data.manufacture_year || ''})`
      );
    } catch (err: any) {
      console.warn('Gemini recognition warning:', err);
    } finally {
      setAiScanLoading(false);
    }
  };

  // Submit Valuation: 100% TÙY CHỌN ẢNH
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!brand.trim()) {
      setError('Vui lòng nhập hãng xe (Thương hiệu).');
      return;
    }
    if (!model.trim()) {
      setError('Vui lòng nhập tên dòng xe (Model).');
      return;
    }
    if (!year || isNaN(Number(year))) {
      setError('Vui lòng nhập năm sản xuất xe.');
      return;
    }
    if (!odometerKm || isNaN(Number(odometerKm))) {
      setError('Vui lòng nhập số km ODO đã lăn bánh.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Map body type to backend standard
      let backendBody = 'SEDAN';
      const bLower = bodyType.toLowerCase();
      if (bLower.includes('suv') || bLower.includes('crossover')) backendBody = 'SUV';
      else if (bLower.includes('hatchback')) backendBody = 'HATCHBACK';
      else if (bLower.includes('pickup') || bLower.includes('bán tải')) backendBody = 'PICKUP';
      else if (bLower.includes('mpv')) backendBody = 'MPV';
      else if (bLower.includes('coupe')) backendBody = 'COUPE';

      // Map fuel type to backend standard
      let backendFuel = 'GASOLINE';
      const pLower = powertrain.toLowerCase();
      if (pLower.includes('diesel') || pLower.includes('dầu')) backendFuel = 'DIESEL';
      else if (pLower.includes('hybrid')) backendFuel = 'HYBRID';
      else if (pLower.includes('điện') || pLower.includes('ev')) backendFuel = 'ELECTRIC';

      // Map transmission to backend standard
      const backendTrans = transmission.toLowerCase().includes('sàn') || transmission.toLowerCase().includes('manual')
        ? 'MANUAL'
        : 'AUTOMATIC';

      const response = await api.estimateValuation({
        brand: brand.trim(),
        model: model.trim(),
        variant: variant.trim() || undefined,
        manufacture_year: Number(year),
        odometer_km: Number(odometerKm),
        body_type: backendBody,
        fuel_type: backendFuel,
        transmission: backendTrans,
        engine_displacement: parseFloat(engineDisplacement) || undefined,
        seats: seats ? Number(seats) : undefined,
        doors: doors ? Number(doors) : undefined,
        origin: origin.trim() || undefined,
        province_code: '01',
      });

      if (response.status === 'PREDICTED') {
        setResult(response);
        setResultModalOpen(true);
        setTimeout(() => {
          const resElement = document.getElementById('valuation-results-section');
          if (resElement) resElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      } else {
        setResult(null);
        setError(response.reason || 'Không thể định giá xe với thông số hiện tại.');
      }
    } catch (caught) {
      setResult(null);
      setError(caught instanceof Error ? caught.message : 'Không thể kết nối dịch vụ định giá.');
    } finally {
      setLoading(false);
    }
  };

  // Usage Intensity Calculation
  const usageStats = useMemo(() => {
    const yNum = Number(year) || 2022;
    const odoNum = Number(odometerKm) || 40000;
    const age = Math.max(1, 2026 - yNum);
    const avgKmPerYear = Math.round(odoNum / age);
    let intensityLabel = 'Sử dụng tiêu chuẩn gia đình';
    let intensityColor = 'text-primary bg-surface-container border-surface-container-high';

    if (avgKmPerYear < 10000) {
      intensityLabel = 'Xe đi rất ít, bảo quản tốt (Xe lướt)';
      intensityColor = 'text-on-secondary-container bg-secondary-container/40 border-secondary/30';
    } else if (avgKmPerYear > 22000) {
      intensityLabel = 'Tần suất di chuyển cao / Chạy đường dài';
      intensityColor = 'text-on-surface-variant bg-surface-container-high border-outline/30';
    }

    return { age, avgKmPerYear, intensityLabel, intensityColor };
  }, [year, odometerKm]);

  // Navigate to full /dang-tin preserving all technical fields in localStorage
  const handleOpenFullPost = () => {
    try {
      const draft = {
        brandName: brand,
        modelName: model,
        trim: variant,
        manufactureYear: Number(year) || 0,
        odometerKm: String(odometerKm),
        condition,
        origin,
        bodyType,
        powertrain,
        fuelType: powertrain,
        transmission,
        drivetrain,
        engineDisplacement,
        seats: seats ? Number(seats) : 0,
        doors: doors ? Number(doors) : 0,
        color,
        interiorColor,
        vehicleHistory: {
          accidentStatus: normalizeAccidentStatus(accidentStatus),
          floodStatus: normalizeFloodStatus(floodStatus),
          serviceHistory: normalizeServiceHistory(serviceHistory),
          ownerCount: normalizeIntCount(ownerCount, 1, 20) ?? 1,
          repaintedPartsCount: normalizeIntCount(repaintedPartsCount, 0, 50) ?? 0,
          replacedParts: replacedParts ? String(replacedParts) : '',
          engineRepaired: Boolean(engineRepaired),
          transmissionRepaired: Boolean(transmissionRepaired),
        },
        priceVnd: String(result?.estimated_price_vnd || ''),
      };
      localStorage.setItem('aura_listing_draft', JSON.stringify(draft));
    } catch {
      // ignore
    }
    router.push('/dang-tin');
  };

  return (
    <div id="ai-valuation-form-card" className="w-full space-y-8">
      {/* ========================================================= */}
      {/* 1. KHUNG TẢI ẢNH LÊN ĐẦU TIÊN (FULL WIDTH, 100% TÙY CHỌN) */}
      {/* ========================================================= */}
      <div className="w-full rounded-3xl border border-[#eae8e3] bg-gradient-to-br from-surface-container-lowest via-surface to-secondary-container/10 p-5 sm:p-7 shadow-xs space-y-4">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#eae8e3]">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-[#b89b72]/15 text-[#b89b72] flex items-center justify-center shrink-0">
              <ImageIcon className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold font-display text-sm sm:text-base text-[#1a1c1a]">
                  Tải ảnh nhận diện xe
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-bold uppercase tracking-wider">
                  Tùy chọn
                </span>
              </div>
              <p className="text-xs text-[#777] mt-0.5">
                AI Vision quét ảnh để tự điền các thông số bên dưới, hoặc bạn có thể bỏ qua và nhập trực tiếp.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-[#777]">
            <Sparkles className="w-4 h-4 text-[#b89b72] shrink-0" />
            <span>Không bắt buộc có ảnh</span>
          </div>
        </div>

        {/* Hidden Input File */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/jpg"
          className="hidden"
          onChange={handleFileInputChange}
        />

        {/* Scanning & Success State Notifications */}
        {aiScanLoading ? (
          <div className="p-4 rounded-2xl bg-white border border-[#b89b72]/50 text-center space-y-2 animate-pulse shadow-xs">
            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-[#1a1c1a]">
              <Loader2 className="w-4 h-4 animate-spin text-[#b89b72]" />
              <span>AI Vision đang nhận diện ảnh và trích xuất thông số xe...</span>
            </div>
            <p className="text-[11px] text-[#777]">
              Hãng xe, dòng xe, kiểu dáng, màu sơn và năm sản xuất sẽ được tự động điền vào form bên dưới.
            </p>
          </div>
        ) : aiScanSuccess ? (
          <div className="p-3.5 rounded-2xl bg-secondary-container/50 border border-secondary/30 text-on-secondary-container text-xs flex items-center justify-between gap-2 animate-in fade-in shadow-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-secondary shrink-0" />
              <span className="font-semibold text-xs">{aiScanSuccess}</span>
            </div>
            <button
              type="button"
              onClick={() => setAiScanSuccess(null)}
              className="text-secondary hover:text-on-secondary-fixed cursor-pointer font-bold px-1 text-sm"
            >
              ✕
            </button>
          </div>
        ) : null}

        {/* Upload Dropzone & Gallery */}
        {uploadedFiles.length === 0 ? (
          /* Empty Dropzone (Full Width) */
          <div
            onDrop={(e) => {
              e.preventDefault();
              setIsDragOver(false);
              if (e.dataTransfer.files) handleAddPhotos(Array.from(e.dataTransfer.files));
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setIsDragOver(false);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer rounded-2xl border-2 border-dashed p-6 sm:p-7 text-center transition-all ${
              isDragOver
                ? 'border-[#b89b72] bg-[#b89b72]/10 shadow-md'
                : 'border-[#eae8e3] hover:border-[#b89b72]/60 bg-white hover:bg-[#faf9f6]'
            }`}
          >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 text-left">
                <div className="w-11 h-11 rounded-2xl bg-[#b89b72]/15 text-[#b89b72] flex items-center justify-center shrink-0">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-[#1a1c1a]">
                    Kéo thả ảnh vào đây hoặc bấm để chọn ảnh xe (Tùy chọn)
                  </h4>
                  <p className="text-[11px] text-[#777] mt-0.5">
                    Hỗ trợ tối đa 8 ảnh thực tế (đầu xe, đuôi xe, mặt taplo ODO, nội thất...). Định dạng JPG, PNG, WEBP.
                  </p>
                </div>
              </div>

              <span className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#1a1c1a] hover:bg-[#b89b72] text-white text-xs font-bold transition-colors shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-[#b89b72]" />
                <span>Chọn ảnh từ thiết bị</span>
              </span>
            </div>
          </div>
        ) : (
          /* Uploaded Photos Gallery (Full Width Strip) */
          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5">
              {uploadedPreviews.map((previewUrl, idx) => (
                <div
                  key={idx}
                  className="relative aspect-square rounded-xl overflow-hidden border border-[#eae8e3] group bg-[#f4f3f0]"
                >
                  <img src={previewUrl} alt={`Ảnh xe ${idx + 1}`} className="w-full h-full object-cover" />
                  {idx === 0 && (
                    <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/75 text-white text-[9px] font-bold">
                      Ảnh bìa
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(idx)}
                    className="absolute top-1 right-1 p-1 rounded-full bg-black/60 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    title="Xóa ảnh này"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {/* Add More Button */}
              {uploadedFiles.length < 8 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square rounded-xl border-2 border-dashed border-[#eae8e3] hover:border-[#b89b72] flex flex-col items-center justify-center text-[#888] hover:text-[#b89b72] transition-colors cursor-pointer bg-white"
                >
                  <Plus className="w-5 h-5 mb-0.5" />
                  <span className="text-[10px] font-semibold">Thêm ảnh</span>
                </button>
              )}
            </div>

            {/* Gallery Control Bar */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => runAiVisionRecognition(uploadedFiles[0])}
                disabled={aiScanLoading}
                className="text-xs text-[#b89b72] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Quét lại từ ảnh đại diện</span>
              </button>

              <button
                type="button"
                onClick={handleClearAllPhotos}
                className="text-xs text-red-600 hover:underline font-semibold cursor-pointer"
              >
                Xóa tất cả ảnh
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 2. FORM THÔNG SỐ ĐỊNH GIÁ XE - CHIẾM HẾT CHIỀU RỘNG (W-FULL) */}
      {/* NHẤN VÀO INPUT PHÁT LÀ XỔ RA GỢI Ý LUÔN                    */}
      {/* ========================================================= */}
      <form
        onSubmit={handleSubmit}
        className="w-full bg-white p-6 sm:p-8 lg:p-10 rounded-3xl border border-[#eae8e3] shadow-xs space-y-8"
      >
        {error && (
          <div role="alert" className="flex gap-2.5 rounded-xl border border-red-200 bg-red-50 p-4 text-xs sm:text-sm text-red-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {/* 1. ĐỊNH DANH HÃNG XE, DÒNG XE, PHIÊN BẢN & NĂM SẢN XUẤT */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#f0eee9] pb-3">
            <div className="flex items-center gap-2 text-[#1a1c1a] font-bold text-xs uppercase tracking-wider font-display">
              <span className="material-symbols-outlined text-[#b89b72] text-[20px]">directions_car</span>
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

        {/* 2. KIỂU DÁNG & HỆ THỐNG VẬN HÀNH (NHẤN VÀO LÀ XỔ RA GỢI Ý LUÔN) */}
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

          {/* 2 columns: Exterior Color & Interior Color (VẪN GIỮ NGUYÊN BẢNG MÀU TRỰC QUAN THEO YÊU CẦU) */}
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
              {/* Visual Swatches Palette (BẢNG MÀU NGOẠI THẤT GIỮ NGUYÊN) */}
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
              {/* Visual Leather Swatches (BẢNG MÀU DA NỘI THẤT GIỮ NGUYÊN) */}
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

        {/* 4. LỊCH SỬ XE & KIỂM ĐỊNH KỸ THUẬT (NHẤN VÀO LÀ XỔ RA GỢI Ý LUÔN) */}
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
            placeholder="VD: Đã thay 4 lốp Michelin mới, thay ắc quy GS chính hãng..."
            suggestions={[
              'Đã thay 4 lốp Michelin mới',
              'Thay bình ắc quy chính hãng',
              'Sơn phủ gầm chống rỉ và dán phim cách nhiệt',
              'Thay má phanh và gạt mưa mới',
            ]}
            maxSuggestions={6}
          />
        </div>

        {/* Submit Action: Full Width Luxury Button */}
        <button
          type="submit"
          disabled={loading}
          className="flex h-14 w-full items-center justify-center rounded-2xl border border-[#1a1c1a] bg-[#1a1c1a] px-6 text-sm sm:text-base font-bold text-white transition-all hover:bg-[#b89b72] hover:border-[#b89b72] disabled:bg-[#dbdad7] shadow-lg cursor-pointer mt-4"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2.5 h-5 w-5 animate-spin text-[#b89b72]" />
              <span>Đang phân tích định giá thị trường xe...</span>
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-5 w-5 text-[#b89b72]" />
              <span>Xem Giá Tham Khảo Ngay</span>
            </>
          )}
        </button>
      </form>

      {/* ========================================================= */}
      {/* 3. KHỐI KẾT QUẢ ĐỊNH GIÁ & ĐĂNG BÁN XE NHANH              */}
      {/* ========================================================= */}
      {result && (
        <div
          id="valuation-results-section"
          className="w-full rounded-3xl border border-[#eae8e3] bg-[#faf9f6] p-6 sm:p-8 lg:p-10 space-y-6 animate-in fade-in duration-300 shadow-sm"
        >
          {/* Header result vehicle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#eae8e3] pb-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#b89b72] block">
                Kết quả định giá thị trường xe
              </span>
              <h3 className="text-xl sm:text-2xl font-bold font-display text-[#1a1c1a] mt-0.5">
                {brand} {model} {variant ? `• ${variant}` : ''} ({year})
              </h3>
              <p className="text-xs text-[#777] mt-0.5">
                {bodyType} • Hộp số {transmission} • {odometerKm ? formatKm(Number(odometerKm)) : ''} • Màu {color || 'tiêu chuẩn'}
              </p>
            </div>

            {/* Quick Actions Bar */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => setResultModalOpen(true)}
                className="px-4 py-2.5 rounded-xl border border-[#b89b72] bg-[#b89b72]/10 hover:bg-[#b89b72]/20 text-xs font-semibold text-[#725a37] transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#b89b72]" />
                <span>Xem lại Modal kết quả</span>
              </button>

              <button
                type="button"
                onClick={() => setQuickModalOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-[#1a1c1a] hover:bg-[#b89b72] text-white font-bold text-xs transition-colors shadow-md flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-[#b89b72]" />
                <span>Đăng tin bán xe với giá này</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handleOpenFullPost}
                className="px-4 py-2.5 rounded-xl border border-[#eae8e3] bg-white hover:bg-[#f4f3f0] text-xs font-semibold text-[#555] transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span>Mở trình đăng tin chi tiết</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Result: Price Boxes & Spectrum */}
            <div className="lg:col-span-7 space-y-5">
              {/* Main Price Box */}
              <div className="p-6 rounded-2xl bg-white border border-[#eae8e3] shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#777] uppercase tracking-wider">
                    Giá giao dịch tham khảo hợp lý
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md bg-secondary-container text-on-secondary-container text-[11px] font-bold border border-secondary/20">
                    Mức giá đề xuất tốt nhất
                  </span>
                </div>

                <div className="text-3xl sm:text-4xl font-extrabold text-[#1a1c1a] font-mono tracking-tight">
                  {formatVND(result.estimated_price_vnd)}
                </div>

                <div className="text-xs font-semibold text-[#b89b72]">
                  Tương đương khoảng ~ {formatVietnameseTextPrice(result.estimated_price_vnd)}
                </div>
              </div>

              {/* Conformal Range Bar (Visual Spectrum) */}
              <div className="p-5 rounded-2xl bg-white border border-[#eae8e3] space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#1a1c1a]">Khoảng giá mua bán phổ biến</span>
                  <span className="text-[10px] text-[#777]">Theo tình trạng xe thực tế</span>
                </div>

                {/* Range Bar */}
                <div className="relative pt-1">
                  <div className="h-3 w-full rounded-full bg-gradient-to-r from-secondary-fixed via-secondary to-primary shadow-inner" />
                  <div className="flex items-center justify-between text-[11px] font-mono font-bold text-[#444] mt-2">
                    <div className="text-left">
                      <span className="text-[10px] font-normal text-[#888] block">Giá bán nhanh</span>
                      <span>{formatVietnameseTextPrice(result.interval_low_vnd)}</span>
                    </div>
                    <div className="text-center text-secondary">
                      <span className="text-[10px] font-normal text-secondary block">Giá hợp lý</span>
                      <span>{formatVietnameseTextPrice(result.estimated_price_vnd)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-normal text-[#888] block">Xe đẹp / lướt</span>
                      <span>{formatVietnameseTextPrice(result.interval_high_vnd)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4 Usage & Market Indicators */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-white border border-[#eae8e3] space-y-0.5">
                  <span className="text-[10px] font-semibold text-[#777] uppercase flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-[#b89b72]" />
                    <span>Tuổi xe</span>
                  </span>
                  <div className="text-base font-bold text-[#1a1c1a] font-mono">
                    {usageStats.age} năm
                  </div>
                  <div className="text-[10px] text-[#888]">Năm {year}</div>
                </div>

                <div className="p-3 rounded-xl bg-white border border-[#eae8e3] space-y-0.5">
                  <span className="text-[10px] font-semibold text-[#777] uppercase flex items-center gap-1">
                    <Gauge className="w-3 h-3 text-[#b89b72]" />
                    <span>Tình trạng ODO</span>
                  </span>
                  <div className="text-base font-bold text-[#1a1c1a] font-mono">
                    {usageStats.avgKmPerYear.toLocaleString('vi-VN')} km/năm
                  </div>
                  <div className="text-[10px] text-secondary truncate font-medium">
                    {usageStats.avgKmPerYear < 12000 ? 'Xe đi ít, giữ gìn' : 'Đi lại gia đình'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white border border-[#eae8e3] space-y-0.5">
                  <span className="text-[10px] font-semibold text-[#777] uppercase flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-[#b89b72]" />
                    <span>Thanh khoản</span>
                  </span>
                  <div className="text-base font-bold text-[#1a1c1a]">
                    {['toyota', 'honda', 'mazda', 'hyundai', 'kia'].includes(brand.toLowerCase())
                      ? 'Dễ bán'
                      : 'Phổ biến'}
                  </div>
                  <div className="text-[10px] text-[#888]">Nhu cầu thị trường</div>
                </div>

                <div className="p-3 rounded-xl bg-white border border-[#eae8e3] space-y-0.5">
                  <span className="text-[10px] font-semibold text-[#777] uppercase flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-[#b89b72]" />
                    <span>Xuất xứ</span>
                  </span>
                  <div className="text-base font-bold text-secondary truncate">
                    {origin || 'Tiêu chuẩn'}
                  </div>
                  <div className="text-[10px] text-[#888]">
                    Hộp số {transmission || 'Tiêu chuẩn'}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Result: Quick Action Card & Market Advice */}
            <div className="lg:col-span-5 space-y-4">
              {/* Quick Posting Callout Card */}
              <div className="p-5 rounded-2xl bg-[#1a1c1a] text-white space-y-3 shadow-md">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#b89b72]">
                  <Sparkles className="w-4 h-4 text-[#b89b72]" />
                  <span>Sẵn sàng kết nối người mua thực tế</span>
                </div>
                <h4 className="font-display font-bold text-lg leading-snug">
                  Đăng tin bán ngay với mức giá {formatVND(result.estimated_price_vnd)}
                </h4>
                <p className="text-xs text-[#a1a1aa] leading-relaxed">
                  Toàn bộ thông số kỹ thuật xe{uploadedFiles.length > 0 ? ` và ${uploadedFiles.length} ảnh đã tải` : ''} đã được chuẩn bị sẵn. Bạn chỉ cần bổ sung địa chỉ và xác nhận để đăng bán.
                </p>
                <div className="pt-1 flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={() => setQuickModalOpen(true)}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-[#b89b72] hover:bg-[#a68a63] text-[#1a1c1a] font-bold text-xs text-center transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Bổ sung thông tin &amp; Đăng ngay</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* AI Explanation / Market Advice */}
              {result.explanation && (
                <div className="p-4 rounded-xl bg-white border border-[#eae8e3] text-xs space-y-3">
                  <div>
                    <h4 className="font-bold text-[#1a1c1a] flex items-center gap-1.5 text-xs">
                      <TrendingUp className="w-4 h-4 text-[#b89b72]" />
                      <span>Đánh giá tổng quan về xe:</span>
                    </h4>
                    <p className="mt-1 text-[#444] leading-relaxed">
                      {result.explanation.summary}
                    </p>
                  </div>

                  {result.explanation.positive_factors?.length > 0 && (
                    <div className="space-y-1 pt-2 border-t border-[#f0eee9]">
                      <span className="font-semibold text-secondary text-[11px] flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-secondary" />
                        <span>Điểm cộng của xe:</span>
                      </span>
                      <ul className="space-y-1 pl-4 list-disc text-[#666] text-[11px]">
                        {result.explanation.positive_factors.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.explanation.market_advice && (
                    <p className="pt-2 border-t border-[#f0eee9] text-[11px] italic text-[#777]">
                      💡 Lời khuyên: {result.explanation.market_advice}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. MODAL DIALOG HIỂN THỊ KẾT QUẢ ĐỊNH GIÁ & HÀNH ĐỘNG */}
      <ValuationResultModal
        isOpen={resultModalOpen}
        onClose={() => setResultModalOpen(false)}
        result={result}
        vehicle={{
          brand,
          model,
          variant,
          year,
          odometerKm,
          bodyType,
          transmission,
          fuelType: powertrain,
          color,
          origin,
          condition,
        }}
        onOpenQuickListing={() => {
          setResultModalOpen(false);
          setQuickModalOpen(true);
        }}
        onOpenFullListing={() => {
          setResultModalOpen(false);
          handleOpenFullPost();
        }}
        onRecalculate={() => {
          setResultModalOpen(false);
          const topElement = document.getElementById('ai-valuation-form-card');
          if (topElement) topElement.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* Quick Listing Modal Popup (Collects remaining listing details) */}
      <QuickListingModal
        isOpen={quickModalOpen}
        onClose={() => setQuickModalOpen(false)}
        initialData={{
          brand,
          model,
          trim: variant,
          year: Number(year) || 2022,
          odometerKm: Number(odometerKm) || 40000,
          condition,
          origin,
          bodyType,
          fuelType: powertrain,
          transmission,
          drivetrain,
          engineDisplacement,
          seats: seats ? Number(seats) : undefined,
          doors: doors ? Number(doors) : undefined,
          color,
          interiorColor,
          estimatedPriceVnd: result?.estimated_price_vnd || 500000000,
          lowPriceVnd: result?.interval_low_vnd || undefined,
          highPriceVnd: result?.interval_high_vnd || undefined,
          suggestedTitle: `Bán xe ${brand} ${model} ${variant ? variant + ' ' : ''}${year} màu ${color || 'trắng'}`,
          suggestedDescription: result?.explanation?.summary || undefined,
          vehicleHistory: {
            accidentStatus: normalizeAccidentStatus(accidentStatus),
            floodStatus: normalizeFloodStatus(floodStatus),
            serviceHistory: normalizeServiceHistory(serviceHistory),
            ownerCount: normalizeIntCount(ownerCount, 1, 20) ?? 1,
            repaintedPartsCount: normalizeIntCount(repaintedPartsCount, 0, 50) ?? 0,
            replacedParts: replacedParts ? String(replacedParts) : '',
            engineRepaired: Boolean(engineRepaired),
            transmissionRepaired: Boolean(transmissionRepaired),
          },
        }}
        initialFiles={uploadedFiles}
        onAddFiles={(newFiles) => {
          setUploadedFiles((prev) => [...prev, ...newFiles].slice(0, 8));
          setUploadedPreviews((prev) => [...prev, ...newFiles.map((f) => URL.createObjectURL(f))].slice(0, 8));
        }}
      />
    </div>
  );
}

// ========================================================
// REUSABLE SUGGESTIVE INPUT COMPONENT (FLOATING AUTOCOMPLETE DROPDOWN):
// - Nhấn vào input phát là xổ ra danh sách gợi ý luôn!
// - Khi người dùng gõ phím: Dropdown tự động lọc gợi ý chính xác theo từ khóa
// - Bấm ngoài hoặc phím Escape: Dropdown đóng lại mượt mà
// ========================================================
function SuggestiveInput({
  label,
  value,
  onChange,
  placeholder,
  suggestions,
  required = false,
  type = 'text',
  suffix,
  maxSuggestions = 12,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  suggestions: string[];
  required?: boolean;
  type?: string;
  suffix?: string;
  maxSuggestions?: number;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Chuẩn hóa loại bỏ dấu tiếng Việt để tìm kiếm thông minh
  const removeDiacritics = (str: string) =>
    str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase();

  // Lọc gợi ý động theo những gì người dùng gõ
  const filtered = useMemo(() => {
    if (!value || !value.trim()) {
      return suggestions.slice(0, maxSuggestions);
    }
    const q = value.trim().toLowerCase();
    const qNorm = removeDiacritics(q);
    const matches = suggestions.filter((s) => {
      const sLower = s.toLowerCase();
      const sNorm = removeDiacritics(sLower);
      return sLower.includes(q) || sNorm.includes(qNorm);
    });
    return matches.slice(0, maxSuggestions);
  }, [value, suggestions, maxSuggestions]);

  // Đóng dropdown khi nhấn ra ngoài
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (item: string) => {
    onChange(item);
    setIsOpen(false);
  };

  const hasTyped = Boolean(value && value.trim().length > 0);
  const displayItems = hasTyped ? filtered : suggestions.slice(0, maxSuggestions);

  return (
    <div ref={containerRef} className={`space-y-1.5 relative ${isOpen ? 'z-30' : 'z-0'}`}>
      <label className="block text-xs font-semibold text-[#3a3a3a]">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            // Nhấn vào input phát là xổ ra gợi ý luôn
            setIsOpen(true);
          }}
          onClick={() => {
            // Nhấp chuột vào ô input cũng xổ ra ngay
            setIsOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setIsOpen(false);
            if (e.key === 'Enter' && isOpen && displayItems.length > 0) {
              e.preventDefault();
              handleSelect(displayItems[0]);
            }
          }}
          placeholder={placeholder}
          className={`w-full h-11 px-3.5 rounded-xl border border-[#e2e0da] bg-white text-xs sm:text-sm text-[#1a1c1a] focus:border-[#b89b72] focus:ring-2 focus:ring-[#b89b72]/20 transition-all outline-none font-medium cursor-pointer ${
            suffix ? 'pr-12' : (suggestions.length > 0 ? 'pr-9' : '')
          }`}
        />

        {suffix ? (
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#888] pointer-events-none">
            {suffix}
          </span>
        ) : suggestions.length > 0 ? (
          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen((prev) => !prev);
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#aaa] hover:text-[#b89b72] transition-colors cursor-pointer"
            title="Xem danh sách gợi ý"
          >
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        ) : null}
      </div>

      {/* DROPDOWN GỢI Ý XỔ RA NGAY KHI NHẤN / FOCUS VÀO INPUT */}
      {isOpen && displayItems.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-white rounded-2xl shadow-xl border border-[#eae8e3] max-h-64 overflow-y-auto p-1.5 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-1.5 text-[10px] font-bold text-[#888] uppercase tracking-wider flex items-center justify-between border-b border-[#f4f3f0] mb-1">
            <span>Gợi ý lựa chọn ({displayItems.length})</span>
            <span className="text-[10px] text-[#b89b72]">Nhấn để chọn</span>
          </div>
          {displayItems.map((item) => {
            const displayLabel =
              suffix === 'KM' && !isNaN(Number(item))
                ? `${Number(item).toLocaleString('vi-VN')} KM`
                : item;

            return (
              <button
                key={item}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(item);
                }}
                className="w-full text-left px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-[#1a1c1a] hover:bg-[#b89b72]/15 hover:text-[#725a37] transition-colors flex items-center justify-between cursor-pointer group"
              >
                <span className="group-hover:translate-x-0.5 transition-transform">{displayLabel}</span>
                <span className="text-[11px] text-[#b89b72] opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                  Chọn
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
