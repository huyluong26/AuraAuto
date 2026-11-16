'use client';

import React from 'react';

interface CarInspectionCardProps {
  onDownloadReport?: () => void;
}

export function CarInspectionCard({}: CarInspectionCardProps) {
  const COMMITMENTS = [
    {
      icon: 'build_circle',
      title: 'Quyền Kiểm Tra Tại Hãng Hoặc Gara Tùy Chọn',
      badge: 'TOÀN QUYỀN',
      desc: 'Người mua được quyền cùng chủ xe mang phương tiện đến kiểm tra tại bất kỳ đại lý chính hãng hoặc gara độc lập nào trước khi ký giao dịch.',
    },
    {
      icon: 'history_edu',
      title: 'Minh Bạch Pháp Lý & Hỗ Trợ Sang Tên',
      badge: 'CHUẨN PHÁP LÝ',
      desc: 'Hồ sơ người bán được xác thực danh tính và giấy tờ xe. Hỗ trợ toàn bộ thủ tục công chứng, rút hồ sơ gốc và sang tên đổi biển số trong 24h.',
    },
    {
      icon: 'lock',
      title: 'Bảo Vệ Đặt Cọc & Hoàn Tiền 100%',
      badge: 'HOÀN CỌC 100%',
      desc: 'Mọi giao dịch đặt cọc có biên nhận rõ ràng. Cam kết hỗ trợ hoàn trả 100% tiền đặt cọc nếu phát hiện xe bị đâm đụng, thủy kích hoặc sai lệch mô tả.',
    },
    {
      icon: 'support_agent',
      title: 'Hỗ Trợ Giao Dịch & Đồng Hành 24/7',
      badge: 'ĐỒNG HÀNH 24/7',
      desc: 'Chuyên viên AuraAuto luôn sẵn sàng hỗ trợ định giá, tư vấn hợp đồng mua bán và giải đáp thắc mắc của hai bên xuyên suốt quá trình giao dịch.',
    },
  ];

  return (
    <div className="p-5 rounded-xl bg-surface-container-lowest shadow-xs border border-surface-container">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[20px]">
              verified_user
            </span>
            <h3 className="text-base font-bold font-display text-primary">
              Cam Kết Nền Tảng & Bảo Vệ Khách Hàng AuraAuto
            </h3>
          </div>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Bộ quy chuẩn an toàn và chính sách bảo vệ quyền lợi minh bạch cho người mua ô tô
          </p>
        </div>

        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary-fixed/30 text-on-secondary-fixed-variant text-xs font-semibold self-start sm:self-auto">
          <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
          <span>AuraAuto Protection</span>
        </span>
      </div>

      {/* 4 Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {COMMITMENTS.map((item, idx) => (
          <div
            key={idx}
            className="p-3 rounded-lg bg-surface-container-low border border-surface-container flex flex-col gap-1.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                <span className="material-symbols-outlined text-secondary text-[16px]">
                  {item.icon}
                </span>
                <span>{item.title}</span>
              </span>
              <span className="px-1.5 py-0.5 rounded bg-surface-container-high text-secondary text-[10px] font-bold">
                {item.badge}
              </span>
            </div>
            <p className="text-[11px] text-on-surface-variant leading-relaxed">
              {item.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Reassurance Footer Banner */}
      <div className="mt-3 pt-3 border-t border-surface-container flex flex-wrap items-center justify-between gap-2 text-xs text-on-surface-variant">
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-secondary text-[16px]">check_circle</span>
          <span>Bảo vệ quyền lợi tối đa cho người mua và người bán trên toàn quốc</span>
        </div>
        <div className="text-[11px] text-secondary font-medium">
          Hotline hỗ trợ an toàn: 1900 8888 (Miễn phí)
        </div>
      </div>
    </div>
  );
}

// Export alias for semantic naming
export const PlatformCommitmentCard = CarInspectionCard;
