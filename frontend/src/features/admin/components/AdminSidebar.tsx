'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAdminUI } from '../context/AdminUIContext';

interface AdminSidebarProps {
  pendingCount?: number;
  pendingAppointmentCount?: number;
  adminUser?: {
    email?: string;
    display_name?: string;
    role?: string;
  };
}

export function AdminSidebar({ pendingCount = 0, pendingAppointmentCount = 0, adminUser }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { confirm, toast } = useAdminUI();

  const handleLogout = async () => {
    const isConfirmed = await confirm({
      title: 'Đăng xuất phiên Quản trị',
      message: 'Bạn có chắc chắn muốn đăng xuất khỏi Trung tâm Quản trị AuraAuto?',
      confirmText: 'Đăng xuất',
      cancelText: 'Ở lại',
      variant: 'danger',
      icon: 'logout',
    });

    if (isConfirmed) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('aura_auth_changed'));
      toast.info('Đã đăng xuất', 'Phiên làm việc quản trị đã kết thúc');
      router.push('/dang-nhap');
    }
  };

  const navSections = [
    {
      title: 'TỔNG QUAN',
      items: [
        {
          label: 'Bảng điều khiển',
          href: '/admin',
          icon: 'dashboard',
          badge: null,
          exact: true,
        },
      ],
    },
    {
      title: 'VẬN HÀNH SÀN XE',
      items: [
        {
          label: 'Quản lý tin đăng xe',
          href: '/admin/tin-dang',
          icon: 'directions_car',
          badge: pendingCount > 0 ? `${pendingCount} chờ duyệt` : null,
          badgeColor: 'bg-secondary-container text-on-secondary-container font-bold',
          exact: false,
        },
        {
          label: 'Dịch vụ & Tin nổi bật',
          href: '/admin/tin-noi-bat',
          icon: 'stars',
          badge: 'VIP',
          badgeColor: 'bg-amber-100 text-amber-900 font-bold',
          exact: false,
        },
        {
          label: 'Lịch hẹn xem xe',
          href: '/admin/lich-hen',
          icon: 'calendar_month',
          badge: pendingAppointmentCount > 0 ? `${pendingAppointmentCount} mới` : null,
          badgeColor: 'bg-amber-100 text-amber-900 font-bold',
          exact: false,
        },
        {
          label: 'Thành viên & Showroom',
          href: '/admin/nguoi-dung',
          icon: 'group',
          badge: null,
          exact: false,
        },
        {
          label: 'Khiếu nại & Báo cáo',
          href: '/admin/bao-cao',
          icon: 'gavel',
          badge: null,
          exact: false,
        },
      ],
    },
    {
      title: 'QUẢN TRỊ NỘI BỘ & PHÂN QUYỀN',
      items: [
        {
          label: 'Nhân sự & Kiểm duyệt',
          href: '/admin/nhan-su',
          icon: 'shield_person',
          badge: 'RBAC',
          badgeColor: 'bg-amber-100 text-amber-800 font-bold',
          exact: false,
        },
      ],
    },
    {
      title: 'TRUYỀN THÔNG & TIN TỨC',
      items: [
        {
          label: 'Quản lý tin tức bài viết',
          href: '/admin/tin-tuc',
          icon: 'newspaper',
          badge: null,
          exact: false,
        },
      ],
    },
    {
      title: 'HẠ TẦNG & VẬN HÀNH AI',
      items: [
        {
          label: 'Hệ thống, Dọn dẹp & MLOps',
          href: '/admin/he-thong',
          icon: 'smart_toy',
          badge: 'MLOps',
          badgeColor: 'bg-emerald-100 text-emerald-800 font-semibold',
          exact: false,
        },
      ],
    },
  ];

  return (
    <aside className="w-64 h-screen bg-surface-container-lowest border-r border-surface-container-high flex flex-col shrink-0 select-none shadow-[2px_0_12px_rgba(0,0,0,0.02)] sticky top-0 z-30">
      {/* Brand Header */}
      <div className="h-20 px-5 border-b border-surface-container-high flex items-center justify-between">
        <Link href="/admin" className="flex flex-col group">
          <div className="flex items-center gap-2">
            <span className="font-headline-sm text-headline-sm text-primary tracking-tight font-bold group-hover:text-secondary transition-colors">
              AuraAuto
            </span>
            <span className="font-label-sm text-[10px] px-1.5 py-0.5 rounded-md bg-secondary-container text-on-secondary-container font-extrabold uppercase tracking-wider">
              ADMIN
            </span>
          </div>
          <span className="font-label-sm text-[10px] text-secondary tracking-widest uppercase font-medium">
            Enterprise Portal
          </span>
        </Link>
      </div>

      {/* Main Navigation with Categorized Sections */}
      <div className="flex-1 py-4 px-3 space-y-5 overflow-y-auto">
        {navSections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1">
            <div className="px-3 pb-1 font-label-sm text-[10px] font-bold tracking-widest uppercase text-outline">
              {section.title}
            </div>

            {section.items.map((item) => {
              const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl font-label-md text-xs transition-all group ${
                    isActive
                      ? 'bg-secondary-container/30 text-secondary font-semibold border-l-3 border-secondary shadow-2xs'
                      : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-low'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`material-symbols-outlined text-[19px] transition-colors ${
                        isActive ? 'text-secondary font-semibold' : 'text-outline group-hover:text-primary'
                      }`}
                    >
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-tight ${
                        item.badgeColor || 'bg-surface-container text-on-surface'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}

        {/* Shortcuts */}
        <div className="pt-2 space-y-1 border-t border-surface-container-high/60">
          <div className="px-3 pb-1 font-label-sm text-[10px] font-bold tracking-widest uppercase text-outline">
            LỐI TẮT SÀN CÔNG KHAI
          </div>

          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between px-3 py-2 rounded-xl text-on-surface-variant hover:text-primary hover:bg-surface-container-low font-label-md text-xs transition-colors group"
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[18px] text-outline group-hover:text-primary">
                open_in_new
              </span>
              <span>Trang chủ sàn xe</span>
            </div>
            <span className="text-[10px] text-outline font-mono">↗</span>
          </Link>

          <Link
            href="/dang-tin"
            className="flex items-center justify-between px-3 py-2 rounded-xl text-on-surface-variant hover:text-primary hover:bg-surface-container-low font-label-md text-xs transition-colors group"
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[18px] text-outline group-hover:text-primary">
                add_circle
              </span>
              <span>Đăng bán xe mới</span>
            </div>
          </Link>
        </div>
      </div>

      {/* Admin User Footer Card */}
      <div className="p-3 border-t border-surface-container-high bg-surface-container-lowest">
        <div className="p-2.5 rounded-xl bg-surface-container-low border border-surface-container-high flex items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-primary text-on-primary flex items-center justify-center font-bold text-xs uppercase shrink-0 shadow-2xs">
              {adminUser?.display_name ? adminUser.display_name.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-label-md text-xs text-primary font-semibold truncate leading-tight">
                {adminUser?.display_name || 'Hệ Thống Quản Trị'}
              </span>
              <span className="font-body-sm text-[10px] text-on-surface-variant truncate">
                {adminUser?.email || 'admin@otocu.vn'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            title="Đăng xuất quản trị"
            className="p-1.5 rounded-lg text-outline hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
