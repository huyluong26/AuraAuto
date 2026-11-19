'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { api } from '@/lib/api';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import {
  GUIDED_PHOTO_SLOTS,
  detectProvinceFromText,
} from '@/features/car-listing/constants';
import {
  normalizeAccidentStatus,
  normalizeFloodStatus,
  normalizeServiceHistory,
  normalizeIntCount,
  normalizeBodyType,
  normalizeFuelType,
  normalizeTransmission,
} from '@/features/car-listing/utils/normalizers';
import { QuickListingData } from '../types';

interface UseQuickListingFormProps {
  isOpen: boolean;
  initialData: QuickListingData;
  initialFiles: File[];
  onAddFiles?: (files: File[]) => void;
}

export function useQuickListingForm({
  isOpen,
  initialData,
  initialFiles,
}: UseQuickListingFormProps) {
  const { user, isLoggedIn } = useCurrentUser();

  const sellerType: 'INDIVIDUAL' | 'SHOWROOM' =
    user?.account_type === 'SHOWROOM' || Boolean(user?.showroom) ? 'SHOWROOM' : 'INDIVIDUAL';
  const showroomName = user?.showroom?.name || '';
  const showroomPhone = user?.showroom?.phone || user?.phone || user?.phone_number || '';

  const [provinceCode, setProvinceCode] = useState<string>('01');
  const [locationAddress, setLocationAddress] = useState<string>('');

  const [isOwner, setIsOwner] = useState(true);
  const [maintenanceHistory, setMaintenanceHistory] = useState(true);
  const [noAccidentFlood, setNoAccidentFlood] = useState(true);
  const [readyInspection, setReadyInspection] = useState(true);

  const [priceVnd, setPriceVnd] = useState<number>(initialData.estimatedPriceVnd);
  const [title, setTitle] = useState(
    initialData.suggestedTitle ||
      `Bán xe ${initialData.brand} ${initialData.model} ${initialData.trim ? initialData.trim + ' ' : ''}${initialData.year} ${initialData.color || ''}`.trim()
  );
  const [description, setDescription] = useState(
    initialData.suggestedDescription ||
      `Xe ${initialData.brand} ${initialData.model} sản xuất năm ${initialData.year}, số km đã đi ${initialData.odometerKm.toLocaleString('vi-VN')} km. Hộp số ${initialData.transmission === 'AUTOMATIC' ? 'Tự động' : 'Số sàn'}, máy ${initialData.fuelType === 'GASOLINE' ? 'Xăng' : 'Dầu'}, xe sử dụng giữ gìn, bảo dưỡng định kỳ chính hãng, sẵn sàng giao dịch.`
  );

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

  const [submitting, setSubmitting] = useState(false);
  const [submitStatusText, setSubmitStatusText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdListingId, setCreatedListingId] = useState<string | null>(null);

  const hasInitializedRef = useRef(false);

  useEffect(() => {
    if (isOpen && !hasInitializedRef.current) {
      hasInitializedRef.current = true;
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
    } else if (!isOpen) {
      hasInitializedRef.current = false;
    }
  }, [isOpen, initialFiles]);

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
      e.target.value = '';
    }
  };

  const handleAddExtraPhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newItems = Array.from(e.target.files)
        .filter((f) => f.type.startsWith('image/'))
        .map((file) => ({ file, previewUrl: URL.createObjectURL(file) }));
      setExtraPhotos((prev) => [...prev, ...newItems].slice(0, 10));
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
      const resolved = await api.resolveBrandModel({
        brand_name: initialData.brand,
        model_name: initialData.model,
        body_type: initialData.bodyType || 'SEDAN',
      });

      if (!resolved?.brand_id) {
        throw new Error('Không thể đồng bộ danh mục xe trên hệ thống.');
      }

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

  return {
    user,
    isLoggedIn,
    sellerType,
    showroomName,
    provinceCode,
    setProvinceCode,
    locationAddress,
    handleAddressChange,
    isOwner,
    setIsOwner,
    maintenanceHistory,
    setMaintenanceHistory,
    noAccidentFlood,
    setNoAccidentFlood,
    readyInspection,
    setReadyInspection,
    priceVnd,
    setPriceVnd,
    title,
    setTitle,
    description,
    setDescription,
    slotPhotos,
    extraPhotos,
    batchFileInputRef,
    extraFileInputRef,
    slotInputRefs,
    submitting,
    submitStatusText,
    errorMessage,
    createdListingId,
    totalPhotosCount,
    handleSlotPhotoUpload,
    handleRemoveSlotPhoto,
    handleBatchUpload,
    handleAddExtraPhotos,
    handleRemoveExtraPhoto,
    handleSubmit,
  };
}
