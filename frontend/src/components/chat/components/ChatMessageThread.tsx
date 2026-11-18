'use client';

import React from 'react';
import Link from 'next/link';
import { ChatMessageItem } from '../types';
import { parseAppointmentMessage } from '../utils/chatParser';

interface ChatMessageThreadProps {
  messages: ChatMessageItem[];
  loadingMsgs: boolean;
  currentUserId?: string;
  appointmentStatuses: Record<string, string>;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  onSendMessage: (text: string) => void;
  onConfirmAppointment: (apptId: string, time: string, date: string, loc: string) => void;
  onDeclineAppointment: (apptId: string) => void;
  onCancelAppointment: (apptId: string) => void;
  onCloseWidget: () => void;
}

export const ChatMessageThread: React.FC<ChatMessageThreadProps> = ({
  messages,
  loadingMsgs,
  currentUserId,
  appointmentStatuses,
  messagesEndRef,
  onSendMessage,
  onConfirmAppointment,
  onDeclineAppointment,
  onCancelAppointment,
  onCloseWidget,
}) => {
  return (
    <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-[#faf9f6]">
      {loadingMsgs ? (
        <div className="h-full flex items-center justify-center gap-2 text-outline text-xs">
          <div className="w-5 h-5 border-2 border-[#1a1c1a] border-t-transparent rounded-full animate-spin" />
          <span>Đang tải tin nhắn...</span>
        </div>
      ) : messages.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2 text-outline">
          <span className="material-symbols-outlined text-[32px] text-[#b89b72]">waving_hand</span>
          <p className="text-xs">
            Hãy gửi lời chào đầu tiên hoặc bấm các nút hành động bên trên để trao đổi mua bán chiếc xe này!
          </p>
          <div className="flex flex-wrap gap-1.5 justify-center pt-2">
            {[
              'Xe còn sẵn không bạn?',
              'Xe có thương lượng bớt giá không?',
              'Hẹn xem xe cuối tuần này được không?',
            ].map((t, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onSendMessage(t)}
                className="text-[11px] px-2.5 py-1 rounded-full bg-white hover:bg-[#edebe6] text-[#1a1c1a] transition-colors cursor-pointer border border-[#eae8e3]"
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      ) : (
        messages.map((m) => {
          const isMe = m.sender_user_id === currentUserId;
          const appt = parseAppointmentMessage(m.content, appointmentStatuses);
          const isConfirmNotice = m.content.startsWith('✅ [XÁC NHẬN LỊCH HẸN]');
          const isDeclineNotice = m.content.startsWith('❌ [TỪ CHỐI LỊCH HẸN]');
          const isCancelNotice = m.content.startsWith('🚫 [ĐÃ HỦY LỊCH HẸN]');

          // A) THẺ HỆ THỐNG: YÊU CẦU LỊCH HẸN XEM XE
          if (appt) {
            const isConfirmed = appt.status === 'CONFIRMED';
            const isDeclined = appt.status === 'DECLINED';
            const isCancelled = appt.status === 'CANCELLED';
            const isPending = !isConfirmed && !isDeclined && !isCancelled;

            return (
              <div key={m.id} className="w-full my-2">
                <div className="max-w-[92%] mx-auto bg-white rounded-xl border border-[#eae8e3] p-3.5 shadow-xs space-y-2.5 border-l-4 border-l-[#b89b72]">
                  <div className="flex items-center justify-between pb-2 border-b border-[#eae8e3]">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[#b89b72] text-[18px]">
                        calendar_month
                      </span>
                      <span className="font-bold text-xs text-[#1a1c1a]">
                        Đề nghị Lịch Hẹn Xem Xe
                      </span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isConfirmed
                          ? 'bg-secondary-container text-on-secondary-container border border-secondary/20'
                          : isDeclined
                          ? 'bg-error-container text-on-error-container border border-error/20'
                          : isCancelled
                          ? 'bg-surface-container-low text-outline border border-surface-container-high'
                          : 'bg-surface-container text-on-surface-variant border border-outline-variant/40'
                      }`}
                    >
                      {isConfirmed
                        ? 'Đã đồng ý lịch hẹn'
                        : isDeclined
                        ? 'Đã từ chối'
                        : isCancelled
                        ? 'Đã hủy lịch'
                        : 'Chờ phản hồi'}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-[#444748]">
                    <div className="flex items-center gap-1.5">
                      <span className="text-outline font-medium">Thời gian:</span>
                      <strong className="text-[#1a1c1a]">
                        {appt.time} ngày {new Date(appt.date).toLocaleDateString('vi-VN')}
                      </strong>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="text-outline font-medium shrink-0">Địa điểm:</span>
                      <span className="text-[#1a1c1a] font-medium">{appt.location}</span>
                    </div>
                    {appt.note && (
                      <div className="flex items-start gap-1.5 text-[11px] text-outline">
                        <span className="shrink-0">Ghi chú:</span>
                        <span>{appt.note}</span>
                      </div>
                    )}
                  </div>

                  {/* Nút thao tác Đồng ý / Từ chối (cho bên nhận khi Pending) */}
                  {isPending && !isMe && (
                    <div className="flex items-center gap-2 pt-2 border-t border-[#eae8e3]">
                      <button
                        type="button"
                        onClick={() =>
                          onConfirmAppointment(appt.id, appt.time, appt.date, appt.location)
                        }
                        className="flex-1 py-1.5 rounded-lg bg-secondary hover:bg-on-secondary-fixed text-on-secondary font-semibold text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                      >
                        <span className="material-symbols-outlined text-[15px]">check</span>
                        <span>Đồng ý lịch hẹn</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeclineAppointment(appt.id)}
                        className="px-3 py-1.5 rounded-lg border border-[#eae8e3] hover:bg-[#faf9f6] text-outline hover:text-red-600 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Từ chối
                      </button>
                    </div>
                  )}

                  {/* Nút hủy đề nghị lịch hẹn cho người gửi khi đang Pending */}
                  {isPending && isMe && (
                    <div className="flex items-center justify-end pt-2 border-t border-[#eae8e3]">
                      <button
                        type="button"
                        onClick={() => onCancelAppointment(appt.id)}
                        className="text-[11px] text-[#777777] hover:text-red-600 font-semibold cursor-pointer transition-colors"
                      >
                        Hủy đề nghị lịch hẹn
                      </button>
                    </div>
                  )}

                  {/* Khi đã đồng ý */}
                  {isConfirmed && (
                    <div className="pt-1.5 border-t border-[#eae8e3] flex items-center justify-between">
                      <span className="text-[11px] text-secondary font-medium flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">verified</span>
                        <span>Đã lưu vào Quản lý Lịch hẹn</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onCancelAppointment(appt.id)}
                          className="text-[11px] text-[#777777] hover:text-red-600 transition-colors cursor-pointer"
                          title="Hủy lịch hẹn"
                        >
                          Hủy lịch
                        </button>
                        <Link
                          href="/lich-hen"
                          onClick={onCloseWidget}
                          className="text-[11px] text-primary hover:underline font-bold flex items-center gap-0.5"
                        >
                          <span>Chi tiết</span>
                          <span className="material-symbols-outlined text-[12px]">
                            arrow_forward
                          </span>
                        </Link>
                      </div>
                    </div>
                  )}

                  {/* Khi đã hủy */}
                  {isCancelled && (
                    <div className="pt-1.5 border-t border-[#eae8e3] text-left">
                      <span className="text-[11px] text-[#777777] font-medium flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px] text-red-500">
                          cancel
                        </span>
                        <span>Lịch hẹn này đã được hủy</span>
                      </span>
                    </div>
                  )}
                </div>
                <div className="text-[10px] text-outline text-center mt-1">
                  {new Date(m.created_at).toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            );
          }

          // B) TIN NHẮN THÔNG BÁO XÁC NHẬN / TỪ CHỐI / HỦY LỊCH
          if (isConfirmNotice || isDeclineNotice || isCancelNotice) {
            return (
              <div key={m.id} className="w-full my-1.5 text-center">
                <div
                  className={`inline-block px-3.5 py-1.5 rounded-full text-xs font-medium border ${
                    isConfirmNotice
                      ? 'bg-secondary-container text-on-secondary-container border border-secondary/20'
                      : isCancelNotice
                      ? 'bg-surface-container text-on-surface-variant border border-outline-variant/40'
                      : 'bg-error-container text-on-error-container border border-error/20'
                  }`}
                >
                  {m.content.replace(/#ID:.*?#MSG:/, '')}
                </div>
                <div className="text-[10px] text-outline mt-0.5">
                  {new Date(m.created_at).toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            );
          }

          // C) TIN NHẮN CHAT BÌNH THƯỜNG
          return (
            <div key={m.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <div
                className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-xs sm:text-[13px] leading-relaxed whitespace-pre-line shadow-2xs ${
                  isMe
                    ? 'bg-[#1a1c1a] text-white rounded-tr-xs'
                    : 'bg-white border border-[#eae8e3] text-[#1a1c1a] rounded-tl-xs'
                }`}
              >
                {m.content}
              </div>
              <span className="text-[10px] text-outline mt-0.5 px-1">
                {new Date(m.created_at).toLocaleTimeString('vi-VN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          );
        })
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};
