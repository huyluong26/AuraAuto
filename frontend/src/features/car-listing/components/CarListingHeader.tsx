'use client';

import React from 'react';
import { CarListingStep } from '../types';

interface CarListingHeaderProps {
  currentStep: CarListingStep;
  onStepClick: (step: CarListingStep) => void;
}

export function CarListingHeader({ currentStep, onStepClick }: CarListingHeaderProps) {
  const steps: Array<{ step: CarListingStep; title: string; subtitle: string }> = [
    { step: 1, title: 'Thông tin cơ bản', subtitle: 'Xuất xưởng & ODO' },
    { step: 2, title: 'Thông số xe', subtitle: 'Pháp lý & Cam kết' },
    { step: 3, title: 'Hình ảnh thực', subtitle: 'Các góc khuyến nghị' },
    { step: 4, title: 'Định giá & AI', subtitle: 'Gợi ý thuật toán' },
    { step: 5, title: 'Xem trước', subtitle: 'Kiểm tra & Nộp duyệt' },
  ];

  return (
    <div className="space-y-space-xl">
      {/* Header: Editorial & Restrained */}
      <header className="space-y-space-xs max-w-3xl">
        <div className="inline-flex items-center gap-space-xs text-secondary">
          <span className="material-symbols-outlined text-[18px]">verified_user</span>
          <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary font-semibold">
            Thị trường ô tô cá nhân C2C
          </span>
        </div>
        <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight">
          Đăng tin bán xe chính chủ
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant font-normal leading-relaxed">
          Kết nối trực tiếp người mua thực tế toàn quốc trong 3 phút. Tuyệt đối minh bạch và không phát sinh phí môi giới ẩn.
        </p>
      </header>

      {/* Step Progress Indicator (Interactive Porsche/Apple Flow) */}
      <nav aria-label="Tiến trình đăng tin" className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-space-sm items-center">
          {steps.map((item) => {
            const isCurrent = currentStep === item.step;
            const isCompleted = currentStep > item.step;

            return (
              <button
                key={item.step}
                type="button"
                onClick={() => onStepClick(item.step)}
                className="flex items-center gap-space-sm text-left group cursor-pointer p-1 rounded-lg transition-colors hover:bg-surface-container-low"
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-label-md text-label-md font-semibold transition-colors shrink-0 ${
                    isCurrent
                      ? 'bg-primary text-on-primary ring-2 ring-primary/20'
                      : isCompleted
                      ? 'bg-secondary text-on-secondary'
                      : 'bg-surface-container-high text-on-surface'
                  }`}
                >
                  {isCompleted ? (
                    <span className="material-symbols-outlined text-[16px]">check</span>
                  ) : (
                    item.step
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <span
                    className={`font-label-md text-label-md font-semibold truncate ${
                      isCurrent ? 'text-primary' : 'text-on-surface-variant'
                    }`}
                  >
                    {item.title}
                  </span>
                  <span
                    className={`font-label-sm text-label-sm truncate ${
                      isCurrent ? 'text-secondary font-medium' : 'text-outline'
                    }`}
                  >
                    {isCurrent ? 'Đang thực hiện' : isCompleted ? 'Đã hoàn thành' : item.subtitle}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
