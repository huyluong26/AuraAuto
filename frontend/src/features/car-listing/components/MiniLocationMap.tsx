'use client';

import React, { useState } from 'react';
import { Coordinates } from '../types';
import { PROVINCE_COORDINATES, detectProvinceFromText } from '../constants';

interface MiniLocationMapProps {
  provinceCode: string;
  locationAddress: string;
  coordinates: Coordinates;
  onCoordinatesChange: (coords: Coordinates) => void;
  onAddressDetected: (address: string, provinceCode?: string) => void;
  searchingAddress?: boolean;
}

export function MiniLocationMap({
  provinceCode,
  locationAddress,
  coordinates,
  onCoordinatesChange,
  onAddressDetected,
  searchingAddress = false,
}: MiniLocationMapProps) {
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const handleGetCurrentLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setGeoError('Trình duyệt của bạn không hỗ trợ định vị GPS.');
      return;
    }

    setLocating(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        onCoordinatesChange({ lat, lng });

        // Reverse Geocode with OpenStreetMap Nominatim
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=vi`
          );
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            const road = addr.road || addr.street || '';
            const suburb = addr.suburb || addr.quarter || addr.neighbourhood || '';
            const district = addr.city_district || addr.district || addr.county || '';
            const city = addr.city || addr.state || addr.province || '';

            const detectedAddressParts = [road, suburb, district, city].filter(Boolean);
            const detectedStr = detectedAddressParts.join(', ') || data.display_name || '';

            // Detect matching province code
            const matchedProv = detectProvinceFromText(detectedStr) || detectProvinceFromText(city) || provinceCode;

            onAddressDetected(detectedStr, matchedProv);
          }
        } catch {
          // Keep GPS coordinates if reverse geocode fails
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        setLocating(false);
        if (err.code === 1) {
          setGeoError('Bạn chưa cấp quyền truy cập vị trí trên trình duyệt.');
        } else {
          setGeoError('Không thể lấy vị trí GPS hiện tại.');
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Render OpenStreetMap embed based on coordinates
  const delta = 0.007;
  const bbox = `${coordinates.lng - delta}%2C${coordinates.lat - delta}%2C${coordinates.lng + delta}%2C${coordinates.lat + delta}`;
  const marker = `${coordinates.lat}%2C${coordinates.lng}`;
  const embedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${marker}`;

  const currentProvName = PROVINCE_COORDINATES[provinceCode]?.name || 'Toàn quốc';

  return (
    <div className="space-y-3 pt-1">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <label className="block font-label-md text-label-md text-on-surface-variant font-medium">
            Vị trí ghim thực tế trên bản đồ (Mini Map)
          </label>
          {searchingAddress && (
            <span className="inline-flex items-center gap-1 text-[11px] text-secondary">
              <span className="material-symbols-outlined text-[13px] animate-spin">sync</span>
              Đang đồng bộ tọa độ...
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleGetCurrentLocation}
          disabled={locating}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-low hover:bg-secondary-container/50 border border-surface-container-high text-xs font-semibold text-secondary transition-all cursor-pointer disabled:opacity-60 self-start sm:self-auto shadow-sm"
        >
          {locating ? (
            <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
          ) : (
            <span className="material-symbols-outlined text-[16px]">my_location</span>
          )}
          <span>{locating ? 'Đang lấy tọa độ GPS...' : 'Lấy vị trí GPS hiện tại'}</span>
        </button>
      </div>

      {geoError && (
        <p className="text-xs text-error font-medium flex items-center gap-1">
          <span className="material-symbols-outlined text-[15px]">info</span>
          {geoError}
        </p>
      )}

      {/* Mini Map Container */}
      <div className="relative rounded-xl overflow-hidden border border-surface-container-high bg-surface shadow-inner aspect-[21/9] sm:aspect-[24/8] min-h-[170px]">
        <iframe
          key={`${coordinates.lat}-${coordinates.lng}`}
          title="Bản đồ vị trí xem xe thực tế"
          width="100%"
          height="100%"
          src={embedUrl}
          className="w-full h-full border-0 pointer-events-none"
          loading="lazy"
        />

        {/* Pinpoint overlay card */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 sm:right-auto bg-surface-container-lowest/95 backdrop-blur-md px-3.5 py-2 rounded-lg border border-surface-container-high shadow-md flex items-center justify-between sm:justify-start gap-2.5 text-xs max-w-lg">
          <div className="flex items-center gap-1.5 text-secondary font-semibold min-w-0">
            <span className="material-symbols-outlined text-[18px] text-error shrink-0">location_on</span>
            <div className="min-w-0 flex flex-col">
              <span className="truncate text-primary font-medium text-xs">
                {locationAddress || `Khu vực: ${currentProvName}`}
              </span>
              <span className="text-[10px] text-outline truncate font-mono">
                [{coordinates.lat.toFixed(5)}, {coordinates.lng.toFixed(5)}]
              </span>
            </div>
          </div>

          <a
            href={`https://www.google.com/maps/search/?api=1&query=${coordinates.lat},${coordinates.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-secondary hover:underline font-semibold ml-auto shrink-0 flex items-center gap-0.5"
          >
            <span>Mở Maps</span>
            <span className="material-symbols-outlined text-[12px]">open_in_new</span>
          </a>
        </div>
      </div>
    </div>
  );
}
