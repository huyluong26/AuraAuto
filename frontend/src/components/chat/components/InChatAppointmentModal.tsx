'use client';

import React from 'react';

interface InChatAppointmentModalProps {
  apptDate: string;
  setApptDate: (val: string) => void;
  apptTime: string;
  setApptTime: (val: string) => void;
  apptLocation: string;
  setApptLocation: (val: string) => void;
  apptNote: string;
  setApptNote: (val: string) => void;
  submittingAppt: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const InChatAppointmentModal: React.FC<InChatAppointmentModalProps> = ({
  apptDate,
  setApptDate,
  apptTime,
  setApptTime,
  apptLocation,
  setApptLocation,
  apptNote,
  setApptNote,
  submittingAppt,
  onClose,
  onSubmit,
}) => {
  return (
    <form
      onSubmit={onSubmit}
      className="p-3.5 bg-white border-b border-[#eae8e3] space-y-2.5 text-xs shrink-0 shadow-sm animate-in fade-in slide-in-from-top-2"
    >
      <div className="flex items-center justify-between font-bold text-[#1a1c1a]">
        <span className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-secondary text-[16px]">
            calendar_today
          </span>
          <span>Lên lịch hẹn xem xe với đối tác</span>
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-outline hover:text-[#1a1c1a] cursor-pointer"
        >
          ✕
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] font-bold text-outline uppercase mb-0.5">
            Ngày xem xe
          </label>
          <input
            type="date"
            required
            value={apptDate}
            onChange={(e) => setApptDate(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg border border-[#eae8e3] text-xs bg-[#faf9f6] text-[#1a1c1a]"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-outline uppercase mb-0.5">
            Khung giờ
          </label>
          <select
            value={apptTime}
            onChange={(e) => setApptTime(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg border border-[#eae8e3] text-xs bg-[#faf9f6] text-[#1a1c1a]"
          >
            <option value="08:30">08:30 Sáng</option>
            <option value="09:30">09:30 Sáng</option>
            <option value="10:30">10:30 Sáng</option>
            <option value="14:00">14:00 Chiều</option>
            <option value="15:30">15:30 Chiều</option>
            <option value="17:00">17:00 Chiều</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-[10px] font-bold text-outline uppercase mb-0.5">
          Địa điểm hẹn gặp
        </label>
        <input
          type="text"
          required
          value={apptLocation}
          onChange={(e) => setApptLocation(e.target.value)}
          placeholder="Showroom / Địa chỉ cụ thể..."
          className="w-full px-2.5 py-1.5 rounded-lg border border-[#eae8e3] text-xs bg-[#faf9f6] text-[#1a1c1a]"
        />
      </div>

      <div>
        <label className="block text-[10px] font-bold text-outline uppercase mb-0.5">
          Ghi chú mong muốn
        </label>
        <input
          type="text"
          value={apptNote}
          onChange={(e) => setApptNote(e.target.value)}
          placeholder="Yêu cầu kiểm tra máy móc, lái thử..."
          className="w-full px-2.5 py-1.5 rounded-lg border border-[#eae8e3] text-xs bg-[#faf9f6] text-[#1a1c1a]"
        />
      </div>

      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-1.5 rounded-lg border border-[#eae8e3] text-[11px] font-semibold text-outline hover:bg-[#faf9f6] cursor-pointer"
        >
          Hủy bỏ
        </button>
        <button
          type="submit"
          disabled={submittingAppt}
          className="px-4 py-1.5 rounded-lg bg-[#1a1c1a] text-white text-[11px] font-semibold hover:bg-black transition-colors disabled:opacity-50 cursor-pointer"
        >
          {submittingAppt ? 'Đang gửi...' : 'Gửi đề nghị lịch hẹn'}
        </button>
      </div>
    </form>
  );
};
