'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Navbar, Footer } from '@/components/layout';
import { useFavorites } from '@/hooks/useFavorites';
import { api, formatVND, formatFullVND, formatKm } from '@/lib/api';
import { ListingItem, ListingDetail } from '@/types';
import { CarCard } from '@/features/cars';
import {
  Calendar,
  Gauge,
  MapPin,
  Trash2,
  ArrowRight,
  Sparkles,
  Bookmark,
  Share2,
  CalendarCheck,
  Phone,
  ShieldCheck,
} from 'lucide-react';

export default function SavedCarsPage() {
  const { favorites, toggleFavorite, favoriteCount } = useFavorites();
  const [savedCars, setSavedCars] = useState<ListingDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  // Load car details for each favorited ID
  useEffect(() => {
    let mounted = true;

    async function loadSavedCars() {
      setLoading(true);
      const favIds = Object.keys(favorites);

      if (favIds.length === 0) {
        if (mounted) {
          setSavedCars([]);
          setLoading(false);
        }
        return;
      }

      try {
        // Ưu tiên nạp danh sách đã lưu tối ưu hóa qua API nếu người dùng đã đăng nhập
        const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
        if (token) {
          try {
            const apiCars = await api.getFavorites();
            if (mounted && apiCars && Array.isArray(apiCars) && apiCars.length > 0) {
              setSavedCars(apiCars as any);
              return;
            }
          } catch {
            // Fallback sang nạp theo IDs từ bộ nhớ máy
          }
        }

        const carPromises = favIds.map(async (id) => {
          try {
            return await api.getListingById(id);
          } catch {
            return null; // Car might have been removed or deleted
          }
        });

        const results = await Promise.all(carPromises);
        const validCars = results.filter((c): c is ListingDetail => c !== null);

        if (mounted) {
          setSavedCars(validCars);
        }
      } catch (err) {
        console.error('Lỗi khi nạp danh sách xe đã lưu:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadSavedCars();

    return () => {
      mounted = false;
    };
  }, [favorites]);

  const handleRemove = (id: string, title: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(id);
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (token) {
      api.removeFavorite(id).catch(() => {});
    }
    showToast(`Đã gỡ "${title}" khỏi danh mục xe đã lưu.`);
  };

  const handleClearAll = () => {
    if (typeof window === 'undefined') return;
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ xe khỏi danh sách quan tâm?')) {
      const ids = Object.keys(favorites);
      ids.forEach((id) => toggleFavorite(id));
      localStorage.removeItem('aura_favorites');
      setSavedCars([]);
      showToast('Đã xóa toàn bộ xe khỏi danh mục đã lưu.');
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col font-body-md text-on-surface antialiased">
      <Navbar />

      <main className="flex-1 pt-24 pb-20">
        {/* Header Banner */}
        <div className="w-full bg-gradient-to-b from-surface-container/60 to-surface border-b border-surface-container-high/60 py-10 lg:py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-container/80 text-secondary text-xs font-semibold tracking-wider uppercase border border-secondary/20">
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>Bộ Sưu Tập Quan Tâm</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold text-primary font-headline tracking-tight">
                  Danh Sách Xe Đã Lưu
                </h1>
                <p className="text-outline text-sm sm:text-base">
                  Theo dõi trạng thái, so sánh và cập nhật biến động giá của những chiếc xe bạn đang quan tâm.
                </p>
              </div>

              {savedCars.length > 0 && (
                <div className="flex items-center gap-3 self-start sm:self-auto shrink-0">
                  <span className="px-3.5 py-1.5 rounded-full bg-surface-container-lowest border border-surface-container-high text-xs font-semibold text-secondary shadow-xs">
                    {savedCars.length} chiếc xe đang lưu
                  </span>
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-surface-container hover:bg-error/10 hover:text-error text-xs font-medium text-outline transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xóa tất cả</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content Container */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
          {loading ? (
            /* Loading Skeleton Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="h-96 rounded-2xl bg-surface-container-high border border-surface-container-high"
                />
              ))}
            </div>
          ) : savedCars.length === 0 ? (
            /* Empty State */
            <div className="text-center py-20 bg-surface-container/30 rounded-3xl border border-dashed border-surface-container-high p-8 max-w-2xl mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-surface-container-high flex items-center justify-center mx-auto text-outline mb-4">
                <Bookmark className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="text-xl font-bold text-primary mb-2 font-headline">
                Chưa có chiếc xe nào được lưu
              </h3>
              <p className="text-outline text-sm leading-relaxed max-w-md mx-auto mb-6">
                Khi duyệt danh sách xe hoặc xem chi tiết, hãy bấm nút biểu tượng Bookmark để lưu lại những chiếc xe bạn ưng ý nhất và so sánh tiện lợi.
              </p>
              <Link
                href="/xe"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-secondary transition-colors shadow-md"
              >
                <span>Khám phá bộ sưu tập xe sẵn có</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            /* Saved Cars Grid - Unified CarCard */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedCars.map((car) => (
                <CarCard key={car.id} listing={car as any} />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Floating Toast Notification */}
      <div
        className={`fixed top-20 right-4 sm:right-6 z-50 transform transition-all duration-300 pointer-events-none ${
          toastMessage ? 'translate-y-0 opacity-100' : '-translate-y-6 opacity-0'
        }`}
      >
        <div className="px-4 py-3 rounded-xl shadow-lg border bg-surface-container-lowest border-secondary text-primary flex items-center gap-2.5 text-body-sm font-medium">
          <span className="material-symbols-outlined text-secondary text-[20px]">
            check_circle
          </span>
          <span>{toastMessage}</span>
        </div>
      </div>

      <Footer />
    </div>
  );
}
