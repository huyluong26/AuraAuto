import { api } from '@/lib/api';
import { CommitmentsState, Coordinates, VehicleHistoryState, TradeOptionsState } from '../types';
import { POWERTRAIN_OPTIONS, TRANSMISSION_OPTIONS } from '../constants';

export interface SubmitListingParams {
  brandId: string;
  modelId: string;
  brandName: string;
  modelName: string;
  trim?: string;
  manufactureYear: number;
  odometerKm: string;
  bodyType: string;
  powertrain: string;
  transmission: string;
  provinceCode: string;
  locationAddress: string;
  coordinates: Coordinates;
  condition: string;
  origin: string;
  engineDisplacement: string;
  drivetrain: string;
  seats: number;
  doors: number;
  color: string;
  interiorColor: string;
  description: string;
  priceVnd: string;
  sellerType: 'INDIVIDUAL' | 'SHOWROOM';
  showroomName?: string;
  showroomPhone?: string;
  showroomId?: string;
  privacyShield: boolean;
  tradeOptions: TradeOptionsState;
  commitments: CommitmentsState;
  vehicleHistory: VehicleHistoryState;
  photos: { file: File; label: string }[];
  onStatusUpdate: (text: string) => void;
}

export async function submitNewListing(params: SubmitListingParams): Promise<{
  listingId: string | null;
  status: string | null;
  brandId: string;
  modelId: string;
}> {
  let finalBrandId = params.brandId;
  let finalModelId = params.modelId;

  if (!finalBrandId || !finalModelId) {
    params.onStatusUpdate('Đang khởi tạo danh mục thương hiệu & dòng xe mới...');
    const resolved = await api.resolveBrandModel({
      brand_name: params.brandName,
      model_name: params.modelName,
      body_type: params.bodyType || 'SEDAN',
    });
    if (resolved?.brand_id) {
      finalBrandId = resolved.brand_id;
      finalModelId = resolved.model_id || '';
    } else {
      throw new Error('Không thể đồng bộ danh mục xe mới trên cơ sở dữ liệu.');
    }
  }

  // Upload photos
  const filesToUpload = params.photos.map((item) => item.file);
  let mediaItems: any[] = [];

  if (filesToUpload.length > 0) {
    params.onStatusUpdate(`Đang tải ${filesToUpload.length} ảnh xe lên hệ thống lưu trữ...`);
    try {
      const uploadRes = await api.uploadMultipleMedia(filesToUpload);
      if (Array.isArray(uploadRes)) {
        mediaItems = uploadRes.map((item, idx) => ({
          url: item.secure_url || item.url,
          thumbnail_url: item.thumbnail_url || item.url,
          media_type: 'IMAGE',
          is_primary: idx === 0,
          sort_order: idx,
          label: params.photos[idx]?.label || `Góc chụp #${idx + 1}`,
        }));
      }
    } catch (uploadErr) {
      console.warn('Upload media error:', uploadErr);
    }
  }

  const matchedTrans = TRANSMISSION_OPTIONS.find((t) => t.id === params.transmission);
  const matchedPower = POWERTRAIN_OPTIONS.find((p) => p.value === params.powertrain);
  const parsedOdo = parseInt(params.odometerKm.replace(/\D/g, ''), 10) || 0;
  const parsedPrice = parseInt(params.priceVnd.replace(/\D/g, ''), 10) || 0;
  const fullTitle = `${params.brandName} ${params.modelName} ${params.trim || ''} ${params.manufactureYear}`
    .replace(/\s+/g, ' ')
    .trim();

  const commitmentsList = [
    params.commitments.isOwner && 'Chính chủ cá nhân đứng tên',
    params.commitments.maintenanceHistory && 'Lịch sử bảo dưỡng chính hãng',
    params.commitments.noAccidentFlood && 'Cam kết không đâm đụng, thủy kích',
    params.commitments.readyInspection && 'Sẵn sàng giám định độc lập',
  ]
    .filter(Boolean)
    .join('; ');

  const tradeList = [
    params.tradeOptions.negotiable && 'Có thương lượng nhẹ cho người mua thiện chí',
    params.tradeOptions.tradeSuv && 'Hỗ trợ giao lưu bù trừ với dòng SUV',
    params.privacyShield && 'Bảo vệ số điện thoại qua eKYC',
  ]
    .filter(Boolean)
    .join('; ');

  const coordsText =
    params.coordinates.lat && params.coordinates.lng
      ? `\nTọa độ GPS kiểm định: [${params.coordinates.lat.toFixed(6)}, ${params.coordinates.lng.toFixed(6)}]`
      : '';

  const fullDescription = [
    params.description.trim(),
    `\nThông số kỹ thuật: Động cơ ${params.engineDisplacement || 'Tiêu chuẩn'} | Dẫn động ${params.drivetrain || 'Tiêu chuẩn'} | ${params.seats ? `${params.seats} chỗ` : ''} | ${params.doors ? `${params.doors} cửa` : ''} | Xuất xứ ${params.origin} | Tình trạng ${params.condition === 'NEW' ? 'Xe mới' : 'Đã qua sử dụng'}`,
    commitmentsList ? `Cam kết chủ xe: ${commitmentsList}` : '',
    tradeList ? `Tùy chọn: ${tradeList}` : '',
    params.locationAddress ? `Địa chỉ xem xe: ${params.locationAddress}` : '',
    coordsText,
  ]
    .filter(Boolean)
    .join('\n');

  params.onStatusUpdate('Đang nộp hồ sơ kiểm định xe lên hệ thống thẩm định...');
  const payload: any = {
    brand_id: finalBrandId,
    model_id: finalModelId,
    seller_type: params.sellerType,
    showroom_id: params.showroomId || undefined,
    custom_showroom_name: params.sellerType === 'SHOWROOM' ? params.showroomName?.trim() : undefined,
    custom_showroom_phone: params.sellerType === 'SHOWROOM' ? params.showroomPhone?.trim() || undefined : undefined,
    title: fullTitle,
    price_vnd: parsedPrice,
    manufacture_year: params.manufactureYear,
    odometer_km: parsedOdo,
    mileage_unknown: false,
    condition: params.condition || 'USED',
    body_type: params.bodyType || 'SEDAN',
    fuel_type: matchedPower?.dbValue || 'GASOLINE',
    transmission: matchedTrans?.value || 'AUTOMATIC',
    origin: params.origin || 'Lắp ráp trong nước',
    color: params.color.trim() || 'Trắng',
    interior_color: params.interiorColor.trim() || 'Đen',
    seats: params.seats || 5,
    doors: params.doors || 4,
    province_code: params.provinceCode || '79',
    location_address: params.locationAddress.trim() || undefined,
    description: fullDescription,
    accident_status: params.vehicleHistory.accidentStatus,
    flood_status: params.vehicleHistory.floodStatus,
    service_history: params.vehicleHistory.serviceHistory,
    owner_count: params.vehicleHistory.ownerCount || undefined,
    repainted_parts_count: params.vehicleHistory.repaintedPartsCount,
    replaced_parts: params.vehicleHistory.replacedParts.trim() || undefined,
    engine_repaired: params.vehicleHistory.engineRepaired,
    transmission_repaired: params.vehicleHistory.transmissionRepaired,
    media: mediaItems,
  };

  const res = await api.createListing(payload);
  const newListingId = res?.data?.id || null;
  let finalStatus = res?.data?.status || null;

  if (newListingId && res?.data?.status === 'DRAFT') {
    const submitRes = await api.submitListingForReview(newListingId).catch(() => null);
    if (submitRes?.data?.status) {
      finalStatus = submitRes.data.status;
    }
  }

  return {
    listingId: newListingId,
    status: finalStatus,
    brandId: finalBrandId,
    modelId: finalModelId,
  };
}
