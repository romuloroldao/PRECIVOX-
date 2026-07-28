import RouteGuard from '@/components/RouteGuard';
import { NpsSurveyWidget } from '@/components/cliente/NpsSurveyWidget';
import { ElOnboardingWidget } from '@/components/cliente/ElOnboardingWidget';
import { ElRefinamentoToast } from '@/components/cliente/ElRefinamentoToast';
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
        <div className="pb-[var(--cliente-content-pad-bottom)] md:pb-0">{children}</div>
        <NpsSurveyWidget />
        <ElOnboardingWidget />
        <ElRefinamentoToast />
        <BottomNav />
      </MercadoVivoGeofenceWatcher>
    </RouteGuard>
  );
}

