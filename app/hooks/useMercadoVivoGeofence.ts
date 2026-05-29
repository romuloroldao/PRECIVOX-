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
  /** Inicia GPS ao montar (padrão: true). */
  autoDetect?: boolean;
  raioMetros?: number;
  onEntrou?: (d: MercadoVivoDeteccao) => void;
};

const GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 20_000,
  maximumAge: 15_000,
};

export function useMercadoVivoGeofence(options: Options = {}) {
  const { enabled = true, autoDetect = true, raioMetros = 200, onEntrou } = options;
  const [deteccao, setDeteccao] = useState<MercadoVivoDeteccao | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [gpsAtivo, setGpsAtivo] = useState(false);
  const ultimoCheckin = useRef<string | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const processandoRef = useRef(false);
  const onEntrouRef = useRef(onEntrou);
  onEntrouRef.current = onEntrou;

  const processarPosicao = useCallback(
    async (lat: number, lon: number) => {
      if (processandoRef.current) return;
      processandoRef.current = true;
      setCarregando(true);
      setErro(null);

      try {
        const res = await fetch(
          `/api/cliente/modo-mercado-vivo?lat=${lat}&lon=${lon}&raioMetros=${raioMetros}`,
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
              body: JSON.stringify({ lat, lon, raioMetros }),
            });
            onEntrouRef.current?.(resultado);
          }
        }
      } catch (e) {
        setErro(e instanceof Error ? e.message : 'Erro ao detectar mercado');
      } finally {
        processandoRef.current = false;
        setCarregando(false);
      }
    },
    [raioMetros]
  );

  const pararWatch = useCallback(() => {
    if (watchIdRef.current != null && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setGpsAtivo(false);
  }, []);

  const iniciarWatch = useCallback(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setErro('Geolocalização indisponível neste dispositivo');
      return;
    }

    pararWatch();
    setCarregando(true);
    setErro(null);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setGpsAtivo(true);
        void processarPosicao(pos.coords.latitude, pos.coords.longitude);
      },
      (err) => {
        setCarregando(false);
        if (err.code === err.PERMISSION_DENIED) {
          setErro('Permita localização para o modo mercado ao vivo');
          pararWatch();
        } else if (err.code === err.TIMEOUT) {
          setErro('Aguardando sinal GPS…');
          /* mantém watch ativo — retry automático */
        } else {
          setErro('Sinal GPS instável — tentando novamente…');
        }
      },
      GEO_OPTIONS
    );
    setGpsAtivo(true);
  }, [pararWatch, processarPosicao]);

  const verificar = useCallback(() => {
    if (!enabled || typeof window === 'undefined' || !navigator.geolocation) {
      setErro('Geolocalização indisponível neste dispositivo');
      return;
    }
    setCarregando(true);
    setErro(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsAtivo(true);
        void processarPosicao(pos.coords.latitude, pos.coords.longitude);
      },
      (err) => {
        setCarregando(false);
        if (err.code === err.PERMISSION_DENIED) {
          setErro('Permita localização para o modo mercado ao vivo');
        } else {
          setErro('Não foi possível obter localização. Tente novamente.');
        }
      },
      GEO_OPTIONS
    );
  }, [enabled, processarPosicao]);

  useEffect(() => {
    if (!enabled || !autoDetect) {
      pararWatch();
      return;
    }
    iniciarWatch();
    return () => pararWatch();
  }, [enabled, autoDetect, raioMetros, iniciarWatch, pararWatch]);

  return { deteccao, erro, carregando, gpsAtivo, verificar, reiniciarGps: iniciarWatch };
};
