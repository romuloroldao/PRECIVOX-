import RouteGuard from '@/components/RouteGuard';

export default function ClienteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RouteGuard allowedRoles={['CLIENTE', 'GESTOR', 'ADMIN']}>
      {children}
    </RouteGuard>
  );
}

