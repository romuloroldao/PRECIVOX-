import RouteGuard from '@/components/RouteGuard';

export default function GestorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RouteGuard allowedRoles={['GESTOR', 'ADMIN']}>
      {children}
    </RouteGuard>
  );
}

