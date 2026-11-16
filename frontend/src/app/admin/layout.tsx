'use client';

import React, { useState, useEffect } from 'react';
import { AdminGuard } from '@/features/admin/components/AdminGuard';
import { AdminSidebar } from '@/features/admin/components/AdminSidebar';
import { AdminUIProvider } from '@/features/admin/context/AdminUIContext';
import { api } from '@/lib/api';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [metrics, setMetrics] = useState<{ pending_listings?: number; pending_appointments?: number } | null>(null);
  const [adminUser, setAdminUser] = useState<any>(null);

  useEffect(() => {
    let mounted = true;

    async function loadQuickMetrics() {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser && mounted) {
          setAdminUser(JSON.parse(storedUser));
        }

        const data = await api.getAdminMetrics();
        if (mounted) {
          setMetrics(data);
        }
      } catch {
        // Handled by AdminGuard
      }
    }

    loadQuickMetrics();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <AdminGuard>
      <AdminUIProvider>
        <div className="h-screen w-screen overflow-hidden bg-surface font-body-md text-on-surface antialiased selection:bg-secondary-fixed selection:text-on-secondary-fixed flex flex-col md:flex-row">
          {/* Persistent Enterprise Admin Sidebar - Fixed and Non-stretching */}
          <AdminSidebar
            pendingCount={metrics?.pending_listings || 0}
            pendingAppointmentCount={metrics?.pending_appointments || 0}
            adminUser={adminUser}
          />

          {/* Main Admin Viewport - Independent Scrollable Content Area */}
          <div className="flex-1 flex flex-col min-w-0 bg-surface overflow-y-auto h-full">
            {children}
          </div>
        </div>
      </AdminUIProvider>
    </AdminGuard>
  );
}
