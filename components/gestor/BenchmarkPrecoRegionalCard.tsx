'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { BarChart3, Loader2, RefreshCw, TrendingDown, TrendingUp } from 'lucide-react';
import { REGIAO_PRECO_UI } from '@/lib/regiao-preco-ui';

interface Props {
  mercadoId?: string;
  compact?: boolean;
}

type Item = {
  id: string;
  produtoId: string;
  produtoNome: string;
  precoAtual: number;
  precoMedioRegional: number;
  diferencaPct: number;
  posicao: 'ACIMA' | 'ABAIXO' | 'ALINHADO';
  categoria: string | null;
  recomendacao: string;
};

type Resumo = {
  totalAnalisados: number;
  acimaMercado: number;
  abaixoMercado: number;
  alinhados: number;
  gapMedioPct: number;
};

const REGIOES = REGIAO_PRECO_UI;

const POSICAO_STYLE = {
  ACIMA: 'text-red-700 bg-red-50 border-red-200',
  ABAIXO: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  ALINHADO: 'text-gray-700 bg-gray-50 border-gray-200',
};

export function BenchmarkPrecoRegionalCard({ mercadoId, compact = false }: Props) {
  const [itens, setItens] = useState<Item[]>([]);
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [explicacao, setExplicacao] = useState('');
  const [regiaoPreco, setRegiaoPreco] = useState<(typeof REGIOES)[number]['id']>('cidade');
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro(null);
    const q = new URLSearchParams({
      limite: compact ? '5' : '10',
      regiaoPreco,
      raioKm: '25',
    });
    if (mercadoId) q.set('mercadoId', mercadoId);
    try {
      const res = await fetch(`/api/gestor/benchmark-preco?${q}`, {
        credentials: 'include',
        cache: 'no-store',
      });
      const json = await res.json();
      if (json.success) {
        setItens(json.data.itens ?? []);
        setResumo(json.data.resumo ?? null);
        setExplicacao(json.data.explicacao ?? '');
      } else {
        setErro(json.error ?? 'Erro ao carregar benchmark');
      }
    } catch {
      setErro('Erro de rede');
    } finally {
      setLoading(false);
    }
  }, [mercadoId, compact, regiaoPreco]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  if (loading && itens.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-500 flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Calculando benchmark regional…
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-blue-600" />
          <div>
            <h3 className="font-semibold text-gray-900">Benchmark preço regional</h3>
            <p className="text-xs text-gray-600">
              Seu catálogo vs referência agregada no bairro
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {REGIOES.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRegiaoPreco(r.id)}
              className={`px-2 py-0.5 text-xs rounded-md transition-colors ${
                regiaoPreco === r.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/80 text-gray-600 hover:bg-white'
              }`}
            >
              {r.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => void carregar()}
            className="p-1.5 rounded-lg hover:bg-white/80 text-gray-600 ml-1"
            title="Atualizar"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {erro && <p className="text-sm text-red-700">{erro}</p>}

        {resumo && resumo.totalAnalisados > 0 && (
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-lg bg-red-50 border border-red-100 p-2">
              <p className="font-bold text-red-700">{resumo.acimaMercado}</p>
              <p className="text-red-600">Acima</p>
            </div>
            <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-2">
              <p className="font-bold text-emerald-700">{resumo.abaixoMercado}</p>
              <p className="text-emerald-600">Abaixo</p>
            </div>
            <div className="rounded-lg bg-gray-50 border border-gray-100 p-2">
              <p className="font-bold text-gray-700">{resumo.gapMedioPct}%</p>
              <p className="text-gray-600">Gap médio</p>
            </div>
          </div>
        )}

        {!erro && itens.length === 0 && (
          <p className="text-sm text-gray-600">
            Sem comparações disponíveis para esta região. Verifique cadastro de cidade/UF ou aguarde mais dados agregados.
          </p>
        )}

        {itens.map((item) => (
          <div
            key={item.id}
            className="rounded-lg border border-gray-100 p-3 hover:border-gray-200 transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <Link
                  href={`/gestor/produtos/${item.produtoId}`}
                  className="font-medium text-gray-900 truncate block hover:text-blue-600"
                >
                  {item.produtoNome}
                </Link>
                {item.categoria && (
                  <p className="text-xs text-gray-500">{item.categoria}</p>
                )}
              </div>
              <span
                className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full border flex items-center gap-0.5 ${POSICAO_STYLE[item.posicao]}`}
              >
                {item.posicao === 'ACIMA' && <TrendingUp className="h-3 w-3" />}
                {item.posicao === 'ABAIXO' && <TrendingDown className="h-3 w-3" />}
                {item.diferencaPct > 0 ? '+' : ''}
                {item.diferencaPct}%
              </span>
            </div>
            <div className="flex gap-4 mt-2 text-xs text-gray-600">
              <span>
                Seu preço: <strong className="text-gray-900">R$ {item.precoAtual.toFixed(2)}</strong>
              </span>
              <span>
                Referência: <strong className="text-gray-900">R$ {item.precoMedioRegional.toFixed(2)}</strong>
              </span>
            </div>
            {!compact && (
              <p className="text-xs text-gray-500 mt-2">{item.recomendacao}</p>
            )}
          </div>
        ))}

        {explicacao && itens.length > 0 && (
          <p className="text-xs text-gray-500 border-t border-gray-100 pt-3">{explicacao}</p>
        )}

        {!compact && itens.length > 0 && (
          <Link
            href="/gestor/ia/conversao"
            className="inline-flex text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            Ver análise completa de conversão →
          </Link>
        )}
      </div>
    </div>
  );
}
