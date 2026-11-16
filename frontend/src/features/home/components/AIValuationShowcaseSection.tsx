import React from 'react';
import Link from 'next/link';

export default function AIValuationShowcaseSection() {
  return (
    <section className="w-full px-margin-mobile md:px-margin py-space-xl max-w-7xl mx-auto">
      <div className="bg-surface-container-lowest rounded-2xl p-space-lg sm:p-space-xl shadow-[0_16px_40px_rgba(25,25,25,0.05)]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-center">
          {/* Cột trái: Nội dung giá trị */}
          <div className="lg:col-span-6 space-y-space-md">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-fixed/30 text-secondary font-label-sm text-label-sm">
              <span className="material-symbols-outlined text-[16px]">psychology</span>
              <span className="uppercase tracking-widest font-semibold">Thuật Toán AI Phân Tích Độc Quyền</span>
            </div>

            <h2 className="font-headline-lg text-headline-lg text-primary tracking-tight font-medium leading-snug">
              Biết chính xác giá trị chiếc xe của bạn
            </h2>

            <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
              Ứng dụng công nghệ Machine Learning để phân tích dữ liệu thị trường và đưa ra mức giá xe tham khảo phù hợp
              theo thời gian thực.
            </p>

            {/* 3 Tiêu chí đột phá */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-md pt-space-xs">
              <div className="p-space-md rounded-xl bg-surface-container-low space-y-1">
                <div className="font-headline-md text-headline-md font-bold text-secondary">96%</div>
                <div className="font-label-md text-label-md text-primary font-semibold">Độ tin cậy định lượng</div>
                <div className="font-body-sm text-[11px] text-on-surface-variant">
                  Độ lệch sai số dưới 3.8% so với giá giao dịch thực
                </div>
              </div>

              <div className="p-space-md rounded-xl bg-surface-container-low space-y-1">
                <div className="font-headline-md text-headline-md font-bold text-primary">50.000+</div>
                <div className="font-label-md text-label-md text-primary font-semibold">Giao dịch thực tế</div>
                <div className="font-body-sm text-[11px] text-on-surface-variant">
                  Tập dữ liệu xe hạng sang liên tục cập nhật theo tuần
                </div>
              </div>

              <div className="p-space-md rounded-xl bg-surface-container-low space-y-1">
                <div className="font-headline-md text-headline-md font-bold text-primary">100%</div>
                <div className="font-label-md text-label-md text-primary font-semibold">Minh bạch tuyệt đối</div>
                <div className="font-body-sm text-[11px] text-on-surface-variant">
                  Không chênh lệch phí ảo, bảo vệ quyền lợi hai chiều
                </div>
              </div>
            </div>

            <div className="pt-space-sm flex flex-col sm:flex-row items-center gap-space-md">
              <Link
                href="/dinh-gia-ai"
                className="w-full sm:w-auto px-space-xl py-3 rounded-lg bg-primary hover:bg-inverse-surface text-on-primary font-label-lg text-label-lg flex items-center justify-center gap-space-xs transition-colors shadow-md"
              >
                <span className="material-symbols-outlined text-[20px]">calculate</span>
                <span>Khám phá định giá xe AI</span>
              </Link>
              <span className="font-body-sm text-body-sm text-on-surface-variant">Kết quả ngay trong 45 giây</span>
            </div>
          </div>

          {/* Cột phải: Widget Machine Learning trực quan */}
          <div className="lg:col-span-6">
            <div className="bg-surface-container p-space-lg rounded-xl relative overflow-hidden shadow-inner">
              {/* Decorative Accent line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-secondary-fixed via-secondary to-primary" />

              <div className="flex items-center justify-between pb-space-md">
                <div>
                  <span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest block">
                    Mô phỏng thẩm định AI
                  </span>
                  <h4 className="font-headline-sm text-headline-sm text-primary font-semibold">
                    Porsche Macan GTS • 2021
                  </h4>
                </div>
                <span className="px-2.5 py-1 rounded bg-surface-container-lowest text-on-surface font-label-sm text-label-sm shadow-sm">
                  Trực tiếp
                </span>
              </div>

              {/* Giá trị dự báo trọng tâm */}
              <div className="my-space-md p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex items-center justify-between">
                <div>
                  <span className="font-body-sm text-body-sm text-on-surface-variant block">
                    Khoảng giá giao dịch tối ưu:
                  </span>
                  <span className="font-headline-md text-headline-md text-primary font-bold">
                    3.920.000.000 <span className="text-secondary font-medium">~</span> 4.150.000.000{' '}
                    <span className="font-label-md text-label-md font-normal text-on-surface-variant">₫</span>
                  </span>
                </div>
                <div className="w-10 h-10 rounded-full bg-secondary-fixed/30 text-secondary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[22px]">trending_up</span>
                </div>
              </div>

              {/* Inline SVG Machine Learning Chart: Biến thiên khấu hao & Tỷ lệ thị trường */}
              <div className="space-y-space-xs pt-space-xs">
                <div className="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
                  <span>Dự báo khấu hao &amp; Xu hướng 3 năm (2023 - 2025)</span>
                  <span className="text-secondary font-medium">Độ biến động thấp (-4.2%/năm)</span>
                </div>
                <div className="w-full bg-surface-container-lowest p-space-md rounded-lg shadow-sm">
                  <svg className="w-full h-auto overflow-visible text-secondary" fill="none" viewBox="0 0 460 160">
                    <line stroke="#E3E2DF" strokeDasharray="3 3" strokeWidth="1" x1="20" x2="440" y1="20" y2="20" />
                    <line stroke="#E3E2DF" strokeDasharray="3 3" strokeWidth="1" x1="20" x2="440" y1="70" y2="70" />
                    <line stroke="#E3E2DF" strokeDasharray="3 3" strokeWidth="1" x1="20" x2="440" y1="120" y2="120" />

                    <defs>
                      <linearGradient id="aiGrad" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#725a37" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#725a37" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    <path d="M 30,35 Q 120,45 220,68 T 430,95 L 430,140 L 30,140 Z" fill="url(#aiGrad)" />
                    <path
                      d="M 30,35 Q 120,45 220,68 T 430,95"
                      stroke="#725a37"
                      strokeLinecap="round"
                      strokeWidth="3"
                    />

                    <circle cx="30" cy="35" fill="#1C1B1B" r="4.5" stroke="#FAF9F6" strokeWidth="2" />
                    <circle cx="220" cy="68" fill="#725a37" r="4.5" stroke="#FAF9F6" strokeWidth="2" />
                    <circle cx="430" cy="95" fill="#725a37" r="5" stroke="#FAF9F6" strokeWidth="2.5" />

                    <text fill="#747878" fontSize="11" textAnchor="middle" x="30" y="148">
                      2023
                    </text>
                    <text fill="#747878" fontSize="11" textAnchor="middle" x="220" y="148">
                      2024 (Hiện tại)
                    </text>
                    <text fill="#747878" fontSize="11" textAnchor="middle" x="430" y="148">
                      2025 (Dự báo)
                    </text>
                    <text fill="#1A1C1A" fontSize="11" fontWeight="600" textAnchor="middle" x="220" y="55">
                      4.020.000.000 ₫
                    </text>
                  </svg>
                </div>
              </div>

              {/* Parameters Grid */}
              <div className="mt-space-md grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded bg-surface-container-lowest">
                  <span className="block font-label-sm text-[10px] text-on-surface-variant uppercase">Odo thực</span>
                  <span className="font-label-md text-label-md text-primary font-semibold">31.200 km</span>
                </div>
                <div className="p-2 rounded bg-surface-container-lowest">
                  <span className="block font-label-sm text-[10px] text-on-surface-variant uppercase">
                    Tình trạng sơn
                  </span>
                  <span className="font-label-md text-label-md text-secondary font-semibold">98.5% Nguyên bản</span>
                </div>
                <div className="p-2 rounded bg-surface-container-lowest">
                  <span className="block font-label-sm text-[10px] text-on-surface-variant uppercase">Thanh khoản</span>
                  <span className="font-label-md text-label-md text-primary font-semibold">Rất cao (&lt;14 ngày)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
