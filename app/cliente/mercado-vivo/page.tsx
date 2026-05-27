'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { useLista } from '@/app/context/ListaContext';
import type { ItemCorredor } from '@/lib/modo-mercado-vivo';
import {
  recordCompraConfirmada,
  recordCompraParcial,
} from '@/lib/events/frontend-events';
import {
  ArrowLeft,
  Check,
  Circle,
  MapPin,
  RefreshCw,
  ScanLine,
  ShoppingCart,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useGeofenceRaio } from '@/app/hooks/useGeofenceRaio';
import { GeofenceRaioSelector } from '@/components/cliente/GeofenceRaioSelector';

const SESSION_KEY = 'precivox_mercado_vivo';

type SessaoVivo = {
  mercadoId: string;
  mercadoNome: string;
  unidadeId: string;
  unidadeNome: string;
};

export default function MercadoVivoPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { itens, total, listaAtivaId, removerItem } = useLista();
  const [sessao, setSessao] = useState<SessaoVivo | null>(null);
  const [corredor, setCorredor] = useState<ItemCorredor[]>([]);
  const [comprados, setComprados] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [geoMsg, setGeoMsg] = useState<string | null>(null);
  const { raioMetros } = useGeofenceRaio();

  const carregarSessao = useCallback(async (lat: number, lon: number) => {
    const res = await fetch('/api/cliente/modo-mercado-vivo', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat, lon, raioMetros }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Não foi possível iniciar o modo corredor');

    const s: SessaoVivo = {
      mercadoId: json.data.mercadoId,
      mercadoNome: json.data.mercadoNome,
      unidadeId: json.data.unidadeId,
      unidadeNome: json.data.unidadeNome,
    };
    setSessao(s);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
    return s;
  }, [raioMetros]);

  const sincronizarLista = useCallback(
    async (mercadoId: string) => {
      const res = await fetch('/api/cliente/modo-mercado-vivo/itens', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mercadoId,
          itens: itens.map((i) => ({
            id: i.id,
            estoqueId: i.estoqueId,
            produtoCatalogoId: i.produtoCatalogoId,
            nome: i.nome,
            quantidade: i.quantidade,
            preco: i.preco,
            precoPromocional: i.precoPromocional,
            emPromocao: i.emPromocao,
            unidade: i.unidade,
          })),
        }),
      });
      const json = await res.json();
      if (json.success) setCorredor(json.data.itens);
    },
    [itens]
  );

  useEffect(() => {
    let cancelled = false;

    async function init() {
      let salva: SessaoVivo | null = null;
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (raw) {
        try {
          salva = JSON.parse(raw) as SessaoVivo;
          setSessao(salva);
        } catch {
          /* ignore */
        }
      }

      const finalizarComMercado = async (s: SessaoVivo) => {
        if (cancelled) return;
        setSessao(s);
        await sincronizarLista(s.mercadoId);
        setLoading(false);
      };

      if (!navigator.geolocation) {
        if (salva) await finalizarComMercado(salva);
        else setGeoMsg('Geolocalização indisponível.');
        setLoading(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          if (cancelled) return;
          try {
            const s = salva ?? (await carregarSessao(pos.coords.latitude, pos.coords.longitude));
            await finalizarComMercado(s);
          } catch (e) {
            if (salva) await finalizarComMercado(salva);
            else setGeoMsg(e instanceof Error ? e.message : 'Erro ao localizar mercado');
            setLoading(false);
          }
        },
        async () => {
          if (cancelled) return;
          if (salva) {
            await finalizarComMercado(salva);
          } else {
            try {
              const res = await fetch('/api/nps/suggest-mercado', { cache: 'no-store' });
              const data = await res.json();
              if (data.mercadoId) {
                const s: SessaoVivo = {
                  mercadoId: data.mercadoId,
                  mercadoNome: data.mercadoNome ?? 'Mercado',
                  unidadeId: data.unidadeId ?? '',
                  unidadeNome: data.unidadeNome ?? 'Unidade',
                };
                sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
                await finalizarComMercado(s);
                setGeoMsg('Sem GPS — modo manual pelo mercado sugerido.');
                return;
              }
            } catch {
              /* ignore */
            }
            setGeoMsg('Permita localização para detectar o mercado.');
            setLoading(false);
          }
        },
        { enableHighAccuracy: true, timeout: 15_000 }
      );
    }

    void init();
    return () => {
      cancelled = true;
    };
  }, [carregarSessao, sincronizarLista]);

  useEffect(() => {
    if (sessao?.mercadoId && itens.length > 0) {
      void sincronizarLista(sessao.mercadoId);
    }
  }, [sessao?.mercadoId, itens, sincronizarLista]);

  const pendentes = corredor.filter((i) => !comprados.has(i.id));
  const progresso =
    corredor.length > 0 ? Math.round((comprados.size / corredor.length) * 100) : 0;

  const totalCorredor = useMemo(
    () =>
      corredor.reduce(
        (acc, i) => acc + i.precoExibido * i.quantidade,
        0
      ),
    [corredor]
  );

  const toggleComprado = (id: string) => {
    setComprados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const finalizar = async () => {
    if (!sessao) return;
    const userId =
      (session?.user as { id?: string })?.id ??
      (typeof window !== 'undefined' ? localStorage.getItem('userId') : null) ??
      'anonymous';

    const compradosCount = comprados.size;
    const totalItens = corredor.length;

    if (compradosCount >= totalItens && totalItens > 0) {
      await recordCompraConfirmada(userId, sessao.mercadoId, {
        listaId: listaAtivaId ?? undefined,
        itensCount: totalItens,
        valorEstimado: totalCorredor,
      });
      for (const id of comprados) removerItem(id);
    } else if (compradosCount > 0) {
      await recordCompraParcial(userId, sessao.mercadoId, {
        listaId: listaAtivaId ?? undefined,
        itensComprados: compradosCount,
        itensTotal: totalItens,
      });
    }

    router.push('/cliente/home');
  };

  return (
    <DashboardLayout role="CLIENTE">
      <div className="mx-auto flex min-h-[80vh] max-w-lg flex-col bg-gray-950 text-white">
        <header className="sticky top-0 z-10 border-b border-emerald-800/50 bg-emerald-900 px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <Link
              href="/cliente/busca"
              className="rounded-lg p-2 text-emerald-100 hover:bg-emerald-800"
              aria-label="Voltar"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="min-w-0 flex-1 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-200">
                Modo corredor
              </p>
              <h1 className="truncate text-sm font-bold">
                {sessao?.mercadoNome ?? 'Mercado'}
              </h1>
            </div>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-lg p-2 text-emerald-100 hover:bg-emerald-800"
              aria-label="Atualizar"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
          </div>
          {sessao && (
            <div className="mt-2 flex justify-center">
              <Link
                href={`/cliente/scan?mercadoId=${encodeURIComponent(sessao.mercadoId)}`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-800/80 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
              >
                <ScanLine className="h-3.5 w-3.5" />
                Scan etiqueta
              </Link>
            </div>
          )}
          {sessao && (
            <p className="mt-1 flex items-center justify-center gap-1 text-[11px] text-emerald-200">
              <MapPin className="h-3 w-3" />
              {sessao.unidadeNome}
            </p>
          )}
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-emerald-950">
            <div
              className="h-full bg-emerald-400 transition-all duration-300"
              style={{ width: `${progresso}%` }}
            />
          </div>
          <p className="mt-1 text-center text-xs text-emerald-100">
            {comprados.size}/{corredor.length} itens · R${' '}
            {totalCorredor.toFixed(2).replace('.', ',')}
          </p>
          <div className="mt-3 border-t border-emerald-800/60 pt-3">
            <GeofenceRaioSelector
              dark
              compact
              onChange={() => window.location.reload()}
            />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-3 py-4">
          {loading && (
            <p className="py-8 text-center text-sm text-gray-400">Localizando mercado…</p>
          )}
          {geoMsg && !loading && (
            <p className="mb-4 rounded-lg bg-amber-900/40 px-3 py-2 text-sm text-amber-100">
              {geoMsg}
            </p>
          )}
          {!loading && corredor.length === 0 && (
            <div className="py-12 text-center">
              <ShoppingCart className="mx-auto h-12 w-12 text-gray-600" />
              <p className="mt-3 text-sm text-gray-400">Sua lista está vazia.</p>
              <Link
                href="/cliente/busca"
                className="mt-4 inline-block text-sm font-semibold text-emerald-400"
              >
                Adicionar produtos →
              </Link>
            </div>
          )}
          <ul className="space-y-2">
            {corredor.map((item) => {
              const ok = comprados.has(item.id);
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => toggleComprado(item.id)}
                    className={`flex w-full items-start gap-3 rounded-xl border px-4 py-4 text-left transition ${
                      ok
                        ? 'border-emerald-700/50 bg-emerald-950/40 opacity-70'
                        : 'border-gray-700 bg-gray-900 active:scale-[0.99]'
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 ${
                        ok ? 'border-emerald-400 bg-emerald-500 text-white' : 'border-gray-500'
                      }`}
                    >
                      {ok ? <Check className="h-4 w-4" /> : <Circle className="h-4 w-4 text-gray-600" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={`block font-semibold leading-snug ${ok ? 'line-through text-gray-500' : ''}`}
                      >
                        {item.nome}
                      </span>
                      <span className="mt-1 flex flex-wrap gap-2 text-xs text-gray-400">
                        <span>×{item.quantidade}</span>
                        <span className="font-medium text-emerald-300">
                          R$ {item.precoExibido.toFixed(2).replace('.', ',')}
                        </span>
                        {item.emPromocao && (
                          <span className="rounded bg-violet-900/60 px-1 text-violet-200">Promo</span>
                        )}
                        {!item.noMercadoAtual && (
                          <span className="text-amber-400">Outra loja na lista</span>
                        )}
                        {!item.disponivel && (
                          <span className="text-red-400">Indisponível agora</span>
                        )}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </main>

        <footer className="sticky bottom-0 border-t border-gray-800 bg-gray-950 p-4 pb-6">
          <button
            type="button"
            onClick={() => void finalizar()}
            disabled={corredor.length === 0}
            className="w-full rounded-xl bg-emerald-500 py-4 text-base font-bold text-gray-950 disabled:opacity-40"
          >
            Finalizar ({pendentes.length} pendente{pendentes.length !== 1 ? 's' : ''})
          </button>
          <p className="mt-2 text-center text-[10px] text-gray-500">
            Lista ativa: R$ {total.toFixed(2).replace('.', ',')} · check-in registrado
          </p>
        </footer>
      </div>
    </DashboardLayout>
  );
}
