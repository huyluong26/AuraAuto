'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  X,
  Upload,
  Plus,
  Trash2,
  MapPin,
  CheckCircle2,
  Loader2,
  Sparkles,
  ExternalLink,
  Car,
  AlertCircle,
  LogIn,
  ShieldCheck,
  User,
  Building,
  Check,
  RotateCcw,
  Camera,
} from 'lucide-react';
import { api, formatVND } from '@/lib/api';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { VehicleHistoryState } from '@/features/car-listing/types';
import {
  LOCATION_GROUPS,
  detectProvinceFromText,
  GUIDED_PHOTO_SLOTS,
} from '@/features/car-listing/constants';

export interface QuickListingData {
  brand: string;
  model: string;
  trim?: string;
  year: number;
  odometerKm: number;
  bodyType: string;
  fuelType: string;
  transmission: string;
  origin: string;
  condition?: string;
  drivetrain?: string;
  engineDisplacement?: string;
  seats?: number;
  doors?: number;
  color?: string;
  interiorColor?: string;
  estimatedPriceVnd: number;
  lowPriceVnd?: number;
  highPriceVnd?: number;
  suggestedTitle?: string;
  suggestedDescription?: string;
  vehicleHistory?: VehicleHistoryState;
}

export function normalizeAccidentStatus(val?: string): 'UNKNOWN' | 'NONE' | 'MINOR' | 'MAJOR' {
  if (!val) return 'UNKNOWN';
  const u = val.trim().toUpperCase();
  if (['UNKNOWN', 'NONE', 'MINOR', 'MAJOR'].includes(u)) return u as any;
  const l = val.toLowerCase();
  if (l.includes('chưa từng') || l.includes('không') || l.includes('chưa va') || l.includes('nguyên bản') || l.includes('zin') || l.includes('none')) return 'NONE';
  if (l.includes('nhẹ') || l.includes('xước') || l.includes('quẹt') || l.includes('sát') || l.includes('minor')) return 'MINOR';
  if (l.includes('nặng') || l.includes('khung gầm') || l.includes('tai nạn') || l.includes('ảnh hưởng') || l.includes('major')) return 'MAJOR';
  return 'UNKNOWN';
}

export function normalizeFloodStatus(val?: string): 'UNKNOWN' | 'NONE' | 'SUSPECTED' | 'CONFIRMED' {
  if (!val) return 'UNKNOWN';
  const u = val.trim().toUpperCase();
  if (['UNKNOWN', 'NONE', 'SUSPECTED', 'CONFIRMED'].includes(u)) return u as any;
  const l = val.toLowerCase();
  if (l.includes('không') || l.includes('cam kết') || l.includes('chưa từng') || l.includes('zin') || l.includes('none')) return 'NONE';
  if (l.includes('nghi ngờ') || l.includes('dấu hiệu') || l.includes('suspect')) return 'SUSPECTED';
  if (l.includes('ngập') || l.includes('thủy kích') || l.includes('confirmed')) return 'CONFIRMED';
  return 'UNKNOWN';
}

export function normalizeServiceHistory(val?: string): 'UNKNOWN' | 'NONE' | 'PARTIAL' | 'FULL' {
  if (!val) return 'UNKNOWN';
  const u = val.trim().toUpperCase();
  if (['UNKNOWN', 'NONE', 'PARTIAL', 'FULL'].includes(u)) return u as any;
  const l = val.toLowerCase();
  if (l.includes('đầy đủ') || l.includes('100%') || l.includes('hãng') || l.includes('full')) return 'FULL';
  if (l.includes('một phần') || l.includes('vài') || l.includes('sổ theo dõi') || l.includes('partial')) return 'PARTIAL';
  if (l.includes('không có') || l.includes('mất') || l.includes('chưa rõ') || l.includes('none')) return 'NONE';
  return 'UNKNOWN';
}

export function normalizeIntCount(val?: any, minVal = 0, maxVal = 50): number | undefined {
  if (val === undefined || val === null || val === '') return undefined;
  if (typeof val === 'number') {
    if (isNaN(val)) return undefined;
    return Math.max(minVal, Math.min(maxVal, Math.round(val)));
  }
  const match = String(val).match(/\d+/);
  if (match) {
    const parsed = parseInt(match[0], 10);
    return Math.max(minVal, Math.min(maxVal, parsed));
  }
  return undefined;
}

export function normalizeBodyType(val?: string): string {
  if (!val) return 'SEDAN';
  const u = val.trim().toUpperCase();
  if (u.includes('GẦM CAO') || u.includes('SUV')) return 'SUV';
  if (u.includes('BÁN TẢI') || u.includes('PICKUP')) return 'PICKUP';
  if (u.includes('HATCHBACK')) return 'HATCHBACK';
  if (u.includes('MPV') || u.includes('ĐA DỤNG')) return 'MPV';
  if (u.includes('CROSSOVER') || u.includes('CUV')) return 'CROSSOVER';
  if (u.includes('MUI TRẦN') || u.includes('CONVERTIBLE')) return 'CONVERTIBLE';
  if (u.includes('COUPE')) return 'COUPE';
  return u;
}

export function normalizeFuelType(val?: string): string {
  if (!val) return 'GASOLINE';
  const u = val.trim().toUpperCase();
  if (u.includes('XĂNG') || u.includes('GAS')) return 'GASOLINE';
  if (u.includes('DẦU') || u.includes('DIESEL')) return 'DIESEL';
  if (u.includes('ĐIỆN') || u.includes('ELECTRIC')) return 'ELECTRIC';
  if (u.includes('HYBRID')) return 'HYBRID';
  return u;
}

export function normalizeTransmission(val?: string): string {
  if (!val) return 'AUTOMATIC';
  const u = val.trim().toUpperCase();
  if (u.includes('SÀN') || u.includes('MANUAL')) return 'MANUAL';
  return 'AUTOMATIC';
}

interface QuickListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: QuickListingData;
  initialFiles: File[];
  onAddFiles?: (files: File[]) => void;
}

export function QuickListingModal({
  isOpen,
  onClose,
  initialData,
  initialFiles,
  onAddFiles,
}: QuickListingModalProps) {
  const { user, isLoggedIn } = useCurrentUser();

  // 1. Seller Information State (Tự động nhận diện từ tài khoản người dùng đã đăng nhập)
  const sellerType: 'INDIVIDUAL' | 'SHOWROOM' =
    user?.account_type === 'SHOWROOM' || Boolean(user?.showroom) ? 'SHOWROOM' : 'INDIVIDUAL';
  const showroomName = user?.showroom?.name || '';
  const showroomPhone = user?.showroom?.phone || user?.phone || user?.phone_number || '';

  // 2. Location & Address State
  const [provinceCode, setProvinceCode] = useState<string>('01');
  const [locationAddress, setLocationAddress] = useState<string>('');

  // 3. Commitments State
  const [isOwner, setIsOwner] = useState(true);
  const [maintenanceHistory, setMaintenanceHistory] = useState(true);
  const [noAccidentFlood, setNoAccidentFlood] = useState(true);
  const [readyInspection, setReadyInspection] = useState(true);

  // 4. Listing Form State
  const [priceVnd, setPriceVnd] = useState<number>(initialData.estimatedPriceVnd);
  const [title, setTitle] = useState(
    initialData.suggestedTitle ||
      `Bán xe ${initialData.brand} ${initialData.model} ${initialData.trim ? initialData.trim + ' ' : ''}${initialData.year} ${initialData.color || ''}`.trim()
  );
  const [description, setDescription] = useState(
    initialData.suggestedDescription ||
      `Xe ${initialData.brand} ${initialData.model} sản xuất năm ${initialData.year}, số km đã đi ${initialData.odometerKm.toLocaleString('vi-VN')} km. Hộp số ${initialData.transmission === 'AUTOMATIC' ? 'Tự động' : 'Số sàn'}, máy ${initialData.fuelType === 'GASOLINE' ? 'Xăng' : 'Dầu'}, xe sử dụng giữ gìn, bảo dưỡng định kỳ chính hãng, sẵn sàng giao dịch.`
  );

  // 5. Guided Photo Slots & Extra Photos State
  const [slotPhotos, setSlotPhotos] = useState<Record<string, { file: File; previewUrl: string } | null>>({
    front: null,
    front_34: null,
    rear: null,
    cockpit: null,
    odo: null,
    seats: null,
    engine: null,
    inspection_sticker: null,
  });
  const [extraPhotos, setExtraPhotos] = useState<{ file: File; previewUrl: string }[]>([]);
  const batchFileInputRef = useRef<HTMLInputElement>(null);
  const extraFileInputRef = useRef<HTMLInputElement>(null);
  const slotInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // 6. Submission State
  const [submitting, setSubmitting] = useState(false);
  const [submitStatusText, setSubmitStatusText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdListingId, setCreatedListingId] = useState<string | null>(null);

  // Sync previews whenever initialFiles change (e.g. from AI scan in valuation card)
  useEffect(() => {
    if (initialFiles && initialFiles.length > 0) {
      const keys = GUIDED_PHOTO_SLOTS.map((s) => s.key);
      const newSlots: Record<string, { file: File; previewUrl: string } | null> = {
        front: null,
        front_34: null,
        rear: null,
        cockpit: null,
        odo: null,
        seats: null,
        engine: null,
        inspection_sticker: null,
      };
      const newExtra: { file: File; previewUrl: string }[] = [];

      initialFiles.forEach((file, idx) => {
        const previewUrl = URL.createObjectURL(file);
        if (idx < keys.length) {
          newSlots[keys[idx]] = { file, previewUrl };
        } else {
          newExtra.push({ file, previewUrl });
        }
      });
      setSlotPhotos(newSlots);
      setExtraPhotos(newExtra);
    }
  }, [initialFiles]);

  const activeSlotPhotosList = useMemo(() => {
    return GUIDED_PHOTO_SLOTS.map((slot) => {
      const item = slotPhotos[slot.key];
      return item ? { ...item, slotKey: slot.key, label: slot.label, isPrimary: slot.isPrimary } : null;
    }).filter(Boolean) as { file: File; previewUrl: string; slotKey: string; label: string; isPrimary?: boolean }[];
  }, [slotPhotos]);

  const totalPhotosCount = activeSlotPhotosList.length + extraPhotos.length;

  useEffect(() => {
    setPriceVnd(initialData.estimatedPriceVnd);
    if (initialData.suggestedDescription) {
      setDescription(initialData.suggestedDescription);
    }
    setTitle(
      initialData.suggestedTitle ||
        `Bán xe ${initialData.brand} ${initialData.model} ${initialData.trim ? initialData.trim + ' ' : ''}${initialData.year} ${initialData.color || ''}`.trim()
    );
  }, [initialData]);

  if (!isOpen) return null;

  // Handle address change with smart province auto-detection
  const handleAddressChange = (addr: string) => {
    setLocationAddress(addr);
    const detected = detectProvinceFromText(addr);
    if (detected) {
      setProvinceCode(detected);
    }
  };

  const handleSlotPhotoUpload = (slotKey: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const previewUrl = URL.createObjectURL(file);
      setSlotPhotos((prev) => ({
        ...prev,
        [slotKey]: { file, previewUrl },
      }));
      if (onAddFiles) onAddFiles([file]);
      e.target.value = '';
    }
  };

  const handleRemoveSlotPhoto = (slotKey: string) => {
    setSlotPhotos((prev) => ({
      ...prev,
      [slotKey]: null,
    }));
  };

  const handleBatchUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const incoming = Array.from(e.target.files).filter((f) => f.type.startsWith('image/'));
      setSlotPhotos((prev) => {
        const nextSlots = { ...prev };
        const keys = GUIDED_PHOTO_SLOTS.map((s) => s.key);
        let incomingIdx = 0;

        for (const k of keys) {
          if (!nextSlots[k] && incomingIdx < incoming.length) {
            const file = incoming[incomingIdx++];
            nextSlots[k] = { file, previewUrl: URL.createObjectURL(file) };
          }
        }

        if (incomingIdx < incoming.length) {
          const remaining = incoming.slice(incomingIdx).map((file) => ({
            file,
            previewUrl: URL.createObjectURL(file),
          }));
          setExtraPhotos((old) => [...old, ...remaining].slice(0, 10));
        }

        return nextSlots;
      });
      if (onAddFiles) onAddFiles(incoming);
      e.target.value = '';
    }
  };

  const handleAddExtraPhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newItems = Array.from(e.target.files)
        .filter((f) => f.type.startsWith('image/'))
        .map((file) => ({ file, previewUrl: URL.createObjectURL(file) }));
      setExtraPhotos((prev) => [...prev, ...newItems].slice(0, 10));
      if (onAddFiles) onAddFiles(newItems.map((item) => item.file));
      e.target.value = '';
    }
  };

  const handleRemoveExtraPhoto = (index: number) => {
    setExtraPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!isLoggedIn) {
      setErrorMessage('Vui lòng đăng nhập tài khoản trước khi đăng tin bán xe.');
      return;
    }

    if (!locationAddress.trim()) {
      setErrorMessage('Vui lòng nhập địa chỉ chi tiết nơi xem xe (Số nhà, tên đường, quận/huyện).');
      return;
    }

    if (totalPhotosCount === 0) {
      setErrorMessage('Vui lòng tải lên ít nhất 1 ảnh thực tế của xe (ưu tiên góc Đầu xe chính diện) để hoàn tất đăng tin.');
      return;
    }

    if (priceVnd <= 0) {
      setErrorMessage('Giá bán xe phải lớn hơn 0.');
      return;
    }

    // Collect all photos with labels in priority order
    const allUploadItems: { file: File; label: string; isPrimary: boolean }[] = [
      ...activeSlotPhotosList.map((item) => ({
        file: item.file,
        label: item.label,
        isPrimary: item.isPrimary || false,
      })),
      ...extraPhotos.map((item, idx) => ({
        file: item.file,
        label: `Ảnh chi tiết bổ sung ${idx + 1}`,
        isPrimary: false,
      })),
    ];

    setSubmitting(true);
    setSubmitStatusText('Đang xác thực thông số và danh mục xe...');

    try {
      // 1. Resolve Brand and Model UUIDs
      const resolved = await api.resolveBrandModel({
        brand_name: initialData.brand,
        model_name: initialData.model,
        body_type: initialData.bodyType || 'SEDAN',
      });

      if (!resolved?.brand_id) {
        throw new Error('Không thể đồng bộ danh mục xe trên hệ thống.');
      }

      // 2. Upload Photos with Guided Labels
      let mediaItems: any[] = [];
      if (allUploadItems.length > 0) {
        setSubmitStatusText(`Đang tải lên ${allUploadItems.length} ảnh xe thực tế có nhãn góc chụp...`);
        try {
          const filesToUpload = allUploadItems.map((item) => item.file);
          const uploadRes = await api.uploadMultipleMedia(filesToUpload);
          if (Array.isArray(uploadRes)) {
            mediaItems = uploadRes.map((item, idx) => ({
              url: item.secure_url || item.url,
              thumbnail_url: item.thumbnail_url || item.url,
              media_type: 'IMAGE',
              is_primary: idx === 0,
              sort_order: idx,
              label: allUploadItems[idx]?.label || undefined,
            }));
          }
        } catch (uploadErr: any) {
          console.error('Lỗi tải ảnh:', uploadErr);
          throw new Error(uploadErr?.message || 'Không thể tải ảnh xe lên hệ thống. Vui lòng thử lại.');
        }
      }

      // 3. Assemble commitments array
      const commitmentsArray: string[] = [];
      if (isOwner) commitmentsArray.push('Cam kết xe chính chủ đứng tên cavet');
      if (maintenanceHistory) commitmentsArray.push('Bảo dưỡng định kỳ đầy đủ tại hãng');
      if (noAccidentFlood) commitmentsArray.push('Cam kết xe không đâm đụng hay ngập nước');
      if (readyInspection) commitmentsArray.push('Sẵn sàng mang xe test hãng toàn quốc');
      if (commitmentsArray.length === 0) {
        commitmentsArray.push(
          'Cam kết xe không đâm đụng, tai nạn ảnh hưởng kết cấu khung gầm',
          'Cam kết động cơ và hộp số nguyên bản, không ngập nước hay thủy kích',
          'Giấy tờ pháp lý minh bạch, sẵn sàng sang tên đổi chủ'
        );
      }

      // 4. Create Listing Payload
      setSubmitStatusText('Đang khởi tạo tin đăng bán xe...');
      const payload: any = {
        seller_type: sellerType || user?.account_type || 'INDIVIDUAL',
        custom_showroom_name: sellerType === 'SHOWROOM' ? showroomName.trim() : undefined,
        custom_showroom_phone: sellerType === 'SHOWROOM' ? showroomPhone.trim() : undefined,
        brand_id: resolved.brand_id,
        model_id: resolved.model_id,
        title: title.trim(),
        price_vnd: priceVnd,
        manufacture_year: initialData.year,
        odometer_km: initialData.odometerKm,
        condition: initialData.condition === 'NEW' ? 'NEW' : 'USED',
        body_type: normalizeBodyType(initialData.bodyType),
        fuel_type: normalizeFuelType(initialData.fuelType),
        transmission: normalizeTransmission(initialData.transmission),
        origin: initialData.origin || 'Lắp ráp trong nước',
        color: initialData.color || 'Trắng',
        interior_color: initialData.interiorColor || 'Đen Da Cao Cấp',
        seats: initialData.seats || 5,
        doors: initialData.doors || 4,
        engine_displacement: initialData.engineDisplacement
          ? parseFloat(initialData.engineDisplacement)
          : undefined,
        province_code: provinceCode || '01',
        location_address: locationAddress.trim(),
        description: description.trim(),
        media: mediaItems,
        commitments: commitmentsArray,
        accident_status: normalizeAccidentStatus(initialData.vehicleHistory?.accidentStatus),
        flood_status: normalizeFloodStatus(initialData.vehicleHistory?.floodStatus),
        service_history: normalizeServiceHistory(initialData.vehicleHistory?.serviceHistory),
        owner_count: normalizeIntCount(initialData.vehicleHistory?.ownerCount, 1, 20),
        repainted_parts_count: normalizeIntCount(initialData.vehicleHistory?.repaintedPartsCount, 0, 50),
        replaced_parts: initialData.vehicleHistory?.replacedParts || undefined,
        engine_repaired: Boolean(initialData.vehicleHistory?.engineRepaired),
        transmission_repaired: Boolean(initialData.vehicleHistory?.transmissionRepaired),
      };

      const res = await api.createListing(payload);
      if (res?.data?.id) {
        setCreatedListingId(res.data.id);
      } else {
        throw new Error(res?.message || 'Không thể hoàn tất đăng tin.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Đã có lỗi xảy ra khi xuất bản tin đăng xe.');
    } finally {
      setSubmitting(false);
      setSubmitStatusText('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto bg-white rounded-3xl shadow-2xl border border-[#eae8e3] text-[#1a1c1a]">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-5 sm:p-6 border-b border-[#eae8e3] bg-white/95 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#b89b72]/15 text-[#b89b72] flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold font-display text-base sm:text-lg text-[#1a1c1a]">
                Bổ Sung Thông Tin Để Đăng Bán Ngay
              </h3>
              <p className="text-[11px] text-[#777]">
                Thông số kỹ thuật xe từ phần định giá đã được tự động điền sẵn
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#777] hover:text-[#1a1c1a] hover:bg-[#f4f3f0] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Screen */}
        {createdListingId ? (
          <div className="p-8 sm:p-10 text-center space-y-6 animate-in fade-in duration-300">
            <div className="w-16 h-16 rounded-2xl bg-secondary-container text-secondary mx-auto flex items-center justify-center shadow-xs">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-1.5">
              <h4 className="font-display text-2xl font-bold text-[#1a1c1a]">
                Xuất Bản Tin Đăng Xe Thành Công!
              </h4>
              <p className="text-xs sm:text-sm text-[#666] max-w-md mx-auto">
                Chiếc xe <strong>{title}</strong> với giá{' '}
                <strong>{formatVND(priceVnd)}</strong> đã được đưa lên sàn AuraAuto.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#faf9f6] border border-[#eae8e3] max-w-md mx-auto text-xs text-left space-y-2.5">
              <div className="flex justify-between">
                <span className="text-[#777]">Dòng xe:</span>
                <span className="font-semibold">{initialData.brand} {initialData.model}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#777]">Năm &amp; ODO:</span>
                <span className="font-semibold">{initialData.year} • {initialData.odometerKm.toLocaleString('vi-VN')} km</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#777]">Màu sắc:</span>
                <span className="font-semibold">{initialData.color || 'Tiêu chuẩn'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#777]">Địa chỉ xem xe:</span>
                <span className="font-semibold truncate max-w-[200px]">{locationAddress}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#777]">Hình ảnh:</span>
                <span className="font-semibold text-secondary">{totalPhotosCount} ảnh thực tế có nhãn</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href={`/xe/${createdListingId}`}
                className="px-6 py-3 rounded-xl bg-[#1a1c1a] hover:bg-[#b89b72] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-colors"
              >
                <span>Xem tin vừa đăng</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 rounded-xl border border-[#eae8e3] bg-white hover:bg-[#f4f3f0] text-xs font-semibold text-[#555] transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        ) : (
          /* Form Content */
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-6">
            {/* Login Warning Banner if not logged in */}
            {!isLoggedIn && (
              <div className="p-4 rounded-xl bg-secondary-container/50 border border-secondary/30 text-on-secondary-container text-xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-secondary shrink-0" />
                  <span>Bạn chưa đăng nhập. Vui lòng đăng nhập để xuất bản tin xe.</span>
                </div>
                <Link
                  href="/dang-nhap?redirect=/dinh-gia-ai"
                  className="px-3.5 py-1.5 rounded-lg bg-secondary hover:bg-on-secondary-fixed text-on-secondary font-semibold text-[11px] shrink-0 flex items-center gap-1 shadow-xs"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Đăng nhập</span>
                </Link>
              </div>
            )}

            {errorMessage && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Pre-filled Specs Summary Badge */}
            <div className="p-4 rounded-2xl bg-[#faf9f6] border border-[#eae8e3] space-y-2.5">
              <span className="text-[10px] font-bold text-[#b89b72] uppercase tracking-wider block">
                Thông số kỹ thuật xe đã được đồng bộ từ kết quả định giá
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <div>
                  <span className="text-[#888] block text-[10px]">Hãng &amp; Dòng xe</span>
                  <span className="font-semibold text-[#1a1c1a]">{initialData.brand} {initialData.model}</span>
                </div>
                <div>
                  <span className="text-[#888] block text-[10px]">Đời xe &amp; Số ODO</span>
                  <span className="font-semibold text-[#1a1c1a]">{initialData.year} • {initialData.odometerKm.toLocaleString('vi-VN')} km</span>
                </div>
                <div>
                  <span className="text-[#888] block text-[10px]">Kiểu dáng &amp; Hộp số</span>
                  <span className="font-semibold text-[#1a1c1a]">
                    {initialData.bodyType} • {initialData.transmission}
                  </span>
                </div>
                <div>
                  <span className="text-[#888] block text-[10px]">Nhiên liệu &amp; Xuất xứ</span>
                  <span className="font-semibold text-[#1a1c1a]">
                    {initialData.fuelType} • {initialData.origin}
                  </span>
                </div>
              </div>
            </div>

            {/* THÔNG TIN TÀI KHOẢN NGƯỜI ĐĂNG (TỰ ĐỘNG THEO PROFILE) */}
            {sellerType === 'SHOWROOM' && (
              <div className="p-3.5 rounded-2xl bg-secondary-container/30 border border-secondary/30 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <Building className="w-4 h-4 text-[#725a37]" />
                  <span className="font-semibold text-[#1a1c1a]">
                    Đăng tin từ tài khoản Showroom: <span className="text-[#725a37] font-bold">{showroomName || 'Salon / Đối tác'}</span>
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-white text-[10px] font-bold text-[#725a37] border border-[#b89b72]/30">
                  Doanh nghiệp
                </span>
              </div>
            )}

            {/* BỔ SUNG 1: TỈNH / THÀNH PHỐ & ĐỊA CHỈ XEM XE */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-[#1a1c1a]">
                1. Khu vực &amp; Địa chỉ xem xe thực tế <span className="text-red-500">*</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Tỉnh / Thành phố Selector */}
                <div>
                  <label className="block text-[11px] font-semibold text-[#555] mb-1">
                    Tỉnh / Thành phố *
                  </label>
                  <select
                    value={provinceCode}
                    onChange={(e) => setProvinceCode(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-[#eae8e3] text-xs focus:border-[#b89b72] focus:ring-2 focus:ring-[#b89b72]/20 outline-none bg-white font-medium"
                  >
                    {LOCATION_GROUPS.map((group) => (
                      <optgroup key={group.label} label={group.label}>
                        {group.options.map((opt) => (
                          <option key={opt.code} value={opt.code}>
                            {opt.name}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                {/* Specific Address Input */}
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-[#555] mb-1">
                    Địa chỉ chi tiết nơi xem xe *
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-[#b89b72] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={locationAddress}
                      onChange={(e) => handleAddressChange(e.target.value)}
                      placeholder="VD: Số 18 đường Phạm Hùng, Mỹ Đình, Nam Từ Liêm"
                      className="w-full h-11 pl-9 pr-3 rounded-xl border border-[#eae8e3] text-xs focus:border-[#b89b72] focus:ring-2 focus:ring-[#b89b72]/20 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* BỔ SUNG 2: CAM KẾT CHẤT LƯỢNG CỦA CHỦ XE */}
            <div className="space-y-2.5">
              <label className="block text-xs font-bold text-[#1a1c1a]">
                2. Cam kết chất lượng của người bán xe
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <label className="flex items-center gap-2.5 p-3 rounded-xl border border-[#eae8e3] hover:bg-[#faf9f6] transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isOwner}
                    onChange={(e) => setIsOwner(e.target.checked)}
                    className="w-4 h-4 rounded accent-[#b89b72] cursor-pointer"
                  />
                  <span className="text-xs">Xe chính chủ đứng tên cavet</span>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-xl border border-[#eae8e3] hover:bg-[#faf9f6] transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={maintenanceHistory}
                    onChange={(e) => setMaintenanceHistory(e.target.checked)}
                    className="w-4 h-4 rounded accent-[#b89b72] cursor-pointer"
                  />
                  <span className="text-xs">Bảo dưỡng định kỳ hãng đầy đủ</span>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-xl border border-[#eae8e3] hover:bg-[#faf9f6] transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={noAccidentFlood}
                    onChange={(e) => setNoAccidentFlood(e.target.checked)}
                    className="w-4 h-4 rounded accent-[#b89b72] cursor-pointer"
                  />
                  <span className="text-xs">Cam kết không đâm đụng, thủy kích</span>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-xl border border-[#eae8e3] hover:bg-[#faf9f6] transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={readyInspection}
                    onChange={(e) => setReadyInspection(e.target.checked)}
                    className="w-4 h-4 rounded accent-[#b89b72] cursor-pointer"
                  />
                  <span className="text-xs">Sẵn sàng mang xe test hãng toàn quốc</span>
                </label>
              </div>
            </div>

            {/* BỔ SUNG 3: HÌNH ẢNH XE THỰC TẾ THEO KHUNG NHÃN */}
            <div className="space-y-3 pt-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#eae8e3] pb-2.5">
                <div>
                  <label className="block text-xs font-bold text-[#1a1c1a]">
                    3. Khung nhãn hình ảnh xe ({totalPhotosCount} ảnh đã chọn) <span className="text-red-500">*</span>
                  </label>
                  <p className="text-[11px] text-[#777]">
                    Tải ảnh vào các khung nhãn góc chụp tiêu chuẩn dưới đây để tin đăng chuyên nghiệp và thu hút người mua nhất
                  </p>
                </div>

                {/* Batch Upload Button */}
                <div className="shrink-0">
                  <input
                    ref={batchFileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handleBatchUpload}
                  />
                  <button
                    type="button"
                    onClick={() => batchFileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-xl border border-[#b89b72] bg-[#b89b72]/10 hover:bg-[#b89b72]/20 text-[#725a37] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Chọn nhiều ảnh cùng lúc, hệ thống sẽ tự động điền vào các khung nhãn"
                  >
                    <Upload className="w-3.5 h-3.5 text-[#b89b72]" />
                    <span>Tải nhanh nhiều ảnh</span>
                  </button>
                </div>
              </div>

              {/* 8 Guided Slot Frames Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {GUIDED_PHOTO_SLOTS.map((slot) => {
                  const photo = slotPhotos[slot.key];
                  return (
                    <div
                      key={slot.key}
                      className={`relative rounded-2xl overflow-hidden transition-all ${
                        photo
                          ? 'border border-[#eae8e3] bg-black shadow-2xs group'
                          : slot.isPrimary
                          ? 'border-2 border-dashed border-[#b89b72] bg-[#faf9f6] hover:bg-[#f4f3f0] ring-1 ring-[#b89b72]/20'
                          : 'border-2 border-dashed border-[#eae8e3] hover:border-[#b89b72] bg-[#faf9f6] hover:bg-[#f4f3f0]'
                      }`}
                    >
                      {/* Hidden input for this specific slot */}
                      <input
                        ref={(el) => {
                          slotInputRefs.current[slot.key] = el;
                        }}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleSlotPhotoUpload(slot.key, e)}
                      />

                      {photo ? (
                        /* Filled Slot */
                        <div className="relative aspect-[4/3] w-full">
                          <img
                            src={photo.previewUrl}
                            alt={slot.label}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

                          {/* Top Badges */}
                          <div className="absolute top-1.5 left-1.5 flex items-center gap-1">
                            {slot.isPrimary && (
                              <span className="px-1.5 py-0.5 rounded-md bg-secondary text-on-secondary text-[9px] font-bold shadow-2xs">
                                Ảnh bìa
                              </span>
                            )}
                            <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] shadow-2xs">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </span>
                          </div>

                          {/* Bottom Label Badge */}
                          <div className="absolute bottom-1.5 left-1.5 right-1.5">
                            <span className="block text-[10px] font-semibold text-white bg-black/65 px-1.5 py-0.5 rounded backdrop-blur-xs truncate text-center">
                              {slot.label}
                            </span>
                          </div>

                          {/* Hover Actions Overlay */}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-2">
                            <button
                              type="button"
                              onClick={() => slotInputRefs.current[slot.key]?.click()}
                              className="px-2 py-1 rounded-lg bg-white/90 hover:bg-white text-[#1a1c1a] text-[10px] font-semibold flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
                              title="Thay đổi ảnh cho góc này"
                            >
                              <RotateCcw className="w-2.5 h-2.5" />
                              <span>Đổi</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveSlotPhoto(slot.key)}
                              className="p-1 rounded-lg bg-red-600/90 hover:bg-red-600 text-white shadow-sm transition-colors cursor-pointer"
                              title="Xóa ảnh góc này"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Empty Guided Slot */
                        <div
                          onClick={() => slotInputRefs.current[slot.key]?.click()}
                          className="aspect-[4/3] flex flex-col items-center justify-center p-2 text-center cursor-pointer transition-colors"
                        >
                          <div className="w-7 h-7 rounded-xl bg-white border border-[#eae8e3] text-[#725a37] flex items-center justify-center mb-1 shadow-2xs group-hover:border-[#b89b72]">
                            <span className="material-symbols-outlined text-[16px] text-secondary">
                              {slot.icon}
                            </span>
                          </div>

                          <span className="text-[11px] font-bold text-[#1a1c1a] leading-tight block truncate max-w-full px-1">
                            {slot.label}
                          </span>

                          {slot.isPrimary ? (
                            <span className="mt-0.5 text-[9px] font-bold text-red-600">
                              * Bắt buộc (Ảnh bìa)
                            </span>
                          ) : (
                            <span className="mt-0.5 text-[9px] text-[#888] line-clamp-1">
                              Bấm để tải ảnh
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Extra Photos Section */}
              <div className="pt-2">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-[#555]">Ảnh chi tiết bổ sung khác (tùy chọn)</span>
                  <input
                    ref={extraFileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handleAddExtraPhotos}
                  />
                  <button
                    type="button"
                    onClick={() => extraFileInputRef.current?.click()}
                    className="text-[11px] text-[#b89b72] hover:text-[#977b52] font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm ảnh bổ sung ({extraPhotos.length}/10)</span>
                  </button>
                </div>

                {extraPhotos.length > 0 && (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {extraPhotos.map((item, idx) => (
                      <div
                        key={idx}
                        className="relative aspect-square rounded-xl overflow-hidden border border-[#eae8e3] group bg-[#f4f3f0]"
                      >
                        <img src={item.previewUrl} alt={`Ảnh bổ sung ${idx + 1}`} className="w-full h-full object-cover" />
                        <span className="absolute bottom-1 left-1 text-[9px] font-medium text-white bg-black/60 px-1 py-0.2 rounded truncate max-w-[85%]">
                          Bổ sung {idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveExtraPhoto(idx)}
                          className="absolute top-1 right-1 p-1 rounded-full bg-black/60 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          title="Xóa ảnh này"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* BỔ SUNG 5: GIÁ BÁN NIÊM YẾT */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#1a1c1a]">
                5. Giá bán niêm yết <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  step="1000000"
                  value={priceVnd}
                  onChange={(e) => setPriceVnd(Number(e.target.value))}
                  className="w-full h-11 pl-4 pr-16 rounded-xl border border-[#eae8e3] text-sm font-mono font-bold focus:border-[#b89b72] focus:ring-2 focus:ring-[#b89b72]/20 outline-none"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#888]">
                  VNĐ
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                <span className="text-[#888] text-[11px]">Mức giá AI định giá:</span>
                <button
                  type="button"
                  onClick={() => setPriceVnd(initialData.estimatedPriceVnd)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                    priceVnd === initialData.estimatedPriceVnd
                      ? 'bg-secondary text-on-secondary shadow-xs'
                      : 'bg-surface-container-high text-primary hover:bg-surface-container-highest'
                  }`}
                >
                  Giá đề xuất: {formatVND(initialData.estimatedPriceVnd)}
                </button>
                {initialData.lowPriceVnd && (
                  <button
                    type="button"
                    onClick={() => setPriceVnd(initialData.lowPriceVnd!)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                      priceVnd === initialData.lowPriceVnd
                        ? 'bg-secondary text-on-secondary shadow-xs'
                        : 'bg-surface-container-high text-primary hover:bg-surface-container-highest'
                    }`}
                  >
                    Bán nhanh: {formatVND(initialData.lowPriceVnd)}
                  </button>
                )}
              </div>
            </div>

            {/* BỔ SUNG 6: TIÊU ĐỀ & MÔ TẢ TIN ĐĂNG */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#1a1c1a]">
                  6. Tiêu đề tin đăng bán xe <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-[#eae8e3] text-xs sm:text-sm focus:border-[#b89b72] focus:ring-2 focus:ring-[#b89b72]/20 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#1a1c1a]">
                  Mô tả chi tiết tình trạng xe
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3.5 rounded-xl border border-[#eae8e3] text-xs focus:border-[#b89b72] focus:ring-2 focus:ring-[#b89b72]/20 outline-none leading-relaxed"
                />
              </div>
            </div>

            {/* Submit Action Buttons */}
            <div className="pt-3 border-t border-[#eae8e3] flex flex-col sm:flex-row items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-[#eae8e3] hover:bg-[#f4f3f0] text-xs font-semibold text-[#555] transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>

              <button
                type="submit"
                disabled={submitting || !isLoggedIn}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#1a1c1a] hover:bg-[#b89b72] text-white font-bold text-xs transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#b89b72]" />
                    <span>{submitStatusText || 'Đang xuất bản tin...'}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-[#b89b72]" />
                    <span>Xác nhận xuất bản tin bán xe</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
