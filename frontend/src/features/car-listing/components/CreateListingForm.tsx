'use client';

import React from 'react';
import { useCreateListing } from '../hooks/useCreateListing';
import { CarListingHeader } from './CarListingHeader';
import { Step1BasicInfo } from './Step1BasicInfo';
import { Step2TechnicalCommitments } from './Step2TechnicalCommitments';
import { Step3GuidedPhotoUploader } from './Step3GuidedPhotoUploader';
import { Step4PricingAuraML } from './Step4PricingAuraML';
import { Step5PreviewAndSubmit } from './Step5PreviewAndSubmit';
import { ListingSuccessModal } from './ListingSuccessModal';

export function CreateListingForm() {
  const listingState = useCreateListing();

  if (listingState.success) {
    return (
      <ListingSuccessModal
        listingId={listingState.createdListingId}
        onReset={() => {
          window.location.reload();
        }}
      />
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">
      {/* Header with Interactive Step Progress Flow */}
      <CarListingHeader
        currentStep={listingState.currentStep}
        onStepClick={listingState.goToStep}
      />

      {/* Main Single Column Spacious Layout */}
      <div className="w-full space-y-6">
        {/* Global Error Banner if validation fails */}
        {listingState.errorMessage && (
          <div className="p-4 rounded-xl bg-error-container text-on-error-container border border-error/30 flex items-center gap-3 animate-in fade-in duration-200">
            <span className="material-symbols-outlined text-[22px] shrink-0">error</span>
            <p className="font-body-sm text-sm font-semibold">{listingState.errorMessage}</p>
          </div>
        )}

        {/* Step 1: Basic Info & Geolocation */}
        {listingState.currentStep === 1 && (
          <Step1BasicInfo
            sellerType={listingState.sellerType}
            onSellerTypeChange={listingState.setSellerType}
            showroomName={listingState.showroomName}
            onShowroomNameChange={listingState.setShowroomName}
            showroomPhone={listingState.showroomPhone}
            onShowroomPhoneChange={listingState.setShowroomPhone}
            brands={listingState.brands}
            models={listingState.models}
            brandId={listingState.brandId}
            brandName={listingState.brandName}
            onBrandSelect={listingState.handleBrandSelect}
            onCustomBrandInput={listingState.handleCustomBrandInput}
            modelId={listingState.modelId}
            modelName={listingState.modelName}
            onModelSelect={listingState.handleModelSelect}
            onCustomModelInput={listingState.handleCustomModelInput}
            onApplyCarRecognition={listingState.handleApplyCarRecognition}
            trim={listingState.trim}
            onTrimChange={listingState.setTrim}
            manufactureYear={listingState.manufactureYear}
            onYearChange={listingState.setManufactureYear}
            odometerKm={listingState.odometerKm}
            onOdometerChange={listingState.handleOdometerChange}
            provinceCode={listingState.provinceCode}
            onProvinceChange={listingState.handleProvinceChange}
            locationAddress={listingState.locationAddress}
            onAddressChange={listingState.setLocationAddress}
            coordinates={listingState.coordinates}
            onCoordinatesChange={listingState.setCoordinates}
            errors={listingState.errors}
            onNext={listingState.nextStep}
          />
        )}

        {/* Step 2: Comprehensive Technical Specifications & Description */}
        {listingState.currentStep === 2 && (
          <Step2TechnicalCommitments
            sellerType={listingState.sellerType}
            brandName={listingState.brandName}
            manufactureYear={listingState.manufactureYear}
            condition={listingState.condition}
            onConditionChange={listingState.setCondition}
            origin={listingState.origin}
            onOriginChange={listingState.setOrigin}
            bodyType={listingState.bodyType}
            onBodyTypeChange={listingState.setBodyType}
            transmission={listingState.transmission}
            onTransmissionChange={listingState.setTransmission}
            powertrain={listingState.powertrain}
            onPowertrainChange={listingState.setPowertrain}
            engineDisplacement={listingState.engineDisplacement}
            onEngineDisplacementChange={listingState.setEngineDisplacement}
            drivetrain={listingState.drivetrain}
            onDrivetrainChange={listingState.setDrivetrain}
            seats={listingState.seats}
            onSeatsChange={listingState.setSeats}
            doors={listingState.doors}
            onDoorsChange={listingState.setDoors}
            color={listingState.color}
            onColorChange={listingState.handleColorChange}
            interiorColor={listingState.interiorColor}
            onInteriorColorChange={listingState.setInteriorColor}
            description={listingState.description}
            onDescriptionChange={listingState.setDescription}
            commitments={listingState.commitments}
            onToggleCommitment={listingState.toggleCommitment}
            vehicleHistory={listingState.vehicleHistory}
            onVehicleHistoryChange={listingState.updateVehicleHistory}
            errors={listingState.errors}
            onPrev={listingState.prevStep}
            onNext={listingState.nextStep}
          />
        )}

        {/* Step 3: Guided 8 Angle Photos */}
        {listingState.currentStep === 3 && (
          <Step3GuidedPhotoUploader
            slotPhotos={listingState.slotPhotos}
            onSlotPhotoUpload={listingState.handleSlotPhotoUpload}
            onRemoveSlotPhoto={listingState.removeSlotPhoto}
            extraPhotos={listingState.extraPhotos}
            onExtraPhotosUpload={listingState.handleExtraPhotosUpload}
            onRemoveExtraPhoto={listingState.removeExtraPhoto}
            error={listingState.errors.photo}
            onPrev={listingState.prevStep}
            onNext={listingState.nextStep}
          />
        )}

        {/* Step 4: Pricing & CatBoost AI Valuation (Side-by-side with Apply Price) */}
        {listingState.currentStep === 4 && (
          <Step4PricingAuraML
            priceVnd={listingState.priceVnd}
            onPriceChange={listingState.setPriceVnd}
            tradeOptions={listingState.tradeOptions}
            onToggleTradeOption={listingState.toggleTradeOption}
            aiLoading={listingState.aiLoading}
            aiPriceSuggestion={listingState.aiPriceSuggestion}
            aiIntervalLow={listingState.aiIntervalLow}
            aiIntervalHigh={listingState.aiIntervalHigh}
            aiConfidence={listingState.aiConfidence}
            aiEstimateNote={listingState.aiEstimateNote}
            aiError={listingState.aiError}
            onGetAIEstimate={listingState.handleGetAIEstimate}
            onApplyAiPrice={listingState.handleApplyAiPrice}
            error={listingState.errors.price}
            onPrev={listingState.prevStep}
            onNext={listingState.nextStep}
          />
        )}

        {/* Step 5: Editorial Summary & Certification Submission */}
        {listingState.currentStep === 5 && (
          <Step5PreviewAndSubmit
            sellerType={listingState.sellerType}
            showroomName={listingState.showroomName}
            showroomPhone={listingState.showroomPhone}
            brandName={listingState.brandName}
            modelName={listingState.modelName}
            trim={listingState.trim}
            manufactureYear={listingState.manufactureYear}
            odometerKm={listingState.odometerKm}
            provinceCode={listingState.provinceCode}
            locationAddress={listingState.locationAddress}
            condition={listingState.condition}
            origin={listingState.origin}
            bodyType={listingState.bodyType}
            transmission={listingState.transmission}
            powertrain={listingState.powertrain}
            engineDisplacement={listingState.engineDisplacement}
            drivetrain={listingState.drivetrain}
            seats={listingState.seats}
            doors={listingState.doors}
            color={listingState.color}
            interiorColor={listingState.interiorColor}
            description={listingState.description}
            commitments={listingState.commitments}
            vehicleHistory={listingState.vehicleHistory}
            primaryPhotoPreview={listingState.slotPhotos.front?.previewUrl}
            totalPhotosCount={listingState.uploadedPhotosCount}
            priceVnd={listingState.priceVnd}
            tradeOptions={listingState.tradeOptions}
            privacyShield={listingState.privacyShield}
            onTogglePrivacyShield={listingState.setPrivacyShield}
            submitting={listingState.submitting}
            submitStatusText={listingState.submitStatusText}
            onPrev={listingState.prevStep}
            onSubmit={listingState.handleSubmit}
          />
        )}
      </div>
    </div>
  );
}
