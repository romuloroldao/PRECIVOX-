import RouteGuard from '@/components/RouteGuard';
import { NpsSurveyWidget } from '@/components/cliente/NpsSurveyWidget';
import { MercadoVivoGeofenceWatcher } from '@/components/cliente/MercadoVivoGeofenceWatcher';

export default function ClienteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RouteGuard allowedRoles={['CLIENTE', 'GESTOR', 'ADMIN']}>
      <MercadoVivoGeofenceWatcher>
        {children}
        <NpsSurveyWidget />
      </MercadoVivoGeofenceWatcher>
    </RouteGuard>
  );
}

