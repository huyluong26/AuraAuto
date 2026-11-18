'use client';

import { useState, useMemo, useRef } from 'react';
import { api } from '@/lib/api';
import { ValuationResponse, CarRecognitionResponse } from '@/types';
import {
  SUGGESTED_BODY_TYPES,
} from '@/features/car-listing/constants';
import {
  normalizeAccidentStatus,
  normalizeFloodStatus,
  normalizeServiceHistory,
  normalizeIntCount,
} from '@/features/car-listing/utils/normalizers';
import {
  BRAND_MODEL_CATALOG,
  MASTER_ALL_MODELS,
} from '../constants/carCatalog';

export function useAICarValuationForm() {
  // 1. Vehicle Identity & Age
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [variant, setVariant] = useState('');
  const [year, setYear] = useState<string>('');
  const [odometerKm, setOdometerKm] = useState<string>('');

  // 2. Technical Specifications & Powertrain
  const [bodyType, setBodyType] = useState('');
  const [transmission, setTransmission] = useState('');
  const [powertrain, setPowertrain] = useState('');
  const [engineDisplacement, setEngineDisplacement] = useState('');
  const [drivetrain, setDrivetrain] = useState('');
  const [seats, setSeats] = useState<string>('');
  const [doors, setDoors] = useState<string>('');

  // 3. Condition, Origin & Colors
  const [condition, setCondition] = useState('');
  const [origin, setOrigin] = useState('');
  const [color, setColor] = useState('');
  const [interiorColor, setInteriorColor] = useState('');

  // 4. Vehicle History & Technical Inspection
  const [accidentStatus, setAccidentStatus] = useState('');
  const [floodStatus, setFloodStatus] = useState('');
  const [serviceHistory, setServiceHistory] = useState('');
  const [ownerCount, setOwnerCount] = useState('');
  const [repaintedPartsCount, setRepaintedPartsCount] = useState('');
  const [replacedParts, setReplacedParts] = useState('');
  const [engineRepaired, setEngineRepaired] = useState(false);
  const [transmissionRepaired, setTransmissionRepaired] = useState(false);

  // Photos & AI Scanner State
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadedPreviews, setUploadedPreviews] = useState<string[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [aiScanLoading, setAiScanLoading] = useState(false);
  const [aiScanSuccess, setAiScanSuccess] = useState<string | null>(null);

  // Valuation Request & Result State
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ValuationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Modals State
  const [quickModalOpen, setQuickModalOpen] = useState(false);
  const [resultModalOpen, setResultModalOpen] = useState(false);

  // Dynamic Models Suggestions
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

  // Dynamic ODO Suggestions
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

  // Photo Handling & AI Vision Recognition
  const runAiVisionRecognition = async (file: File) => {
    setAiScanLoading(true);
    setError(null);
    setAiScanSuccess(null);

    try {
      const data: CarRecognitionResponse = await api.recognizeCarImage(file);

      if (data.brand) setBrand(data.brand);
      if (data.model) setModel(data.model);
      if (data.trim) setVariant(data.trim);
      if (data.manufacture_year && data.manufacture_year >= 1990) setYear(String(data.manufacture_year));
      if (data.body_type) {
        const matchedBody = SUGGESTED_BODY_TYPES.find((b) =>
          b.toLowerCase().includes(data.body_type!.toLowerCase())
        );
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

  const handleAddPhotos = async (files: File[]) => {
    const validFiles = files.filter((f) => f.type.startsWith('image/'));
    if (validFiles.length === 0) return;

    const newFiles = [...uploadedFiles, ...validFiles].slice(0, 8);
    setUploadedFiles(newFiles);

    const newPreviews = newFiles.map((f) => URL.createObjectURL(f));
    setUploadedPreviews(newPreviews);

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

  // Submit Valuation
  const handleSubmit = async (event?: React.FormEvent) => {
    if (event) event.preventDefault();
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
      let backendBody = 'SEDAN';
      const bLower = bodyType.toLowerCase();
      if (bLower.includes('suv') || bLower.includes('crossover')) backendBody = 'SUV';
      else if (bLower.includes('hatchback')) backendBody = 'HATCHBACK';
      else if (bLower.includes('pickup') || bLower.includes('bán tải')) backendBody = 'PICKUP';
      else if (bLower.includes('mpv')) backendBody = 'MPV';
      else if (bLower.includes('coupe')) backendBody = 'COUPE';

      let backendFuel = 'GASOLINE';
      const pLower = powertrain.toLowerCase();
      if (pLower.includes('diesel') || pLower.includes('dầu')) backendFuel = 'DIESEL';
      else if (pLower.includes('hybrid')) backendFuel = 'HYBRID';
      else if (pLower.includes('điện') || pLower.includes('ev')) backendFuel = 'ELECTRIC';

      const backendTrans =
        transmission.toLowerCase().includes('sàn') || transmission.toLowerCase().includes('manual')
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
        condition: condition || 'USED',
        accident_status: normalizeAccidentStatus(accidentStatus),
        flood_status: normalizeFloodStatus(floodStatus),
        service_history: normalizeServiceHistory(serviceHistory),
        engine_repaired: Boolean(engineRepaired),
        transmission_repaired: Boolean(transmissionRepaired),
        owner_count: normalizeIntCount(ownerCount, 1, 20) ?? undefined,
        repainted_parts_count: normalizeIntCount(repaintedPartsCount, 0, 50) ?? undefined,
        replaced_parts: replacedParts ? String(replacedParts) : undefined,
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

  const resetForm = () => {
    setBrand('');
    setModel('');
    setVariant('');
    setYear('');
    setOdometerKm('');
    setBodyType('');
    setTransmission('');
    setPowertrain('');
    setEngineDisplacement('');
    setDrivetrain('');
    setSeats('');
    setDoors('');
    setCondition('');
    setOrigin('');
    setColor('');
    setInteriorColor('');
    setAccidentStatus('');
    setFloodStatus('');
    setServiceHistory('');
    setOwnerCount('');
    setRepaintedPartsCount('');
    setReplacedParts('');
    setEngineRepaired(false);
    setTransmissionRepaired(false);
    setUploadedFiles([]);
    setUploadedPreviews([]);
    setResult(null);
    setError(null);
    setAiScanSuccess(null);
  };

  return {
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
    bodyType,
    setBodyType,
    transmission,
    setTransmission,
    powertrain,
    setPowertrain,
    engineDisplacement,
    setEngineDisplacement,
    drivetrain,
    setDrivetrain,
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
    uploadedFiles,
    uploadedPreviews,
    isDragOver,
    setIsDragOver,
    fileInputRef,
    aiScanLoading,
    aiScanSuccess,
    setAiScanSuccess,
    loading,
    result,
    error,
    setError,
    quickModalOpen,
    setQuickModalOpen,
    resultModalOpen,
    setResultModalOpen,
    modelSuggestions,
    odoSuggestions,
    handleAddPhotos,
    handleFileInputChange,
    handleRemovePhoto,
    handleClearAllPhotos,
    handleSubmit,
    resetForm,
  };
}
