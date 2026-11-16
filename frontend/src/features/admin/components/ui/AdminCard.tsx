'use client';

import React, { ReactNode } from 'react';

interface AdminCardProps {
  title?: string;
  subtitle?: string;
  icon?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  footer?: ReactNode;
}

export function AdminCard({
  title,
  subtitle,
  icon,
  action,
  children,
  className = '',
  bodyClassName = '',
  footer,
}: AdminCardProps) {
  const hasHeader = title || action;

  return (
    <div
      className={`bg-surface-container-lowest rounded-2xl border border-surface-container-high shadow-xs overflow-hidden ${className}`}
    >
      {hasHeader && (
        <div className="px-6 py-4 border-b border-surface-container-high flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="w-9 h-9 rounded-xl bg-surface-container-low border border-surface-container-high flex items-center justify-center text-secondary shrink-0">
                <span className="material-symbols-outlined text-[20px]">{icon}</span>
              </div>
            )}
            <div>
              {title && (
                <h3 className="font-headline-sm text-headline-sm font-semibold text-primary">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {action && <div className="flex items-center gap-2">{action}</div>}
        </div>
      )}

      <div className={`p-6 ${bodyClassName}`}>{children}</div>

      {footer && (
        <div className="px-6 py-3.5 bg-surface-container-low border-t border-surface-container-high">
          {footer}
        </div>
      )}
    </div>
  );
}
