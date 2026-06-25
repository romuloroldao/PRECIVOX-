'use client';

import { useEffect, useState } from 'react';
import { Store, Info } from 'lucide-react';

type MercadoStat = {
  id: string;
  nome: string;
  produtosComEstoque: number;
  ofertas: number;
};

type Resumo = {
  mercados: MercadoStat[];
  totais: {
    mercadosAtivos: number;
    produtosUnicosGlobal: number;
    produtosCatalogoIsolado: number;
    ofertasTotal: number;
  };
  explicacao: string;
};

interface Props {
  mercadoFiltro: string;
  modoComparativo: boolean;
  className?: string;
}

export function CatalogoMercadosResumo({ mercadoFiltro, modoComparativo, className = '' }: Props) {
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch('/api/public/mercados/catalogo-resumo', { cache: 'no-store' });
        const json = await res.json();
        if (!cancelled && json.success) setResumo(json.data);
      } catch {
        if (!cancelled) setResumo(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!resumo) return null;

  const mercadoAtual = mercadoFiltro
    ? resumo.mercados.find((m) => m.id === mercadoFiltro)
    : null;

  const totalExibivel = modoComparativo
    ? mercadoAtual?.ofertas ?? resumo.totais.ofertasTotal
    : mercadoAtual?.produtosComEstoque ?? resumo.totais.produtosUnicosGlobal;

  return (
    <div
      className={`rounded-xl border border-indigo-100 bg-indigo-50/80 px-4 py-3 text-sm ${className}`}
    >
      <div className="flex items-start gap-2">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-indigo-700" />
        <div className="min-w-0 flex-1">
          {mercadoAtual ? (
            <p className="text-indigo-950">
              <strong>{mercadoAtual.nome}</strong>:{' '}
              <strong>{mercadoAtual.produtosComEstoque.toLocaleString('pt-BR')}</strong> produtos ·{' '}
              <strong>{mercadoAtual.ofertas.toLocaleString('pt-BR')}</strong> ofertas.
            </p>
          ) : (
            <p className="text-indigo-950">
              <strong>{resumo.totais.mercadosAtivos} mercados</strong> com{' '}
              <strong>{resumo.totais.produtosUnicosGlobal.toLocaleString('pt-BR')}</strong> produtos e{' '}
              <strong>{resumo.totais.ofertasTotal.toLocaleString('pt-BR')}</strong> ofertas disponíveis.
            </p>
          )}
          <p className="mt-1 text-xs leading-relaxed text-indigo-900/85">
            {modoComparativo
              ? 'Cada linha mostra o preço em um mercado diferente (até '
              : 'Cada produto aparece uma vez, com o melhor preço (até '}
            <strong>{totalExibivel.toLocaleString('pt-BR')}</strong>
            {modoComparativo ? ' ofertas).' : ' produtos).'}
            {!modoComparativo && !mercadoFiltro && (
              <>
                {' '}
                Para comparar o mesmo item em vários mercados, use{' '}
                <strong>Comparar preços</strong> nos filtros.
              </>
            )}
          </p>
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="mt-2 flex items-center gap-1 text-xs font-semibold text-indigo-800 hover:underline"
          >
            <Store className="h-3.5 w-3.5" />
            {open ? 'Ocultar' : 'Ver'} itens por mercado
          </button>
          {open && (
            <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto rounded-lg bg-white/70 p-2 text-xs text-gray-800">
              {resumo.mercados.map((m) => (
                <li key={m.id} className="flex justify-between gap-2 border-b border-indigo-50 py-1 last:border-0">
                  <span className="truncate font-medium">{m.nome}</span>
                  <span className="shrink-0 tabular-nums text-gray-600">
                    {m.produtosComEstoque.toLocaleString('pt-BR')} prod. ·{' '}
                    {m.ofertas.toLocaleString('pt-BR')} of.
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
