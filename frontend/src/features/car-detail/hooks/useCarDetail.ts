'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '@/lib/api';
import { useFavorites } from '@/hooks/useFavorites';
import { ListingDetail, ListingItem, ValuationResponse } from '@/types';
import { getHighResImageUrl } from '@/lib/image';
import { GalleryImage } from '../types';

function cleanVehicleBrandModel(listing: ListingDetail) {
  let brand = listing.brand_name || '';
  let model = listing.model_name || '';
  const variant = listing.variant_name || '';

  if (!brand || !model) {
    const rawTokens = (listing.title || '').trim().split(/\s+/);
    const ignoredWords = new Set(['bán', 'xe', 'cần', 'chính', 'chủ', 'ô', 'tô']);
    const cleanTokens = rawTokens.filter((t) => !ignoredWords.has(t.toLowerCase()));
    if (!brand && cleanTokens.length > 0) {
      brand = cleanTokens[0];
    }
    if (!model && cleanTokens.length > 1) {
      model = cleanTokens[1];
    }
  }

  return {
    brand: brand || 'Toyota',
    model: model || 'Camry',
    variant: variant || undefined,
  };
}

export function useCarDetail(id: string) {
  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [valuation, setValuation] = useState<ValuationResponse | null>(null);
  const [valuationLoading, setValuationLoading] = useState(false);
  const [similarCars, setSimilarCars] = useState<ListingItem[]>([]);
  const [similarLoading, setSimilarLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Direct Chat modal state
  const [chatModalOpen, setChatModalOpen] = useState(false);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Local & Global Favorites
  const { isFavorite, toggleFavorite } = useFavorites();
  const isSaved = isFavorite(id);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  }, []);

  // Fetch listing and similar cars (AI valuation is loaded ON-DEMAND only)
  useEffect(() => {
    let mounted = true;
    async function fetchDetail() {
      setLoading(true);
      setError(null);
      setValuation(null);
      setValuationLoading(false);
      setSimilarCars([]);

      try {
        // Fast path: load listing detail in ~30-50ms and reveal UI immediately
        const data = await api.getListingById(id);
        if (!mounted) return;
        setListing(data);
        setLoading(false);

        // Tự động kích hoạt thẩm định giá AI & Gemini trong nền (Non-blocking)
        setValuationLoading(true);
        (async () => {
          try {
            const { brand, model, variant } = cleanVehicleBrandModel(data);
            const valRes = await api.estimateValuation({
              brand,
              model,
              variant,
              manufacture_year: data.manufacture_year,
              odometer_km: data.odometer_km || 10000,
              body_type: data.body_type,
              fuel_type: data.fuel_type,
              transmission: data.transmission,
              province_code: data.province_code,
              condition: data.condition,
              origin: data.origin,
              accident_status: data.accident_status,
              flood_status: data.flood_status,
              service_history: data.service_history,
              engine_repaired: data.engine_repaired,
              transmission_repaired: data.transmission_repaired,
              owner_count: data.owner_count,
              repainted_parts_count: data.repainted_parts_count,
              replaced_parts: data.replaced_parts,
            });
            if (mounted) {
              setValuation(valRes);
            }
          } catch (valErr) {
            console.warn('Auto valuation error:', valErr);
          } finally {
            if (mounted) setValuationLoading(false);
          }
        })();

        // Background parallel non-blocking fetch: Recommended cars
        // 1. Hiển thị toàn bộ tin nổi bật nếu có
        // 2. Không có tin nổi bật -> gợi ý xe cùng hãng
        // 3. Không có xe cùng hãng -> gợi ý xe khác
        setSimilarLoading(true);
        (async () => {
          try {
            // Tải song song gợi ý xe nổi bật và xe cùng hãng (Parallel Non-blocking Fetch)
            const brandKeyword = data.brand_name || data.title?.trim().split(' ')[0] || '';
            const [featuredList, brandRes] = await Promise.all([
              api.getFeaturedListings(8).catch(() => []),
              api
                .getListings({
                  brand_id: data.brand_id || undefined,
                  search: data.brand_id ? undefined : (brandKeyword || undefined),
                  page_size: 8,
                })
                .catch(() => null),
            ]);

            // 1. Ưu tiên tin nổi bật
            const validFeatured = (featuredList || []).filter(
              (c) => String(c.id).toLowerCase() !== String(data.id).toLowerCase()
            );
            if (validFeatured.length > 0) {
              if (mounted) setSimilarCars(validFeatured.slice(0, 4));
              return;
            }

            // 2. Ưu tiên xe cùng hãng
            const sameBrandCars = (brandRes?.items || []).filter(
              (c) => String(c.id).toLowerCase() !== String(data.id).toLowerCase()
            );
            if (sameBrandCars.length > 0) {
              if (mounted) setSimilarCars(sameBrandCars.slice(0, 4));
              return;
            }

            // 3. Fallback xe khác
            const generalRes = await api.getListings({ page_size: 8 }).catch(() => null);
            const otherCars = (generalRes?.items || []).filter(
              (c) => String(c.id).toLowerCase() !== String(data.id).toLowerCase()
            );
            if (mounted) setSimilarCars(otherCars.slice(0, 4));
          } catch {
            if (mounted) setSimilarCars([]);
          } finally {
            if (mounted) setSimilarLoading(false);
          }
        })();
      } catch (err: any) {
        if (mounted) {
          setError(err.message || 'Không tìm thấy thông tin xe');
          setLoading(false);
        }
      }
    }

    if (id) {
      fetchDetail();
    }

    return () => {
      mounted = false;
    };
  }, [id]);

  // On-demand AI valuation triggered explicitly by user click
  const requestValuation = useCallback(async (silent = false) => {
    if (!listing || valuationLoading) return;
    setValuationLoading(true);
    try {
      const { brand, model, variant } = cleanVehicleBrandModel(listing);
      const valRes = await api.estimateValuation({
        brand,
        model,
        variant,
        manufacture_year: listing.manufacture_year,
        odometer_km: listing.odometer_km || 10000,
        body_type: listing.body_type,
        fuel_type: listing.fuel_type,
        transmission: listing.transmission,
        province_code: listing.province_code,
        condition: listing.condition,
        origin: listing.origin,
        accident_status: listing.accident_status,
        flood_status: listing.flood_status,
        service_history: listing.service_history,
        engine_repaired: listing.engine_repaired,
        transmission_repaired: listing.transmission_repaired,
        owner_count: listing.owner_count,
        repainted_parts_count: listing.repainted_parts_count,
        replaced_parts: listing.replaced_parts,
      });
      setValuation(valRes);
      if (!silent) {
        showToast('Đã hoàn tất thẩm định giá xe bằng AI AuraML™ & Gemini!');
      }
    } catch {
      if (!silent) {
        showToast('Không thể kết nối máy chủ định giá AI lúc này.');
      }
    } finally {
      setValuationLoading(false);
    }
  }, [listing, valuationLoading, showToast]);

  // Gallery images with labels & Ultra HD quality matching GUIDED_PHOTO_SLOTS
  const galleryImages: GalleryImage[] = useMemo(() => {
    if (!listing) return [];
    if (listing.media && listing.media.length > 0) {
      // 8 nhãn góc chụp tiêu chuẩn đồng bộ 100% với form đăng tin (GUIDED_PHOTO_SLOTS)
      const standardSlotLabels = [
        'Đầu xe chính diện',
        'Góc nghiêng 3/4 trước',
        'Đuôi xe chính diện',
        'Khoang lái toàn cảnh',
        'Đồng hồ ODO (AI đọc km)',
        'Hàng ghế ngồi',
        'Khoang máy động cơ',
        'Tem đăng kiểm & Giấy tờ',
      ];

      return listing.media
        .map((m, idx) => ({
          url: getHighResImageUrl(m.url || m.media_url || '', 2560, 95),
          label:
            m.label ||
            (idx < standardSlotLabels.length
              ? standardSlotLabels[idx]
              : `Ảnh chi tiết #${idx - standardSlotLabels.length + 1}`),
        }))
        .filter((img) => img.url);
    }
    if (listing.primary_image_url) {
      return [{ url: getHighResImageUrl(listing.primary_image_url, 2560, 95), label: 'Đầu xe chính diện' }];
    }
    return [
      {
        url: getHighResImageUrl(
          'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=2560&q=95',
          2560,
          95
        ),
        label: 'Đầu xe chính diện',
      },
    ];
  }, [listing]);

  // Monthly loan estimate
  const monthlyEstimate = useMemo(() => {
    if (!listing?.price_vnd) return 0;
    const loan = listing.price_vnd * 0.8; // 20% down payment
    const monthlyRate = 0.079 / 12; // 7.9% / year
    const months = 84;
    const monthly =
      (loan * (monthlyRate * Math.pow(1 + monthlyRate, months))) /
      (Math.pow(1 + monthlyRate, months) - 1);
    return Math.round(monthly);
  }, [listing?.price_vnd]);

  // Original price estimate for discount highlight
  const originalPriceEstimate = useMemo(() => {
    if (valuation?.estimated_price_vnd && listing?.price_vnd) {
      if (valuation.estimated_price_vnd > listing.price_vnd) {
        return Math.round(valuation.estimated_price_vnd * 1.025);
      }
    }
    return undefined;
  }, [valuation, listing?.price_vnd]);

  // Gauge pin position
  const gaugePercent = useMemo(() => {
    if (!listing?.price_vnd || !valuation?.interval_low_vnd || !valuation?.interval_high_vnd) {
      return 50;
    }
    const min = valuation.interval_low_vnd * 0.95;
    const max = valuation.interval_high_vnd * 1.05;
    const pct = ((listing.price_vnd - min) / (max - min)) * 100;
    return Math.max(8, Math.min(92, Math.round(pct)));
  }, [listing?.price_vnd, valuation]);

  // Toggle favorite with backend sync
  const handleToggleSave = useCallback(async () => {
    toggleFavorite(id);
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

    if (!isSaved) {
      showToast('Đã lưu xe vào danh mục yêu thích cá nhân.');
      if (token) {
        api.addFavorite(id).catch(() => {});
      }
    } else {
      showToast('Đã gỡ xe khỏi danh mục yêu thích.');
      if (token) {
        api.removeFavorite(id).catch(() => {});
      }
    }
  }, [id, isSaved, toggleFavorite, showToast]);

  // Share link
  const handleShare = useCallback(() => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      showToast('Đã sao chép liên kết hồ sơ xe vào bộ nhớ tạm.');
    }
  }, [showToast]);

  return {
    listing,
    valuation,
    valuationLoading,
    requestValuation,
    similarCars,
    similarLoading,
    loading,
    error,
    galleryImages,
    originalPriceEstimate,
    gaugePercent,
    isSaved,
    chatModalOpen,
    setChatModalOpen,
    toastMessage,
    showToast,
    handleToggleSave,
    handleShare,
  };
}
