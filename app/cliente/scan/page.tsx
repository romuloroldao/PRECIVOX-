'use client';

import { useCallback, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { useLista } from '@/app/context/ListaContext';
import type { ItemLista } from '@/app/context/ListaContext';
import {
  reconhecerTextoEtiqueta,
  detectarCodigoBarrasImagem,
} from '@/lib/scan-ocr-client';
import {
  ArrowLeft,
  Camera,
  Loader2,
  ScanLine,
  ShoppingCart,
  Sparkles,
} from 'lucide-react';
import { CrowdEtiquetaConfirm } from '@/components/cliente/CrowdEtiquetaConfirm';

type ScanMatch = {
  produtoId: string;
  estoqueId: string;
  nome: string;
  marca: string | null;
  preco: number;
  precoPromocional: number | null;
  emPromocao: boolean;
  unidadeId: string;
  unidadeNome: string;
  mercadoId: string;
  mercadoNome: string;
  score: number;
  metodo: string;
  explicacao: string;
  economiaLiquidaEtiqueta: {
    economiaLiquida: number;
    explicacao: string;
    recomendacao: string;
  } | null;
  melhorAlternativa: {
    preco: number;
    precoPromocional: number | null;
    emPromocao: boolean;
    distanciaKm: number | null;
    unidade: { nome: string; mercado: { nome: string } };
    economiaLiquida: {
      economiaLiquida: number;
      explicacao: string;
      recomendacao: string;
    };
  } | null;
};

export default function ScanInteligentePage() {
  const searchParams = useSearchParams();
  const mercadoIdUrl = searchParams.get('mercadoId');
  const { adicionarItem } = useLista();

  const inputRef = useRef<HTMLInputElement>(null);
  const [textoOcr, setTextoOcr] = useState('');
  const [precoManual, setPrecoManual] = useState('');
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [matchLoading, setMatchLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [matches, setMatches] = useState<ScanMatch[]>([]);
  const [meta, setMeta] = useState<{
    precoDetectado: number | null;
    eansDetectados: string[];
    mercadoId: string;
  } | null>(null);

  const processarImagem = useCallback(async (file: File) => {
    setErro(null);
    setOcrLoading(true);
    setOcrProgress(0);
    try {
      const eans = await detectarCodigoBarrasImagem(file);
      const texto = await reconhecerTextoEtiqueta(file, (p) =>
        setOcrProgress(Math.round((p.progress ?? 0) * 100))
      );
      const merged =
        eans.length > 0
          ? `${eans.join(' ')}\n${texto}`.trim()
          : texto;
      if (!merged) {
        setErro('Não foi possível ler a etiqueta. Tente outra foto com boa luz.');
        return;
      }
      setTextoOcr(merged);
    } catch {
      setErro('Falha no OCR. Verifique a câmera e tente novamente.');
    } finally {
      setOcrLoading(false);
    }
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void processarImagem(file);
    e.target.value = '';
  };

  const buscarMatches = async () => {
    if (textoOcr.trim().length < 2) {
      setErro('Leia ou digite o texto da etiqueta.');
      return;
    }
    setMatchLoading(true);
    setErro(null);
    setMatches([]);
    try {
      let lat: number | undefined;
      let lon: number | undefined;
      try {
        const pos = await new Promise<GeolocationPosition>((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej, {
            timeout: 8000,
            maximumAge: 60_000,
          })
        );
        lat = pos.coords.latitude;
        lon = pos.coords.longitude;
      } catch {
        /* mercado via URL ou perfil */
      }

      const precoEtiqueta = precoManual ? parseFloat(precoManual.replace(',', '.')) : undefined;

      const res = await fetch('/api/cliente/scan-inteligente', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          textoOcr: textoOcr.trim(),
          mercadoId: mercadoIdUrl ?? undefined,
          lat,
          lon,
          precoEtiqueta: Number.isFinite(precoEtiqueta!) ? precoEtiqueta : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Não foi possível encontrar o produto');
      }
      setMatches(json.data.matches ?? []);
      setMeta({
        precoDetectado: json.data.precoDetectado,
        eansDetectados: json.data.eansDetectados ?? [],
        mercadoId: json.data.mercadoId,
      });
      if (json.data.precoDetectado != null && !precoManual) {
        setPrecoManual(String(json.data.precoDetectado.toFixed(2)).replace('.', ','));
      }
      if ((json.data.matches ?? []).length === 0) {
        setErro('Nenhum produto parecido no catálogo deste mercado.');
      }
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro na busca');
    } finally {
      setMatchLoading(false);
    }
  };

  const adicionarNaLista = (m: ScanMatch) => {
    const item: ItemLista = {
      id: m.estoqueId,
      produtoCatalogoId: m.produtoId,
      estoqueId: m.estoqueId,
      nome: m.nome,
      preco: m.preco,
      precoPromocional: m.precoPromocional ?? undefined,
      emPromocao: m.emPromocao,
      quantidade: 1,
      marca: m.marca ?? undefined,
      unidade: {
        id: m.unidadeId,
        nome: m.unidadeNome,
        mercado: { id: m.mercadoId, nome: m.mercadoNome },
      },
    };
    adicionarItem(item);
  };

  const precoExibido = (m: ScanMatch) =>
    m.emPromocao && m.precoPromocional != null ? m.precoPromocional : m.preco;

  return (
    <DashboardLayout role="CLIENTE">
      <div className="mx-auto max-w-lg space-y-5 pb-24">
        <div className="flex items-center gap-3">
          <Link
            href="/cliente/home"
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
            aria-label="Voltar"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900">
              <ScanLine className="h-6 w-6 text-violet-700" />
              Escanear etiqueta
            </h1>
            <p className="text-sm text-gray-600">
              Fotografe a etiqueta e encontre o produto com o melhor preço
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-violet-200 bg-violet-50/80 p-4">
          <p className="text-sm text-violet-900">
            Aponte para a etiqueta na prateleira. A leitura acontece no seu aparelho — só o
            resultado é usado para encontrar o produto e a Economia Líquida™.
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={onFileChange}
        />

        <button
          type="button"
          disabled={ocrLoading}
          onClick={() => inputRef.current?.click()}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-700 py-4 text-base font-semibold text-white hover:bg-violet-800 disabled:opacity-60"
        >
          {ocrLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Lendo etiqueta… {ocrProgress}%
            </>
          ) : (
            <>
              <Camera className="h-5 w-5" />
              Fotografar etiqueta
            </>
          )}
        </button>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">
            Texto lido (pode editar)
          </label>
          <textarea
            value={textoOcr}
            onChange={(e) => setTextoOcr(e.target.value)}
            rows={4}
            placeholder="Nome do produto, código de barras, preço…"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">
            Preço na etiqueta (opcional)
          </label>
          <input
            type="text"
            inputMode="decimal"
            value={precoManual}
            onChange={(e) => setPrecoManual(e.target.value)}
            placeholder="Ex: 12,99"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <button
          type="button"
          disabled={matchLoading || ocrLoading}
          onClick={() => void buscarMatches()}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-violet-700 bg-white py-3 font-semibold text-violet-800 hover:bg-violet-50 disabled:opacity-60"
        >
          {matchLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Sparkles className="h-5 w-5" />
          )}
          Encontrar no catálogo
        </button>

        {erro && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
            {erro}
          </p>
        )}

        {meta && meta.eansDetectados.length > 0 && (
          <p className="text-xs text-gray-600">
            Códigos detectados: {meta.eansDetectados.join(', ')}
          </p>
        )}

        {matches.length > 0 && (
          <ul className="space-y-3">
            {matches.map((m) => (
              <li
                key={m.estoqueId}
                className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-gray-900">{m.nome}</p>
                    {m.marca && <p className="text-xs text-gray-500">{m.marca}</p>}
                    <p className="mt-1 text-lg font-bold text-emerald-700">
                      R$ {precoExibido(m).toFixed(2)}
                      {m.emPromocao && (
                        <span className="ml-2 text-xs font-medium text-amber-700">Promo</span>
                      )}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold uppercase text-violet-800">
                    {m.metodo === 'ean' ? 'EAN' : `${Math.round(m.score * 100)}%`}
                  </span>
                </div>
                <p className="mt-2 text-xs text-gray-600">{m.explicacao}</p>
                {m.economiaLiquidaEtiqueta && (
                  <p
                    className={`mt-2 text-xs font-medium ${
                      m.economiaLiquidaEtiqueta.economiaLiquida >= 0
                        ? 'text-emerald-800'
                        : 'text-amber-800'
                    }`}
                  >
                    Etiqueta · EL™: {m.economiaLiquidaEtiqueta.explicacao}
                  </p>
                )}
                {m.melhorAlternativa &&
                  (m.melhorAlternativa.economiaLiquida?.economiaLiquida ?? 0) > 0 && (
                    <div className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                      <p className="text-xs font-semibold text-emerald-900">
                        Melhor preço na região
                      </p>
                      <p className="text-xs text-emerald-800">
                        {m.melhorAlternativa.unidade?.mercado?.nome ?? 'Mercado'} ·{' '}
                        {m.melhorAlternativa.unidade?.nome ?? '—'}
                        {m.melhorAlternativa.distanciaKm != null &&
                          ` · ${m.melhorAlternativa.distanciaKm.toFixed(1)} km`}
                      </p>
                      <p className="mt-1 text-xs font-medium text-emerald-900">
                        R${' '}
                        {(m.melhorAlternativa.emPromocao &&
                        m.melhorAlternativa.precoPromocional != null
                          ? m.melhorAlternativa.precoPromocional
                          : m.melhorAlternativa.preco
                        ).toFixed(2)}{' '}
                        — {m.melhorAlternativa.economiaLiquida.explicacao}
                      </p>
                    </div>
                  )}
                <p className="mt-1 text-[11px] text-gray-500">
                  {m.mercadoNome} · {m.unidadeNome}
                </p>
                <button
                  type="button"
                  onClick={() => adicionarNaLista(m)}
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  <ShoppingCart className="h-4 w-4" />
                  Adicionar à lista
                </button>
                <CrowdEtiquetaConfirm
                  estoqueId={m.estoqueId}
                  precoCatalogo={precoExibido(m)}
                  textoOcrInicial={textoOcr}
                  precoEtiqueta={
                    meta?.precoDetectado ??
                    (precoManual ? parseFloat(precoManual.replace(',', '.')) : null)
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </DashboardLayout>
  );
}
