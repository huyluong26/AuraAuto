'use client';

import React, { useState, useMemo } from 'react';
import { formatFullVND } from '@/lib/api';

interface LoanCalculatorCardProps {
  priceVnd: number;
}

export function LoanCalculatorCard({ priceVnd }: LoanCalculatorCardProps) {
  const [downPaymentPercent, setDownPaymentPercent] = useState<number>(20);
  const loanTermMonths = 84;
  const interestRateYear = 0.079; // 7.9% / year

  const { downPayment, loanAmount, monthlyPayment } = useMemo(() => {
    if (!priceVnd) return { downPayment: 0, loanAmount: 0, monthlyPayment: 0 };
    const dp = (priceVnd * downPaymentPercent) / 100;
    const loan = priceVnd - dp;
    const monthlyRate = interestRateYear / 12;
    const monthly =
      (loan * (monthlyRate * Math.pow(1 + monthlyRate, loanTermMonths))) /
      (Math.pow(1 + monthlyRate, loanTermMonths) - 1);

    return {
      downPayment: dp,
      loanAmount: loan,
      monthlyPayment: Math.round(monthly),
    };
  }, [priceVnd, downPaymentPercent, loanTermMonths, interestRateYear]);

  return (
    <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex flex-col gap-space-xs">
      <div className="flex items-center justify-between">
        <span className="font-label-lg text-label-lg font-semibold text-primary">
          Tính toán nhanh trả góp
        </span>
        <span className="font-label-sm text-label-sm text-secondary font-bold">
          Lãi suất 7.9%/năm
        </span>
      </div>

      {/* Percentage buttons */}
      <div className="grid grid-cols-3 gap-1 pt-1">
        {[20, 30, 50].map((pct) => (
          <button
            key={pct}
            type="button"
            onClick={() => setDownPaymentPercent(pct)}
            className={`py-1 text-xs rounded font-medium transition-all cursor-pointer ${
              downPaymentPercent === pct
                ? 'bg-secondary text-white'
                : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            Trả trước {pct}%
          </button>
        ))}
      </div>

      <div className="space-y-2 pt-2 font-body-sm text-body-sm">
        <div className="flex justify-between">
          <span className="text-on-surface-variant">Trả trước {downPaymentPercent}%:</span>
          <span className="font-semibold text-primary">{formatFullVND(downPayment)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-on-surface-variant">Khoản vay còn lại:</span>
          <span className="font-semibold text-primary">{formatFullVND(loanAmount)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-on-surface-variant">Thời hạn đề xuất:</span>
          <span className="font-semibold text-primary">7 năm (84 tháng)</span>
        </div>
        <div className="flex justify-between pt-1 border-t border-surface-container">
          <span className="text-primary font-medium">Gốc + lãi bình quân:</span>
          <span className="font-bold text-secondary text-body-md">
            ~ {formatFullVND(monthlyPayment)}/tháng
          </span>
        </div>
      </div>
    </div>
  );
}
