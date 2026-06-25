'use client';

import Link from 'next/link';
import { MapPin, Navigation, Loader2 } from 'lucide-react';
import { useSession } from '@/lib/hooks/useUnifiedSession';
import { useMercadoVivoGeofenceContext } from '@/components/cliente/MercadoVivoGeofenceProvider';
import { useMercadoSelos } from '@/app/hooks/useMercadoSelos';
import { GeofenceRaioSelector } from '@/components/cliente/GeofenceRaioSelector';
import { MercadoSeloBadge } from '@/components/cliente/MercadoSeloBadge';
import { MercadoCrowdReputacaoChip } from '@/components/cliente/MercadoCrowdReputacaoChip';

interface Props {
  enabled?: boolean;
}

export function MercadoVivoBanner({ enabled = true }: Props) {
  const { status } = useSession();
  const sessionOk = status === 'authenticated';
  const { deteccao, erro, carregando, gpsAtivo, raioMetros, verificar, reiniciarGps } =
    useMercadoVivoGeofenceContext();
  const selos = useMercadoSelos(deteccao?.mercadoId ? [deteccao.mercadoId] : []);
  const selo = deteccao?.mercadoId ? selos[deteccao.mercadoId] : undefined;

  if (!enabled) return null;

  if (!deteccao?.dentro || !deteccao.mercadoId) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <GeofenceRaioSelector
          compact
          enabled={sessionOk && enabled}
          onChange={() => void verificar()}
        />
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-600">
          {erro ? (
            <span>{erro}</span>
          ) : carregando || gpsAtivo ? (
            <span>Detectando mercado pela sua localização…</span>
          ) : (
            <span>Aguardando sinal GPS…</span>
          )}
          <button
            type="button"
            onClick={() => {
              reiniciarGps();
              void verificar();
            }}
            className="font-semibold text-precivox-blue hover:underline"
          >
            Detectar agora
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-emerald-300 bg-gradient-to-r from-emerald-600 to-teal-600 p-4 text-white shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2">
          <MapPin className="h-5 w-5 shrink-0" />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-100">
              Modo mercado ao vivo · raio {raioMetros} m
            </p>
            <p className="flex flex-wrap items-center gap-2 font-semibold">
              <span>Você está em {deteccao.unidadeNome ?? deteccao.mercadoNome}</span>
              {selo?.selo && (
                <MercadoSeloBadge
                  selo={selo.selo}
                  seloCurto={selo.seloCurto}
                  compact
                  className="!bg-white/20 !text-white !ring-white/40"
                />
              )}
              <MercadoCrowdReputacaoChip mercadoId={deteccao.mercadoId} />
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
