'use client';

import { useState, useEffect, useMemo } from 'react';
import { api } from '@/lib/api';
import { PublicSellerProfile, ListingItem } from '@/types';
import { PROVINCE_MAP } from '@/features/auth/constants/provinces';

export function useSellerProfile(id: string) {
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

  return {
    profile,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    sortBy,
    setSortBy,
    phoneRevealed,
    setPhoneRevealed,
    filteredListings,
    isShowroom,
    displayName,
    phone,
    maskedPhone,
    locationText,
  };
}

