import React from 'react';
import { Navbar, Footer } from '@/components/layout';
import { AICarValuationCard } from '@/features/valuation';
import { Sparkles, HelpCircle, CheckCircle2, ShieldCheck, Car, Tag, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function AIDinhGiaPage() {
  return (
    <div className="min-h-screen bg-[#faf9f6] flex flex-col font-sans text-[#1a1c1a]">
      <Navbar />

      <main className="flex-1 pt-28 sm:pt-32 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-12">
        {/* Simple & Friendly Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3.5">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#f4f3f0] text-[#725a37] text-xs font-semibold uppercase tracking-[0.08em] border border-[#e3e2df]">
            <Sparkles className="w-3.5 h-3.5 text-[#b89b72]" />
            <span>Định giá xe ô tô trực tuyến</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-display text-[#1a1c1a] tracking-tight">
            Định Giá Xe Ô Tô Nhanh Chóng &amp; Miễn Phí
          </h1>
          <p className="text-sm sm:text-base text-[#666] leading-relaxed">
            Nhập thông tin xe của bạn để nhận ngay mức giá tham khảo sát với thị trường thực tế chỉ trong vài giây.
          </p>
        </div>

        {/* Valuation Card Tool */}
        <div className="w-full">
          <AICarValuationCard />
        </div>

        {/* 3 Simple Steps for Car Owners */}
        <div className="max-w-4xl mx-auto space-y-6 pt-4">
          <div className="text-center space-y-1">
            <h2 className="text-xl sm:text-2xl font-bold font-display text-[#1a1c1a]">
              Quy Trình 3 Bước Đơn Giản
            </h2>
            <p className="text-xs sm:text-sm text-[#777]">
              Giúp bạn nắm bắt giá trị thực tế của chiếc xe dễ dàng nhất
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-[#eae8e3] shadow-xs space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-secondary-container/40 text-on-secondary-container flex items-center justify-center font-bold text-sm">
                01
              </div>
              <h3 className="font-bold text-sm text-[#1a1c1a]">1. Điền Thông Tin Xe</h3>
              <p className="text-xs text-[#666] leading-relaxed">
                Chọn hãng xe, dòng xe, năm sản xuất và số km xe đã chạy thực tế trên đồng hồ ODO.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#eae8e3] shadow-xs space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-secondary text-on-secondary flex items-center justify-center font-bold text-sm">
                02
              </div>
              <h3 className="font-bold text-sm text-[#1a1c1a]">2. Xem Giá Thị Trường</h3>
              <p className="text-xs text-[#666] leading-relaxed">
                Hệ thống đưa ra mức giá hợp lý nhất cùng khoảng giá bán nhanh và giá xe lướt giữ gìn đẹp.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#eae8e3] shadow-xs space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-surface-container-high text-primary flex items-center justify-center font-bold text-sm">
                03
              </div>
              <h3 className="font-bold text-sm text-[#1a1c1a]">3. Đăng Bán Miễn Phí</h3>
              <p className="text-xs text-[#666] leading-relaxed">
                Đăng tin bán xe trực tiếp trên sàn AuraAuto để kết nối hàng ngàn khách mua thực tế mỗi ngày.
              </p>
            </div>
          </div>
        </div>

        {/* Consumer FAQs */}
        <div className="max-w-3xl mx-auto pt-4 space-y-6">
          <div className="flex items-center space-x-2.5">
            <HelpCircle className="w-5 h-5 text-[#b89b72]" />
            <h2 className="text-xl font-bold font-display text-[#1a1c1a]">
              Câu Hỏi Thường Gặp
            </h2>
          </div>

          <div className="space-y-4">
            <div className="p-6 rounded-2xl bg-white border border-[#eae8e3] text-sm space-y-2 shadow-xs">
              <h3 className="font-semibold font-display text-[#1a1c1a] text-base flex items-center gap-2">
                <span className="text-[#b89b72]">Q:</span>
                <span>Định giá xe trên AuraAuto có mất phí không?</span>
              </h3>
              <p className="text-[#555] leading-relaxed pl-5">
                Hoàn toàn <strong>miễn phí 100%</strong>. Bạn có thể tra cứu và định giá không giới hạn cho mọi dòng xe trên thị trường.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-[#eae8e3] text-sm space-y-2 shadow-xs">
              <h3 className="font-semibold font-display text-[#1a1c1a] text-base flex items-center gap-2">
                <span className="text-[#b89b72]">Q:</span>
                <span>Mức giá định giá này dùng để làm gì?</span>
              </h3>
              <p className="text-[#555] leading-relaxed pl-5">
                Mức giá này giúp người bán biết tầm giá hợp lý để đăng tin không bị hớ, đồng thời giúp người mua nắm được giá sàn giao dịch để tự tin thương lượng khi xem xe.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-[#eae8e3] text-sm space-y-2 shadow-xs">
              <h3 className="font-semibold font-display text-[#1a1c1a] text-base flex items-center gap-2">
                <span className="text-[#b89b72]">Q:</span>
                <span>Làm sao để bán được chiếc xe với giá tốt nhất?</span>
              </h3>
              <p className="text-[#555] leading-relaxed pl-5">
                Để bán xe được giá cao, bạn nên bảo dưỡng định kỳ có hóa đơn, giữ gìn nội ngoại thất sạch sẽ và chụp hình ảnh xe đầy đủ, rõ nét khi đăng tin trên AuraAuto.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
