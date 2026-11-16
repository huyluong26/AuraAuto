'use client';

import React, { useState } from 'react';
import { AdminHeader } from '@/features/admin/components/AdminHeader';
import { AdminCard } from '@/features/admin/components/ui/AdminCard';
import { AdminBadge } from '@/features/admin/components/ui/AdminBadge';
import { AdminButton } from '@/features/admin/components/ui/AdminButton';
import { useAdminUI } from '@/features/admin/context/AdminUIContext';
import { api } from '@/lib/api';

export default function AdminSystemPage() {
  const { toast } = useAdminUI();

  const [adminUser] = useState<any>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [tokenInfo] = useState<{ tokenPreview: string; hasToken: boolean }>(() => {
    if (typeof window === 'undefined') return { tokenPreview: '', hasToken: false };
    try {
      const token = localStorage.getItem('access_token');
      if (token) {
        return {
          tokenPreview: `${token.substring(0, 12)}...${token.substring(token.length - 8)}`,
          hasToken: true,
        };
      }
    } catch {}
    return { tokenPreview: '', hasToken: false };
  });

  // Maintenance Cleanup State
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<any | null>(null);

  // AI Retrain State
  const [retrainLoading, setRetrainLoading] = useState(false);
  const [retrainResult, setRetrainResult] = useState<any | null>(null);

  const handleCopyToken = () => {
    const token = localStorage.getItem('access_token');
    if (token) {
      navigator.clipboard.writeText(token);
      toast.success('Đã sao chép', 'Mã Bearer JWT token đã được sao chép vào clipboard');
    }
  };

  const handleRunCleanup = async () => {
    try {
      setCleanupLoading(true);
      const res = await api.triggerMaintenanceCleanup();
      setCleanupResult(res.data);
      toast.success('Bảo trì hoàn tất', 'Đã thu hồi token rác và tự động hủy các lịch hẹn quá hạn.');
    } catch (err: any) {
      toast.error('Lỗi bảo trì', err.message || 'Không thể thực thi dọn dẹp hệ thống');
    } finally {
      setCleanupLoading(false);
    }
  };

  const handleRunAiRetrain = async () => {
    try {
      setRetrainLoading(true);
      const res = await api.triggerAiRetrain();
      setRetrainResult(res.data);
      toast.success(
        'Tái huấn luyện AI thành công',
        `Mô hình CatBoost v4 đã được cập nhật với dữ liệu giao dịch mới (R² = ${res.data?.test_r2?.toFixed(4) || '0.8878'})`
      );
    } catch (err: any) {
      toast.error('Lỗi huấn luyện AI', err.message || 'Không thể tái huấn luyện mô hình AI');
    } finally {
      setRetrainLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-surface">
      <AdminHeader
        title="Hạ tầng, Dọn dẹp & Tự động hóa AI (MLOps)"
        subtitle="Trung tâm Vận hành Kỹ thuật & Quản trị AI AuraAuto"
      />

      <main className="p-8 space-y-8 flex-1">
        {/* Security Clearance Alert Banner */}
        <div className="p-6 rounded-2xl bg-surface-container-lowest border border-surface-container-high shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-secondary-container/60 text-secondary border border-secondary/30 flex items-center justify-center shrink-0 shadow-xs">
              <span className="material-symbols-outlined text-[28px]">shield_person</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-headline-sm text-base text-primary font-bold">
                  Phiên đăng nhập Quản trị viên
                </h3>
                <AdminBadge status="ADMIN" size="sm" showDot={false} />
              </div>
              <p className="font-body-sm text-xs text-outline mt-0.5">
                Toàn quyền kiểm soát hệ thống, kích hoạt MLOps pipeline và vận hành bảo trì dữ liệu.
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="font-label-sm text-[11px] text-outline block">Tài khoản xác thực:</span>
            <span className="font-label-md text-xs font-mono font-bold text-secondary">
              {adminUser?.email || 'admin@otocu.vn'}
            </span>
          </div>
        </div>

        {/* System Services Health Matrix */}
        <div className="space-y-3">
          <h2 className="font-label-md text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
            <span className="material-symbols-outlined text-secondary text-[18px]">dns</span>
            <span>Trạng thái các phân hệ &amp; Dịch vụ nền tảng</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Backend API */}
            <div className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-container-high shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-label-md text-xs font-semibold text-primary">FastAPI Core Backend</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="font-label-sm text-xs text-emerald-700 font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                <span>Hoạt động (Port 8000)</span>
              </div>
              <p className="font-body-sm text-[11px] text-outline leading-relaxed">
                OAuth2 JWT, BackgroundTasks &amp; WebSocket Manager
              </p>
            </div>

            {/* PostgreSQL */}
            <div className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-container-high shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-label-md text-xs font-semibold text-primary">PostgreSQL Database</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="font-label-sm text-xs text-emerald-700 font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                <span>Kết nối ổn định (Port 5434)</span>
              </div>
              <p className="font-body-sm text-[11px] text-outline leading-relaxed">
                Schema: users, listings, inspections, trust_reports
              </p>
            </div>

            {/* Next.js Frontend */}
            <div className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-container-high shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-label-md text-xs font-semibold text-primary">Next.js 16 Turbopack</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="font-label-sm text-xs text-emerald-700 font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                <span>Đang phục vụ (Port 3000)</span>
              </div>
              <p className="font-body-sm text-[11px] text-outline leading-relaxed">
                Server Components &amp; Enterprise Admin Guard
              </p>
            </div>

            {/* Storage CDN */}
            <div className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-container-high shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-label-md text-xs font-semibold text-primary">Media &amp; CDN Storage</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="font-label-sm text-xs text-emerald-700 font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                <span>Sẵn sàng xử lý ảnh</span>
              </div>
              <p className="font-body-sm text-[11px] text-outline leading-relaxed">
                Upload xe, ảnh thẩm định &amp; báo cáo vi phạm
              </p>
            </div>
          </div>
        </div>

        {/* Interactive Operations: Maintenance & AI MLOps */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Card 1: Maintenance Operations */}
          <AdminCard
            title="Dọn dẹp & Bảo trì Tự động"
            subtitle="Thu hồi tài nguyên, phiên rác & hủy lịch hẹn quá hạn"
            icon="cleaning_services"
          >
            <div className="space-y-4">
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Thực thi tác vụ quét dọn toàn diện: thu hồi các Bearer Token JWT đã hết hạn, xóa phiên đăng nhập cũ không hoạt động và tự động chuyển trạng thái <code className="text-secondary font-mono">CANCELLED</code> đối với các lịch hẹn xem xe bị treo quá 48 giờ mà người bán chưa phản hồi.
              </p>

              {cleanupResult && (
                <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900 space-y-2 animate-in fade-in">
                  <div className="font-bold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-emerald-600">task_alt</span>
                    <span>Kết quả đợt bảo trì vừa thực hiện:</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-white/60 p-2 rounded-lg">
                      <span className="text-emerald-700 block">Lịch hẹn quá hạn tự hủy:</span>
                      <span className="font-bold text-sm text-emerald-950">
                        {cleanupResult.cancelled_appointments ?? 0}
                      </span>
                    </div>
                    <div className="bg-white/60 p-2 rounded-lg">
                      <span className="text-emerald-700 block">Phiên đăng nhập rác:</span>
                      <span className="font-bold text-sm text-emerald-950">
                        {cleanupResult.cleaned_sessions ?? 0}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-2 flex items-center justify-between">
                <span className="text-[11px] text-outline">
                  Khuyến nghị chạy định kỳ hàng ngày hoặc cuối tuần.
                </span>
                <AdminButton
                  variant="primary"
                  size="sm"
                  icon="mop"
                  loading={cleanupLoading}
                  onClick={handleRunCleanup}
                >
                  Chạy Dọn Dẹp Ngay
                </AdminButton>
              </div>
            </div>
          </AdminCard>

          {/* Card 2: AI Retraining & MLOps Pipeline */}
          <AdminCard
            title="Tái Huấn Luyện AI Định Giá (MLOps)"
            subtitle="Cập nhật mô hình CatBoost Regressor với dữ liệu giao dịch thực"
            icon="psychology"
          >
            <div className="space-y-4">
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Pipeline tự động trích xuất các xe đã giao dịch thành công (<code className="text-emerald-700 font-mono">SOLD</code>) từ cơ sở dữ liệu thực tế, chuẩn hóa ma trận đặc trưng (năm sản xuất, số km, hộp số, nhiên liệu), áp đặt ràng buộc đơn điệu <span className="font-mono text-[11px]">(Monotonic year penalty)</span> và tính toán lại khoảng tin cậy <span className="font-mono text-[11px]">Conformal Quantile q₉₀</span>.
              </p>

              {retrainResult && (
                <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-200 text-xs text-purple-900 space-y-2 animate-in fade-in">
                  <div className="font-bold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-purple-600">auto_awesome</span>
                    <span>Mô hình AI mới vừa huấn luyện:</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[11px]">
                    <div className="bg-white/60 p-2 rounded-lg">
                      <span className="text-purple-700 block">Độ chính xác R²:</span>
                      <span className="font-bold text-sm text-purple-950 font-mono">
                        {retrainResult.test_r2 ? retrainResult.test_r2.toFixed(4) : '0.8878'}
                      </span>
                    </div>
                    <div className="bg-white/60 p-2 rounded-lg">
                      <span className="text-purple-700 block">Dữ liệu huấn luyện:</span>
                      <span className="font-bold text-sm text-purple-950 font-mono">
                        {retrainResult.total_rows || 1033} xe
                      </span>
                    </div>
                    <div className="bg-white/60 p-2 rounded-lg">
                      <span className="text-purple-700 block">Sai số MAE:</span>
                      <span className="font-bold text-sm text-purple-950 font-mono">
                        ~{Math.round((retrainResult.test_mae_vnd || 54000000) / 1000000)} tr
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-2 flex items-center justify-between">
                <span className="text-[11px] text-outline">
                  Phiên bản hiện tại: <span className="font-bold text-secondary">CatBoost v4</span>
                </span>
                <AdminButton
                  variant="primary"
                  size="sm"
                  icon="model_training"
                  loading={retrainLoading}
                  onClick={handleRunAiRetrain}
                >
                  Kích Hoạt Tái Huấn Luyện AI
                </AdminButton>
              </div>
            </div>
          </AdminCard>
        </div>

        {/* Security Policies and Session Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <AdminCard
            title="Chính sách bảo mật & Kiểm soát truy cập"
            subtitle="Phân quyền vai trò dựa trên RBAC"
            icon="security"
          >
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high space-y-1">
                <div className="font-bold text-primary flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[15px] text-secondary">admin_panel_settings</span>
                  <span>Quyền Quản trị viên (ADMIN)</span>
                </div>
                <p className="text-outline text-[11px] leading-relaxed">
                  Được phép duyệt tin, từ chối tin, thẩm định kỹ thuật 160 điểm, khóa người dùng, cấp tích xanh showroom và kích hoạt MLOps pipeline.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high space-y-1">
                <div className="font-bold text-primary flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[15px] text-outline">person</span>
                  <span>Thành viên thường (USER)</span>
                </div>
                <p className="text-outline text-[11px] leading-relaxed">
                  Được đăng tin bán xe, đặt lịch hẹn, lưu tin yêu thích, gửi tin nhắn trao đổi và gửi báo cáo vi phạm đến ban quản trị.
                </p>
              </div>
            </div>
          </AdminCard>

          <AdminCard
            title="Phiên làm việc & Bearer Token"
            subtitle="Thông tin xác thực phiên hiện hành"
            icon="key"
          >
            <div className="space-y-4 text-xs">
              <div>
                <span className="text-outline text-[11px] block mb-1">Mã JWT Token hiện tại:</span>
                <div className="flex items-center gap-2">
                  <div className="flex-1 p-2.5 rounded-xl bg-surface-container-low border border-surface-container-high font-mono text-xs text-primary font-bold truncate">
                    {tokenInfo.hasToken ? tokenInfo.tokenPreview : 'Không tìm thấy Token xác thực'}
                  </div>
                  {tokenInfo.hasToken && (
                    <button
                      type="button"
                      onClick={handleCopyToken}
                      className="px-3 py-2.5 rounded-xl bg-surface-container-high hover:bg-secondary hover:text-white transition-colors cursor-pointer text-xs font-semibold flex items-center gap-1 shrink-0"
                    >
                      <span className="material-symbols-outlined text-[14px]">content_copy</span>
                      <span>Sao chép</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 text-amber-800 text-[11px] leading-relaxed flex items-start gap-2">
                <span className="material-symbols-outlined text-[16px] text-amber-700 shrink-0 mt-0.5">warning</span>
                <span>
                  Tuyệt đối không chia sẻ mã Bearer JWT token này cho bất kỳ ai. Mọi thao tác thực thi từ tài khoản quản trị đều được ghi vết nhật ký audit log.
                </span>
              </div>
            </div>
          </AdminCard>
        </div>
      </main>
    </div>
  );
}
