'use client';

import { MercadoVivoGeofenceProvider } from '@/components/cliente/MercadoVivoGeofenceProvider';

/** Mantém GPS ativo em todas as rotas /cliente/* (via provider no layout). */
export function MercadoVivoGeofenceWatcher({ children }: { children: React.ReactNode }) {
  return <MercadoVivoGeofenceProvider>{children}</MercadoVivoGeofenceProvider>;
}
