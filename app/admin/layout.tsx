'use client';

import AdminSidebar from '@/components/AdminSidebar';
import RouteGuard from '@/components/RouteGuard';
import ScrollToTop from '@/components/ScrollToTop';
import { ToastProvider } from '@/components/ToastContainer';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Bloqueia CLIENTE no shell admin (sidebar). Páginas ADMIN-only
  // reforçam role nas próprias screens / APIs (withAdmin).
  return (
    <RouteGuard allowedRoles={['ADMIN', 'GESTOR']}>
      <ToastProvider>
        <div className="flex min-h-screen bg-gray-50">
          <AdminSidebar />
          <div className="flex-1 lg:ml-64 transition-all duration-300">
            <main className="p-4 md:p-8">
              {children}
            </main>
          </div>
          <ScrollToTop />
        </div>
      </ToastProvider>
    </RouteGuard>
  );
}

