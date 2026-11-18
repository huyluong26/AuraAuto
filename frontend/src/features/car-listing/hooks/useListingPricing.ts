'use client';

import { useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { ValuationResponse } from '@/types';
import { TradeOptionsState, VehicleHistoryState } from '../types';
import { POWERTRAIN_OPTIONS, TRANSMISSION_OPTIONS } from '../constants';

interface UseListingPricingParams {
  brandName: string;
  modelName: string;
  trim: string;
  manufactureYear: number;
  odometerKm: string;
  bodyType: string;
  powertrain: string;
  transmission: string;
  provinceCode: string;
  engineDisplacement: string;
  seats: number;
  doors: number;
  origin: string;
  condition: string;
  vehicleHistory: VehicleHistoryState;
  onClearPriceError?: () => void;
}

export function useListingPricing(params: UseListingPricingParams) {
  const [priceVnd, setPriceVnd] = useState('');
  const [tradeOptions, setTradeOptions] = useState<TradeOptionsState>({
    negotiable: false,
    tradeSuv: false,
  });

  const [aiLoading, setAiLoading] = useState(false);
  const [aiPriceSuggestion, setAiPriceSuggestion] = useState<number | null>(null);
  const [aiIntervalLow, setAiIntervalLow] = useState<number | null>(null);
  const [aiIntervalHigh, setAiIntervalHigh] = useState<number | null>(null);
  const [aiConfidence, setAiConfidence] = useState<string | null>(null);
  const [aiEstimateNote, setAiEstimateNote] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiValuationResult, setAiValuationResult] = useState<ValuationResponse | null>(null);

  const toggleTradeOption = useCallback((key: keyof TradeOptionsState) => {
    setTradeOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleApplyAiPrice = useCallback((suggestedPrice: number) => {
    setPriceVnd(suggestedPrice.toLocaleString('vi-VN'));
    if (params.onClearPriceError) params.onClearPriceError();
  }, [params]);

  const handleGetAIEstimate = useCallback(async () => {
    setAiError(null);
    setAiEstimateNote(null);
    if (!params.brandName.trim() || !params.modelName.trim() || !params.manufactureYear || !params.odometerKm.trim()) {
      setAiError('Vui lòng nhập hãng, dòng xe, năm sản xuất và số km ở bước 1 trước khi định giá.');
      return;
    }
    setAiLoading(true);
    try {
      const cleanOdo = parseInt(params.odometerKm.replace(/\D/g, ''), 10);
      if (!Number.isFinite(cleanOdo) || cleanOdo <= 0) {
        setAiError('Số km ODO phải lớn hơn 0.');
        return;
      }
      const matchedTrans = TRANSMISSION_OPTIONS.find((t) => t.id === params.transmission);
      const matchedPower = POWERTRAIN_OPTIONS.find((p) => p.value === params.powertrain);
      const cleanEngineDisp = parseFloat(params.engineDisplacement.replace(/[^\d.]/g, '')) || undefined;

      const res = await api.estimateValuation({
        brand: params.brandName,
        model: params.modelName,
        variant: params.trim || undefined,
        manufacture_year: params.manufactureYear,
        odometer_km: cleanOdo,
        body_type: params.bodyType || 'SEDAN',
        fuel_type: matchedPower?.dbValue || 'GASOLINE',
        transmission: matchedTrans?.value || 'AUTOMATIC',
        province_code: params.provinceCode || undefined,
        engine_displacement: cleanEngineDisp,
        seats: params.seats || undefined,
        doors: params.doors || undefined,
        origin: params.origin || undefined,
        condition: params.condition || 'USED',
        accident_status: params.vehicleHistory.accidentStatus,
        flood_status: params.vehicleHistory.floodStatus,
        service_history: params.vehicleHistory.serviceHistory,
        engine_repaired: params.vehicleHistory.engineRepaired,
        transmission_repaired: params.vehicleHistory.transmissionRepaired,
        owner_count: params.vehicleHistory.ownerCount || undefined,
        repainted_parts_count: params.vehicleHistory.repaintedPartsCount,
        replaced_parts: params.vehicleHistory.replacedParts?.trim() || undefined,
      });

      if ((res.status === 'PREDICTED' || res.status === 'SUCCESS') && res.estimated_price_vnd) {
        setAiValuationResult(res);
        setAiPriceSuggestion(res.estimated_price_vnd);
        setAiIntervalLow(res.interval_low_vnd || null);
        setAiIntervalHigh(res.interval_high_vnd || null);
        setAiConfidence(res.confidence_level || 'MEDIUM');

        // Nếu người dùng chưa nhập giá thì tự động gợi ý điền
        if (res.confidence_level === 'MEDIUM' && !priceVnd) {
          setPriceVnd(res.estimated_price_vnd.toLocaleString('vi-VN'));
          if (params.onClearPriceError) params.onClearPriceError();
        }
        const confidence = res.confidence_level === 'MEDIUM' ? 'Độ tin cậy cao' : 'Tham khảo mở rộng';
        const range = res.interval_low_vnd && res.interval_high_vnd
          ? `Khoảng giá thị trường hợp lý: ${res.interval_low_vnd.toLocaleString('vi-VN')} ₫ – ${res.interval_high_vnd.toLocaleString('vi-VN')} ₫.`
          : '';
        const adjNote = res.total_condition_adjustment_vnd
          ? ` [Đã hiệu chỉnh ${res.total_condition_adjustment_vnd > 0 ? '+' : ''}${Math.round(res.total_condition_adjustment_vnd / 1_000_000)} triệu theo tình trạng xe]`
          : '';
        const method = `Định giá chuyên sâu bởi mô hình CatBoost ML & tiêu chuẩn thẩm định thực tế${adjNote}.`;
        setAiEstimateNote(`${range} ${confidence}. ${method}${res.reason ? ` Ghi chú: ${res.reason}` : ''}`.trim());
      } else {
        setAiValuationResult(null);
        setAiPriceSuggestion(null);
        setAiIntervalLow(null);
        setAiIntervalHigh(null);
        setAiConfidence(null);
        setAiEstimateNote(null);
        setAiError(res.reason || 'Chưa đủ dữ liệu để định giá xe này. Bạn vẫn có thể tự nhập giá bán.');
      }
    } catch (err) {
      console.warn('Valuation error:', err);
      setAiValuationResult(null);
      setAiPriceSuggestion(null);
      setAiIntervalLow(null);
      setAiIntervalHigh(null);
      setAiConfidence(null);
      setAiEstimateNote(null);
      setAiError(err instanceof Error ? err.message : 'Không kết nối được dịch vụ định giá. Vui lòng thử lại.');
    } finally {
      setAiLoading(false);
    }
  }, [params, priceVnd]);

  return {
    priceVnd,
    setPriceVnd,
    tradeOptions,
    setTradeOptions,
    toggleTradeOption,
    aiLoading,
    aiPriceSuggestion,
    aiIntervalLow,
    aiIntervalHigh,
    aiConfidence,
    aiEstimateNote,
    aiError,
    aiValuationResult,
    handleGetAIEstimate,
    handleApplyAiPrice,
  };
}
