import RouteGuard from '@/components/RouteGuard';
import { ToastProvider } from '@/components/ToastContainer';

export default function GestorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RouteGuard allowedRoles={['GESTOR', 'ADMIN']}>
      <ToastProvider>
        {children}
      </ToastProvider>
    </RouteGuard>
  );
}

