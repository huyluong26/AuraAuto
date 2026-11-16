'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Navbar, Footer } from '@/components/layout';
import CarCard from '@/features/cars/components/CarCard';
import { api, formatVND } from '@/lib/api';
import { PublicSellerProfile, ListingItem } from '@/types';
import { PROVINCE_MAP } from '@/features/auth/constants/provinces';

export default function PublicSellerProfilePage() {
  const params = useParams();
  const id = params?.id as string;

  const [profile, setProfile] = useState<PublicSellerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & filter state inside seller listings
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc'>('newest');
  const [phoneRevealed, setPhoneRevealed] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function fetchProfile() {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const data = await api.getPublicSellerProfile(id);
        if (isMounted) {
          setProfile(data);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || 'Không tìm thấy hồ sơ người bán hoặc showroom này.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchProfile();
    return () => {
      isMounted = false;
    };
  }, [id]);

  const isShowroom = profile?.account_type === 'SHOWROOM' || Boolean(profile?.showroom);
  const displayName = isShowroom
    ? (profile?.showroom?.name || profile?.display_name || 'Showroom Đối Tác')
    : (profile?.display_name || 'Người bán cá nhân');

  const phone = profile?.showroom?.phone || profile?.phone;
  const maskedPhone = phone && phone.length > 6
    ? phone.slice(0, 4) + ' ' + phone.slice(4, 7) + ' xxx'
    : (phone || 'Chưa cung cấp');

  const locationText = isShowroom
    ? (profile?.showroom?.address || profile?.address || 'Hà Nội / TP. Hồ Chí Minh')
    : (profile?.province_name || (profile?.province_code && PROVINCE_MAP[profile.province_code]) || profile?.address || 'Toàn quốc');

  // Filtered and sorted listings
  const filteredListings = useMemo(() => {
    if (!profile?.active_listings) return [];
    let list = [...profile.active_listings];

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter((item) =>
        item.title.toLowerCase().includes(q) ||
        (item.body_type && item.body_type.toLowerCase().includes(q))
      );
    }

    if (sortBy === 'price_asc') {
      list.sort((a, b) => a.price_vnd - b.price_vnd);
    } else if (sortBy === 'price_desc') {
      list.sort((a, b) => b.price_vnd - a.price_vnd);
    }

    return list;
  }, [profile?.active_listings, searchTerm, sortBy]);

  return (
    <div className="min-h-screen bg-surface flex flex-col font-body-md text-on-surface antialiased">
      <Navbar />

      <main className="w-full pt-20 pb-20 flex-1">
        {/* Loading State */}
        {loading && (
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 rounded-full border-2 border-secondary border-t-transparent animate-spin" />
            <p className="font-label-md text-label-md text-on-surface-variant font-medium">
              Đang tải thông tin hồ sơ và kho xe từ hệ thống...
            </p>
          </div>
        )}

        {/* Error State */}
        {!loading && (error || !profile) && (
          <div className="w-full max-w-xl mx-auto px-4 py-24 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mx-auto text-outline">
              <span className="material-symbols-outlined text-[32px]">person_off</span>
            </div>
            <h2 className="font-headline-md text-2xl font-bold text-primary">
              Không tìm thấy hồ sơ người bán
            </h2>
            <p className="font-body-md text-on-surface-variant text-sm sm:text-base leading-relaxed">
              {error || 'Hồ sơ người bán hoặc showroom này không tồn tại hoặc đã tạm dừng hoạt động trên hệ thống.'}
            </p>
            <div className="pt-2">
              <Link
                href="/xe"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-on-primary font-semibold text-sm hover:bg-primary-container transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                <span>Khám phá kho xe AuraAuto</span>
              </Link>
            </div>
          </div>
        )}

        {/* Loaded Profile Content */}
        {!loading && profile && (
          <div className="w-full">
            {/* Breadcrumb Navigation */}
            <div className="w-full border-b border-surface-container-high/60 bg-surface-container-lowest">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-2 text-xs text-on-surface-variant">
                <Link href="/" className="hover:text-primary transition-colors">
                  Trang chủ
                </Link>
                <span>/</span>
                <Link href="/xe" className="hover:text-primary transition-colors">
                  {isShowroom ? 'Showroom đối tác' : 'Người bán'}
                </Link>
                <span>/</span>
                <span className="text-primary font-semibold truncate max-w-[200px] sm:max-w-none">
                  {displayName}
                </span>
              </div>
            </div>

            {/* Profile Hero Header */}
            {isShowroom ? (
              /* ================= SHOWROOM HERO ================= */
              <div className="w-full relative bg-surface-container-low border-b border-surface-container-high/70 pb-6">
                {/* Banner Image */}
                <div className="w-full h-44 sm:h-64 lg:h-80 relative overflow-hidden bg-primary">
                  <img
                    src={
                      profile.showroom?.banner_url ||
                      'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1600&q=85'
                    }
                    alt={displayName}
                    className="w-full h-full object-cover opacity-85"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
                  
                  {/* Verified Partner Top Badge */}
                  <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-secondary border border-secondary/40 text-xs font-bold shadow-sm">
                      <span className="material-symbols-outlined text-[16px]">verified</span>
                      <span>Showroom Đối tác Chính thức</span>
                    </span>
                  </div>
                </div>

                {/* Showroom Identity Card */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 sm:-mt-20 relative z-10">
                  <div className="bg-surface-container-lowest rounded-2xl p-5 sm:p-8 shadow-md border border-surface-container-high/80 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    {/* Left: Avatar & Info */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                      {profile.showroom?.logo_url || profile.avatar_url ? (
                        <img
                          src={profile.showroom?.logo_url || profile.avatar_url}
                          alt={displayName}
                          className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-4 border-surface-container-lowest shadow-md shrink-0 bg-white"
                        />
                      ) : (
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#b89b72] text-white flex items-center justify-center border-4 border-surface-container-lowest shadow-md shrink-0">
                          <span className="material-symbols-outlined text-[36px]">storefront</span>
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <h1 className="font-headline-md text-xl sm:text-2xl lg:text-3xl font-bold text-primary font-display">
                            {displayName}
                          </h1>
                          <span
                            className="material-symbols-outlined text-secondary text-[22px]"
                            title="Showroom được kiểm duyệt pháp lý & đối tác xác thực"
                          >
                            verified
                          </span>
                        </div>

                        <p className="text-xs sm:text-sm text-on-surface-variant max-w-2xl leading-relaxed">
                          {profile.showroom?.description ||
                            'Hệ thống showroom kinh doanh và ký gửi các dòng xe ô tô đã qua sử dụng tuyển chọn, bảo hành động cơ và hộp số tiêu chuẩn.'}
                        </p>

                        {/* Meta Tags */}
                        <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-on-surface-variant pt-1">
                          <div className="flex items-center gap-1 text-secondary font-medium">
                            <span className="material-symbols-outlined text-[15px]">location_on</span>
                            <span className="text-primary font-medium">{locationText}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[15px] text-secondary">schedule</span>
                            <span>Giờ mở cửa: 08:00 - 19:00</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[15px] text-secondary">calendar_today</span>
                            <span>Tham gia từ {new Date(profile.created_at).toLocaleDateString('vi-VN', { month: '2-digit', year: 'numeric' })}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right: Contact Actions */}
                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-surface-container-high/60">
                      {phone && (
                        <button
                          type="button"
                          onClick={() => {
                            setPhoneRevealed(true);
                            if (phoneRevealed && typeof window !== 'undefined') {
                              window.location.href = `tel:${phone}`;
                            }
                          }}
                          className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs sm:text-sm font-semibold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[18px]">call</span>
                          <span>{phoneRevealed ? phone : `${maskedPhone} (Hiện số)`}</span>
                        </button>
                      )}

                      <a
                        href={phone ? `https://zalo.me/${phone.replace(/[^0-9]/g, '')}` : '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2.5 rounded-xl bg-secondary-container hover:bg-secondary-fixed text-on-secondary-container text-xs sm:text-sm font-semibold border border-secondary/30 transition-all flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-[18px] text-secondary">chat</span>
                        <span>Nhắn Zalo</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* ================= INDIVIDUAL SELLER HERO ================= */
              <div className="w-full bg-surface-container-low border-b border-surface-container-high/70 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="bg-surface-container-lowest rounded-2xl p-6 sm:p-8 shadow-sm border border-surface-container-high/80 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    {/* Left: Avatar & Info */}
                    <div className="flex items-center gap-4 sm:gap-6">
                      {profile.avatar_url ? (
                        <img
                          src={profile.avatar_url}
                          alt={displayName}
                          className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-secondary/40 shadow-xs shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-secondary text-on-secondary flex items-center justify-center font-bold text-xl uppercase shadow-xs shrink-0">
                          {displayName.slice(0, 2)}
                        </div>
                      )}

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h1 className="font-headline-md text-xl sm:text-2xl font-bold text-primary">
                            {displayName}
                          </h1>
                          <span className="px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[11px] font-bold">
                            Chính chủ
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-on-surface-variant">
                          <div className="flex items-center gap-1 text-secondary font-medium">
                            <span className="material-symbols-outlined text-[14px]">location_on</span>
                            <span className="text-primary font-medium">{locationText}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px] text-secondary">calendar_today</span>
                            <span>Tham gia từ {new Date(profile.created_at).toLocaleDateString('vi-VN', { month: '2-digit', year: 'numeric' })}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 pt-1 text-xs">
                          <span className="text-secondary font-bold text-sm">5.0</span>
                          <div className="flex text-secondary text-[13px]">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <span
                                key={s}
                                className="material-symbols-outlined text-[14px]"
                                style={{ fontVariationSettings: "'FILL' 1" }}
                              >
                                star
                              </span>
                            ))}
                          </div>
                          <span className="text-on-surface-variant text-[11px]">
                            ({profile.reviews_count || 12} đánh giá giao dịch uy tín)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Call Actions */}
                    <div className="flex items-center gap-2.5 pt-2 md:pt-0 border-t md:border-t-0 border-surface-container-high/60">
                      {phone && (
                        <button
                          type="button"
                          onClick={() => {
                            setPhoneRevealed(true);
                            if (phoneRevealed && typeof window !== 'undefined') {
                              window.location.href = `tel:${phone}`;
                            }
                          }}
                          className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs sm:text-sm font-semibold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[18px]">phone_in_talk</span>
                          <span>{phoneRevealed ? phone : `${maskedPhone} (Hiện số)`}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* KPI Metrics Row */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="p-4 rounded-xl bg-surface-container-lowest border border-surface-container-high shadow-2xs flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[22px]">directions_car</span>
                  </div>
                  <div>
                    <span className="text-xs text-on-surface-variant font-medium block">Xe đang bán</span>
                    <strong className="text-lg sm:text-xl font-bold text-primary font-display">
                      {profile.active_listings_count}
                    </strong>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-surface-container-lowest border border-surface-container-high shadow-2xs flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[22px]">task_alt</span>
                  </div>
                  <div>
                    <span className="text-xs text-on-surface-variant font-medium block">Xe đã bán</span>
                    <strong className="text-lg sm:text-xl font-bold text-primary font-display">
                      {profile.sold_listings_count}
                    </strong>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-surface-container-lowest border border-surface-container-high shadow-2xs flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      star
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-on-surface-variant font-medium block">Đánh giá uy tín</span>
                    <strong className="text-lg sm:text-xl font-bold text-primary font-display">
                      {profile.rating_avg.toFixed(1)} / 5.0
                    </strong>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-surface-container-lowest border border-surface-container-high shadow-2xs flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[22px]">verified_user</span>
                  </div>
                  <div>
                    <span className="text-xs text-on-surface-variant font-medium block">Tiêu chuẩn kiểm định</span>
                    <strong className="text-xs sm:text-sm font-bold text-primary block mt-0.5">
                      {isShowroom ? '100% Cam kết kiểm tra' : 'Chính chủ xác minh'}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Showroom Commitments Banner (Only for Showroom) */}
            {isShowroom && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
                <div className="p-5 rounded-2xl bg-[#b89b72]/10 border border-[#b89b72]/30 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-secondary text-[22px] shrink-0 mt-0.5">
                      verified
                    </span>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-primary">Cam kết pháp lý &amp; Sang tên</h4>
                      <p className="text-[11px] text-on-surface-variant mt-0.5">
                        Giấy tờ gốc hợp lệ, hỗ trợ rút hồ sơ và công chứng sang tên nhanh chóng.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-secondary text-[22px] shrink-0 mt-0.5">
                      build_circle
                    </span>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-primary">Bảo hành kỹ thuật Showroom</h4>
                      <p className="text-[11px] text-on-surface-variant mt-0.5">
                        Cam kết xe không đâm đụng ảnh hưởng khung gầm, không ngập nước thủy kích.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-secondary text-[22px] shrink-0 mt-0.5">
                      payments
                    </span>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-primary">Hỗ trợ trả góp &amp; Lái thử</h4>
                      <p className="text-[11px] text-on-surface-variant mt-0.5">
                        Hỗ trợ vay ngân hàng đến 70% giá trị xe, thủ tục duyệt hồ sơ linh hoạt.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Main Listings Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
              {/* Section Header & Filter Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-surface-container-high/60">
                <div>
                  <h2 className="font-headline-md text-lg sm:text-xl font-bold text-primary flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary text-[22px]">
                      {isShowroom ? 'garage' : 'directions_car'}
                    </span>
                    <span>
                      {isShowroom
                        ? `Kho xe đang bán tại Showroom (${filteredListings.length})`
                        : `Danh sách xe đang bán (${filteredListings.length})`}
                    </span>
                  </h2>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Các dòng xe đang được mở bán công khai và sẵn sàng bàn giao ngay.
                  </p>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Search Input */}
                  <div className="relative min-w-[220px]">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
                      search
                    </span>
                    <input
                      type="text"
                      placeholder="Tìm dòng xe..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-container-lowest border border-surface-container-high text-xs text-primary placeholder:text-outline focus:border-primary outline-none transition-all"
                    />
                    {searchTerm && (
                      <button
                        type="button"
                        onClick={() => setSearchTerm('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-outline hover:text-primary text-xs"
                      >
                        ×
                      </button>
                    )}
                  </div>

                  {/* Sort Dropdown */}
                  <select
                    value={sortBy}
                    onChange={(e: any) => setSortBy(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-surface-container-lowest border border-surface-container-high text-xs text-primary font-medium focus:border-primary outline-none transition-all cursor-pointer"
                  >
                    <option value="newest">Mới đăng nhất</option>
                    <option value="price_asc">Giá: Thấp đến cao</option>
                    <option value="price_desc">Giá: Cao đến thấp</option>
                  </select>
                </div>
              </div>

              {/* Listings Grid */}
              {filteredListings.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-6">
                  {filteredListings.map((listing: ListingItem) => (
                    <CarCard key={listing.id} listing={listing} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 px-4 bg-surface-container-lowest rounded-2xl border border-surface-container-high/60 my-6">
                  <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center mx-auto text-outline mb-3">
                    <span className="material-symbols-outlined text-[28px]">search_off</span>
                  </div>
                  <h3 className="text-base font-bold text-primary">Không tìm thấy xe phù hợp</h3>
                  <p className="text-xs text-on-surface-variant mt-1 max-w-sm mx-auto">
                    {searchTerm
                      ? `Không có xe nào khớp với từ khóa "${searchTerm}". Bạn hãy thử tìm với từ khóa khác.`
                      : 'Hiện tại người bán chưa có thêm xe nào đang mở bán.'}
                  </p>
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="mt-4 px-4 py-2 rounded-xl bg-surface-container text-primary text-xs font-semibold hover:bg-surface-container-high transition-colors"
                    >
                      Xóa bộ lọc tìm kiếm
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
