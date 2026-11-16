'use client';

import React, { useState, useEffect } from 'react';
import { api, formatVND } from '@/lib/api';
import { POPULAR_PROVINCES } from '@/features/auth/constants/provinces';
import {
  SUGGESTED_BODY_TYPES,
  TRANSMISSION_OPTIONS,
  POWERTRAIN_OPTIONS,
  GUIDED_PHOTO_SLOTS,
} from '../constants';
import { BrandItem, ModelItem } from '../types';

interface EditListingModalProps {
  listingId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditListingModal({ listingId, onClose, onSuccess }: EditListingModalProps) {
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
  interface EditableMedia {
    id?: string;
    url: string;
    thumbnail_url?: string | null;
    is_primary: boolean;
    label?: string;
    sort_order?: number;
    file?: File;
  }
  const [mediaList, setMediaList] = useState<EditableMedia[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  // Available photo labels for selection
  const PHOTO_LABEL_OPTIONS = [
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

  // Load listing editable data & catalog
  useEffect(() => {
    let mounted = true;
    async function initData() {
      try {
        setLoading(true);
        setError(null);

        // Fetch brands catalog and listing data in parallel
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

          // Load models for this brand
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

  // Handle brand change
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

  // Upload new photos
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

  // Delete photo
  const handleDeletePhoto = (index: number) => {
    setMediaList((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      // Ensure there is at least one primary photo
      if (updated.length > 0 && !updated.some((m) => m.is_primary)) {
        updated[0].is_primary = true;
      }
      return updated;
    });
  };

  // Set primary photo
  const handleSetPrimary = (index: number) => {
    setMediaList((prev) =>
      prev.map((item, idx) => ({
        ...item,
        is_primary: idx === index,
      }))
    );
  };

  // Update photo label
  const handleUpdateLabel = (index: number, newLabel: string) => {
    setMediaList((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, label: newLabel } : item))
    );
  };

  // Handle Form Submit
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/65 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-4xl max-h-[92vh] bg-surface-container-lowest rounded-3xl shadow-2xl border border-surface-container-high flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-surface-container-high flex items-center justify-between bg-surface-container-low/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[22px]">edit_document</span>
              <h2 className="text-base sm:text-lg font-bold text-primary">Chỉnh sửa thông tin tin đăng</h2>
              {hasPendingRevision && (
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-300">
                  Có bản sửa đổi chờ duyệt
                </span>
              )}
            </div>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Cập nhật chi tiết xe, cam kết kỹ thuật, giá bán và ảnh góc chụp.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Informative Alert for Published Listings */}
        {listingStatus === 'PUBLISHED' && (
          <div className="px-6 py-2.5 bg-secondary-fixed/30 border-b border-secondary/20 flex items-center gap-2.5 text-xs text-on-surface">
            <span className="material-symbols-outlined text-[18px] text-secondary shrink-0">info</span>
            <span>
              <strong>Lưu ý:</strong> Tin đăng này đang chạy công khai trên sàn. Khi bạn gửi bản sửa mới, tin vẫn tiếp tục hiển thị với thông tin cũ cho đến khi được Admin phê duyệt.
            </span>
          </div>
        )}

        {/* Modal Navigation Tabs */}
        <div className="px-6 pt-3 border-b border-surface-container-high flex gap-2 overflow-x-auto bg-surface-container-lowest">
          <button
            type="button"
            onClick={() => setActiveTab('SPECS')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap border-b-2 ${
              activeTab === 'SPECS'
                ? 'border-secondary text-secondary bg-surface-container-low/70'
                : 'border-transparent text-on-surface-variant hover:text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">directions_car</span>
            <span>1. Thông tin xe & Vận hành</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('COMMITMENTS')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap border-b-2 ${
              activeTab === 'COMMITMENTS'
                ? 'border-secondary text-secondary bg-surface-container-low/70'
                : 'border-transparent text-on-surface-variant hover:text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">verified_user</span>
            <span>2. Cam kết & Lịch sử xe</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('PRICING_LOCATION')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap border-b-2 ${
              activeTab === 'PRICING_LOCATION'
                ? 'border-secondary text-secondary bg-surface-container-low/70'
                : 'border-transparent text-on-surface-variant hover:text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">payments</span>
            <span>3. Giá bán & Vị trí & Mô tả</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('PHOTOS')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap border-b-2 ${
              activeTab === 'PHOTOS'
                ? 'border-secondary text-secondary bg-surface-container-low/70'
                : 'border-transparent text-on-surface-variant hover:text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">photo_library</span>
            <span>4. Quản lý ảnh ({mediaList.length})</span>
          </button>
        </div>

        {/* Modal Body / Form */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-2 border-secondary/30 border-t-secondary rounded-full animate-spin" />
              <p className="text-xs text-on-surface-variant">Đang tải toàn bộ dữ liệu tin đăng...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-error-container/40 border border-error/30 text-error text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{error}</span>
            </div>
          ) : (
            <form id="edit-listing-form" onSubmit={handleSubmit} className="space-y-6">
              {/* TAB 1: SPECS */}
              {activeTab === 'SPECS' && (
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
                        onChange={(e) => handleBrandChange(e.target.value)}
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
              )}

              {/* TAB 2: COMMITMENTS & HISTORY */}
              {activeTab === 'COMMITMENTS' && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Accident */}
                    <div>
                      <label className="block text-xs font-bold text-primary mb-1">Tình trạng tai nạn</label>
                      <select
                        value={accidentStatus}
                        onChange={(e) => setAccidentStatus(e.target.value as any)}
                        className="w-full px-3 py-2.5 rounded-xl bg-surface-container-low border border-surface-container-high text-xs text-primary focus:border-secondary outline-none font-medium"
                      >
                        <option value="NONE">Cam kết không tai nạn</option>
                        <option value="MINOR">Va quẹt nhẹ bên ngoài</option>
                        <option value="MAJOR">Tai nạn ảnh hưởng khung gầm</option>
                        <option value="UNKNOWN">Chưa xác định</option>
                      </select>
                    </div>

                    {/* Flood */}
                    <div>
                      <label className="block text-xs font-bold text-primary mb-1">Tình trạng ngập nước</label>
                      <select
                        value={floodStatus}
                        onChange={(e) => setFloodStatus(e.target.value as any)}
                        className="w-full px-3 py-2.5 rounded-xl bg-surface-container-low border border-surface-container-high text-xs text-primary focus:border-secondary outline-none font-medium"
                      >
                        <option value="NONE">Cam kết không thủy kích</option>
                        <option value="SUSPECTED">Nghi vấn ngập nước</option>
                        <option value="CONFIRMED">Đã từng ngập nước</option>
                        <option value="UNKNOWN">Chưa xác định</option>
                      </select>
                    </div>

                    {/* Service History */}
                    <div>
                      <label className="block text-xs font-bold text-primary mb-1">Lịch sử bảo dưỡng</label>
                      <select
                        value={serviceHistory}
                        onChange={(e) => setServiceHistory(e.target.value as any)}
                        className="w-full px-3 py-2.5 rounded-xl bg-surface-container-low border border-surface-container-high text-xs text-primary focus:border-secondary outline-none font-medium"
                      >
                        <option value="FULL">Bảo dưỡng hãng đầy đủ</option>
                        <option value="PARTIAL">Bảo dưỡng định kỳ một phần</option>
                        <option value="NONE">Không có sổ bảo dưỡng</option>
                        <option value="UNKNOWN">Chưa xác định</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-primary mb-1">Số đời chủ sở hữu</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={ownerCount}
                        onChange={(e) => setOwnerCount(parseInt(e.target.value, 10) || 1)}
                        className="w-full px-3 py-2.5 rounded-xl bg-surface-container-low border border-surface-container-high text-xs text-primary focus:border-secondary outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-primary mb-1">Số chi tiết đã sơn lại</label>
                      <input
                        type="number"
                        min="0"
                        max="30"
                        value={repaintedPartsCount}
                        onChange={(e) => setRepaintedPartsCount(parseInt(e.target.value, 10) || 0)}
                        className="w-full px-3 py-2.5 rounded-xl bg-surface-container-low border border-surface-container-high text-xs text-primary focus:border-secondary outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-primary mb-1">
                      Phụ tùng, linh kiện đã thay thế (nếu có)
                    </label>
                    <input
                      type="text"
                      value={replacedParts}
                      onChange={(e) => setReplacedParts(e.target.value)}
                      placeholder="VD: Thay 4 lốp Michelin mới, thay ắc quy Varta chính hãng"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-surface-container-high text-xs text-primary focus:border-secondary outline-none"
                    />
                  </div>

                  {/* Engine & Transmission Repair Switches */}
                  <div className="p-4 rounded-2xl bg-surface-container-low border border-surface-container-high space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={engineRepaired}
                        onChange={(e) => setEngineRepaired(e.target.checked)}
                        className="w-4 h-4 rounded text-secondary focus:ring-secondary cursor-pointer"
                      />
                      <span className="text-xs text-primary font-medium">
                        Động cơ đã từng hạ máy / bổ máy / đại tu
                      </span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={transmissionRepaired}
                        onChange={(e) => setTransmissionRepaired(e.target.checked)}
                        className="w-4 h-4 rounded text-secondary focus:ring-secondary cursor-pointer"
                      />
                      <span className="text-xs text-primary font-medium">
                        Hộp số đã từng sửa chữa hoặc thay thế
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {/* TAB 3: PRICING, LOCATION & DESCRIPTION */}
              {activeTab === 'PRICING_LOCATION' && (
                <div className="space-y-4">
                  {/* Price */}
                  <div>
                    <label className="block text-xs font-bold text-primary mb-1">
                      Giá bán mong muốn (VNĐ) <span className="text-error">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={Number(priceVnd.replace(/\D/g, '')).toLocaleString('vi-VN')}
                        onChange={(e) => setPriceVnd(e.target.value.replace(/\D/g, ''))}
                        className="w-full pl-3 pr-12 py-2.5 rounded-xl bg-surface-container-low border border-surface-container-high text-sm text-secondary font-black focus:border-secondary outline-none"
                        required
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-secondary font-bold">VNĐ</span>
                    </div>
                    {parseInt(priceVnd.replace(/\D/g, ''), 10) > 0 && (
                      <p className="text-[11px] text-secondary font-semibold mt-1">
                        Hiển thị: {formatVND(parseInt(priceVnd.replace(/\D/g, ''), 10))}
                      </p>
                    )}
                  </div>

                  {/* Province & Address */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-primary mb-1">Tỉnh / Thành phố xem xe *</label>
                      <select
                        value={provinceCode}
                        onChange={(e) => setProvinceCode(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-surface-container-low border border-surface-container-high text-xs text-primary focus:border-secondary outline-none font-medium"
                      >
                        {POPULAR_PROVINCES.map((p) => (
                          <option key={p.code} value={p.code}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-primary mb-1">Địa chỉ xem xe chi tiết</label>
                      <input
                        type="text"
                        value={locationAddress}
                        onChange={(e) => setLocationAddress(e.target.value)}
                        placeholder="VD: Số 18 đường Phạm Hùng, Phường Mỹ Đình 2, Nam Từ Liêm"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-surface-container-high text-xs text-primary focus:border-secondary outline-none"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs font-bold text-primary mb-1">Mô tả chi tiết phương tiện</label>
                    <textarea
                      rows={5}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Mô tả thêm về tình trạng sử dụng, trang bị nâng cấp, bảo dưỡng..."
                      className="w-full p-3.5 rounded-xl bg-surface-container-low border border-surface-container-high text-xs text-primary focus:border-secondary outline-none leading-relaxed"
                    />
                  </div>
                </div>
              )}

              {/* TAB 4: PHOTOS */}
              {activeTab === 'PHOTOS' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-surface-container-low border border-surface-container-high">
                    <div>
                      <p className="text-xs font-bold text-primary">Danh sách ảnh xe ({mediaList.length} ảnh)</p>
                      <p className="text-[11px] text-on-surface-variant">
                        Mỗi ảnh có thể gắn nhãn góc chụp để tăng tính chuyên nghiệp và minh bạch khi thẩm định.
                      </p>
                    </div>

                    <label className="px-3.5 py-2 rounded-xl bg-primary hover:bg-inverse-surface text-on-primary text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors">
                      <span className="material-symbols-outlined text-[16px]">add_photo_alternate</span>
                      <span>{uploadingPhotos ? 'Đang tải lên...' : 'Tải thêm ảnh mới'}</span>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleUploadPhotos}
                        disabled={uploadingPhotos}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Photos Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {mediaList.map((m, idx) => (
                      <div
                        key={idx}
                        className={`rounded-2xl overflow-hidden border p-2.5 flex flex-col gap-2 transition-all ${
                          m.is_primary
                            ? 'border-secondary bg-secondary-fixed/20 ring-1 ring-secondary/30'
                            : 'border-surface-container-high bg-surface-container-low'
                        }`}
                      >
                        {/* Thumbnail Viewport */}
                        <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-surface-container">
                          <img src={m.url} alt={`Ảnh #${idx + 1}`} className="w-full h-full object-cover" />
                          {m.is_primary && (
                            <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-secondary text-on-secondary text-[10px] font-bold shadow-xs flex items-center gap-1">
                              <span className="material-symbols-outlined text-[12px]">star</span>
                              <span>Ảnh bìa</span>
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeletePhoto(idx)}
                            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 hover:bg-error text-white flex items-center justify-center transition-colors cursor-pointer"
                            title="Xóa ảnh này"
                          >
                            <span className="material-symbols-outlined text-[15px]">delete</span>
                          </button>
                        </div>

                        {/* Label Selector */}
                        <div className="space-y-1">
                          <span className="text-[10px] text-outline font-semibold block">Nhãn góc chụp:</span>
                          <select
                            value={m.label || ''}
                            onChange={(e) => handleUpdateLabel(idx, e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-surface-container-lowest border border-surface-container-high text-[11px] text-primary focus:border-secondary outline-none font-medium"
                          >
                            {PHOTO_LABEL_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Set primary action */}
                        {!m.is_primary && (
                          <button
                            type="button"
                            onClick={() => handleSetPrimary(idx)}
                            className="w-full py-1.5 rounded-lg text-[11px] font-semibold text-secondary hover:bg-secondary/10 transition-colors cursor-pointer flex items-center justify-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[14px]">star_border</span>
                            <span>Đặt làm ảnh đại diện</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-surface-container-high bg-surface-container-low/50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-on-surface-variant">
              Trạng thái: <strong className="text-primary">{listingStatus}</strong>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>

            <button
              type="submit"
              form="edit-listing-form"
              disabled={submitting || loading}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-secondary hover:bg-on-secondary-fixed text-on-secondary shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">send</span>
              <span>{submitting ? 'Đang gửi duyệt...' : 'Lưu & Gửi duyệt cập nhật'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
