'use client';

import React from 'react';
import Link from 'next/link';
import {
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  Car,
  Loader2,
  Star,
  Eye,
  Tag,
  Edit,
  Trash2,
} from 'lucide-react';
import { formatVND } from '@/lib/api';
import { ListingItem } from '@/types';
import { ListingFilterStatus } from '../types';

interface ListingManagementCardListProps {
  listings: ListingItem[];
  loading: boolean;
  actionLoadingId: string | null;
  onQuickEditPrice: (item: ListingItem) => void;
  onFullEdit: (id: string) => void;
  onPromote: (item: ListingItem) => void;
  onRelist: (id: string) => void;
  onSubmitReview: (id: string) => void;
  onToggleHide: (id: string) => void;
  onMarkSold: (id: string) => void;
  onDelete: (item: ListingItem) => void;
  filterStatus: ListingFilterStatus;
  searchQuery: string;
  onResetFilters: () => void;
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
}

export const ListingManagementCardList: React.FC<ListingManagementCardListProps> = ({
  listings,
  loading,
  actionLoadingId,
  onQuickEditPrice,
  onFullEdit,
  onPromote,
  onRelist,
  onSubmitReview,
  onToggleHide,
  onMarkSold,
  onDelete,
  filterStatus,
  searchQuery,
  onResetFilters,
  page,
  totalItems,
  totalPages,
  onPageChange,
}) => {
  if (loading) {
    return (
      <div className="py-24 text-center">
        <Loader2 className="w-8 h-8 text-[#b89b72] animate-spin mx-auto mb-3" />
        <p className="text-sm font-semibold text-[#444748]">Đang tải danh sách tin đăng từ hệ thống...</p>
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="py-20 text-center bg-white rounded-2xl border border-[#eae8e3] p-8 space-y-4 shadow-sm">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-[#faf9f6] border border-[#eae8e3] flex items-center justify-center text-[#777777]">
          <Car className="w-8 h-8 text-[#b89b72]" />
        </div>
        <h3 className="text-base font-semibold text-[#1a1c1a] font-display">
          {searchQuery || filterStatus !== 'ALL'
            ? 'Không tìm thấy tin đăng phù hợp'
            : 'Chưa có bài đăng bán xe nào'}
        </h3>
        <p className="text-xs text-[#777777] max-w-sm mx-auto">
          {searchQuery || filterStatus !== 'ALL'
            ? 'Thử thay đổi từ khóa tìm kiếm hoặc chọn bộ lọc trạng thái khác để xem tin đăng.'
            : 'Bạn chưa tạo bài đăng bán xe nào trên sàn AuraAuto. Hãy bắt đầu ngay để tiếp cận hàng triệu người mua!'}
        </p>
        {searchQuery || filterStatus !== 'ALL' ? (
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-block px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#191919] hover:bg-black transition-colors cursor-pointer"
          >
            Đặt lại bộ lọc
          </button>
        ) : (
          <Link
            href="/dang-tin"
            className="inline-block px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#191919] hover:bg-black transition-colors cursor-pointer"
          >
            Đăng tin bán xe ngay
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {listings.map((item) => (
        <div
          key={item.id}
          className="bg-white rounded-xl p-5 sm:p-6 border border-[#eae8e3] shadow-[0_8px_30px_rgba(25,25,25,0.03)] hover:border-[#b89b72] transition space-y-4"
        >
          {/* Card Top Bar */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between pb-3 border-b border-[#eae8e3] gap-3">
            <div className="flex items-start space-x-3.5 min-w-0 flex-1">
              <div className="w-20 h-16 sm:w-24 sm:h-20 rounded-lg overflow-hidden bg-[#faf9f6] border border-[#eae8e3] shrink-0 relative">
                {item.primary_image_url ? (
                  <img
                    src={item.primary_image_url}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#777777]">
                    <Car className="w-6 h-6 text-[#b89b72]" />
                  </div>
                )}
                {item.is_featured && (
                  <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-[#b89b72] text-white text-[9px] font-bold uppercase tracking-wider shadow-xs">
                    VIP
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold font-display text-[#1a1c1a] text-base sm:text-lg leading-snug line-clamp-1">
                    {item.title}
                  </h3>
                </div>

                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[#777777] mt-1">
                  <span>{item.manufacture_year}</span>
                  <span>•</span>
                  <span>{item.odometer_km?.toLocaleString('vi-VN')} km</span>
                  <span>•</span>
                  <span>{item.transmission || 'Tự động'}</span>
                  <span>•</span>
                  <span>{item.fuel_type || 'Xăng'}</span>
                  <span>•</span>
                  <span>{item.province_name || item.location_address || 'Toàn quốc'}</span>
                </div>

                <div className="text-[11px] text-[#9ca3af] font-mono mt-1 flex items-center gap-2">
                  <span>Mã tin: #{item.id.slice(0, 8).toUpperCase()}</span>
                  <span>•</span>
                  <span>Ngày đăng: {new Date(item.created_at).toLocaleDateString('vi-VN')}</span>
                </div>
              </div>
            </div>

            {/* Status Badges */}
            <div className="flex items-center gap-1.5 shrink-0 self-start">
              {item.status === 'PUBLISHED' && (
                <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold bg-[#fcdbad]/60 text-[#775f3a] border border-[#b89b72]/40">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-[#725a37]" />
                  Đang hiển thị
                </span>
              )}
              {item.status === 'PENDING_REVIEW' && (
                <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold bg-[#f4f3f0] text-[#777777] border border-[#eae8e3]">
                  <Clock className="w-3.5 h-3.5 mr-1 text-[#858383]" />
                  Chờ duyệt
                </span>
              )}
              {item.status === 'REJECTED' && (
                <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold bg-[#ffdad6]/40 text-[#93000a] border border-[#ffdad6]">
                  <XCircle className="w-3.5 h-3.5 mr-1 text-[#ba1a1a]" />
                  Bị từ chối
                </span>
              )}
              {item.status === 'SOLD' && (
                <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold bg-[#191919] text-white border border-[#191919]">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-[#b89b72]" />
                  Đã giao dịch
                </span>
              )}
              {item.status === 'HIDDEN' && (
                <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold bg-[#f4f3f0] text-[#777777] border border-[#eae8e3]">
                  Tạm ẩn
                </span>
              )}
              {item.status === 'DRAFT' && (
                <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold bg-[#f4f3f0] text-[#777777] border border-[#eae8e3]">
                  Bản nháp
                </span>
              )}
            </div>
          </div>

          {/* Alert Section if Rejection reason or pending revision */}
          {item.rejection_reason && (
            <div className="p-3 rounded-lg bg-[#fff1f2] border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
              <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <strong className="block text-rose-900 mb-0.5">Lý do từ chối kiểm duyệt:</strong>
                <span>{item.rejection_reason}</span>
              </div>
            </div>
          )}

          {item.has_pending_revision && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Bản cập nhật #{item.pending_revision_no || 1} đang chờ Admin phê duyệt</span>
            </div>
          )}

          {/* Stats Grid - 3 columns styled like lich-hen */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-[#444748]">
            <div className="flex items-center space-x-2">
              <Eye className="w-4 h-4 text-[#b89b72]" />
              <div>
                <span className="text-[#777777] block font-medium">Lượt tương tác:</span>
                <strong className="text-[#1a1c1a] font-display">
                  {(item.views_count || 0).toLocaleString()} lượt xem • {(item.favorites_count || 0).toLocaleString()} lưu tin
                </strong>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-[#b89b72]" />
              <div>
                <span className="text-[#777777] block font-medium">Khu vực bán xe:</span>
                <strong className="text-[#1a1c1a] truncate block max-w-[220px]">
                  {item.province_name || item.location_address || 'Toàn quốc'}
                </strong>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Star className="w-4 h-4 text-[#b89b72]" />
              <div>
                <span className="text-[#777777] block font-medium">Gói tin đăng:</span>
                <strong className="text-[#1a1c1a]">
                  {item.is_featured
                    ? `VIP đến ${new Date(item.featured_until || '').toLocaleDateString('vi-VN')}`
                    : 'Tin thường tiêu chuẩn'}
                </strong>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-[#eae8e3]/80">
            <div>
              <span className="text-[11px] text-[#777777] uppercase tracking-[0.08em] font-medium block">
                Giá niêm yết
              </span>
              <span className="text-lg sm:text-xl font-bold font-display text-[#191919]">
                {formatVND(item.price_vnd)}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {/* Xem trên sàn */}
              {item.status === 'PUBLISHED' && (
                <Link
                  href={`/xe/${item.id}`}
                  target="_blank"
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#eae8e3] text-[#1a1c1a] hover:bg-[#faf9f6] transition flex items-center gap-1 cursor-pointer"
                  title="Xem bài đăng thực tế trên sàn AuraAuto"
                >
                  <Eye className="w-3.5 h-3.5 text-[#777777]" />
                  <span>Xem tin</span>
                </Link>
              )}

              {/* Đổi giá nhanh */}
              <button
                type="button"
                onClick={() => onQuickEditPrice(item)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#eae8e3] text-[#1a1c1a] hover:bg-[#faf9f6] transition flex items-center gap-1 cursor-pointer"
                title="Chỉnh sửa nhanh giá niêm yết"
              >
                <Tag className="w-3.5 h-3.5 text-[#777777]" />
                <span>Đổi giá</span>
              </button>

              {/* Chỉnh sửa tin */}
              <button
                type="button"
                onClick={() => onFullEdit(item.id)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#eae8e3] text-[#1a1c1a] hover:bg-[#faf9f6] transition flex items-center gap-1 cursor-pointer"
                title="Chỉnh sửa thông số kỹ thuật, hình ảnh xe"
              >
                <Edit className="w-3.5 h-3.5 text-[#777777]" />
                <span>Sửa tin</span>
              </button>

              {/* Đẩy tin VIP */}
              {item.status === 'PUBLISHED' && (
                <button
                  type="button"
                  onClick={() => onPromote(item)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#b89b72] hover:bg-[#a3865e] text-white transition shadow-sm flex items-center gap-1 cursor-pointer"
                  title="Đẩy tin VIP lên đầu trang chủ và danh mục tìm kiếm"
                >
                  <Star className="w-3.5 h-3.5" />
                  <span>Đẩy tin VIP</span>
                </button>
              )}

              {/* Gửi duyệt */}
              {(item.status === 'DRAFT' || item.status === 'REJECTED') && (
                <button
                  type="button"
                  onClick={() => onSubmitReview(item.id)}
                  disabled={actionLoadingId === item.id}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#191919] hover:bg-black text-white transition shadow-sm flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{actionLoadingId === item.id ? 'Đang gửi...' : 'Gửi duyệt'}</span>
                </button>
              )}

              {/* Ẩn / Hiện tin */}
              {item.status === 'PUBLISHED' && (
                <button
                  type="button"
                  onClick={() => onToggleHide(item.id)}
                  disabled={actionLoadingId === item.id}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#eae8e3] text-[#777777] hover:text-[#1a1c1a] hover:bg-[#faf9f6] transition cursor-pointer disabled:opacity-50"
                >
                  Ẩn tin
                </button>
              )}
              {item.status === 'HIDDEN' && (
                <button
                  type="button"
                  onClick={() => onToggleHide(item.id)}
                  disabled={actionLoadingId === item.id}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#191919] hover:bg-black text-white transition cursor-pointer disabled:opacity-50"
                >
                  Hiện lại tin
                </button>
              )}

              {/* Đã bán xe */}
              {item.status !== 'SOLD' && item.status !== 'DRAFT' && (
                <button
                  type="button"
                  onClick={() => onMarkSold(item.id)}
                  disabled={actionLoadingId === item.id}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-emerald-300 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  title="Đánh dấu xe đã bán thành công"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Đã bán xe</span>
                </button>
              )}

              {/* Đăng lại (khi đã bán) */}
              {item.status === 'SOLD' && (
                <button
                  type="button"
                  onClick={() => onRelist(item.id)}
                  disabled={actionLoadingId === item.id}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#191919] hover:bg-black text-white transition cursor-pointer disabled:opacity-50"
                >
                  Đăng bán lại
                </button>
              )}

              {/* Xóa tin */}
              <button
                type="button"
                onClick={() => onDelete(item)}
                disabled={actionLoadingId === item.id}
                className="p-1.5 rounded-lg text-[#777777] hover:text-[#ba1a1a] hover:bg-rose-50 transition cursor-pointer disabled:opacity-50"
                title="Xóa vĩnh viễn bài đăng xe"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#eae8e3]">
          <div className="text-xs text-[#777777]">
            Hiển thị trang <strong>{page}</strong> / <strong>{totalPages}</strong> (Tổng cộng {totalItems} tin)
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1 || loading}
              className="px-3.5 py-1.5 rounded-lg border border-[#eae8e3] text-xs font-semibold text-[#1a1c1a] bg-white hover:bg-[#faf9f6] transition disabled:opacity-40 cursor-pointer shadow-2xs"
            >
              Trang trước
            </button>
            <button
              type="button"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages || loading}
              className="px-3.5 py-1.5 rounded-lg border border-[#eae8e3] text-xs font-semibold text-[#1a1c1a] bg-white hover:bg-[#faf9f6] transition disabled:opacity-40 cursor-pointer shadow-2xs"
            >
              Trang sau
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
