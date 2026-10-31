'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { AdminSidebar, AdminMobileHeader } from '@/components/admin/AdminSidebar';
import { AuthGuard } from '@/components/admin/AuthGuard';
import { DraftsNotice } from '@/components/admin/DraftsNotice';
import { AuthProvider } from '@/lib/auth';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  
  // Login and the password reset page work without being signed in
  const isLoginPage = pathname === '/admin/login' || pathname === '/admin/reset';

  if (isLoginPage) {
    return (
      <AuthProvider>
        <div className="min-h-screen bg-surface">
          {children}
        </div>
      </AuthProvider>
    );
  }

  return (
    <AuthProvider>
      <AuthGuard>
        <div className="min-h-screen bg-surface">
          <AdminSidebar 
            isOpen={sidebarOpen} 
            onClose={() => setSidebarOpen(false)} 
          />
          <AdminMobileHeader onMenuClick={() => setSidebarOpen(true)} />
          
          {/* Main Content */}
          <main className="lg:ml-64 min-h-screen">
            <div className="pt-16 lg:pt-0">
              {children}
            </div>
          </main>
          <DraftsNotice />
        </div>
      </AuthGuard>
    </AuthProvider>
  );
}

