'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { CarRecognitionResponse } from '@/types';
import {
  CarListingStep,
  PhotoSlotKey,
  SlotPhotoState,
  BrandItem,
  ModelItem,
  CommitmentsState,
  VehicleHistoryState,
  TradeOptionsState,
  Coordinates,
} from '../types';
import { POWERTRAIN_OPTIONS, TRANSMISSION_OPTIONS, PROVINCE_COORDINATES, GUIDED_PHOTO_SLOTS } from '../constants';

export function useCreateListing() {
  // Step Navigation State (1 -> 5)
  const [currentStep, setCurrentStep] = useState<CarListingStep>(1);

  // Catalog State (Real API, loaded cleanly without pre-selecting)
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [models, setModels] = useState<ModelItem[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);

  // Step 1: Basic Info & Seller Identity
  const [sellerType, setSellerType] = useState<'INDIVIDUAL' | 'SHOWROOM'>('INDIVIDUAL');
  const [showroomName, setShowroomName] = useState('');
  const [showroomPhone, setShowroomPhone] = useState('');
  const [showroomId, setShowroomId] = useState('');

  const [brandId, setBrandId] = useState('');
  const [brandName, setBrandName] = useState('');
  const [modelId, setModelId] = useState('');
  const [modelName, setModelName] = useState('');
  const [trim, setTrim] = useState('');
  const [manufactureYear, setManufactureYear] = useState<number>(0);
  const [odometerKm, setOdometerKm] = useState('');
  const [provinceCode, setProvinceCode] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [coordinates, setCoordinates] = useState<Coordinates>({ lat: 10.7769, lng: 106.7009 });

  // Step 2: Technical Specifications (Blank initial state, user explicitly chooses)
  const [condition, setCondition] = useState('');
  const [origin, setOrigin] = useState('');
  const [bodyType, setBodyType] = useState('');
  const [transmission, setTransmission] = useState('');
  const [powertrain, setPowertrain] = useState('');
  const [engineDisplacement, setEngineDisplacement] = useState('');
  const [drivetrain, setDrivetrain] = useState('');
  const [seats, setSeats] = useState<number>(0);
  const [doors, setDoors] = useState<number>(0);
  const [color, setColor] = useState('');
  const [interiorColor, setInteriorColor] = useState('');
  const [description, setDescription] = useState('');
  const [commitments, setCommitments] = useState<CommitmentsState>({
    isOwner: false,
    maintenanceHistory: false,
    noAccidentFlood: false,
    readyInspection: false,
  });
  const [vehicleHistory, setVehicleHistory] = useState<VehicleHistoryState>({
    accidentStatus: 'UNKNOWN',
    floodStatus: 'UNKNOWN',
    serviceHistory: 'UNKNOWN',
    ownerCount: 0,
    repaintedPartsCount: 0,
    replacedParts: '',
    engineRepaired: false,
    transmissionRepaired: false,
  });

  // Step 3: Guided Photo Slots (8 core slots, initially null)
  const [slotPhotos, setSlotPhotos] = useState<Record<PhotoSlotKey, SlotPhotoState | null>>({
    front: null,
    front_34: null,
    rear: null,
    cockpit: null,
    odo: null,
    seats: null,
    engine: null,
    inspection_sticker: null,
  });
  const [extraPhotos, setExtraPhotos] = useState<SlotPhotoState[]>([]);

  // Step 4: Pricing & CatBoost AI Valuation (Blank initial state)
  const [priceVnd, setPriceVnd] = useState('');
  const [tradeOptions, setTradeOptions] = useState<TradeOptionsState>({
    negotiable: false,
    tradeSuv: false,
  });
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPriceSuggestion, setAiPriceSuggestion] = useState<number | null>(null);
  const [aiIntervalLow, setAiIntervalLow] = useState<number | null>(null);
  const [aiIntervalHigh, setAiIntervalHigh] = useState<number | null>(null);
  const [aiConfidence, setAiConfidence] = useState<string | null>(null);
  const [aiEstimateNote, setAiEstimateNote] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Step 5: Seller Contact & Privacy Shield
  const [privacyShield, setPrivacyShield] = useState(true);

  // Status & Validation
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitStatusText, setSubmitStatusText] = useState('Đang khởi tạo tin...');
  const [success, setSuccess] = useState(false);
  const [createdListingId, setCreatedListingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const clearFieldError = useCallback((field: string) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const copy = { ...prev };
      delete copy[field];
      return copy;
    });
  }, []);

  // Fetch real brands from backend API without auto-selecting any brand
  useEffect(() => {
    let isMounted = true;
    async function fetchBrands() {
      setCatalogLoading(true);
      try {
        const data = await api.getBrands();
        if (isMounted && data) {
          setBrands(data);
          // Do not auto-select first brand, leave clean for user input
        }
      } catch (err) {
        console.warn('Failed to load brands from API:', err);
      } finally {
        if (isMounted) setCatalogLoading(false);
      }
    }
    fetchBrands();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch real models when brandId changes without auto-selecting any model
  useEffect(() => {
    let isMounted = true;
    async function fetchModels() {
      if (!brandId) {
        setModels([]);
        return;
      }
      try {
        const data = await api.getModelsByBrand(brandId);
        if (isMounted && data) {
          setModels(data);
          // Do not auto-select first model, user will explicitly pick
        }
      } catch (err) {
        console.warn('Failed to load models for brand:', err);
      }
    }
    fetchModels();
    return () => {
      isMounted = false;
    };
  }, [brandId]);

  // Tự động kiểm tra xem tài khoản đã đăng ký Showroom chưa để nạp sẵn
  useEffect(() => {
    let isMounted = true;
    async function checkMyShowroom() {
      try {
        let targetAddress = '';
        let targetProvince = '';

        // 1. Kiểm tra nhanh từ cache localStorage để phản hồi tức thì UI
        if (typeof window !== 'undefined') {
          const rawUser = localStorage.getItem('user');
          if (rawUser) {
            try {
              const u = JSON.parse(rawUser);
              if (u.account_type === 'SHOWROOM' || u.showroom) {
                setSellerType('SHOWROOM');
                if (u.showroom?.name) setShowroomName(u.showroom.name);
                else if (u.display_name) setShowroomName(u.display_name);
                if (u.showroom?.phone) setShowroomPhone(u.showroom.phone);
                else if (u.phone) setShowroomPhone(u.phone);
                if (u.showroom?.id) setShowroomId(u.showroom.id);

                targetAddress = u.showroom?.address || u.address || '';
                targetProvince = u.showroom?.province_code || u.province_code || '';
                if (targetAddress) setLocationAddress(targetAddress);
                if (targetProvince) {
                  setProvinceCode(targetProvince);
                  if (PROVINCE_COORDINATES[targetProvince]) {
                    setCoordinates(PROVINCE_COORDINATES[targetProvince]);
                  }
                }
              }
            } catch {}
          }
        }

        // 2. Đồng bộ mới nhất từ server
        try {
          const sr = await api.getMyShowroom();
          if (isMounted && sr) {
            setShowroomId(sr.id);
            if (sr.name) setShowroomName(sr.name);
            if (sr.phone) setShowroomPhone(sr.phone);
            setSellerType('SHOWROOM');
            if (sr.address) {
              targetAddress = sr.address;
              setLocationAddress(sr.address);
            }
            if (sr.province_code) {
              targetProvince = sr.province_code;
              setProvinceCode(sr.province_code);
              if (PROVINCE_COORDINATES[sr.province_code]) {
                setCoordinates(PROVINCE_COORDINATES[sr.province_code]);
              }
            }
          }
        } catch {}

        // 3. Fallback lấy thêm thông tin từ getMe() nếu địa chỉ showroom còn trống
        if (!targetAddress || !targetProvince) {
          try {
            const me = await api.getMe();
            if (isMounted && me) {
              if (me.account_type === 'SHOWROOM' || me.showroom) {
                setSellerType('SHOWROOM');
                if (me.showroom?.name) setShowroomName(me.showroom.name);
                if (me.showroom?.phone) setShowroomPhone(me.showroom.phone);
                if (me.showroom?.id) setShowroomId(me.showroom.id);
                const addr = me.showroom?.address || me.address;
                const prov = me.showroom?.province_code || me.province_code;
                if (addr) setLocationAddress(addr);
                if (prov) {
                  setProvinceCode(prov);
                  if (PROVINCE_COORDINATES[prov]) setCoordinates(PROVINCE_COORDINATES[prov]);
                }
              }
            }
          } catch {}
        }
      } catch {
        // Tài khoản cá nhân thông thường
      }
    }
    checkMyShowroom();

    // 2. Phục hồi bản nháp chuyển tiếp từ Định Giá AI (nếu có)
    if (typeof window !== 'undefined') {
      try {
        const rawDraft = localStorage.getItem('aura_listing_draft');
        if (rawDraft) {
          const draft = JSON.parse(rawDraft);
          if (draft.sellerType) setSellerType(draft.sellerType);
          if (draft.showroomName) setShowroomName(draft.showroomName);
          if (draft.showroomPhone) setShowroomPhone(draft.showroomPhone);
          if (draft.brandName) setBrandName(draft.brandName);
          if (draft.modelName) setModelName(draft.modelName);
          if (draft.trim) setTrim(draft.trim);
          if (draft.manufactureYear) setManufactureYear(draft.manufactureYear);
          if (draft.odometerKm) setOdometerKm(draft.odometerKm);
          if (draft.bodyType) setBodyType(draft.bodyType);
          if (draft.fuelType) {
            const f = String(draft.fuelType).toUpperCase();
            if (f.includes('GAS') || f.includes('XĂNG')) setPowertrain('gasoline');
            else if (f.includes('DIESEL') || f.includes('DẦU')) setPowertrain('diesel');
            else if (f.includes('ELECT') || f.includes('ĐIỆN')) setPowertrain('electric');
            else if (f.includes('HYBRID')) setPowertrain('hybrid');
          }
          if (draft.powertrain) setPowertrain(draft.powertrain);
          if (draft.transmission) {
            const t = String(draft.transmission).toUpperCase();
            if (t.includes('AUTO') || t.includes('TỰ ĐỘNG')) setTransmission('auto');
            else if (t.includes('MAN') || t.includes('SÀN')) setTransmission('manual');
          }
          if (draft.condition) setCondition(draft.condition);
          if (draft.origin) setOrigin(draft.origin);
          if (draft.engineDisplacement) setEngineDisplacement(draft.engineDisplacement);
          if (draft.drivetrain) setDrivetrain(draft.drivetrain);
          if (draft.color) setColor(draft.color);
          if (draft.interiorColor) setInteriorColor(draft.interiorColor);
          if (draft.seats) setSeats(Number(draft.seats));
          if (draft.doors) setDoors(Number(draft.doors));
          if (draft.provinceCode) setProvinceCode(draft.provinceCode);
          if (draft.locationAddress) setLocationAddress(draft.locationAddress);
          if (draft.description) setDescription(draft.description);
          if (draft.vehicleHistory) setVehicleHistory(draft.vehicleHistory);
          if (draft.commitments) setCommitments(draft.commitments);
          if (draft.priceVnd) setPriceVnd(String(draft.priceVnd));
          localStorage.removeItem('aura_listing_draft');
        }
      } catch {
        // ignore
      }
    }

    return () => {
      isMounted = false;
    };
  }, []);

  // Brand combobox actions
  const handleBrandSelect = useCallback(
    (id: string, name: string) => {
      setBrandId(id);
      setBrandName(name);
      setModelId('');
      setModelName('');
      clearFieldError('brand');
    },
    [clearFieldError]
  );

  const handleCustomBrandInput = useCallback(
    (name: string) => {
      setBrandId('');
      setBrandName(name);
      setModelId('');
      setModelName('');
      clearFieldError('brand');
    },
    [clearFieldError]
  );

  // Model combobox actions
  const handleModelSelect = useCallback(
    (id: string, name: string) => {
      setModelId(id);
      setModelName(name);
      const m = models.find((x) => x.id === id);
      if (m && m.body_type && !bodyType) {
        setBodyType(m.body_type);
      }
      clearFieldError('model');
    },
    [models, bodyType, clearFieldError]
  );

  const handleCustomModelInput = useCallback(
    (name: string) => {
      setModelId('');
      setModelName(name);
      clearFieldError('model');
    },
    [clearFieldError]
  );

  // Year change
  const handleYearChange = useCallback(
    (val: number) => {
      setManufactureYear(val);
      if (val > 1990) clearFieldError('manufactureYear');
    },
    [clearFieldError]
  );

  // Province change syncs mini-map center
  const handleProvinceChange = useCallback(
    (code: string) => {
      setProvinceCode(code);
      if (code) clearFieldError('provinceCode');
      if (PROVINCE_COORDINATES[code]) {
        setCoordinates(PROVINCE_COORDINATES[code]);
      }
    },
    [clearFieldError]
  );

  // Condition change
  const handleConditionChange = useCallback(
    (val: string) => {
      setCondition(val);
      if (val) clearFieldError('condition');
    },
    [clearFieldError]
  );

  // Origin change
  const handleOriginChange = useCallback(
    (val: string) => {
      setOrigin(val);
      if (val) clearFieldError('origin');
    },
    [clearFieldError]
  );

  // Body type change
  const handleBodyTypeChange = useCallback(
    (val: string) => {
      setBodyType(val);
      if (val) clearFieldError('bodyType');
    },
    [clearFieldError]
  );

  // Transmission change
  const handleTransmissionChange = useCallback(
    (val: string) => {
      setTransmission(val);
      if (val) clearFieldError('transmission');
    },
    [clearFieldError]
  );

  // Powertrain change
  const handlePowertrainChange = useCallback(
    (val: string) => {
      setPowertrain(val);
      if (val) clearFieldError('powertrain');
    },
    [clearFieldError]
  );

  // Color change with error clearing
  const handleColorChange = useCallback(
    (val: string) => {
      setColor(val);
      if (val.trim()) clearFieldError('color');
    },
    [clearFieldError]
  );

  // Odometer change with strictly numbers check
  const handleOdometerChange = useCallback(
    (val: string) => {
      setOdometerKm(val);
      if (val.trim()) clearFieldError('odometer');
    },
    [clearFieldError]
  );

  // Commitments toggle
  const toggleCommitment = useCallback((key: keyof CommitmentsState) => {
    setCommitments((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const updateVehicleHistory = useCallback((patch: Partial<VehicleHistoryState>) => {
    setVehicleHistory((prev) => ({ ...prev, ...patch }));
  }, []);

  // Trade option toggle
  const toggleTradeOption = useCallback((key: keyof TradeOptionsState) => {
    setTradeOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // Guided Slot Photo Upload
  const handleSlotPhotoUpload = useCallback(
    (slotKey: PhotoSlotKey, file: File) => {
      const previewUrl = URL.createObjectURL(file);
      setSlotPhotos((prev) => ({ ...prev, [slotKey]: { file, previewUrl } }));
      if (slotKey === 'front') clearFieldError('photo');
    },
    [clearFieldError]
  );

  const removeSlotPhoto = useCallback((slotKey: PhotoSlotKey) => {
    setSlotPhotos((prev) => ({ ...prev, [slotKey]: null }));
  }, []);

  const handleExtraPhotosUpload = useCallback((files: File[]) => {
    const newItems: SlotPhotoState[] = files.map((f) => ({
      file: f,
      previewUrl: URL.createObjectURL(f),
    }));
    setExtraPhotos((prev) => [...prev, ...newItems].slice(0, 14));
  }, []);

  const removeExtraPhoto = useCallback((index: number) => {
    setExtraPhotos((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Gemini AI Image Recognition Auto-fill
  const handleApplyCarRecognition = useCallback(
    (data: CarRecognitionResponse, file?: File) => {
      // 1. Hãng xe
      if (data.brand) {
        const foundBrand = brands.find(
          (b) => b.name.toLowerCase() === data.brand?.toLowerCase()
        );
        if (foundBrand) {
          setBrandId(foundBrand.id);
          setBrandName(foundBrand.name);
        } else {
          setBrandName(data.brand);
        }
        clearFieldError('brand');
      }

      // 2. Dòng xe
      if (data.model) {
        setModelName(data.model);
        clearFieldError('model');
      }

      // 3. Phiên bản
      if (data.trim) {
        setTrim(data.trim);
      }

      // 4. Năm sản xuất
      if (data.manufacture_year && data.manufacture_year >= 1990) {
        setManufactureYear(data.manufacture_year);
        clearFieldError('manufactureYear');
      }

      // 5. Kiểu dáng
      if (data.body_type) {
        setBodyType(data.body_type.toUpperCase());
        clearFieldError('bodyType');
      }

      // 6. Màu ngoại thất
      if (data.color) {
        setColor(data.color);
        clearFieldError('color');
      }

      // 7. Hộp số
      if (data.transmission) {
        const transVal = data.transmission.toUpperCase();
        if (transVal.includes('AUTO') || transVal === 'AUTOMATIC') {
          setTransmission('auto');
        } else if (transVal.includes('MAN') || transVal === 'MANUAL') {
          setTransmission('manual');
        }
        clearFieldError('transmission');
      }

      // 8. Nhiên liệu / Động cơ
      if (data.fuel_type) {
        const f = data.fuel_type.toUpperCase();
        if (f.includes('GAS') || f.includes('XĂNG')) setPowertrain('gasoline');
        else if (f.includes('DIESEL') || f.includes('DẦU')) setPowertrain('diesel');
        else if (f.includes('ELECT') || f.includes('ĐIỆN')) setPowertrain('electric');
        else if (f.includes('HYBRID')) setPowertrain('hybrid');
        clearFieldError('powertrain');
      }

      // 9. Số chỗ ngồi
      if (data.seats && data.seats > 0) {
        setSeats(data.seats);
      }

      // 10. Số km ODO
      if (data.odometer_km && data.odometer_km > 0) {
        setOdometerKm(String(data.odometer_km));
        clearFieldError('odometer');
      }

      // 11. Mô tả chi tiết gợi ý
      if (data.suggested_description) {
        setDescription(data.suggested_description);
      }

      // 12. Gắn ảnh xe vào slot ảnh góc chính (front) để không cần tải lại ở bước 3
      if (file && file.size > 0) {
        const previewUrl = URL.createObjectURL(file);
        setSlotPhotos((prev) => ({
          ...prev,
          front: prev.front || { file, previewUrl },
        }));
        clearFieldError('photo');
      }
    },
    [brands, clearFieldError]
  );

  // AI Price Guidance based on ML Model features
  const handleGetAIEstimate = useCallback(async () => {
    setAiError(null);
    setAiEstimateNote(null);
    if (!brandName.trim() || !modelName.trim() || !manufactureYear || !odometerKm.trim()) {
      setAiError('Vui lòng nhập hãng, dòng xe, năm sản xuất và số km ở bước 1 trước khi định giá.');
      return;
    }
    setAiLoading(true);
    try {
      const cleanOdo = parseInt(odometerKm.replace(/\D/g, ''), 10);
      if (!Number.isFinite(cleanOdo) || cleanOdo <= 0) {
        setAiError('Số km ODO phải lớn hơn 0.');
        return;
      }
      const matchedTrans = TRANSMISSION_OPTIONS.find((t) => t.id === transmission);
      const matchedPower = POWERTRAIN_OPTIONS.find((p) => p.value === powertrain);
      const cleanEngineDisp = parseFloat(engineDisplacement.replace(/[^\d.]/g, '')) || undefined;

      const res = await api.estimateValuation({
        brand: brandName,
        model: modelName,
        variant: trim || undefined,
        manufacture_year: manufactureYear,
        odometer_km: cleanOdo,
        body_type: bodyType || 'SEDAN',
        fuel_type: matchedPower?.dbValue || 'GASOLINE',
        transmission: matchedTrans?.value || 'AUTOMATIC',
        province_code: provinceCode || undefined,
        engine_displacement: cleanEngineDisp,
        seats: seats || undefined,
        doors: doors || undefined,
        origin: origin || undefined,
      });

      if (res.status === 'PREDICTED' && res.estimated_price_vnd) {
        setAiPriceSuggestion(res.estimated_price_vnd);
        setAiIntervalLow(res.interval_low_vnd || null);
        setAiIntervalHigh(res.interval_high_vnd || null);
        setAiConfidence(res.confidence_level || 'MEDIUM');

        // Nếu người dùng chưa nhập giá thì tự động gợi ý điền
        if (res.confidence_level === 'MEDIUM' && !priceVnd) {
          setPriceVnd(res.estimated_price_vnd.toLocaleString('vi-VN'));
          clearFieldError('price');
        }
        const confidence = res.confidence_level === 'MEDIUM' ? 'Độ tin cậy cao' : 'Tham khảo mở rộng';
        const range = res.interval_low_vnd && res.interval_high_vnd
          ? `Khoảng giá thị trường hợp lý: ${res.interval_low_vnd.toLocaleString('vi-VN')} ₫ – ${res.interval_high_vnd.toLocaleString('vi-VN')} ₫.`
          : '';
        const method = 'Được tính toán bởi mô hình CatBoost ML trên dữ liệu giao dịch thực tế.';
        setAiEstimateNote(`${range} ${confidence}. ${method}${res.reason ? ` Ghi chú: ${res.reason}` : ''}`.trim());
      } else {
        setAiPriceSuggestion(null);
        setAiIntervalLow(null);
        setAiIntervalHigh(null);
        setAiConfidence(null);
        setAiEstimateNote(null);
        setAiError(res.reason || 'Chưa đủ dữ liệu để định giá xe này. Bạn vẫn có thể tự nhập giá bán.');
      }
    } catch (err) {
      console.warn('Valuation error:', err);
      setAiPriceSuggestion(null);
      setAiIntervalLow(null);
      setAiIntervalHigh(null);
      setAiConfidence(null);
      setAiEstimateNote(null);
      setAiError(err instanceof Error ? err.message : 'Không kết nối được dịch vụ định giá. Vui lòng thử lại.');
    } finally {
      setAiLoading(false);
    }
  }, [
    brandName,
    modelName,
    trim,
    manufactureYear,
    odometerKm,
    bodyType,
    powertrain,
    transmission,
    provinceCode,
    engineDisplacement,
    seats,
    doors,
    origin,
    clearFieldError,
    priceVnd,
  ]);

  // Hàm áp dụng giá nhanh từ AI vào ô mức giá mong muốn
  const handleApplyAiPrice = useCallback((suggestedPrice: number) => {
    if (suggestedPrice && suggestedPrice > 0) {
      setPriceVnd(suggestedPrice.toLocaleString('vi-VN'));
      clearFieldError('price');
    }
  }, [clearFieldError]);

  // Step Validation & Navigation
  const validateStep = useCallback(
    (step: CarListingStep): boolean => {
      const newErrors: Record<string, string> = {};

      if (step === 1) {
        if (!brandName.trim()) {
          newErrors.brand = 'Vui lòng chọn hoặc nhập Thương hiệu xe.';
        }
        if (!modelName.trim()) {
          newErrors.model = 'Vui lòng chọn hoặc nhập Dòng xe.';
        }
        if (!manufactureYear || manufactureYear <= 1990) {
          newErrors.manufactureYear = 'Vui lòng chọn năm sản xuất của xe.';
        }
        const cleanOdo = parseInt(odometerKm.replace(/\D/g, ''), 10);
        if (!odometerKm.trim() || !cleanOdo || cleanOdo <= 0) {
          newErrors.odometer = 'Vui lòng nhập số km ODO thực tế của xe (phải là số > 0).';
        }
        if (!provinceCode) {
          newErrors.provinceCode = 'Vui lòng chọn Tỉnh / Thành phố xem xe.';
        }
      } else if (step === 2) {
        if (!condition) {
          newErrors.condition = 'Vui lòng chọn tình trạng sử dụng của xe.';
        }
        if (!origin) {
          newErrors.origin = 'Vui lòng chọn nguồn gốc xuất xứ của xe.';
        }
        if (!bodyType) {
          newErrors.bodyType = 'Vui lòng chọn kiểu dáng thân xe.';
        }
        if (!transmission) {
          newErrors.transmission = 'Vui lòng chọn loại hộp số của xe.';
        }
        if (!powertrain) {
          newErrors.powertrain = 'Vui lòng chọn loại nhiên liệu / động lực.';
        }
        if (!color.trim()) {
          newErrors.color = 'Vui lòng chọn hoặc nhập màu sơn ngoại thất của xe.';
        }
      } else if (step === 3) {
        if (!slotPhotos.front) {
          newErrors.photo = 'Vui lòng tải lên ít nhất ảnh đầu xe chính diện (ảnh bìa bắt buộc).';
        }
      } else if (step === 4) {
        const cleanPrice = parseInt(priceVnd.replace(/\D/g, ''), 10);
        if (!cleanPrice || cleanPrice <= 0) {
          newErrors.price = 'Vui lòng nhập mức giá chuyển nhượng xe hợp lệ (phải là số > 0).';
        }
      }

      setErrors(newErrors);
      if (Object.keys(newErrors).length > 0) {
        const firstError = Object.values(newErrors)[0];
        setErrorMessage(firstError);
        return false;
      }
      setErrorMessage(null);
      return true;
    },
    [
      brandName,
      modelName,
      manufactureYear,
      odometerKm,
      provinceCode,
      condition,
      origin,
      bodyType,
      transmission,
      powertrain,
      color,
      slotPhotos.front,
      priceVnd,
    ]
  );

  const nextStep = useCallback(() => {
    if (validateStep(currentStep)) {
      if (currentStep < 5) {
        setCurrentStep((prev) => ((prev + 1) as CarListingStep));
        window.scrollTo({ top: 120, behavior: 'smooth' });
      }
    }
  }, [currentStep, validateStep]);

  const prevStep = useCallback(() => {
    if (currentStep > 1) {
      setErrorMessage(null);
      setCurrentStep((prev) => ((prev - 1) as CarListingStep));
      window.scrollTo({ top: 120, behavior: 'smooth' });
    }
  }, [currentStep]);

  const goToStep = useCallback(
    (step: CarListingStep) => {
      if (step < currentStep) {
        setErrorMessage(null);
        setCurrentStep(step);
        window.scrollTo({ top: 120, behavior: 'smooth' });
      } else if (validateStep(currentStep)) {
        setCurrentStep(step);
        window.scrollTo({ top: 120, behavior: 'smooth' });
      }
    },
    [currentStep, validateStep]
  );

  // Danh sách ảnh kèm nhãn chuẩn xác theo GUIDED_PHOTO_SLOTS và ảnh chi tiết
  const orderedSlotPhotosWithLabels = GUIDED_PHOTO_SLOTS.map((slot) => {
    const photo = slotPhotos[slot.key];
    if (!photo) return null;
    return {
      file: photo.file,
      previewUrl: photo.previewUrl,
      label: slot.label,
    };
  }).filter(Boolean) as { file: File; previewUrl: string; label: string }[];

  const extraPhotosWithLabels = extraPhotos.map((photo, i) => ({
    file: photo.file,
    previewUrl: photo.previewUrl,
    label: `Ảnh chi tiết #${i + 1}`,
  }));

  const allPhotosWithLabels = [...orderedSlotPhotosWithLabels, ...extraPhotosWithLabels];
  const uploadedPhotosList = allPhotosWithLabels.map((p) => ({ file: p.file, previewUrl: p.previewUrl }));

  // Final Form Submit Handler
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setErrorMessage(null);

      if (!validateStep(1) || !validateStep(2) || !validateStep(3) || !validateStep(4)) {
        return;
      }

      setSubmitting(true);
      try {
        // Resolve Brand and Model UUID dynamically if custom typed
        let finalBrandId = brandId;
        let finalModelId = modelId;

        if (!finalBrandId || !finalModelId) {
          setSubmitStatusText('Đang khởi tạo danh mục thương hiệu & dòng xe mới...');
          try {
            const resolved = await api.resolveBrandModel({
              brand_name: brandName,
              model_name: modelName,
              body_type: bodyType || 'SEDAN',
            });
            if (resolved?.brand_id) {
              finalBrandId = resolved.brand_id;
              finalModelId = resolved.model_id || '';
              setBrandId(finalBrandId);
              if (finalModelId) setModelId(finalModelId);
            } else {
              throw new Error('Không thể đồng bộ danh mục xe mới trên cơ sở dữ liệu.');
            }
          } catch (resolveErr: any) {
            setErrorMessage(resolveErr.message || 'Lỗi tạo mới thương hiệu hoặc dòng xe.');
            setSubmitting(false);
            return;
          }
        }

        // Collect files to upload
        const filesToUpload = allPhotosWithLabels.map((item) => item.file);
        let mediaItems: any[] = [];

        if (filesToUpload.length > 0) {
          setSubmitStatusText(`Đang tải ${filesToUpload.length} ảnh xe lên hệ thống lưu trữ...`);
          try {
            const uploadRes = await api.uploadMultipleMedia(filesToUpload);
            if (Array.isArray(uploadRes)) {
              mediaItems = uploadRes.map((item, idx) => ({
                url: item.secure_url || item.url,
                thumbnail_url: item.thumbnail_url || item.url,
                media_type: 'IMAGE',
                is_primary: idx === 0,
                sort_order: idx,
                label: allPhotosWithLabels[idx]?.label || `Góc chụp #${idx + 1}`,
              }));
            }
          } catch (uploadErr) {
            console.warn('Upload media error:', uploadErr);
          }
        }

        const matchedTrans = TRANSMISSION_OPTIONS.find((t) => t.id === transmission);
        const matchedPower = POWERTRAIN_OPTIONS.find((p) => p.value === powertrain);
        const parsedOdo = parseInt(odometerKm.replace(/\D/g, ''), 10) || 0;
        const parsedPrice = parseInt(priceVnd.replace(/\D/g, ''), 10) || 0;
        const fullTitle = `${brandName} ${modelName} ${trim} ${manufactureYear}`.replace(/\s+/g, ' ').trim();

        const commitmentsList = [
          commitments.isOwner && 'Chính chủ cá nhân đứng tên',
          commitments.maintenanceHistory && 'Lịch sử bảo dưỡng chính hãng',
          commitments.noAccidentFlood && 'Cam kết không đâm đụng, thủy kích',
          commitments.readyInspection && 'Sẵn sàng giám định độc lập',
        ]
          .filter(Boolean)
          .join('; ');

        const tradeList = [
          tradeOptions.negotiable && 'Có thương lượng nhẹ cho người mua thiện chí',
          tradeOptions.tradeSuv && 'Hỗ trợ giao lưu bù trừ với dòng SUV',
          privacyShield && 'Bảo vệ số điện thoại qua eKYC',
        ]
          .filter(Boolean)
          .join('; ');

        const coordsText =
          coordinates.lat && coordinates.lng
            ? `\nTọa độ GPS kiểm định: [${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}]`
            : '';

        const fullDescription = [
          description.trim(),
          `\nThông số kỹ thuật: Động cơ ${engineDisplacement || 'Tiêu chuẩn'} | Dẫn động ${drivetrain || 'Tiêu chuẩn'} | ${seats ? `${seats} chỗ` : ''} | ${doors ? `${doors} cửa` : ''} | Xuất xứ ${origin} | Tình trạng ${condition === 'NEW' ? 'Xe mới' : 'Đã qua sử dụng'}`,
          commitmentsList ? `Cam kết chủ xe: ${commitmentsList}` : '',
          tradeList ? `Tùy chọn: ${tradeList}` : '',
          locationAddress ? `Địa chỉ xem xe: ${locationAddress}` : '',
          coordsText,
        ]
          .filter(Boolean)
          .join('\n');

        setSubmitStatusText('Đang nộp hồ sơ kiểm định xe lên hệ thống thẩm định...');
        const payload: any = {
          brand_id: finalBrandId,
          model_id: finalModelId,
          seller_type: sellerType,
          showroom_id: showroomId || undefined,
          custom_showroom_name: sellerType === 'SHOWROOM' ? showroomName.trim() : undefined,
          custom_showroom_phone: sellerType === 'SHOWROOM' ? (showroomPhone.trim() || undefined) : undefined,
          title: fullTitle,
          price_vnd: parsedPrice,
          manufacture_year: manufactureYear,
          odometer_km: parsedOdo,
          mileage_unknown: false,
          condition: condition || 'USED',
          body_type: bodyType || 'SEDAN',
          fuel_type: matchedPower?.dbValue || 'GASOLINE',
          transmission: matchedTrans?.value || 'AUTOMATIC',
          origin: origin || 'Lắp ráp trong nước',
          color: color.trim() || 'Trắng',
          interior_color: interiorColor.trim() || 'Đen',
          seats: seats || 5,
          doors: doors || 4,
          province_code: provinceCode || '79',
          location_address: locationAddress.trim() || undefined,
          description: fullDescription,
          accident_status: vehicleHistory.accidentStatus,
          flood_status: vehicleHistory.floodStatus,
          service_history: vehicleHistory.serviceHistory,
          owner_count: vehicleHistory.ownerCount || undefined,
          repainted_parts_count: vehicleHistory.repaintedPartsCount,
          replaced_parts: vehicleHistory.replacedParts.trim() || undefined,
          engine_repaired: vehicleHistory.engineRepaired,
          transmission_repaired: vehicleHistory.transmissionRepaired,
          media: mediaItems,
        };

        const res = await api.createListing(payload);
        const newListingId = res?.data?.id || null;
        setCreatedListingId(newListingId);

        // Đảm bảo tin được gửi thẳng tới hàng chờ duyệt (PENDING_REVIEW)
        if (newListingId && res?.data?.status === 'DRAFT') {
          await api.submitListingForReview(newListingId).catch(() => {});
        }

        setSuccess(true);
      } catch (err: any) {
        setErrorMessage(
          err.message || 'Không thể gửi duyệt tin đăng. Vui lòng kiểm tra lại thông tin và thử lại.'
        );
      } finally {
        setSubmitting(false);
      }
    },
    [
      validateStep,
      brandId,
      modelId,
      brandName,
      modelName,
      bodyType,
      uploadedPhotosList,
      transmission,
      powertrain,
      odometerKm,
      priceVnd,
      trim,
      manufactureYear,
      condition,
      origin,
      engineDisplacement,
      drivetrain,
      seats,
      doors,
      description,
      commitments,
      vehicleHistory,
      tradeOptions,
      privacyShield,
      coordinates,
      locationAddress,
      color,
      interiorColor,
      provinceCode,
      sellerType,
      showroomName,
      showroomPhone,
      showroomId,
    ]
  );

  return {
    // Step navigation
    currentStep,
    goToStep,
    nextStep,
    prevStep,
    // Validation
    errors,
    errorMessage,
    // Seller Type (Cá nhân vs Showroom/Tổ chức)
    sellerType,
    setSellerType,
    showroomName,
    setShowroomName,
    showroomPhone,
    setShowroomPhone,
    showroomId,
    setShowroomId,
    // Step 1
    brands,
    models,
    catalogLoading,
    brandId,
    brandName,
    handleBrandSelect,
    handleCustomBrandInput,
    modelId,
    modelName,
    handleModelSelect,
    handleCustomModelInput,
    handleApplyCarRecognition,
    trim,
    setTrim,
    manufactureYear,
    setManufactureYear: handleYearChange,
    handleYearChange,
    odometerKm,
    setOdometerKm: handleOdometerChange,
    handleOdometerChange,
    provinceCode,
    setProvinceCode: handleProvinceChange,
    handleProvinceChange,
    locationAddress,
    setLocationAddress,
    coordinates,
    setCoordinates,
    // Step 2 (Comprehensive Technical Specifications)
    condition,
    setCondition: handleConditionChange,
    handleConditionChange,
    origin,
    setOrigin: handleOriginChange,
    handleOriginChange,
    bodyType,
    setBodyType: handleBodyTypeChange,
    handleBodyTypeChange,
    transmission,
    setTransmission: handleTransmissionChange,
    handleTransmissionChange,
    powertrain,
    setPowertrain: handlePowertrainChange,
    handlePowertrainChange,
    engineDisplacement,
    setEngineDisplacement,
    drivetrain,
    setDrivetrain,
    seats,
    setSeats,
    doors,
    setDoors,
    color,
    setColor: handleColorChange,
    handleColorChange,
    interiorColor,
    setInteriorColor,
    description,
    setDescription,
    commitments,
    toggleCommitment,
    vehicleHistory,
    updateVehicleHistory,
    // Step 3 (8 Guided Core Slots)
    slotPhotos,
    handleSlotPhotoUpload,
    removeSlotPhoto,
    extraPhotos,
    handleExtraPhotosUpload,
    removeExtraPhoto,
    uploadedPhotosCount: uploadedPhotosList.length,
    // Step 4
    priceVnd,
    setPriceVnd,
    tradeOptions,
    toggleTradeOption,
    aiLoading,
    aiPriceSuggestion,
    aiIntervalLow,
    aiIntervalHigh,
    aiConfidence,
    aiEstimateNote,
    aiError,
    handleGetAIEstimate,
    handleApplyAiPrice,
    // Step 5
    privacyShield,
    setPrivacyShield,
    // Submit
    submitting,
    submitStatusText,
    success,
    createdListingId,
    handleSubmit,
  };
}
