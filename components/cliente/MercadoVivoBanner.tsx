'use client';

import Link from 'next/link';
import { MapPin, Navigation, Loader2 } from 'lucide-react';
import { useMercadoVivoGeofence } from '@/app/hooks/useMercadoVivoGeofence';

interface Props {
  enabled?: boolean;
}

export function MercadoVivoBanner({ enabled = true }: Props) {
  const { deteccao, erro, carregando, verificar } = useMercadoVivoGeofence({ enabled });

  if (!enabled) return null;

  if (erro && !deteccao?.dentro) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-xs text-gray-600">
        <button type="button" onClick={() => void verificar()} className="font-semibold text-precivox-blue">
          Ativar localização
        </button>{' '}
        para detectar quando você entrar no mercado (modo corredor).
      </div>
    );
  }

  if (!deteccao?.dentro || !deteccao.mercadoId) return null;

  return (
    <div className="rounded-xl border border-emerald-300 bg-gradient-to-r from-emerald-600 to-teal-600 p-4 text-white shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2">
          <MapPin className="h-5 w-5 shrink-0" />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-100">
              Modo mercado ao vivo
            </p>
            <p className="font-semibold">
              Você está em {deteccao.unidadeNome ?? deteccao.mercadoNome}
            </p>
            {deteccao.distanciaMetros != null && deteccao.distanciaMetros >= 0 && (
              <p className="text-xs text-emerald-50">~{deteccao.distanciaMetros} m da entrada</p>
            )}
          </div>
        </div>
        <Link
          href="/cliente/mercado-vivo"
          className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-50"
        >
          {carregando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
          Abrir corredor
        </Link>
      </div>
    </div>
  );
}
