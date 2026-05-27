'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type MercadoVivoDeteccao = {
  dentro: boolean;
  mercadoId?: string;
  mercadoNome?: string;
  unidadeNome?: string;
  distanciaMetros?: number;
  mensagem?: string;
};

type Options = {
  enabled?: boolean;
  intervalMs?: number;
  onEntrou?: (d: MercadoVivoDeteccao) => void;
};

export function useMercadoVivoGeofence(options: Options = {}) {
  const { enabled = true, intervalMs = 45_000, onEntrou } = options;
  const [deteccao, setDeteccao] = useState<MercadoVivoDeteccao | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const ultimoCheckin = useRef<string | null>(null);
  const onEntrouRef = useRef(onEntrou);
  onEntrouRef.current = onEntrou;

  const verificar = useCallback(async () => {
    if (!enabled || typeof window === 'undefined' || !navigator.geolocation) {
      setErro('Geolocalização indisponível neste dispositivo');
      return;
    }

    setCarregando(true);
    setErro(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude: lat, longitude: lon } = pos.coords;
          const res = await fetch(
            `/api/cliente/modo-mercado-vivo?lat=${lat}&lon=${lon}`,
            { credentials: 'include', cache: 'no-store' }
          );
          const json = await res.json();
          if (!json.success) throw new Error(json.error || 'Falha na detecção');

          const d = json.data as MercadoVivoDeteccao & {
            mercadoId?: string;
            mercadoNome?: string;
            unidadeNome?: string;
            distanciaMetros?: number;
            mensagem?: string;
          };

          const resultado: MercadoVivoDeteccao = {
            dentro: Boolean(d.dentro),
            mercadoId: d.mercadoId,
            mercadoNome: d.mercadoNome,
            unidadeNome: d.unidadeNome,
            distanciaMetros: d.distanciaMetros,
            mensagem: d.mensagem,
          };

          setDeteccao(resultado);

          if (resultado.dentro && resultado.mercadoId) {
            const k = `${resultado.mercadoId}:${new Date().toDateString()}`;
            if (ultimoCheckin.current !== k) {
              ultimoCheckin.current = k;
              await fetch('/api/cliente/modo-mercado-vivo', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lat, lon }),
              });
              onEntrouRef.current?.(resultado);
            }
          }
        } catch (e) {
          setErro(e instanceof Error ? e.message : 'Erro ao detectar mercado');
        } finally {
          setCarregando(false);
        }
      },
      () => {
        setErro('Permita localização para o modo mercado ao vivo');
        setCarregando(false);
      },
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 30_000 }
    );
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    void verificar();
    const t = setInterval(() => void verificar(), intervalMs);
    return () => clearInterval(t);
  }, [enabled, intervalMs, verificar]);

  return { deteccao, erro, carregando, verificar };
}
