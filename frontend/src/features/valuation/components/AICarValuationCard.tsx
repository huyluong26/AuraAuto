'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  Loader2,
  Sparkles,
} from 'lucide-react';
import {
  QuickListingModal,
} from './QuickListingModal';
import {
  normalizeAccidentStatus,
  normalizeFloodStatus,
  normalizeServiceHistory,
  normalizeIntCount,
} from '@/features/car-listing/utils/normalizers';
import { ValuationResultModal } from './ValuationResultModal';
import { ALL_WORLD_CAR_BRANDS } from '../constants/carCatalog';
import { useAICarValuationForm } from '../hooks/useAICarValuationForm';
import { ValuationPhotoScanner } from './ValuationPhotoScanner';
import { ValuationSpecsSection } from './ValuationSpecsSection';
import { ValuationConditionSection } from './ValuationConditionSection';
import { ValuationResultDossier } from './ValuationResultDossier';

export { ALL_WORLD_CAR_BRANDS };

export default function AICarValuationCard() {
  const router = useRouter();
  const {
    brand,
    setBrand,
    model,
    setModel,
    variant,
    setVariant,
    year,
    setYear,
    odometerKm,
    setOdometerKm,
    bodyType,
    setBodyType,
    transmission,
    setTransmission,
    powertrain,
    setPowertrain,
    engineDisplacement,
    setEngineDisplacement,
    drivetrain,
    setDrivetrain,
    seats,
    setSeats,
    doors,
    setDoors,
    condition,
    setCondition,
    origin,
    setOrigin,
    color,
    setColor,
    interiorColor,
    setInteriorColor,
    accidentStatus,
    setAccidentStatus,
    floodStatus,
    setFloodStatus,
    serviceHistory,
    setServiceHistory,
    ownerCount,
    setOwnerCount,
    repaintedPartsCount,
    setRepaintedPartsCount,
    replacedParts,
    setReplacedParts,
    engineRepaired,
    setEngineRepaired,
    transmissionRepaired,
    setTransmissionRepaired,
    uploadedFiles,
    uploadedPreviews,
    isDragOver,
    setIsDragOver,
    fileInputRef,
    aiScanLoading,
    aiScanSuccess,
    setAiScanSuccess,
    loading,
    result,
    error,
    quickModalOpen,
    setQuickModalOpen,
    resultModalOpen,
    setResultModalOpen,
    modelSuggestions,
    odoSuggestions,
    handleAddPhotos,
    handleFileInputChange,
    handleRemovePhoto,
    handleClearAllPhotos,
    handleSubmit,
  } = useAICarValuationForm();

  // Navigate to full /dang-tin preserving all technical fields in localStorage
  const handleOpenFullPost = () => {
    try {
      const draft = {
        brandName: brand,
        modelName: model,
        trim: variant,
        manufactureYear: Number(year) || 0,
        odometerKm: String(odometerKm),
        condition,
        origin,
        bodyType,
        powertrain,
        fuelType: powertrain,
        transmission,
        drivetrain,
        engineDisplacement,
        seats: seats ? Number(seats) : 0,
        doors: doors ? Number(doors) : 0,
        color,
        interiorColor,
        vehicleHistory: {
          accidentStatus: normalizeAccidentStatus(accidentStatus),
          floodStatus: normalizeFloodStatus(floodStatus),
          serviceHistory: normalizeServiceHistory(serviceHistory),
          ownerCount: normalizeIntCount(ownerCount, 1, 20) ?? 1,
          repaintedPartsCount: normalizeIntCount(repaintedPartsCount, 0, 50) ?? 0,
          replacedParts: replacedParts ? String(replacedParts) : '',
          engineRepaired: Boolean(engineRepaired),
          transmissionRepaired: Boolean(transmissionRepaired),
        },
        priceVnd: String(result?.estimated_price_vnd || ''),
      };
      localStorage.setItem('aura_listing_draft', JSON.stringify(draft));
    } catch {
      // ignore
    }
    router.push('/dang-tin');
  };

  return (
    <div id="ai-valuation-form-card" className="w-full space-y-8">
      {/* 1. KHUNG TẢI ẢNH LÊN ĐẦU TIÊN (100% TÙY CHỌN) */}
      <ValuationPhotoScanner
        uploadedFiles={uploadedFiles}
        uploadedPreviews={uploadedPreviews}
        fileInputRef={fileInputRef}
        isDragOver={isDragOver}
        setIsDragOver={setIsDragOver}
        aiScanLoading={aiScanLoading}
        aiScanSuccess={aiScanSuccess}
        setAiScanSuccess={setAiScanSuccess}
        onAddPhotos={handleAddPhotos}
        onRemovePhoto={handleRemovePhoto}
        onClearAllPhotos={handleClearAllPhotos}
        onRescanFirstPhoto={() => {
          if (uploadedFiles.length > 0) handleAddPhotos([uploadedFiles[0]]);
        }}
        onFileInputChange={handleFileInputChange}
      />

      {/* 2. FORM THÔNG SỐ ĐỊNH GIÁ XE (FULL WIDTH) */}
      <form
        onSubmit={handleSubmit}
        className="w-full bg-white p-6 sm:p-8 lg:p-10 rounded-3xl border border-[#eae8e3] shadow-xs space-y-8"
      >
        {error && (
          <div
            role="alert"
            className="flex gap-2.5 rounded-xl border border-red-200 bg-red-50 p-4 text-xs sm:text-sm text-red-800"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Sections 1, 2, 3: Identity, Tech specs, Condition & Colors */}
        <ValuationSpecsSection
          brand={brand}
          setBrand={setBrand}
          model={model}
          setModel={setModel}
          variant={variant}
          setVariant={setVariant}
          year={year}
          setYear={setYear}
          odometerKm={odometerKm}
          setOdometerKm={setOdometerKm}
          modelSuggestions={modelSuggestions}
          odoSuggestions={odoSuggestions}
          aiScanSuccess={aiScanSuccess}
          bodyType={bodyType}
          setBodyType={setBodyType}
          transmission={transmission}
          setTransmission={setTransmission}
          powertrain={powertrain}
          setPowertrain={setPowertrain}
          drivetrain={drivetrain}
          setDrivetrain={setDrivetrain}
          engineDisplacement={engineDisplacement}
          setEngineDisplacement={setEngineDisplacement}
          seats={seats}
          setSeats={setSeats}
          doors={doors}
          setDoors={setDoors}
          condition={condition}
          setCondition={setCondition}
          origin={origin}
          setOrigin={setOrigin}
          color={color}
          setColor={setColor}
          interiorColor={interiorColor}
          setInteriorColor={setInteriorColor}
        />

        {/* Section 4: Vehicle History & Technical Inspection */}
        <ValuationConditionSection
          accidentStatus={accidentStatus}
          setAccidentStatus={setAccidentStatus}
          floodStatus={floodStatus}
          setFloodStatus={setFloodStatus}
          serviceHistory={serviceHistory}
          setServiceHistory={setServiceHistory}
          ownerCount={ownerCount}
          setOwnerCount={setOwnerCount}
          repaintedPartsCount={repaintedPartsCount}
          setRepaintedPartsCount={setRepaintedPartsCount}
          engineRepaired={engineRepaired}
          setEngineRepaired={setEngineRepaired}
          transmissionRepaired={transmissionRepaired}
          setTransmissionRepaired={setTransmissionRepaired}
          replacedParts={replacedParts}
          setReplacedParts={setReplacedParts}
        />

        {/* Submit Action: Full Width Luxury Button */}
        <button
          type="submit"
          disabled={loading}
          className="flex h-14 w-full items-center justify-center rounded-2xl border border-[#1a1c1a] bg-[#1a1c1a] px-6 text-sm sm:text-base font-bold text-white transition-all hover:bg-[#b89b72] hover:border-[#b89b72] disabled:bg-[#dbdad7] shadow-lg cursor-pointer mt-4"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2.5 h-5 w-5 animate-spin text-[#b89b72]" />
              <span>Đang phân tích định giá thị trường xe...</span>
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-5 w-5 text-[#b89b72]" />
              <span>Xem Giá Tham Khảo Ngay</span>
            </>
          )}
        </button>
      </form>

      {/* 3. KHỐI KẾT QUẢ ĐỊNH GIÁ & ĐĂNG BÁN XE NHANH */}
      {result && (
        <ValuationResultDossier
          result={result}
          brand={brand}
          model={model}
          variant={variant}
          year={year}
          odometerKm={odometerKm}
          bodyType={bodyType}
          transmission={transmission}
          color={color}
          origin={origin}
          uploadedFilesCount={uploadedFiles.length}
          onOpenResultModal={() => setResultModalOpen(true)}
          onOpenQuickModal={() => setQuickModalOpen(true)}
          onOpenFullPost={handleOpenFullPost}
        />
      )}

      {/* 4. MODAL DIALOG HIỂN THỊ KẾT QUẢ ĐỊNH GIÁ & HÀNH ĐỘNG */}
      <ValuationResultModal
        isOpen={resultModalOpen}
        onClose={() => setResultModalOpen(false)}
        result={result}
        vehicle={{
          brand,
          model,
          variant,
          year,
          odometerKm,
          bodyType,
          transmission,
          fuelType: powertrain,
          color,
          origin,
          condition,
        }}
        onOpenQuickListing={() => {
          setResultModalOpen(false);
          setQuickModalOpen(true);
        }}
        onOpenFullListing={() => {
          setResultModalOpen(false);
          handleOpenFullPost();
        }}
        onRecalculate={() => {
          setResultModalOpen(false);
          const topElement = document.getElementById('ai-valuation-form-card');
          if (topElement) topElement.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* Quick Listing Modal Popup */}
      <QuickListingModal
        isOpen={quickModalOpen}
        onClose={() => setQuickModalOpen(false)}
        initialData={{
          brand,
          model,
          trim: variant,
          year: Number(year) || 2022,
          odometerKm: Number(odometerKm) || 40000,
          condition,
          origin,
          bodyType,
          fuelType: powertrain,
          transmission,
          drivetrain,
          engineDisplacement,
          seats: seats ? Number(seats) : undefined,
          doors: doors ? Number(doors) : undefined,
          color,
          interiorColor,
          estimatedPriceVnd: result?.estimated_price_vnd || 500000000,
          lowPriceVnd: result?.interval_low_vnd || undefined,
          highPriceVnd: result?.interval_high_vnd || undefined,
          suggestedTitle: `Bán xe ${brand} ${model} ${variant ? variant + ' ' : ''}${year} màu ${color || 'trắng'}`,
          suggestedDescription: result?.explanation?.summary || undefined,
          vehicleHistory: {
            accidentStatus: normalizeAccidentStatus(accidentStatus),
            floodStatus: normalizeFloodStatus(floodStatus),
            serviceHistory: normalizeServiceHistory(serviceHistory),
            ownerCount: normalizeIntCount(ownerCount, 1, 20) ?? 1,
            repaintedPartsCount: normalizeIntCount(repaintedPartsCount, 0, 50) ?? 0,
            replacedParts: replacedParts ? String(replacedParts) : '',
            engineRepaired: Boolean(engineRepaired),
            transmissionRepaired: Boolean(transmissionRepaired),
          },
        }}
        initialFiles={uploadedFiles}
        onAddFiles={(newFiles) => {
          handleAddPhotos(newFiles);
        }}
      />
    </div>
  );
}
