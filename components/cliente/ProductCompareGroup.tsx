'use client';

import { useMemo } from 'react';
import { useLista } from '@/app/context/ListaContext';
import { Produto } from '@/app/hooks/useProdutos';
import { useToast } from '@/components/ToastContainer';
import { ShoppingCart, Trophy } from 'lucide-react';
import { Button, Card } from '@/components/ui';

type ProductCompareGroupProps = {
  produtos: Produto[];
  onAdicionar?: () => void;
  /** Callback para abrir a lista lateral — usado no toast "Ver lista". */
  onAbrirLista?: () => void;
};

function precoOferta(p: Produto): number {
  return p.emPromocao && p.precoPromocional ? p.precoPromocional : p.preco;
}

export function ProductCompareGroup({ produtos, onAdicionar, onAbrirLista }: ProductCompareGroupProps) {
  const { adicionarItem } = useLista();
  const { listaAdicionado } = useToast();

  const grupos = useMemo(() => {
    const map = new Map<string, Produto[]>();
    for (const p of produtos) {
      const key = p.produtoCatalogoId ?? p.produto?.id ?? p.id;
      const list = map.get(key) ?? [];
      list.push(p);
      map.set(key, list);
    }
    return [...map.entries()].map(([key, ofertas]) => {
      const sorted = [...ofertas].sort((a, b) => precoOferta(a) - precoOferta(b));
      return { key, ofertas: sorted, ref: sorted[0] };
    });
  }, [produtos]);

  const handleAdicionar = (produto: Produto) => {
    adicionarItem({
      id: produto.id,
      produtoCatalogoId: produto.produtoCatalogoId ?? produto.produto?.id,
      estoqueId: produto.estoqueId,
      nome: produto.nome,
      preco: produto.preco,
      precoPromocional: produto.precoPromocional,
      emPromocao: produto.emPromocao,
      // produto.quantidade é o estoque disponível; ao adicionar à lista começa em 1.
      quantidade: 1,
      imagem: produto.imagem,
      categoria: produto.categoria,
      marca: produto.marca,
      unidade: produto.unidade,
    });
    const nomeCurto = produto.nome.length > 40 ? produto.nome.slice(0, 38) + '…' : produto.nome;
    listaAdicionado(
      `${nomeCurto} adicionado`,
      onAbrirLista ? { label: 'Ver lista', onClick: onAbrirLista } : undefined
    );
    onAdicionar?.();
  };

  if (grupos.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500">Nenhuma oferta encontrada.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {grupos.map(({ key, ofertas, ref }) => {
        const menorPreco = precoOferta(ofertas[0]);
        return (
          <Card key={key} variant="elevated" className="overflow-hidden">
            <div className="border-b border-gray-100 bg-gray-50/80 px-4 py-3 md:px-5">
              <h3 className="font-semibold text-gray-900 line-clamp-2">{ref.nome}</h3>
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500">
                {ref.marca && <span>{ref.marca}</span>}
                {ref.categoria && <span>{ref.categoria}</span>}
                <span className="font-medium text-emerald-700">
                  {ofertas.length} {ofertas.length === 1 ? 'oferta' : 'ofertas'}
                </span>
              </div>
            </div>

            <ul className="divide-y divide-gray-100">
              {ofertas.map((o, idx) => {
                const preco = precoOferta(o);
                const isMelhor = idx === 0 && ofertas.length > 1;
                return (
                  <li
                    key={o.id}
                    className={`flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between md:px-5 ${
                      isMelhor ? 'bg-emerald-50/60' : 'hover:bg-gray-50/80'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-gray-900">{o.unidade.mercado.nome}</span>
                        {isMelhor && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                            <Trophy className="h-3 w-3" />
                            Menor preço
                          </span>
                        )}
                        {o.emPromocao && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                            Promo
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        {o.unidade.nome}
                        {o.unidade.cidade ? ` · ${o.unidade.cidade}` : ''}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                      <div className="text-right">
                        <p className="text-lg font-bold tabular-nums text-gray-900">
                          R$ {preco.toFixed(2).replace('.', ',')}
                        </p>
                        {idx > 0 && ofertas.length > 1 && (
                          <p className="text-[11px] text-amber-700">
                            +R$ {(preco - menorPreco).toFixed(2).replace('.', ',')} vs melhor
                          </p>
                        )}
                      </div>
                      <Button
                        variant={o.disponivel ? 'primary' : 'ghost'}
                        size="sm"
                        icon={ShoppingCart}
                        onClick={() => handleAdicionar(o)}
                        disabled={!o.disponivel}
                      >
                        Adicionar
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>
        );
      })}
    </div>
  );
}
