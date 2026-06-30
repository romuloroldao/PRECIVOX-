import RouteGuard from '@/components/RouteGuard';
import { NpsSurveyWidget } from '@/components/cliente/NpsSurveyWidget';
import { MercadoVivoGeofenceWatcher } from '@/components/cliente/MercadoVivoGeofenceWatcher';
import { ClienteAppBar } from '@/components/cliente/ClienteAppBar';
import BottomNav from '@/components/cliente/BottomNav';

export default function ClienteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RouteGuard allowedRoles={['CLIENTE', 'GESTOR', 'ADMIN']}>
      <MercadoVivoGeofenceWatcher>
        <ClienteAppBar />
        {/* Espaço inferior no mobile para o conteúdo não ficar sob a navegação. */}
        <div className="pb-[calc(var(--cliente-bottom-nav-height)+1rem)] md:pb-0">{children}</div>
        <NpsSurveyWidget />
        <BottomNav />
      </MercadoVivoGeofenceWatcher>
    </RouteGuard>
  );
}

