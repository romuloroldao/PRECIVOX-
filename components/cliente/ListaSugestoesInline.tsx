'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { useLista } from '@/app/context/ListaContext';
import type { Produto } from '@/app/hooks/useProdutos';

function mapLinhaApi(item: Record<string, unknown>): Produto {
  const u = item.unidade as Produto['unidade'];
  return {
    id: `${item.id}-${u?.id || ''}`,
    estoqueId: String(item.id),
    nome: String(item.nome ?? ''),
    preco: Number(item.preco) || 0,
    precoPromocional: item.precoPromocional ? Number(item.precoPromocional) : undefined,
    emPromocao: Boolean(item.emPromocao),
    disponivel: item.disponivel !== false,
    quantidade: Number(item.quantidade) || 0,
    categoria: String(item.categoria ?? ''),
    marca: String(item.marca ?? ''),
    imagem: (item.imagem as string) || undefined,
    produtoCatalogoId: (item.produto as { id?: string })?.id,
    produto: item.produto as Produto['produto'],
    unidade: u,
  };
}

type Props = {
  mercadoId: string | null;
};

/**
 * Bloco compacto: termos com intenção no mercado + itens com boa retenção na lista (eventos).
 */
export function ListaSugestoesInline({ mercadoId }: Props) {
  const { itens, adicionarItem } = useLista();
  const [termos, setTermos] = useState<{ termo: string; ocorrencias: number }[]>([]);
  const [retencao, setRetencao] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(false);

  const excludeCsv = useMemo(
    () =>
      itens
        .map((i) => i.produtoCatalogoId)
        .filter((x): x is string => Boolean(x))
        .join(','),
    [itens]
  );

  useEffect(() => {
    if (!mercadoId) return;
    let cancelled = false;
    setLoading(true);
    const q = new URLSearchParams({
      mercadoId,
      excludeIds: excludeCsv,
    });
    (async () => {
      try {
        const res = await fetch(`/api/cliente/sugestoes-lista?${q}`, { cache: 'no-store' });
        const data = await res.json();
        if (cancelled) return;
        setTermos(Array.isArray(data.termosIntencao) ? data.termosIntencao : []);
        const pr = Array.isArray(data.produtosRetencao) ? data.produtosRetencao : [];
        setRetencao(pr.map((x: Record<string, unknown>) => mapLinhaApi(x)));
      } catch {
        if (!cancelled) {
          setTermos([]);
          setRetencao([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mercadoId, excludeCsv]);

  if (!mercadoId || itens.length === 0) return null;

  const excludeSet = new Set(excludeCsv.split(',').filter(Boolean));
  const retencaoFiltrada = retencao.filter((p) => {
    const id = p.produtoCatalogoId ?? p.produto?.id;
    return !id || !excludeSet.has(id);
  });

  if (loading && termos.length === 0 && retencaoFiltrada.length === 0) {
    return (
      <div className="mb-6 rounded-xl border border-violet-200/80 bg-violet-50/50 px-4 py-3 text-sm text-violet-900/80">
        Carregando sugestões para sua lista…
      </div>
    );
  }

  if (termos.length === 0 && retencaoFiltrada.length === 0) return null;

  return (
    <div className="mb-6 rounded-xl border border-violet-200/80 bg-gradient-to-r from-violet-50/90 to-white p-4 shadow-sm">
      <p className="text-sm font-semibold text-violet-950">Itens que costumam fazer sentido com sua lista</p>
      <p className="mt-1 text-xs text-violet-900/75">
        Com base em buscas frequentes no app e em itens que as pessoas costumam manter na lista.
      </p>

      {termos.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {termos.slice(0, 6).map((t) => (
            <a
              key={t.termo}
              href={`/cliente/busca?pref=${encodeURIComponent(t.termo)}`}
              className="inline-flex items-center rounded-full bg-white px-3 py-1.5 text-xs font-medium text-violet-900 shadow-sm ring-1 ring-violet-200/80 hover:bg-violet-100/80"
            >
              {t.termo}
              <span className="ml-1 text-violet-500">({t.ocorrencias})</span>
            </a>
          ))}
        </div>
      )}

      {retencaoFiltrada.length > 0 && (
        <ul className="mt-4 space-y-2">
          {retencaoFiltrada.slice(0, 5).map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-violet-100 bg-white/90 px-3 py-2 text-sm"
            >
              <span className="line-clamp-2 min-w-0 font-medium text-gray-900">{p.nome}</span>
              <button
                type="button"
                onClick={() =>
                  adicionarItem({
                    id: p.id,
                    estoqueId: p.estoqueId,
                    nome: p.nome,
                    preco: p.preco,
                    precoPromocional: p.precoPromocional,
                    emPromocao: p.emPromocao,
                    quantidade: p.quantidade,
                    imagem: p.imagem,
                    categoria: p.categoria,
                    marca: p.marca,
                    unidade: p.unidade,
                    produtoCatalogoId: p.produtoCatalogoId ?? p.produto?.id,
                  })
                }
                className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-700"
              >
                <Plus className="h-3.5 w-3.5" />
                Adicionar
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
