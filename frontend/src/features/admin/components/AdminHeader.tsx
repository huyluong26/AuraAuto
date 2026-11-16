'use client';

import React, { ReactNode } from 'react';
import Link from 'next/link';
import { AdminButton } from './ui/AdminButton';

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  actions?: ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

export function AdminHeader({
  title,
  subtitle,
  onRefresh,
  isRefreshing = false,
  actions,
  breadcrumbs,
}: AdminHeaderProps) {
  return (
    <header className="h-20 bg-surface-container-lowest/90 backdrop-blur-xl border-b border-surface-container-high px-8 flex items-center justify-between shrink-0 shadow-[0_1px_8px_rgba(0,0,0,0.02)]">
      <div className="flex flex-col">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-1.5 font-label-sm text-[11px] text-on-surface-variant">
          <Link href="/admin" className="hover:text-primary transition-colors">
            AuraAuto Admin
          </Link>
          {breadcrumbs ? (
            breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                <span className="text-outline">/</span>
                {crumb.href ? (
                  <Link href={crumb.href} className="hover:text-primary transition-colors">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-secondary font-semibold">{crumb.label}</span>
                )}
              </React.Fragment>
            ))
          ) : (
            <>
              <span className="text-outline">/</span>
              <span className="text-secondary font-semibold">{title}</span>
            </>
          )}
        </div>

        {/* Title */}
        <h1 className="font-headline-md text-xl text-primary font-bold tracking-tight flex items-center gap-2 mt-0.5">
          <span>{title}</span>
          {subtitle && (
            <span className="font-body-sm text-xs text-outline font-normal">
              ({subtitle})
            </span>
          )}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Real-time system pulse indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container-low border border-surface-container-high font-label-sm text-[11px] text-on-surface-variant font-medium">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span>Trực tuyến</span>
        </div>

        {/* Custom Actions Slot */}
        {actions}

        {/* Refresh button */}
        {onRefresh && (
          <AdminButton
            variant="outline"
            size="sm"
            icon="refresh"
            loading={isRefreshing}
            onClick={onRefresh}
            title="Làm mới dữ liệu"
          >
            {isRefreshing ? 'Đang tải...' : 'Làm mới'}
          </AdminButton>
        )}
      </div>
    </header>
  );
}
