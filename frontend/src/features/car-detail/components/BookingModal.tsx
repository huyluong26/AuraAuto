'use client';

import React, { useState } from 'react';
import { ListingDetail } from '@/types';

interface BookingModalProps {
  isOpen: boolean;
  listing: ListingDetail;
  onClose: () => void;
  onSubmit: (data: {
    customerName: string;
    customerPhone: string;
    bookingDate: string;
    experienceType: 'SHOWROOM' | 'HOME';
    note: string;
  }) => Promise<void>;
}

export function BookingModal({
  isOpen,
  listing,
  onClose,
  onSubmit,
}: BookingModalProps) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [experienceType, setExperienceType] = useState<'SHOWROOM' | 'HOME'>('SHOWROOM');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({
        customerName,
        customerPhone,
        bookingDate,
        experienceType,
        note,
      });
      setCustomerName('');
      setCustomerPhone('');
      setBookingDate('');
      setNote('');
    } catch {
      // Error handled by parent
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-xl bg-surface-container-lowest p-space-lg shadow-2xl relative animate-in fade-in duration-200">
        <button
          type="button"
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-surface-container text-on-surface-variant cursor-pointer"
          onClick={onClose}
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        <div className="flex items-center gap-space-sm mb-space-md">
          <div className="w-10 h-10 rounded-lg bg-secondary text-on-secondary flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">sports_motorsports</span>
          </div>
          <div>
            <h3 className="font-headline-sm text-headline-sm font-bold text-primary">
              Đặt Lịch Lái Thử VIP
            </h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-1">
              {listing.title} • Tại {listing.location_address || 'Showroom'}
            </p>
          </div>
        </div>

        <form className="space-y-space-sm" onSubmit={handleSubmit}>
          <div>
            <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1 uppercase font-semibold">
              Họ và tên của Quý Khách
            </label>
            <input
              className="w-full h-12 px-3 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:bg-surface-container-lowest outline-none ring-1 ring-outline-variant focus:ring-2 focus:ring-secondary transition-all"
              placeholder="Ví dụ: Ông Trần Quốc Bảo"
              required
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-space-sm">
            <div>
              <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1 uppercase font-semibold">
                Số điện thoại
              </label>
              <input
                className="w-full h-12 px-3 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:bg-surface-container-lowest outline-none ring-1 ring-outline-variant focus:ring-2 focus:ring-secondary transition-all"
                placeholder="090 123 4567"
                required
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
            </div>
            <div>
              <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1 uppercase font-semibold">
                Ngày mong muốn
              </label>
              <input
                className="w-full h-12 px-3 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:bg-surface-container-lowest outline-none ring-1 ring-outline-variant focus:ring-2 focus:ring-secondary transition-all"
                required
                type="date"
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1 uppercase font-semibold">
              Hình thức trải nghiệm
            </label>
            <div className="grid grid-cols-2 gap-space-xs">
              <label
                className={`flex items-center gap-2 p-2.5 rounded-lg cursor-pointer transition-all ${
                  experienceType === 'SHOWROOM'
                    ? 'bg-secondary-container text-on-secondary-container font-semibold ring-1 ring-secondary'
                    : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
                }`}
              >
                <input
                  type="radio"
                  name="modalExperienceType"
                  checked={experienceType === 'SHOWROOM'}
                  onChange={() => setExperienceType('SHOWROOM')}
                  className="accent-secondary"
                />
                <span className="font-body-sm text-body-sm">Tại Showroom</span>
              </label>

              <label
                className={`flex items-center gap-2 p-2.5 rounded-lg cursor-pointer transition-all ${
                  experienceType === 'HOME'
                    ? 'bg-secondary-container text-on-secondary-container font-semibold ring-1 ring-secondary'
                    : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
                }`}
              >
                <input
                  type="radio"
                  name="modalExperienceType"
                  checked={experienceType === 'HOME'}
                  onChange={() => setExperienceType('HOME')}
                  className="accent-secondary"
                />
                <span className="font-body-sm text-body-sm">Lái thử tận nhà</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1 uppercase font-semibold">
              Ghi chú thêm (tùy chọn)
            </label>
            <input
              className="w-full h-10 px-3 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:bg-surface-container-lowest outline-none ring-1 ring-outline-variant focus:ring-2 focus:ring-secondary transition-all"
              placeholder="Ví dụ: Cần kiểm định tại hãng trước khi lái thử..."
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <button
            disabled={submitting}
            className="w-full py-3.5 mt-2 rounded-lg bg-primary text-on-primary font-label-lg text-label-lg hover:bg-primary-container transition-all shadow-md font-semibold cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            type="submit"
          >
            {submitting ? (
              <span>Đang gửi thông tin...</span>
            ) : (
              <span>Xác Nhận Đặt Lịch Riêng Tư</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
