import RouteGuard from '@/components/RouteGuard';
import { NpsSurveyWidget } from '@/components/cliente/NpsSurveyWidget';

export default function ClienteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RouteGuard allowedRoles={['CLIENTE', 'GESTOR', 'ADMIN']}>
      {children}
      <NpsSurveyWidget />
    </RouteGuard>
  );
}

