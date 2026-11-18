'use client';

import { useState, useCallback, useMemo } from 'react';
import { PhotoSlotKey, SlotPhotoState } from '../types';
import { GUIDED_PHOTO_SLOTS } from '../constants';

export function useListingPhotos(clearPhotoError?: () => void) {
  // Step 3: Guided Photo Slots (8 core slots, initially null)
  const [slotPhotos, setSlotPhotos] = useState<Record<PhotoSlotKey, SlotPhotoState | null>>({
    front: null,
    front_34: null,
    rear: null,
    cockpit: null,
    odo: null,
    seats: null,
    engine: null,
    inspection_sticker: null,
  });
  const [extraPhotos, setExtraPhotos] = useState<SlotPhotoState[]>([]);

  // Guided Slot Photo Upload
  const handleSlotPhotoUpload = useCallback(
    (slotKey: PhotoSlotKey, file: File) => {
      const previewUrl = URL.createObjectURL(file);
      setSlotPhotos((prev) => ({ ...prev, [slotKey]: { file, previewUrl } }));
      if (clearPhotoError) clearPhotoError();
    },
    [clearPhotoError]
  );

  const removeSlotPhoto = useCallback((slotKey: PhotoSlotKey) => {
    setSlotPhotos((prev) => ({ ...prev, [slotKey]: null }));
  }, []);

  const handleExtraPhotosUpload = useCallback((files: File[]) => {
    const newItems: SlotPhotoState[] = files.map((f) => ({
      file: f,
      previewUrl: URL.createObjectURL(f),
    }));
    setExtraPhotos((prev) => [...prev, ...newItems].slice(0, 14));
  }, []);

  const removeExtraPhoto = useCallback((index: number) => {
    setExtraPhotos((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Danh sách ảnh kèm nhãn chuẩn xác theo GUIDED_PHOTO_SLOTS và ảnh chi tiết
  const orderedSlotPhotosWithLabels = useMemo(() => {
    return GUIDED_PHOTO_SLOTS.map((slot) => {
      const photo = slotPhotos[slot.key];
      if (!photo) return null;
      return {
        file: photo.file,
        previewUrl: photo.previewUrl,
        label: slot.label,
      };
    }).filter(Boolean) as { file: File; previewUrl: string; label: string }[];
  }, [slotPhotos]);

  const extraPhotosWithLabels = useMemo(() => {
    return extraPhotos.map((photo, i) => ({
      file: photo.file,
      previewUrl: photo.previewUrl,
      label: `Ảnh chi tiết #${i + 1}`,
    }));
  }, [extraPhotos]);

  const allPhotosWithLabels = useMemo(() => {
    return [...orderedSlotPhotosWithLabels, ...extraPhotosWithLabels];
  }, [orderedSlotPhotosWithLabels, extraPhotosWithLabels]);

  const uploadedPhotosList = useMemo(() => {
    return allPhotosWithLabels.map((p) => ({ file: p.file, previewUrl: p.previewUrl }));
  }, [allPhotosWithLabels]);

  return {
    slotPhotos,
    setSlotPhotos,
    extraPhotos,
    setExtraPhotos,
    handleSlotPhotoUpload,
    removeSlotPhoto,
    handleExtraPhotosUpload,
    removeExtraPhoto,
    orderedSlotPhotosWithLabels,
    extraPhotosWithLabels,
    allPhotosWithLabels,
    uploadedPhotosList,
    uploadedPhotosCount: uploadedPhotosList.length,
  };
}
