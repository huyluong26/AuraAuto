'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { BrandItem, ModelItem } from '../types';

export interface EditableMedia {
  id?: string;
  url: string;
  thumbnail_url?: string | null;
  is_primary: boolean;
  label?: string;
  sort_order?: number;
  file?: File;
}

export const PHOTO_LABEL_OPTIONS = [
  'Đầu xe chính diện',
  'Góc chéo trước 3/4',
  'Đuôi xe chính diện',
  'Khoang lái toàn cảnh',
  'Đồng hồ ODO',
  'Hàng ghế ngồi',
  'Khoang máy động cơ',
  'Tem đăng kiểm & Giấy tờ',
  'Cửa sổ trời & Trần xe',
  'Cốp sau khoang hành lý',
  'La-zăng & Lốp xe',
  'Chi tiết nội thất khác',
];

interface UseEditListingFormProps {
  listingId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function useEditListingForm({ listingId, onClose, onSuccess }: UseEditListingFormProps) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tabs: 'SPECS' | 'COMMITMENTS' | 'PRICING_LOCATION' | 'PHOTOS'
  const [activeTab, setActiveTab] = useState<'SPECS' | 'COMMITMENTS' | 'PRICING_LOCATION' | 'PHOTOS'>('SPECS');

  // Catalog
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [models, setModels] = useState<ModelItem[]>([]);

  // Core listing state
  const [listingStatus, setListingStatus] = useState<string>('PUBLISHED');
  const [hasPendingRevision, setHasPendingRevision] = useState<boolean>(false);
  const [revisionNo, setRevisionNo] = useState<number>(1);

  // Step 1: Specifications
  const [title, setTitle] = useState('');
  const [brandId, setBrandId] = useState('');
  const [modelId, setModelId] = useState('');
  const [variantId, setVariantId] = useState<string | undefined>(undefined);
  const [manufactureYear, setManufactureYear] = useState<number>(2020);
  const [bodyType, setBodyType] = useState('Sedan');
  const [fuelType, setFuelType] = useState('GASOLINE');
  const [transmission, setTransmission] = useState('AUTOMATIC');
  const [odometerKm, setOdometerKm] = useState<string>('0');
  const [origin, setOrigin] = useState('Lắp ráp trong nước');
  const [color, setColor] = useState('Trắng');
  const [interiorColor, setInteriorColor] = useState('Đen');
  const [seats, setSeats] = useState<number>(5);
  const [doors, setDoors] = useState<number>(4);
  const [condition, setCondition] = useState('USED');
  const [licensePlate, setLicensePlate] = useState('');
  const [vin, setVin] = useState('');

  // Step 2: Commitments & History
  const [accidentStatus, setAccidentStatus] = useState<'UNKNOWN' | 'NONE' | 'MINOR' | 'MAJOR'>('NONE');
  const [floodStatus, setFloodStatus] = useState<'UNKNOWN' | 'NONE' | 'SUSPECTED' | 'CONFIRMED'>('NONE');
  const [serviceHistory, setServiceHistory] = useState<'UNKNOWN' | 'NONE' | 'PARTIAL' | 'FULL'>('FULL');
  const [ownerCount, setOwnerCount] = useState<number>(1);
  const [repaintedPartsCount, setRepaintedPartsCount] = useState<number>(0);
  const [replacedParts, setReplacedParts] = useState('');
  const [engineRepaired, setEngineRepaired] = useState(false);
  const [transmissionRepaired, setTransmissionRepaired] = useState(false);

  // Step 3: Price, Location & Description
  const [priceVnd, setPriceVnd] = useState<string>('0');
  const [provinceCode, setProvinceCode] = useState('01');
  const [locationAddress, setLocationAddress] = useState('');
  const [description, setDescription] = useState('');

  // Step 4: Media
  const [mediaList, setMediaList] = useState<EditableMedia[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  // Load listing editable data & catalog
  useEffect(() => {
    let mounted = true;
    async function initData() {
      try {
        setLoading(true);
        setError(null);

        const [brandList, editData] = await Promise.all([
          api.getBrands().catch(() => []),
          api.getEditableListing(listingId),
        ]);

        if (!mounted) return;
        setBrands(brandList);

        if (editData) {
          setListingStatus(editData.status || 'PUBLISHED');
          setHasPendingRevision(Boolean(editData.has_pending_revision));
          setRevisionNo(editData.revision_no || 1);

          setTitle(editData.title || '');
          setBrandId(editData.brand_id || '');
          setModelId(editData.model_id || '');
          setVariantId(editData.variant_id || undefined);
          setManufactureYear(editData.manufacture_year || 2020);
          setBodyType(editData.body_type || 'Sedan');
          setFuelType(editData.fuel_type || 'GASOLINE');
          setTransmission(editData.transmission || 'AUTOMATIC');
          setOdometerKm(String(editData.odometer_km || 0));
          setOrigin(editData.origin || 'Lắp ráp trong nước');
          setColor(editData.color || 'Trắng');
          setInteriorColor(editData.interior_color || 'Đen');
          setSeats(editData.seats || 5);
          setDoors(editData.doors || 4);
          setCondition(editData.condition || 'USED');
          setLicensePlate(editData.license_plate || '');
          setVin(editData.vin || '');

          setAccidentStatus(editData.accident_status || 'NONE');
          setFloodStatus(editData.flood_status || 'NONE');
          setServiceHistory(editData.service_history || 'FULL');
          setOwnerCount(editData.owner_count || 1);
          setRepaintedPartsCount(editData.repainted_parts_count || 0);
          setReplacedParts(editData.replaced_parts || '');
          setEngineRepaired(Boolean(editData.engine_repaired));
          setTransmissionRepaired(Boolean(editData.transmission_repaired));

          setPriceVnd(String(editData.price_vnd || 0));
          setProvinceCode(editData.province_code || '01');
          setLocationAddress(editData.location_address || '');
          setDescription(editData.description || '');

          if (Array.isArray(editData.media)) {
            setMediaList(
              editData.media.map((m: any, idx: number) => ({
                id: m.id,
                url: m.url,
                thumbnail_url: m.thumbnail_url,
                is_primary: m.is_primary ?? idx === 0,
                label: m.label || `Góc chụp #${idx + 1}`,
                sort_order: m.sort_order ?? idx,
              }))
            );
          }

          if (editData.brand_id) {
            const modelList = await api.getModelsByBrand(editData.brand_id).catch(() => []);
            if (mounted) setModels(modelList);
          }
        }
      } catch (err: any) {
        if (mounted) {
          setError(err.message || 'Không thể tải thông tin tin đăng để chỉnh sửa.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initData();
    return () => {
      mounted = false;
    };
  }, [listingId]);

  const handleBrandChange = async (newBrandId: string) => {
    setBrandId(newBrandId);
    setModelId('');
    if (!newBrandId) {
      setModels([]);
      return;
    }
    try {
      const modelList = await api.getModelsByBrand(newBrandId);
      setModels(modelList);
    } catch {
      setModels([]);
    }
  };

  const handleUploadPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploadingPhotos(true);
      const fileList = Array.from(files);
      const uploadRes = await api.uploadMultipleMedia(fileList);

      if (Array.isArray(uploadRes)) {
        const newMediaItems: EditableMedia[] = uploadRes.map((item, idx) => ({
          url: item.secure_url || item.url,
          thumbnail_url: item.thumbnail_url || item.url,
          is_primary: mediaList.length === 0 && idx === 0,
          label: PHOTO_LABEL_OPTIONS[idx % PHOTO_LABEL_OPTIONS.length] || `Góc chụp mới #${idx + 1}`,
          sort_order: mediaList.length + idx,
        }));
        setMediaList((prev) => [...prev, ...newMediaItems]);
      }
    } catch (err: any) {
      alert(err.message || 'Lỗi khi tải ảnh lên. Vui lòng thử lại.');
    } finally {
      setUploadingPhotos(false);
      e.target.value = '';
    }
  };

  const handleDeletePhoto = (index: number) => {
    setMediaList((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      if (updated.length > 0 && !updated.some((m) => m.is_primary)) {
        updated[0].is_primary = true;
      }
      return updated;
    });
  };

  const handleSetPrimary = (index: number) => {
    setMediaList((prev) =>
      prev.map((item, idx) => ({
        ...item,
        is_primary: idx === index,
      }))
    );
  };

  const handleUpdateLabel = (index: number, newLabel: string) => {
    setMediaList((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, label: newLabel } : item))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || title.trim().length < 5) {
      alert('Vui lòng nhập tiêu đề tin đăng tối thiểu 5 ký tự.');
      setActiveTab('SPECS');
      return;
    }
    const cleanPrice = parseInt(priceVnd.replace(/\D/g, ''), 10);
    if (!cleanPrice || cleanPrice < 10_000_000) {
      alert('Vui lòng nhập giá bán hợp lệ (tối thiểu 10.000.000 VNĐ).');
      setActiveTab('PRICING_LOCATION');
      return;
    }
    if (mediaList.length === 0) {
      alert('Vui lòng giữ lại hoặc tải lên ít nhất 1 hình ảnh phương tiện.');
      setActiveTab('PHOTOS');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        brand_id: brandId,
        model_id: modelId,
        variant_id: variantId || undefined,
        title: title.trim(),
        price_vnd: cleanPrice,
        manufacture_year: Number(manufactureYear),
        odometer_km: parseInt(String(odometerKm).replace(/\D/g, ''), 10) || 0,
        mileage_unknown: false,
        condition: condition,
        body_type: bodyType,
        fuel_type: fuelType,
        transmission: transmission,
        origin: origin,
        color: color.trim() || 'Trắng',
        interior_color: interiorColor.trim() || 'Đen',
        seats: Number(seats) || 5,
        doors: Number(doors) || 4,
        province_code: provinceCode,
        location_address: locationAddress.trim() || undefined,
        vin: vin.trim() || undefined,
        license_plate: licensePlate.trim() || undefined,
        description: description.trim() || undefined,
        accident_status: accidentStatus,
        flood_status: floodStatus,
        service_history: serviceHistory,
        owner_count: Number(ownerCount) || 1,
        repainted_parts_count: Number(repaintedPartsCount) || 0,
        replaced_parts: replacedParts.trim() || undefined,
        engine_repaired: engineRepaired,
        transmission_repaired: transmissionRepaired,
        media: mediaList.map((m, idx) => ({
          url: m.url,
          thumbnail_url: m.thumbnail_url || m.url,
          media_type: 'IMAGE',
          is_primary: m.is_primary,
          sort_order: idx,
          label: m.label || `Góc chụp #${idx + 1}`,
        })),
      };

      await api.updateListing(listingId, payload);
      alert(
        'Đã gửi bản chỉnh sửa tin đăng xe thành công!\n\nTrong lúc đợi Ban Quản Trị phê duyệt, tin đăng vẫn tiếp tục hiển thị bình thường trên sàn với thông tin hiện tại.'
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi cập nhật tin đăng. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return {
    loading,
    submitting,
    error,
    activeTab,
    setActiveTab,
    brands,
    models,
    listingStatus,
    hasPendingRevision,
    revisionNo,
    title,
    setTitle,
    brandId,
    setBrandId,
    modelId,
    setModelId,
    variantId,
    setVariantId,
    manufactureYear,
    setManufactureYear,
    bodyType,
    setBodyType,
    fuelType,
    setFuelType,
    transmission,
    setTransmission,
    odometerKm,
    setOdometerKm,
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
    condition,
    setCondition,
    licensePlate,
    setLicensePlate,
    vin,
    setVin,
    accidentStatus,
    setAccidentStatus,
    floodStatus,
    setFloodStatus,
    serviceHistory,
    setServiceHistory,
    ownerCount,
    setOwnerCount,
    repaintedPartsCount,
    setRepaintedPartsCount,
    replacedParts,
    setReplacedParts,
    engineRepaired,
    setEngineRepaired,
    transmissionRepaired,
    setTransmissionRepaired,
    priceVnd,
    setPriceVnd,
    provinceCode,
    setProvinceCode,
    locationAddress,
    setLocationAddress,
    description,
    setDescription,
    mediaList,
    uploadingPhotos,
    handleBrandChange,
    handleUploadPhotos,
    handleDeletePhoto,
    handleSetPrimary,
    handleUpdateLabel,
    handleSubmit,
  };
}

