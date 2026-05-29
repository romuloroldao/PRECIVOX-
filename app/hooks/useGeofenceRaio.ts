'use client';

import { useCallback, useEffect, useState } from 'react';
import { GEOFENCE_RAIO_METROS, GEOFENCE_RAIO_OPCOES } from '@/lib/geofence-constants';

const STORAGE_KEY = 'precivox_geofence_raio_metros';

export function useGeofenceRaio(enabled = true) {
  const [raioMetros, setRaioMetrosState] = useState(GEOFENCE_RAIO_METROS);
  const [opcoes, setOpcoes] = useState<number[]>([...GEOFENCE_RAIO_OPCOES]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const local = localStorage.getItem(STORAGE_KEY);
    if (local) {
      const n = parseInt(local, 10);
      if (Number.isFinite(n)) setRaioMetrosState(n);
    }

    if (!enabled) {
      setCarregando(false);
      return;
    }

    void (async () => {
      try {
        const res = await fetch('/api/cliente/modo-mercado-vivo/config', {
          credentials: 'include',
          cache: 'no-store',
        });
        const json = await res.json();
        if (json.success) {
          setRaioMetrosState(json.data.raioMetros);
          setOpcoes(json.data.opcoes ?? [...GEOFENCE_RAIO_OPCOES]);
          localStorage.setItem(STORAGE_KEY, String(json.data.raioMetros));
        }
      } catch {
        /* mantém local/padrão */
      } finally {
        setCarregando(false);
      }
    })();
  }, [enabled]);

  const setRaioMetros = useCallback(async (metros: number) => {
    setRaioMetrosState(metros);
    localStorage.setItem(STORAGE_KEY, String(metros));
    try {
      await fetch('/api/cliente/modo-mercado-vivo/config', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raioMetros: metros }),
      });
    } catch {
      /* preferência fica no dispositivo */
    }
  }, []);

  return { raioMetros, opcoes, carregando, setRaioMetros };
}
