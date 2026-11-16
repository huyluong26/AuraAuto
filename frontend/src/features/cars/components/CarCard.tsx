'use client';

import React from 'react';
import Link from 'next/link';
import { ListingItem } from '@/types';
import { LuxuryCarItem } from '@/features/home/types';
import { useFavorites } from '@/hooks/useFavorites';
import { getHighResImageUrl } from '@/lib/image';
import { formatVND } from '@/lib/api';
import { PROVINCE_MAP } from '@/features/auth/constants/provinces';
import { detectProvinceFromText } from '@/features/car-listing/constants';

const DEFAULT_CAR_IMAGES: Record<string, string> = {
  SEDAN: 'https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=1200&q=90',
  SUV: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1200&q=90',
  HATCHBACK: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=1200&q=90',
  PICKUP: 'https://images.unsplash.com/photo-1559416523-140ddc3d238c?auto=format&fit=crop&w=1200&q=90',
};

const PROVINCE_NAMES = new Set(Object.values(PROVINCE_MAP));

/**
 * Trích xuất Tỉnh / Thành phố xem xe cho nhãn thẻ (không hiển thị địa chỉ chi tiết)
 */
function resolveCardProvince(listing?: ListingItem, car?: LuxuryCarItem): string {
  // 1. Ưu tiên 1: Tên tỉnh/thành phố từ province_name nếu đã có
  if (listing?.province_name && listing.province_name.trim()) {
    const pName = listing.province_name.trim();
    if (PROVINCE_MAP[pName]) return PROVINCE_MAP[pName];
    return pName;
  }

  // 2. Ưu tiên 2: Tên tỉnh/thành phố tra cứu theo province_code của tin đăng
  if (listing?.province_code && listing.province_code.trim()) {
    const code = listing.province_code.trim();
    if (PROVINCE_MAP[code]) return PROVINCE_MAP[code];
  }

  // 3. Ưu tiên 3: Nếu truyền đối tượng car, kiểm tra xem car.location đã là Tỉnh/Thành phố hay chưa
  if (car?.location && car.location.trim()) {
    const loc = car.location.trim();
    if (PROVINCE_NAMES.has(loc)) return loc;
    if (PROVINCE_MAP[loc]) return PROVINCE_MAP[loc];
    const detectedFromCar = detectProvinceFromText(loc);
    if (detectedFromCar && PROVINCE_MAP[detectedFromCar]) {
      return PROVINCE_MAP[detectedFromCar];
    }
  }

  // 4. Ưu tiên 4: Nhận diện Tỉnh / Thành phố từ chuỗi địa chỉ người bán nhập (location_address)
  if (listing?.location_address && listing.location_address.trim()) {
    const detectedFromAddress = detectProvinceFromText(listing.location_address);
    if (detectedFromAddress && PROVINCE_MAP[detectedFromAddress]) {
      return PROVINCE_MAP[detectedFromAddress];
    }
  }

  // 5. Nếu car.location là chuỗi ngắn không chứa số nhà/tên đường
  if (car?.location && car.location.trim() && car.location.length <= 25 && !/\d/.test(car.location)) {
    return car.location.trim();
  }

  return 'Toàn quốc';
}

export interface CarCardProps {
  listing?: ListingItem;
  car?: LuxuryCarItem;
  className?: string;
}

export default function CarCard({ listing, car, className = '' }: CarCardProps) {
  const id = car?.id || listing?.id || '';
  const title = car?.title || listing?.title || 'Xe cao cấp';
  const isFeatured = Boolean(car?.isFeatured || listing?.is_featured);

  // Loại bỏ đời xe bị lặp nếu tiêu đề xe đã chứa năm sản xuất
  const yearStr = String(car?.year || listing?.manufacture_year || '');
  const bodyTypeStr = listing?.body_type || 'Hạng sang';
  const subtitle =
    car?.subtitle ||
    (yearStr && !title.includes(yearStr)
      ? `Đời ${yearStr} • ${bodyTypeStr}`
      : bodyTypeStr);

  const rawImage =
    listing?.primary_image_url ||
    car?.imageUrl ||
    DEFAULT_CAR_IMAGES[listing?.body_type?.toUpperCase() || 'SEDAN'] ||
    DEFAULT_CAR_IMAGES.SEDAN;
  const imageUrl = getHighResImageUrl(rawImage, 1200, 92);

  // Nhãn địa chỉ trên thẻ xe: Chỉ hiển thị Tỉnh / Thành phố xem xe, không hiển thị địa chỉ chi tiết
  const displayLocation = resolveCardProvince(listing, car);

  const marketStatus = car?.marketStatus || 'Đã kiểm định';

  // Chuẩn hóa Odometer
  const odometer =
    car?.odometer ||
    (listing?.odometer_km !== undefined ? `${(listing.odometer_km || 0).toLocaleString('vi-VN')} km` : '0 km');

  // Chuẩn hóa nhiên liệu
  const rawFuel = car?.fuel || listing?.fuel_type || '';
  const fuel =
    rawFuel === 'GASOLINE' || rawFuel.toLowerCase().includes('xăng')
      ? 'Xăng'
      : rawFuel === 'DIESEL' || rawFuel.toLowerCase().includes('dầu')
      ? 'Dầu'
      : rawFuel === 'ELECTRIC' || rawFuel.toLowerCase().includes('điện')
      ? 'Điện EV'
      : rawFuel === 'HYBRID' || rawFuel.toLowerCase().includes('hybrid')
      ? 'Hybrid'
      : rawFuel || 'Xăng';

  // Chuẩn hóa hộp số (Tự động / Số sàn)
  const rawTrans = car?.transmission || listing?.transmission || '';
  const transmission =
    rawTrans === 'AUTOMATIC' || rawTrans.toLowerCase().includes('tự động') || rawTrans.toLowerCase().includes('auto')
      ? 'Tự động'
      : rawTrans === 'MANUAL' || rawTrans.toLowerCase().includes('sàn') || rawTrans.toLowerCase().includes('man')
      ? 'Số sàn'
      : rawTrans || 'Tự động';

  // Giá dạng chữ thu gọn: ví dụ 520 triệu, 1,2 tỷ (thay vì 520000000đ)
  const rawPrice = car?.priceVnd ?? listing?.price_vnd ?? 0;
  const displayPrice = formatVND(rawPrice);
  const detailUrl = car?.detailUrl || `/xe/${id}`;

  const { isFavorite, toggleFavorite } = useFavorites();
  const isFav = isFavorite(id);

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(id);
  };

  return (
    <Link
      href={detailUrl}
      className={`group bg-surface-container-lowest rounded-xl overflow-hidden shadow-[0_8px_30px_rgba(25,25,25,0.04)] hover:shadow-[0_16px_40px_rgba(25,25,25,0.09)] transition-all duration-300 flex flex-col justify-between border ${
        isFeatured
          ? 'border-secondary/50 ring-1 ring-secondary/20 shadow-[0_8px_24px_rgba(114,90,55,0.12)]'
          : 'border-surface-container-high'
      } transform hover:-translate-y-0.5 ${className}`}
    >
      {/* 1. Image Viewport */}
      <div className="relative w-full aspect-[16/10] overflow-hidden bg-surface-container">
        <img
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          src={imageUrl}
          alt={title}
          loading="lazy"
        />

        {/* Top-left Badges: Địa chỉ & Huy hiệu */}
        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1 max-w-[85%] z-10">
          <span
            className="px-2.5 py-1 rounded-lg bg-black/65 backdrop-blur-md text-white font-label-sm text-[11px] font-semibold flex items-center gap-1 shadow-sm max-w-full"
            title={displayLocation}
          >
            <span className="material-symbols-outlined text-[13px] text-secondary-fixed shrink-0">location_on</span>
            <span className="truncate">{displayLocation}</span>
          </span>
          {listing?.is_showroom_verified && (
            <span className="px-2 py-0.5 rounded-md bg-secondary text-on-secondary font-label-sm text-[10px] uppercase tracking-wider font-bold w-fit flex items-center gap-0.5 shadow-2xs">
              <span className="material-symbols-outlined text-[12px]">verified</span>
              <span>Uy tín</span>
            </span>
          )}
        </div>

        {/* Top-right Favorite Heart Button */}
        <button
          type="button"
          aria-label="Thêm vào danh sách yêu thích"
          onClick={handleToggleFavorite}
          className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-surface-container-lowest/85 hover:bg-surface-container-lowest text-primary backdrop-blur-md flex items-center justify-center transition-colors shadow-sm cursor-pointer z-10"
        >
          <span
            className={`material-symbols-outlined text-[19px] ${
              isFav ? 'text-secondary font-bold' : 'text-outline hover:text-secondary'
            }`}
            style={{ fontVariationSettings: isFav ? "'FILL' 1" : "'FILL' 0" }}
          >
            favorite
          </span>
        </button>
      </div>

      {/* 2. Info Content Area */}
      <div className="p-3 sm:p-3.5 flex-1 flex flex-col justify-between">
        <div>
          {/* Market Verification Status */}
          <div className="flex items-center justify-start mb-1.5">
            <span className="px-2 py-0.5 rounded bg-secondary-fixed/30 text-secondary font-semibold text-[11px] shrink-0">
              {marketStatus}
            </span>
          </div>

          {/* Car Title H3 */}
          <h3 className="font-headline-sm text-base font-bold text-primary tracking-tight group-hover:text-secondary transition-colors line-clamp-1">
            {title}
          </h3>
          <p className="font-body-sm text-xs text-on-surface-variant mt-0.5 line-clamp-1">
            {subtitle}
          </p>

          {/* Specs Bar: ODO • Nhiên liệu • Hộp số - Grid 3 cột độc lập ngăn hoàn toàn tràn/đè icon */}
          <div className="grid grid-cols-3 items-center my-2.5 py-1.5 px-1 rounded-xl bg-surface-container-low border border-surface-container/60 text-[#1a1c1a] divide-x divide-surface-container-high">
            <div className="flex items-center justify-center gap-1 min-w-0 px-1" title={`Số km đã đi (ODO): ${odometer}`}>
              <span className="material-symbols-outlined text-[13px] text-outline shrink-0">speed</span>
              <span className="text-[11px] font-medium truncate">{odometer}</span>
            </div>
            <div className="flex items-center justify-center gap-1 min-w-0 px-1" title={`Nhiên liệu: ${fuel}`}>
              <span className="material-symbols-outlined text-[13px] text-outline shrink-0">local_gas_station</span>
              <span className="text-[11px] font-medium truncate">{fuel}</span>
            </div>
            <div className="flex items-center justify-center gap-1 min-w-0 px-1" title={`Hộp số: ${transmission}`}>
              <span className="material-symbols-outlined text-[13px] text-outline shrink-0">settings</span>
              <span className="text-[11px] font-medium truncate">{transmission}</span>
            </div>
          </div>
        </div>

        {/* Price & Action Button Footer */}
        <div className="flex items-center justify-between pt-2.5 border-t border-surface-container-high gap-2">
          <div className="min-w-0">
            <span className="text-[10px] text-on-surface-variant block uppercase tracking-wider font-semibold">
              Giá niêm yết
            </span>
            <span className="text-base sm:text-[17px] text-primary font-bold font-display truncate block">
              {displayPrice}
            </span>
          </div>
          <span className="px-3 py-1.5 rounded-lg bg-surface-container-high group-hover:bg-primary group-hover:text-on-primary text-primary text-xs font-semibold transition-colors shrink-0 whitespace-nowrap">
            Xem chi tiết
          </span>
        </div>
      </div>
    </Link>
  );
}

// Named export for flexibility
export { CarCard };
