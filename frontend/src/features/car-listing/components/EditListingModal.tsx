'use client';

import React from 'react';
import { useEditListingForm } from '../hooks/useEditListingForm';
import { EditSpecsTab } from './edit/EditSpecsTab';
import { EditCommitmentsTab } from './edit/EditCommitmentsTab';
import { EditPricingLocationTab } from './edit/EditPricingLocationTab';
import { EditPhotosTab } from './edit/EditPhotosTab';

interface EditListingModalProps {
  listingId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditListingModal({ listingId, onClose, onSuccess }: EditListingModalProps) {
  const {
    loading,
    submitting,
    error,
    activeTab,
    setActiveTab,
    brands,
    models,
    listingStatus,
    hasPendingRevision,
    title,
    setTitle,
    brandId,
    modelId,
    setModelId,
    manufactureYear,
    setManufactureYear,
    bodyType,
    setBodyType,
    fuelType,
    setFuelType,
    transmission,
    setTransmission,
    odometerKm,
    setOdometerKm,
    origin,
    setOrigin,
    color,
    setColor,
    interiorColor,
    setInteriorColor,
    seats,
    setSeats,
    doors,
    setDoors,
    licensePlate,
    setLicensePlate,
    vin,
    setVin,
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
    priceVnd,
    setPriceVnd,
    provinceCode,
    setProvinceCode,
    locationAddress,
    setLocationAddress,
    description,
    setDescription,
    mediaList,
    uploadingPhotos,
    handleBrandChange,
    handleUploadPhotos,
    handleDeletePhoto,
    handleSetPrimary,
    handleUpdateLabel,
    handleSubmit,
  } = useEditListingForm({ listingId, onClose, onSuccess });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/65 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-4xl max-h-[92vh] bg-surface-container-lowest rounded-3xl shadow-2xl border border-surface-container-high flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-surface-container-high flex items-center justify-between bg-surface-container-low/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[22px]">edit_document</span>
              <h2 className="text-base sm:text-lg font-bold text-primary">Chỉnh sửa thông tin tin đăng</h2>
              {hasPendingRevision && (
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-300">
                  Có bản sửa đổi chờ duyệt
                </span>
              )}
            </div>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Cập nhật chi tiết xe, cam kết kỹ thuật, giá bán và ảnh góc chụp.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Informative Alert for Published Listings */}
        {listingStatus === 'PUBLISHED' && (
          <div className="px-6 py-2.5 bg-secondary-fixed/30 border-b border-secondary/20 flex items-center gap-2.5 text-xs text-on-surface">
            <span className="material-symbols-outlined text-[18px] text-secondary shrink-0">info</span>
            <span>
              <strong>Lưu ý:</strong> Tin đăng này đang chạy công khai trên sàn. Khi bạn gửi bản sửa mới, tin vẫn tiếp tục hiển thị với thông tin cũ cho đến khi được Admin phê duyệt.
            </span>
          </div>
        )}

        {/* Modal Navigation Tabs */}
        <div className="px-6 pt-3 border-b border-surface-container-high flex gap-2 overflow-x-auto bg-surface-container-lowest">
          <button
            type="button"
            onClick={() => setActiveTab('SPECS')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap border-b-2 ${
              activeTab === 'SPECS'
                ? 'border-secondary text-secondary bg-surface-container-low/70'
                : 'border-transparent text-on-surface-variant hover:text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">directions_car</span>
            <span>1. Thông tin xe & Vận hành</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('COMMITMENTS')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap border-b-2 ${
              activeTab === 'COMMITMENTS'
                ? 'border-secondary text-secondary bg-surface-container-low/70'
                : 'border-transparent text-on-surface-variant hover:text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">verified_user</span>
            <span>2. Cam kết & Lịch sử xe</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('PRICING_LOCATION')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap border-b-2 ${
              activeTab === 'PRICING_LOCATION'
                ? 'border-secondary text-secondary bg-surface-container-low/70'
                : 'border-transparent text-on-surface-variant hover:text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">payments</span>
            <span>3. Giá bán & Vị trí & Mô tả</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('PHOTOS')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap border-b-2 ${
              activeTab === 'PHOTOS'
                ? 'border-secondary text-secondary bg-surface-container-low/70'
                : 'border-transparent text-on-surface-variant hover:text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">photo_library</span>
            <span>4. Quản lý ảnh ({mediaList.length})</span>
          </button>
        </div>

        {/* Modal Body / Form */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-2 border-secondary/30 border-t-secondary rounded-full animate-spin" />
              <p className="text-xs text-on-surface-variant">Đang tải toàn bộ dữ liệu tin đăng...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-error-container/40 border border-error/30 text-error text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{error}</span>
            </div>
          ) : (
            <form id="edit-listing-form" onSubmit={handleSubmit} className="space-y-6">
              {activeTab === 'SPECS' && (
                <EditSpecsTab
                  title={title}
                  setTitle={setTitle}
                  brandId={brandId}
                  onBrandChange={handleBrandChange}
                  modelId={modelId}
                  setModelId={setModelId}
                  brands={brands}
                  models={models}
                  manufactureYear={manufactureYear}
                  setManufactureYear={setManufactureYear}
                  bodyType={bodyType}
                  setBodyType={setBodyType}
                  odometerKm={odometerKm}
                  setOdometerKm={setOdometerKm}
                  fuelType={fuelType}
                  setFuelType={setFuelType}
                  transmission={transmission}
                  setTransmission={setTransmission}
                  origin={origin}
                  setOrigin={setOrigin}
                  color={color}
                  setColor={setColor}
                  interiorColor={interiorColor}
                  setInteriorColor={setInteriorColor}
                  seats={seats}
                  setSeats={setSeats}
                  doors={doors}
                  setDoors={setDoors}
                  licensePlate={licensePlate}
                  setLicensePlate={setLicensePlate}
                  vin={vin}
                  setVin={setVin}
                />
              )}

              {activeTab === 'COMMITMENTS' && (
                <EditCommitmentsTab
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
                  replacedParts={replacedParts}
                  setReplacedParts={setReplacedParts}
                  engineRepaired={engineRepaired}
                  setEngineRepaired={setEngineRepaired}
                  transmissionRepaired={transmissionRepaired}
                  setTransmissionRepaired={setTransmissionRepaired}
                />
              )}

              {activeTab === 'PRICING_LOCATION' && (
                <EditPricingLocationTab
                  priceVnd={priceVnd}
                  setPriceVnd={setPriceVnd}
                  provinceCode={provinceCode}
                  setProvinceCode={setProvinceCode}
                  locationAddress={locationAddress}
                  setLocationAddress={setLocationAddress}
                  description={description}
                  setDescription={setDescription}
                />
              )}

              {activeTab === 'PHOTOS' && (
                <EditPhotosTab
                  mediaList={mediaList}
                  uploadingPhotos={uploadingPhotos}
                  onUploadPhotos={handleUploadPhotos}
                  onDeletePhoto={handleDeletePhoto}
                  onSetPrimary={handleSetPrimary}
                  onUpdateLabel={handleUpdateLabel}
                />
              )}
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-surface-container-high bg-surface-container-low/50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-on-surface-variant">
              Trạng thái: <strong className="text-primary">{listingStatus}</strong>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>

            <button
              type="submit"
              form="edit-listing-form"
              disabled={submitting || loading}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-secondary hover:bg-on-secondary-fixed text-on-secondary shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">send</span>
              <span>{submitting ? 'Đang gửi duyệt...' : 'Lưu & Gửi duyệt cập nhật'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
