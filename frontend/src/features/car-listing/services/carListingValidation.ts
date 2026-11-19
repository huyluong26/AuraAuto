import { CarListingStep } from '../types';

export interface ListingValidationData {
  brandName: string;
  modelName: string;
  manufactureYear: number;
  odometerKm: string;
  provinceCode: string;
  condition: string;
  origin: string;
  bodyType: string;
  transmission: string;
  powertrain: string;
  color: string;
  hasAnyPhoto: boolean;
  priceVnd: string;
}

export function validateListingStep(
  step: CarListingStep,
  data: ListingValidationData
): { isValid: boolean; errors: Record<string, string>; firstError: string | null } {
  const newErrors: Record<string, string> = {};

  if (step === 1) {
    if (!data.brandName.trim()) {
      newErrors.brand = 'Vui lòng chọn hoặc nhập Thương hiệu xe.';
    }
    if (!data.modelName.trim()) {
      newErrors.model = 'Vui lòng chọn hoặc nhập Dòng xe.';
    }
    if (!data.manufactureYear || data.manufactureYear <= 1990) {
      newErrors.manufactureYear = 'Vui lòng chọn năm sản xuất của xe.';
    }
    const cleanOdo = parseInt(data.odometerKm.replace(/\D/g, ''), 10);
    if (!data.odometerKm.trim() || !cleanOdo || cleanOdo <= 0) {
      newErrors.odometer = 'Vui lòng nhập số km ODO thực tế của xe (phải là số > 0).';
    }
    if (!data.provinceCode) {
      newErrors.provinceCode = 'Vui lòng chọn Tỉnh / Thành phố xem xe.';
    }
  } else if (step === 2) {
    if (!data.condition) {
      newErrors.condition = 'Vui lòng chọn tình trạng sử dụng của xe.';
    }
    if (!data.origin) {
      newErrors.origin = 'Vui lòng chọn nguồn gốc xuất xứ của xe.';
    }
    if (!data.bodyType) {
      newErrors.bodyType = 'Vui lòng chọn kiểu dáng thân xe.';
    }
    if (!data.transmission) {
      newErrors.transmission = 'Vui lòng chọn loại hộp số của xe.';
    }
    if (!data.powertrain) {
      newErrors.powertrain = 'Vui lòng chọn loại nhiên liệu / động lực.';
    }
    if (!data.color.trim()) {
      newErrors.color = 'Vui lòng chọn hoặc nhập màu sơn ngoại thất của xe.';
    }
  } else if (step === 3) {
    if (!data.hasAnyPhoto) {
      newErrors.photo = 'Vui lòng tải lên ít nhất 1 hình ảnh của xe để tiếp tục.';
    }
  } else if (step === 4) {
    const cleanPrice = parseInt(data.priceVnd.replace(/\D/g, ''), 10);
    if (!cleanPrice || cleanPrice <= 0) {
      newErrors.price = 'Vui lòng nhập mức giá chuyển nhượng xe hợp lệ (phải là số > 0).';
    }
  }

  const isValid = Object.keys(newErrors).length === 0;
  const firstError = isValid ? null : Object.values(newErrors)[0];

  return { isValid, errors: newErrors, firstError };
}

