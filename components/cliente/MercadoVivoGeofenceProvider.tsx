'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { useSession } from '@/lib/hooks/useUnifiedSession';
import {
  useMercadoVivoGeofence,
  type MercadoVivoDeteccao,
} from '@/app/hooks/useMercadoVivoGeofence';
import { useGeofenceRaio } from '@/app/hooks/useGeofenceRaio';

type MercadoVivoGeofenceContextValue = {
  deteccao: MercadoVivoDeteccao | null;
  erro: string | null;
  carregando: boolean;
  gpsAtivo: boolean;
  raioMetros: number;
  verificar: () => void;
  reiniciarGps: () => void;
};

const MercadoVivoGeofenceContext = createContext<MercadoVivoGeofenceContextValue | null>(null);

export function MercadoVivoGeofenceProvider({ children }: { children: ReactNode }) {
  const { status } = useSession();
  const sessionOk = status === 'authenticated';
  const { raioMetros } = useGeofenceRaio(sessionOk);
  const geofence = useMercadoVivoGeofence({
    enabled: sessionOk,
    autoDetect: true,
    raioMetros,
  });

  return (
    <MercadoVivoGeofenceContext.Provider value={{ ...geofence, raioMetros }}>
      {children}
    </MercadoVivoGeofenceContext.Provider>
  );
}

export function useMercadoVivoGeofenceContext() {
  const ctx = useContext(MercadoVivoGeofenceContext);
  if (!ctx) {
    throw new Error('useMercadoVivoGeofenceContext deve estar dentro de MercadoVivoGeofenceProvider');
  }
  return ctx;
}
