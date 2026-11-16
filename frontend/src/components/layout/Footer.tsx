'use client';

import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="w-full bg-primary-container text-on-surface-variant mt-auto">
      <div className="w-full px-margin-mobile lg:px-margin py-space-xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-gutter">
        {/* Brand Concierge Info */}
        <div className="lg:col-span-2 flex flex-col justify-between pr-0 lg:pr-gutter space-y-space-lg">
          <div className="space-y-space-md">
            <div className="flex items-center gap-space-sm">
              <span className="font-headline-md text-headline-md text-surface-bright font-semibold tracking-tight">
                AuraAuto
              </span>
              <span className="font-label-sm text-label-sm text-secondary-fixed-dim uppercase tracking-wider px-space-xs py-0.5 rounded bg-surface/10">
                Atelier
              </span>
            </div>
            <p className="font-body-md text-body-md text-surface-container-highest max-w-sm leading-relaxed">
              Trải nghiệm mua bán ô tô cao cấp, minh bạch và thông minh. Tiêu chuẩn thẩm định 200 điểm độc quyền từ chuyên gia và hệ thống AI Automotive Intelligence.
            </p>
          </div>

          <div className="pt-space-md space-y-space-xs">
            <div className="font-label-sm text-label-sm text-secondary-fixed-dim uppercase tracking-widest font-semibold">
              Hotline Concierge VIP 24/7
            </div>
            <div className="font-headline-sm text-headline-sm text-surface-bright font-bold">
              1800 8899 (Phím 1)
            </div>
            <div className="font-body-sm text-body-sm text-surface-variant">
              concierge@auraauto.vn • Tầng 38 Landmark 81, TP. Hồ Chí Minh
            </div>
          </div>
        </div>

        {/* Khám phá */}
        <div className="space-y-space-md">
          <h4 className="font-label-lg text-label-lg text-surface-bright uppercase tracking-wider font-semibold">
            Khám phá
          </h4>
          <ul className="space-y-space-sm">
            <li className="font-body-sm text-body-sm">
              <Link className="text-surface-variant hover:text-surface-bright transition-colors" href="/xe">
                Bộ sưu tập Grand Tourer
              </Link>
            </li>
            <li className="font-body-sm text-body-sm">
              <Link className="text-surface-variant hover:text-surface-bright transition-colors" href="/xe">
                Dòng xe Flagship Sedan
              </Link>
            </li>
            <li className="font-body-sm text-body-sm">
              <Link className="text-surface-variant hover:text-surface-bright transition-colors" href="/xe">
                SUV Hạng sang đặc quyền
              </Link>
            </li>
            <li className="font-body-sm text-body-sm">
              <Link className="text-surface-variant hover:text-surface-bright transition-colors" href="/xe">
                Xe thuần điện Electric Hyper
              </Link>
            </li>
            <li className="font-body-sm text-body-sm">
              <Link className="text-surface-variant hover:text-surface-bright transition-colors" href="/xe">
                So sánh thông số kỹ thuật
              </Link>
            </li>
            <li className="font-body-sm text-body-sm">
              <Link className="text-secondary-fixed-dim hover:text-surface-bright transition-colors font-medium" href="/tin-tuc">
                Tin tức & Thị trường xe
              </Link>
            </li>
          </ul>
        </div>

        {/* Dịch vụ & AI */}
        <div className="space-y-space-md">
          <h4 className="font-label-lg text-label-lg text-surface-bright uppercase tracking-wider font-semibold">
            Dịch vụ & AI
          </h4>
          <ul className="space-y-space-sm">
            <li className="font-body-sm text-body-sm">
              <Link className="text-surface-variant hover:text-surface-bright transition-colors" href="/dinh-gia-ai">
                Định giá xe AI Real-time
              </Link>
            </li>
            <li className="font-body-sm text-body-sm">
              <Link className="text-surface-variant hover:text-surface-bright transition-colors" href="/dinh-gia-ai">
                Chứng nhận Kiểm định 200 điểm
              </Link>
            </li>
            <li className="font-body-sm text-body-sm">
              <Link className="text-surface-variant hover:text-surface-bright transition-colors" href="/dang-tin">
                Ký gửi xe bảo mật cao cấp
              </Link>
            </li>
            <li className="font-body-sm text-body-sm">
              <Link className="text-surface-variant hover:text-surface-bright transition-colors" href="/dinh-gia-ai">
                Tài chính & Bảo hiểm VIP
              </Link>
            </li>
            <li className="font-body-sm text-body-sm">
              <Link className="text-surface-variant hover:text-surface-bright transition-colors" href="/lich-hen">
                Đặt lịch lái thử tận nơi
              </Link>
            </li>
            <li className="font-body-sm text-body-sm">
              <Link className="text-secondary-fixed-dim hover:text-surface-bright transition-colors font-medium" href="/xe-da-luu">
                Danh sách xe đã lưu
              </Link>
            </li>
          </ul>
        </div>

        {/* Trung tâm Hỗ trợ & Kiểm định */}
        <div className="space-y-space-md">
          <h4 className="font-label-lg text-label-lg text-surface-bright uppercase tracking-wider font-semibold">
            Trung tâm Hỗ trợ
          </h4>
          <div className="space-y-space-md">
            <div className="space-y-space-xs">
              <div className="font-label-md text-label-md text-surface-bright font-medium">Hà Nội</div>
              <p className="font-body-sm text-body-sm text-surface-variant">
                Tòa nhà Capital Place, 29 Liễu Giai, Ba Đình (Điểm kiểm định & Công chứng)
              </p>
            </div>
            <div className="space-y-space-xs">
              <div className="font-label-md text-label-md text-surface-bright font-medium">TP. Hồ Chí Minh</div>
              <p className="font-body-sm text-body-sm text-surface-variant">
                Aura Center, 88 Song Hành, An Phú, TP. Thủ Đức (Trạm kiểm định độc lập)
              </p>
            </div>
            <div className="space-y-space-xs">
              <div className="font-label-md text-label-md text-surface-bright font-medium">Đà Nẵng</div>
              <p className="font-body-sm text-body-sm text-surface-variant">
                Bach Dang Complex, 50 Bạch Đằng, Hải Châu (Hỗ trợ hồ sơ sang tên C2C)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-footer Bar */}
      <div className="w-full px-margin-mobile lg:px-margin py-space-md bg-tertiary-container flex flex-col sm:flex-row items-center justify-between gap-space-sm border-t border-surface-container-high/10">
        <div className="font-body-sm text-body-sm text-surface-variant text-center sm:text-left">
          © 2026 AuraAuto Vietnam Joint Stock Company. Bản quyền đã được bảo hộ.
        </div>
        <div className="flex items-center gap-space-lg text-center">
          <Link className="font-body-sm text-body-sm text-surface-variant hover:text-surface-bright transition-colors" href="#">
            Điều khoản dịch vụ
          </Link>
          <Link className="font-body-sm text-body-sm text-surface-variant hover:text-surface-bright transition-colors" href="#">
            Chính sách bảo mật
          </Link>
          <Link className="font-body-sm text-body-sm text-surface-variant hover:text-surface-bright transition-colors" href="#">
            Quy trình thẩm định
          </Link>
        </div>
      </div>
    </footer>
  );
}
