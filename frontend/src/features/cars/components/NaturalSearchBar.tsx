'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Search, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

const EXAMPLE_QUERIES = [
  'SUV 5 chỗ dưới 700 triệu đời từ 2021',
  'Sedan Toyota Vios tầm 450 triệu',
  'Xe bán tải Ford máy dầu',
  'Mercedes C200 lướt màu trắng',
];

export default function NaturalSearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [extracted, setExtracted] = useState<any | null>(null);

  const handleSearch = async (textToSearch?: string) => {
    const q = textToSearch || query;
    if (!q.trim()) return;

    setLoading(true);
    try {
      const res = await api.naturalSearch(q);
      setExtracted(res.extracted_criteria);

      // Build query string to redirect to /xe with filters
      const params = new URLSearchParams();
      if (res.extracted_criteria.brand) params.set('brand', res.extracted_criteria.brand);
      if (res.extracted_criteria.body_type) params.set('body_type', res.extracted_criteria.body_type);
      if (res.extracted_criteria.max_price_vnd) params.set('max_price', String(res.extracted_criteria.max_price_vnd));
      if (res.extracted_criteria.min_year) params.set('min_year', String(res.extracted_criteria.min_year));
      if (res.extracted_criteria.fuel_type) params.set('fuel_type', res.extracted_criteria.fuel_type);

      setTimeout(() => {
        router.push(`/xe?${params.toString()}`);
      }, 700);
    } catch {
      // Fallback: direct keyword search
      router.push(`/xe?keyword=${encodeURIComponent(q)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="relative bg-white rounded-xl shadow-[0_16px_40px_rgba(25,25,25,0.06)] border border-[#eae8e3] p-2 sm:p-2.5 transition focus-within:ring-2 focus-within:ring-[#b89b72]/20 focus-within:border-[#b89b72]">
        <div className="flex items-center space-x-2">
          <div className="pl-3 text-[#b89b72] flex items-center">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Nhập nhu cầu xe bằng tiếng Việt (vd: SUV dưới 700 triệu đời từ 2021)..."
            className="w-full py-2.5 sm:py-3 text-[#1a1c1a] placeholder-[#777777] bg-transparent text-sm sm:text-base font-normal focus:outline-none"
          />
          <button
            onClick={() => handleSearch()}
            disabled={loading || !query.trim()}
            className="inline-flex items-center justify-center px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg bg-[#191919] hover:bg-black disabled:bg-[#dbdad7] text-white font-semibold text-sm transition shrink-0 shadow-sm border border-[#191919] hover:border-[#b89b72]"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin text-[#b89b72]" />
                <span>AI đang lọc...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-1.5 text-[#b89b72]" />
                <span>Tìm kiếm</span>
              </>
            )}
          </button>
        </div>

        {/* Extracted preview badge when searching */}
        {extracted && (
          <div className="mt-2.5 pt-2.5 border-t border-[#eae8e3] flex flex-wrap gap-2 text-xs">
            <span className="text-[#777777] font-medium">AI đã nhận diện:</span>
            {extracted.brand && (
              <span className="px-2 py-0.5 rounded bg-[#f4f3f0] text-[#1a1c1a] font-semibold border border-[#e3e2df]">
                Hãng: {extracted.brand}
              </span>
            )}
            {extracted.body_type && (
              <span className="px-2 py-0.5 rounded bg-[#fcdbad]/60 text-[#775f3a] font-semibold border border-[#b89b72]/40">
                Dáng xe: {extracted.body_type}
              </span>
            )}
            {extracted.max_price_vnd && (
              <span className="px-2 py-0.5 rounded bg-[#f4f3f0] text-[#725a37] font-semibold border border-[#e3e2df]">
                Ngân sách: {(extracted.max_price_vnd / 1_000_000).toLocaleString('vi-VN')} triệu
              </span>
            )}
            {extracted.min_year && (
              <span className="px-2 py-0.5 rounded bg-[#f4f3f0] text-[#444748] font-semibold border border-[#e3e2df]">
                Đời từ: {extracted.min_year}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Suggestion tags */}
      <div className="mt-3.5 flex items-center flex-wrap gap-2 text-xs">
        <span className="text-[#858383] font-medium hidden sm:inline">Gợi ý tìm nhanh:</span>
        {EXAMPLE_QUERIES.map((ex, i) => (
          <button
            key={i}
            onClick={() => {
              setQuery(ex);
              handleSearch(ex);
            }}
            className="px-3 py-1 rounded bg-[#f4f3f0]/80 hover:bg-white text-[#444748] hover:text-[#191919] border border-[#eae8e3] hover:border-[#b89b72] transition text-xs font-medium"
          >
            {ex}
          </button>
        ))}
      </div>
    </div>
  );
}
