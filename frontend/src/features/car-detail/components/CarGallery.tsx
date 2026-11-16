'use client';

import React, { useState } from 'react';
import { GalleryImage } from '../types';
import { getHighResImageUrl } from '@/lib/image';

interface CarGalleryProps {
  images: GalleryImage[];
  title: string;
  condition?: string;
  isVerified?: boolean;
}

export function CarGallery({
  images,
  title,
}: CarGalleryProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const activeImg = images[activeIdx] || images[0];
  const ultraHdMainUrl = getHighResImageUrl(activeImg?.url, 2560, 95);

  return (
    <>
      <section className="w-full px-margin-mobile lg:px-margin pt-space-sm pb-space-md">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-md items-start">
          {/* Main Viewport */}
          <div className="lg:col-span-9 relative group overflow-hidden rounded-xl bg-surface-container shadow-md border border-surface-container">
            <div className="relative w-full aspect-[16/9] overflow-hidden bg-black/5">
              <img
                key={ultraHdMainUrl}
                src={ultraHdMainUrl}
                alt={`${title} - ${activeImg?.label || 'Hình ảnh thực tế'}`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.01]"
                loading="eager"
                fetchPriority="high"
                decoding="async"
              />

              {/* Real Image Label Overlay (Crisp pill without darkening the photo) */}
              <div className="absolute top-3 left-3 flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-lg bg-black/65 backdrop-blur-md text-white font-medium text-xs flex items-center gap-1.5 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary-fixed" />
                  <span>{activeImg?.label || `Góc chụp #${activeIdx + 1}`}</span>
                </span>
              </div>

              {/* Counter Overlay */}
              <div className="absolute top-3 right-3 flex items-center gap-2">
                <span className="px-2.5 py-1.5 rounded-lg bg-black/65 backdrop-blur-md text-white/90 text-xs font-mono font-medium shadow-sm">
                  {activeIdx + 1} / {images.length}
                </span>
              </div>

              {/* Bottom Right: Fullscreen Lightbox trigger */}
              <div className="absolute bottom-3 right-3">
                <button
                  type="button"
                  onClick={() => setLightboxOpen(true)}
                  className="px-3.5 py-1.5 rounded-lg bg-black/65 hover:bg-black/85 backdrop-blur-md text-white text-xs font-medium shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Phóng to ảnh chất lượng cao 4K"
                >
                  <span className="material-symbols-outlined text-[16px]">fullscreen</span>
                  <span>Xem ảnh 4K ({images.length} ảnh)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Thumbnails Column */}
          <div className="lg:col-span-3 flex lg:flex-col gap-space-sm overflow-x-auto lg:overflow-y-auto lg:max-h-[480px] lg:pr-1.5 pb-2 lg:pb-0 scrollbar-thin">
            {images.map((img, idx) => {
              const isActive = activeIdx === idx;
              const thumbUrl = getHighResImageUrl(img.url, 800, 90);
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveIdx(idx)}
                  className={`thumb-btn flex-shrink-0 w-36 lg:w-full h-24 relative rounded-xl overflow-hidden transition-all duration-200 cursor-pointer group ${
                    isActive
                      ? 'ring-2 ring-secondary shadow-md'
                      : 'border border-surface-container opacity-85 hover:opacity-100'
                  }`}
                >
                  <img
                    src={thumbUrl}
                    alt={img.label}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  <span className="absolute bottom-1 right-1.5 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-xs text-[10px] font-semibold text-white shadow-2xs">
                    {img.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Lightbox Modal with 4K Crystal Clear Image */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between p-4 sm:p-6 backdrop-blur-md">
          <div className="flex items-center justify-between text-white">
            <div className="text-xs sm:text-sm font-medium flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-white/10 font-mono">
                {activeIdx + 1} / {images.length}
              </span>
              <span>{activeImg?.label || 'Hình ảnh'}</span>
              <span className="text-white/50">• {title}</span>
            </div>
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-colors"
            >
              <span className="material-symbols-outlined text-[24px]">close</span>
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center relative my-2">
            <button
              type="button"
              onClick={() =>
                setActiveIdx((prev) => (prev === 0 ? images.length - 1 : prev - 1))
              }
              className="absolute left-2 sm:left-4 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white cursor-pointer transition-colors z-10"
              title="Ảnh trước"
            >
              <span className="material-symbols-outlined text-[28px]">chevron_left</span>
            </button>

            <img
              src={getHighResImageUrl(activeImg?.url, 3840, 98)}
              alt={`${title} - ${activeImg?.label}`}
              className="max-h-[82vh] max-w-[92vw] object-contain rounded-lg shadow-2xl"
            />

            <button
              type="button"
              onClick={() =>
                setActiveIdx((prev) => (prev === images.length - 1 ? 0 : prev + 1))
              }
              className="absolute right-2 sm:right-4 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white cursor-pointer transition-colors z-10"
              title="Ảnh kế tiếp"
            >
              <span className="material-symbols-outlined text-[28px]">chevron_right</span>
            </button>
          </div>

          <div className="flex items-center justify-center gap-2 overflow-x-auto py-2 max-w-full px-4 scrollbar-none">
            {images.map((img, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveIdx(idx)}
                className={`relative w-20 h-14 rounded-lg overflow-hidden flex-shrink-0 transition-all cursor-pointer ${
                  activeIdx === idx
                    ? 'ring-2 ring-secondary-fixed scale-105 opacity-100'
                    : 'opacity-50 hover:opacity-85'
                }`}
                title={img.label}
              >
                <img
                  src={getHighResImageUrl(img.url, 300, 85)}
                  alt={img.label}
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-0.5 inset-x-0 bg-black/80 text-[9px] text-white/95 text-center truncate px-1 font-medium">
                  {img.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
