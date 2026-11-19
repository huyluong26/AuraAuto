'use client';

import React from 'react';

interface EvidencePreviewModalProps {
  imageUrl: string | null;
  onClose: () => void;
}

export function EvidencePreviewModal({ imageUrl, onClose }: EvidencePreviewModalProps) {
  if (!imageUrl) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
      onClick={onClose}
    >
      <div className="relative max-w-4xl max-h-[90vh] rounded-2xl overflow-hidden border border-white/20 shadow-2xl bg-black">
        <img src={imageUrl} alt="Phóng to bằng chứng" className="w-full h-full object-contain" />
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/90 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>
    </div>
  );
}

