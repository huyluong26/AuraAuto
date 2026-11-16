'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export interface SearchFilterState {
  brand: string;
  bodyType: string;
  priceRange: string;
  year: string;
}

const BRAND_NAME_MAP: Record<string, string> = {
  porsche: 'Porsche',
  mercedes: 'Mercedes Benz',
  bmw: 'BMW',
  landrover: 'Range Rover',
  audi: 'Audi',
  lexus: 'Lexus',
  bentley: 'Bentley',
};

const BODY_TYPE_MAP: Record<string, string> = {
  sedan: 'SEDAN',
  suv: 'SUV',
  coupe: 'COUPE',
  'gran-turismo': 'SEDAN',
  electric: 'EV',
};

export function useCarSearchFilter(initialState?: Partial<SearchFilterState>) {
  const router = useRouter();

  const [brand, setBrand] = useState(initialState?.brand || '');
  const [bodyType, setBodyType] = useState(initialState?.bodyType || '');
  const [priceRange, setPriceRange] = useState(initialState?.priceRange || '');
  const [year, setYear] = useState(initialState?.year || '');

  const handleSearch = useCallback(
    (e?: React.FormEvent) => {
      if (e) e.preventDefault();

      const params = new URLSearchParams();

      if (brand) {
        params.append('brand', BRAND_NAME_MAP[brand] || brand);
      }

      if (bodyType) {
        params.append('body_type', BODY_TYPE_MAP[bodyType] || bodyType.toUpperCase());
      }

      if (priceRange) {
        switch (priceRange) {
          case 'u1':
            params.append('max_price', '1000000000');
            break;
          case '1-2':
            params.append('min_price', '1000000000');
            params.append('max_price', '2000000000');
            break;
          case '2-5':
            params.append('min_price', '2000000000');
            params.append('max_price', '5000000000');
            break;
          case 'o5':
            params.append('min_price', '5000000000');
            break;
        }
      }

      if (year) {
        if (year === '2020-2021') {
          params.append('min_year', '2020');
          params.append('max_year', '2021');
        } else {
          params.append('min_year', year);
          params.append('max_year', year);
        }
      }

      const queryString = params.toString();
      router.push(queryString ? `/xe?${queryString}` : '/xe');
    },
    [brand, bodyType, priceRange, year, router]
  );

  const handleQuickFilter = useCallback(
    (keyword: string) => {
      router.push(`/xe?keyword=${encodeURIComponent(keyword)}`);
    },
    [router]
  );

  const resetFilters = useCallback(() => {
    setBrand('');
    setBodyType('');
    setPriceRange('');
    setYear('');
  }, []);

  return {
    brand,
    setBrand,
    bodyType,
    setBodyType,
    priceRange,
    setPriceRange,
    year,
    setYear,
    handleSearch,
    handleQuickFilter,
    resetFilters,
  };
}
