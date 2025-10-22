'use client';

import RouteGuard from '@/components/RouteGuard';
import AdminSidebar from '@/components/AdminSidebar';
import ScrollToTop from '@/components/ScrollToTop';
import { ToastProvider } from '@/components/ToastContainer';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RouteGuard allowedRoles={['ADMIN']}>
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

