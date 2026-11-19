'use client';

import React from 'react';
import { formatVND, formatKm } from '@/lib/api';
import { AdminListingDetail } from '../../types';
import { AdminBadge } from '../ui/AdminBadge';
import { ListingModerationDrawers } from './ListingModerationDrawers';

interface ListingOverviewTabProps {
  detail: AdminListingDetail;
  activeImageIndex: number;
  setActiveImageIndex: (index: number) => void;
  showRejectForm: boolean;
  setShowRejectForm: (show: boolean) => void;
  rejectReason: string;
  setRejectReason: (reason: string) => void;
  showTakedownForm: boolean;
  setShowTakedownForm: (show: boolean) => void;
  takedownReason: string;
  setTakedownReason: (reason: string) => void;
  actionLoading: boolean;
  onReject: () => void;
  onTakedown: () => void;
}

export function ListingOverviewTab({
  detail,
  activeImageIndex,
  setActiveImageIndex,
  showRejectForm,
  setShowRejectForm,
  rejectReason,
  setRejectReason,
  showTakedownForm,
  setShowTakedownForm,
  takedownReason,
  setTakedownReason,
  actionLoading,
  onReject,
  onTakedown,
}: ListingOverviewTabProps) {
  return (
    <>
      {/* Status Header Banner */}
      <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container-high flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="font-label-sm text-[11px] text-outline block mb-1">Trạng thái tin đăng</span>
          <div className="flex items-center gap-2">
            <AdminBadge status={detail.status} />
            {detail.has_pending_revision && (
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-300 animate-pulse">
                Bản sửa đổi #{detail.revision_no} chờ duyệt
              </span>
            )}
          </div>
        </div>

        <div className="text-right">
          <span className="font-label-sm text-[11px] text-outline block mb-0.5">Giá niêm yết</span>
          <span className="font-headline-md text-xl text-secondary font-bold">
            {formatVND(detail.price_vnd)}
          </span>
        </div>
      </div>

      {/* Pending Revision Comparison Alert if applicable */}
      {detail.has_pending_revision && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 space-y-2.5">
          <div className="flex items-center gap-2 font-bold text-sm text-amber-700">
            <span className="material-symbols-outlined text-[20px]">edit_note</span>
            <span>BẢN CHỈNH SỬA TIN ĐĂNG (LẦN #{detail.revision_no}) ĐANG CHỜ PHÊ DUYỆT</span>
          </div>
          <p className="text-xs text-amber-800 leading-relaxed">
            Tin này hiện vẫn đang hiển thị công khai trên sàn với dữ liệu trước đó. Dưới đây là thông tin mới do chủ xe cập nhật. Khi bạn duyệt, phiên bản mới này sẽ được xuất bản thay thế bản cũ.
          </p>
          {detail.published_revision && (
            <div className="p-3 bg-white/80 rounded-xl border border-amber-200/80 text-xs space-y-2">
              <div className="font-bold text-primary flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px] text-secondary">compare_arrows</span>
                <span>So sánh với phiên bản đang chạy ngoài sàn:</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-outline">Giá bán cũ:</span>{' '}
                  <span className="line-through text-outline font-medium">{formatVND(detail.published_revision.price_vnd)}</span>{' '}
                  → <strong className="text-secondary">{formatVND(detail.price_vnd)}</strong>
                </div>
                <div>
                  <span className="text-outline">ODO cũ:</span>{' '}
                  <span className="line-through text-outline font-medium">{formatKm(detail.published_revision.odometer_km)}</span>{' '}
                  → <strong className="text-primary">{formatKm(detail.odometer_km)}</strong>
                </div>
                {detail.published_revision.title !== detail.title && (
                  <div className="sm:col-span-2">
                    <span className="text-outline">Tiêu đề cũ:</span> {detail.published_revision.title}
                  </div>
                )}
                {detail.published_revision.location_address !== detail.location_address && (
                  <div className="sm:col-span-2">
                    <span className="text-outline">Địa chỉ cũ:</span> {detail.published_revision.location_address || 'Toàn quốc'}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Photo Gallery with slot labels */}
      <div className="space-y-2">
        <h3 className="font-label-md text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
          <span className="material-symbols-outlined text-secondary text-[18px]">photo_library</span>
          <span>Hình ảnh thực tế & góc chụp ({detail.images.length} ảnh)</span>
        </h3>

        {detail.images.length > 0 ? (
          <div className="space-y-2">
            <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-surface-container-high border border-surface-container-high flex items-center justify-center">
              <img
                src={detail.images[activeImageIndex] || detail.images[0]}
                alt="Xe thẩm định"
                className="w-full h-full object-contain"
              />
              <div className="absolute top-3 left-3 flex items-center gap-1.5">
                <span className="px-2.5 py-1 rounded-md bg-black/75 text-white font-label-sm text-xs backdrop-blur-xs flex items-center gap-1 font-semibold">
                  <span className="material-symbols-outlined text-[13px] text-secondary">label</span>
                  <span>
                    {detail.media?.[activeImageIndex]?.label ||
                      (detail.media?.[activeImageIndex]?.is_primary ? 'Ảnh đại diện' : `Góc chụp #${activeImageIndex + 1}`)}
                  </span>
                </span>
              </div>
              <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded-md bg-primary/70 text-on-primary font-label-sm text-xs backdrop-blur-xs">
                Ảnh {activeImageIndex + 1} / {detail.images.length}
              </span>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
              {detail.images.map((img, idx) => {
                const mLabel = detail.media?.[idx]?.label;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-24 rounded-lg overflow-hidden shrink-0 border-2 transition-all cursor-pointer flex flex-col ${
                      activeImageIndex === idx
                        ? 'border-secondary ring-2 ring-secondary/30 bg-surface-container'
                        : 'border-surface-container-high opacity-70 hover:opacity-100 bg-surface-container-low'
                    }`}
                  >
                    <div className="w-full h-14 overflow-hidden">
                      <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                    </div>
                    <span className="text-[10px] text-center font-medium py-0.5 px-1 truncate w-full text-on-surface">
                      {mLabel || `Ảnh #${idx + 1}`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-xl bg-surface-container-low border border-surface-container-high text-center font-body-sm text-xs text-outline">
            Tin đăng này chưa tải lên hình ảnh.
          </div>
        )}
      </div>

      {/* Complete Technical Specifications Grid */}
      <div className="space-y-2">
        <h3 className="font-label-md text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
          <span className="material-symbols-outlined text-secondary text-[18px]">tune</span>
          <span>Thông số kỹ thuật phương tiện</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high">
            <span className="font-label-sm text-[11px] text-outline block">Hãng xe</span>
            <span className="font-semibold text-primary text-xs">{detail.brand_name || 'N/A'}</span>
          </div>

          <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high">
            <span className="font-label-sm text-[11px] text-outline block">Dòng xe (Model)</span>
            <span className="font-semibold text-primary text-xs">{detail.model_name || 'N/A'}</span>
          </div>

          <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high">
            <span className="font-label-sm text-[11px] text-outline block">Năm sản xuất</span>
            <span className="font-semibold text-primary text-xs">{detail.manufacture_year}</span>
          </div>

          <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high">
            <span className="font-label-sm text-[11px] text-outline block">Số km đã đi (ODO)</span>
            <span className="font-semibold text-primary text-xs">{formatKm(detail.odometer_km)}</span>
          </div>

          <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high">
            <span className="font-label-sm text-[11px] text-outline block">Kiểu dáng thân xe</span>
            <span className="font-semibold text-primary text-xs">{detail.body_type}</span>
          </div>

          <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high">
            <span className="font-label-sm text-[11px] text-outline block">Nhiên liệu</span>
            <span className="font-semibold text-primary text-xs">{detail.fuel_type}</span>
          </div>

          <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high">
            <span className="font-label-sm text-[11px] text-outline block">Hộp số</span>
            <span className="font-semibold text-primary text-xs">{detail.transmission}</span>
          </div>

          <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high">
            <span className="font-label-sm text-[11px] text-outline block">Xuất xứ</span>
            <span className="font-semibold text-primary text-xs">{detail.origin || 'Lắp ráp trong nước'}</span>
          </div>

          <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high">
            <span className="font-label-sm text-[11px] text-outline block">Màu ngoại thất</span>
            <span className="font-semibold text-primary text-xs">{detail.color || 'Không rõ'}</span>
          </div>

          <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high">
            <span className="font-label-sm text-[11px] text-outline block">Màu nội thất</span>
            <span className="font-semibold text-primary text-xs">{detail.interior_color || 'Không rõ'}</span>
          </div>

          <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high">
            <span className="font-label-sm text-[11px] text-outline block">Số chỗ / Số cửa</span>
            <span className="font-semibold text-primary text-xs">{detail.seats || 5} chỗ • {detail.doors || 4} cửa</span>
          </div>

          <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high">
            <span className="font-label-sm text-[11px] text-outline block">Tình trạng xe</span>
            <span className="font-semibold text-primary text-xs">{detail.condition === 'NEW' ? 'Xe mới' : 'Đã qua sử dụng'}</span>
          </div>

          {detail.license_plate && (
            <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high">
              <span className="font-label-sm text-[11px] text-outline block">Biển số</span>
              <span className="font-semibold text-primary text-xs font-mono">{detail.license_plate}</span>
            </div>
          )}

          {detail.vin && (
            <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high">
              <span className="font-label-sm text-[11px] text-outline block">Số khung (VIN)</span>
              <span className="font-semibold text-primary text-xs font-mono">{detail.vin}</span>
            </div>
          )}
        </div>
      </div>

      {/* Technical Commitments & Vehicle History */}
      <div className="space-y-2">
        <h3 className="font-label-md text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
          <span className="material-symbols-outlined text-secondary text-[18px]">verified_user</span>
          <span>Cam kết chất lượng & Lịch sử xe</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high">
            <span className="font-label-sm text-[11px] text-outline block">Tai nạn / Va chạm</span>
            <span className={`font-semibold text-xs ${detail.accident_status === 'NONE' ? 'text-emerald-700' : detail.accident_status === 'MINOR' ? 'text-amber-700' : 'text-primary'}`}>
              {detail.accident_status === 'NONE'
                ? 'Cam kết không tai nạn'
                : detail.accident_status === 'MINOR'
                ? 'Va quẹt nhẹ bên ngoài'
                : detail.accident_status === 'MAJOR'
                ? 'Tai nạn ảnh hưởng kết cấu'
                : 'Chưa xác định'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high">
            <span className="font-label-sm text-[11px] text-outline block">Ngập nước / Thủy kích</span>
            <span className={`font-semibold text-xs ${detail.flood_status === 'NONE' ? 'text-emerald-700' : 'text-primary'}`}>
              {detail.flood_status === 'NONE'
                ? 'Cam kết không thủy kích'
                : detail.flood_status === 'CONFIRMED'
                ? 'Đã từng ngập nước'
                : detail.flood_status === 'SUSPECTED'
                ? 'Nghi vấn ngập nước'
                : 'Chưa xác định'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high">
            <span className="font-label-sm text-[11px] text-outline block">Lịch sử bảo dưỡng</span>
            <span className="font-semibold text-primary text-xs">
              {detail.service_history === 'FULL'
                ? 'Bảo dưỡng hãng đầy đủ'
                : detail.service_history === 'PARTIAL'
                ? 'Bảo dưỡng một phần'
                : 'Không có sổ bảo dưỡng'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high">
            <span className="font-label-sm text-[11px] text-outline block">Số đời chủ</span>
            <span className="font-semibold text-primary text-xs">{detail.owner_count || 1} đời chủ</span>
          </div>

          <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high">
            <span className="font-label-sm text-[11px] text-outline block">Sơn lại / Thay thế phụ tùng</span>
            <span className="font-semibold text-primary text-xs">
              Sơn {detail.repainted_parts_count || 0} chi tiết • {detail.replaced_parts ? `Thay: ${detail.replaced_parts}` : 'Chưa thay thế'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high">
            <span className="font-label-sm text-[11px] text-outline block">Động cơ & Hộp số đã đại tu</span>
            <span className="font-semibold text-primary text-xs">
              {detail.engine_repaired || detail.transmission_repaired ? 'Đã từng can thiệp/sửa chữa' : 'Nguyên bản chưa bổ máy'}
            </span>
          </div>
        </div>
      </div>

      {/* Seller & Viewing Location Information */}
      <div className="space-y-2">
        <h3 className="font-label-md text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
          <span className="material-symbols-outlined text-secondary text-[18px]">person_pin_circle</span>
          <span>Người bán & Địa điểm xem xe thực tế</span>
        </h3>

        <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container-high flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center font-bold text-sm text-primary uppercase">
              {detail.seller.display_name.charAt(0)}
            </div>
            <div>
              <div className="font-semibold text-primary text-xs">{detail.seller.display_name}</div>
              <div className="text-[11px] text-outline">{detail.seller.email} • {detail.seller.phone || 'Chưa có SĐT'}</div>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] text-outline block">Địa chỉ xem xe:</span>
            <span className="font-semibold text-primary text-xs">
              {detail.location_address || `Tỉnh/Thành phố mã ${detail.province_code}`}
            </span>
          </div>
        </div>
      </div>

      {/* Description */}
      {detail.description && (
        <div className="space-y-2">
          <h3 className="font-label-md text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
            <span className="material-symbols-outlined text-secondary text-[18px]">description</span>
            <span>Mô tả chi tiết từ chủ xe</span>
          </h3>
          <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container-high text-xs text-on-surface whitespace-pre-line leading-relaxed">
            {detail.description}
          </div>
        </div>
      )}

      {/* Moderation Drawers (Reject & Takedown) */}
      <ListingModerationDrawers
        showRejectForm={showRejectForm}
        onCloseRejectForm={() => setShowRejectForm(false)}
        rejectReason={rejectReason}
        onRejectReasonChange={setRejectReason}
        showTakedownForm={showTakedownForm}
        onCloseTakedownForm={() => setShowTakedownForm(false)}
        takedownReason={takedownReason}
        onTakedownReasonChange={setTakedownReason}
        actionLoading={actionLoading}
        onReject={onReject}
        onTakedown={onTakedown}
      />
    </>
  );
}

