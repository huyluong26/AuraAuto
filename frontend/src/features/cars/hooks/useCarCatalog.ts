'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { ListingItem } from '@/types';
import {
  BRANDS,
  PRICE_RANGES,
  YEAR_RANGES,
  ODO_RANGES,
  PAGE_SIZE,
} from '../constants/catalog';

export function useCarCatalog() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [keyword, setKeyword] = useState(
    searchParams.get('keyword') || searchParams.get('search') || ''
  );
  const [selectedBrand, setSelectedBrand] = useState(searchParams.get('brand') || 'Tất cả');
  const [selectedProvince, setSelectedProvince] = useState(
    searchParams.get('province_code') || ''
  );
  const [priceIndex, setPriceIndex] = useState(0);
  const [customPrice, setCustomPrice] = useState<{ min?: number; max?: number } | null>(null);
  const [yearIndex, setYearIndex] = useState(0);
  const [customYear, setCustomYear] = useState<{ min?: number; max?: number } | null>(null);
  const [selectedBody, setSelectedBody] = useState(searchParams.get('body_type') || '');
  const [selectedTransmission, setSelectedTransmission] = useState(
    searchParams.get('transmission') || ''
  );
  const [selectedFuel, setSelectedFuel] = useState(searchParams.get('fuel_type') || '');
  const [odoIndex, setOdoIndex] = useState(0);
  const [sortBy, setSortBy] = useState('NEWEST');
  const [showMobileFilter, setShowMobileFilter] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [listings, setListings] = useState<ListingItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Synchronize filter states with URL searchParams
  useEffect(() => {
    const kw = searchParams.get('keyword') || searchParams.get('search') || '';
    setKeyword(kw);

    const b = searchParams.get('brand');
    if (b) {
      const normalizedB = b.trim();
      const matched = BRANDS.find(
        (item) =>
          item.toLowerCase() === normalizedB.toLowerCase() ||
          item.toLowerCase().replace(/-/g, ' ') === normalizedB.toLowerCase().replace(/-/g, ' ')
      );
      setSelectedBrand(matched || normalizedB);
    } else {
      setSelectedBrand('Tất cả');
    }

    const prov = searchParams.get('province_code') || '';
    setSelectedProvince(prov);

    const body = searchParams.get('body_type') || '';
    setSelectedBody(body);

    const trans = searchParams.get('transmission') || '';
    setSelectedTransmission(trans);

    const fuel = searchParams.get('fuel_type') || '';
    setSelectedFuel(fuel);

    // Price query sync
    const minPriceRaw = searchParams.get('min_price') || searchParams.get('min_price_vnd');
    const maxPriceRaw = searchParams.get('max_price') || searchParams.get('max_price_vnd');
    if (minPriceRaw || maxPriceRaw) {
      const minNum = minPriceRaw ? Number(minPriceRaw) : undefined;
      const maxNum = maxPriceRaw ? Number(maxPriceRaw) : undefined;
      const idx = PRICE_RANGES.findIndex((r) => r.min === minNum && r.max === maxNum);
      if (idx !== -1) {
        setPriceIndex(idx);
        setCustomPrice(null);
      } else {
        setPriceIndex(-1);
        setCustomPrice({ min: minNum, max: maxNum });
      }
    } else {
      setPriceIndex(0);
      setCustomPrice(null);
    }

    // Year query sync
    const minYearRaw = searchParams.get('min_year');
    const maxYearRaw = searchParams.get('max_year');
    if (minYearRaw || maxYearRaw) {
      const minNum = minYearRaw ? Number(minYearRaw) : undefined;
      const maxNum = maxYearRaw ? Number(maxYearRaw) : undefined;
      const idx = YEAR_RANGES.findIndex((r) => r.min === minNum && r.max === maxNum);
      if (idx !== -1) {
        setYearIndex(idx);
        setCustomYear(null);
      } else {
        setYearIndex(-1);
        setCustomYear({ min: minNum, max: maxNum });
      }
    } else {
      setYearIndex(0);
      setCustomYear(null);
    }

    setCurrentPage(1);
  }, [searchParams]);

  const hasActiveFilters =
    Boolean(keyword.trim()) ||
    selectedBrand !== 'Tất cả' ||
    Boolean(selectedProvince) ||
    priceIndex !== 0 ||
    yearIndex !== 0 ||
    Boolean(customPrice) ||
    Boolean(customYear) ||
    Boolean(selectedBody) ||
    Boolean(selectedTransmission) ||
    Boolean(selectedFuel) ||
    odoIndex !== 0 ||
    sortBy !== 'NEWEST';

  const resetFilters = () => {
    setKeyword('');
    setSelectedBrand('Tất cả');
    setSelectedProvince('');
    setPriceIndex(0);
    setCustomPrice(null);
    setYearIndex(0);
    setCustomYear(null);
    setSelectedBody('');
    setSelectedTransmission('');
    setSelectedFuel('');
    setOdoIndex(0);
    setSortBy('NEWEST');
    setCurrentPage(1);
    router.push('/xe');
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const priceChoice =
        priceIndex >= 0 ? PRICE_RANGES[priceIndex] : customPrice || { min: undefined, max: undefined };
      const yearChoice =
        yearIndex >= 0 ? YEAR_RANGES[yearIndex] : customYear || { min: undefined, max: undefined };
      const odoChoice = ODO_RANGES[odoIndex];

      const sortParam =
        sortBy === 'PRICE_ASC'
          ? 'price_asc'
          : sortBy === 'PRICE_DESC'
          ? 'price_desc'
          : sortBy === 'ODO_ASC'
          ? 'km_asc'
          : 'newest';

      const searchKw = keyword.trim() || undefined;
      const brandParam = selectedBrand !== 'Tất cả' ? selectedBrand : undefined;

      const res = await api.getListings({
        search: searchKw,
        brand: brandParam,
        body_type: selectedBody || undefined,
        fuel_type: selectedFuel || undefined,
        transmission: selectedTransmission || undefined,
        province_code: selectedProvince || undefined,
        min_price_vnd: priceChoice.min,
        max_price_vnd: priceChoice.max,
        min_year: yearChoice.min,
        max_year: yearChoice.max,
        max_km: odoChoice.max,
        sort_by: sortParam,
        page: currentPage,
        page_size: PAGE_SIZE,
      });

      if (res && res.items) {
        setListings(res.items);
        const resolvedTotal = res.total ?? res.items.length;
        setTotalItems(resolvedTotal);
        setTotalPages(Math.max(1, Math.ceil(resolvedTotal / PAGE_SIZE)));
      } else {
        setListings([]);
        setTotalItems(0);
        setTotalPages(1);
      }
    } catch {
      setListings([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [
    keyword,
    selectedBrand,
    selectedProvince,
    priceIndex,
    customPrice,
    yearIndex,
    customYear,
    selectedBody,
    selectedTransmission,
    selectedFuel,
    odoIndex,
    sortBy,
    currentPage,
  ]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 100, behavior: 'smooth' });
  };

  return {
    keyword,
    setKeyword,
    selectedBrand,
    setSelectedBrand,
    selectedProvince,
    setSelectedProvince,
    priceIndex,
    setPriceIndex,
    customPrice,
    setCustomPrice,
    yearIndex,
    setYearIndex,
    customYear,
    setCustomYear,
    selectedBody,
    setSelectedBody,
    selectedTransmission,
    setSelectedTransmission,
    selectedFuel,
    setSelectedFuel,
    odoIndex,
    setOdoIndex,
    sortBy,
    setSortBy,
    showMobileFilter,
    setShowMobileFilter,
    currentPage,
    setCurrentPage,
    totalItems,
    totalPages,
    listings,
    loading,
    hasActiveFilters,
    resetFilters,
    handlePageChange,
  };
}
