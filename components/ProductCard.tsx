'use client';

import { useCallback, useState } from 'react';
import { useLista } from '@/app/context/ListaContext';
import { Produto } from '@/app/hooks/useProdutos';
import { useToast } from '@/components/ToastContainer';
import { recordProdutoSubstituicaoAceita } from '@/lib/events/frontend-events';
import { ShoppingCart } from 'lucide-react';
import { Card, Button } from '@/components/ui';

interface ProductCardProps {
  produtos: Produto[];
  onAdicionar?: () => void;
}

export function ProductCard({ produtos, onAdicionar }: ProductCardProps) {
  const { adicionarItem, listaAtivaId } = useLista();
  const { success } = useToast();

  const handleAdicionar = (produto: Produto) => {
    adicionarItem({
      id: produto.id,
      produtoCatalogoId: produto.produtoCatalogoId ?? produto.produto?.id,
      estoqueId: produto.estoqueId,
      nome: produto.nome,
      preco: produto.preco,
      precoPromocional: produto.precoPromocional,
      emPromocao: produto.emPromocao,
      quantidade: produto.quantidade,
      imagem: produto.imagem,
      categoria: produto.categoria,
      marca: produto.marca,
      unidade: produto.unidade,
    });
    success(`${produto.nome} adicionado à lista!`);
    onAdicionar?.();
  };

  const registrarSubstituicao = useCallback(
    (origem: Produto, substituto: Produto, modo: 'categoria' | 'equivalente') => {
      const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') || 'anonymous' : 'anonymous';
      const mid = origem.unidade.mercado.id;
      const origemPid = origem.produtoCatalogoId ?? origem.produto?.id;
      const subPid = substituto.produtoCatalogoId ?? substituto.produto?.id;
      if (origemPid && subPid) {
        void recordProdutoSubstituicaoAceita(userId, mid, {
          produtoId: String(origemPid),
          substitutoId: String(subPid),
          modo,
          listaId: listaAtivaId ?? undefined,
        });
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('precivox-nps-prompt', {
            detail: { gatilho: 'substituicao_aceita', delayMs: 2500, mercadoId: mid },
          })
        );
      }
    },
    [listaAtivaId]
  );

  if (produtos.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <p className="text-text-secondary text-base md:text-lg">Nenhum produto encontrado.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      {produtos.map((produto) => (
        <CardLinhaSubstituto
          key={produto.id}
          produto={produto}
          onAdicionar={handleAdicionar}
          onSubstituir={registrarSubstituicao}
        />
      ))}
    </div>
  );
}

function CardLinhaSubstituto({
  produto,
  onAdicionar,
  onSubstituir,
}: {
  produto: Produto;
  onAdicionar: (p: Produto) => void;
  onSubstituir: (origem: Produto, sub: Produto, modo: 'categoria' | 'equivalente') => void;
}) {
  const [modoSub, setModoSub] = useState<'categoria' | 'equivalente' | null>(null);
  const [subs, setSubs] = useState<Produto[]>([]);
  const [loadingSub, setLoadingSub] = useState(false);

  const pid = produto.produtoCatalogoId ?? produto.produto?.id;
  const mercadoId = produto.unidade.mercado.id;

  const carregarSubs = async (modo: 'categoria' | 'equivalente') => {
    if (!pid) return;
    setModoSub(modo);
    setLoadingSub(true);
    try {
      const q = new URLSearchParams({
        mercadoId,
        produtoId: String(pid),
        unidadeId: produto.unidade.id,
        modo,
      });
      const res = await fetch(`/api/cliente/substitutos?${q}`, { cache: 'no-store' });
      const data = await res.json();
      const raw = Array.isArray(data.substitutos) ? data.substitutos : [];
      const mapped: Produto[] = raw.map((item: Record<string, unknown>) => ({
        id: `${item.id}-${(item.unidade as { id?: string })?.id || ''}`,
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
        unidade: item.unidade as Produto['unidade'],
      }));
      setSubs(mapped);
    } catch {
      setSubs([]);
    } finally {
      setLoadingSub(false);
    }
  };

  const usarSubstituto = (sub: Produto) => {
    if (modoSub) onSubstituir(produto, sub, modoSub);
    onAdicionar(sub);
  };

  return (
        <Card
          variant="elevated"
          hover
          className="overflow-hidden"
        >
          {/* Imagem do produto */}
          <div className="relative h-48 bg-gray-100 flex items-center justify-center">
            {produto.imagem ? (
              <img
                src={produto.imagem}
                alt={produto.nome}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-gray-400 text-4xl">📦</div>
            )}
            {produto.emPromocao && (
              <div className="absolute top-2 right-2 rounded-full bg-promo-500 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white shadow-sm">
                Promoção
              </div>
            )}
          </div>

          {/* Conteúdo do card */}
          <div className="p-4 md:p-6">
            <h3 className="font-semibold text-text-primary mb-2 line-clamp-2 text-sm md:text-base">
              {produto.nome}
            </h3>

            <div className="mb-3">
              {produto.marca && (
                <p className="text-xs text-text-secondary mb-1">Marca: {produto.marca}</p>
              )}
              {produto.categoria && (
                <p className="text-xs text-text-secondary">Categoria: {produto.categoria}</p>
              )}
            </div>

            <div className="mb-4">
              <div className="flex items-baseline gap-2">
                {produto.emPromocao && produto.precoPromocional ? (
                  <>
                    <span className="text-xl md:text-2xl font-bold text-success-600">
                      R$ {produto.precoPromocional.toFixed(2).replace('.', ',')}
                    </span>
                    <span className="text-sm text-text-tertiary line-through">
                      R$ {produto.preco.toFixed(2).replace('.', ',')}
                    </span>
                  </>
                ) : (
                  <span className="text-xl md:text-2xl font-bold text-text-primary">
                    R$ {produto.preco.toFixed(2).replace('.', ',')}
                  </span>
                )}
              </div>
              {produto.referenciaRegiao?.media != null && (
                <p className="mt-2 text-xs leading-relaxed text-text-secondary">
                  Referência média na sua região:{' '}
                  <span className="font-semibold text-text-primary">
                    R$ {produto.referenciaRegiao.media.toFixed(2).replace('.', ',')}
                  </span>
                  {produto.referenciaRegiao.diferencaPct != null &&
                    Math.abs(produto.referenciaRegiao.diferencaPct) >= 12 && (
                      <span className="mt-1 block text-amber-800/90">
                        A diferença pode influenciar na lista — não é comparativo com outra rede, é só referência
                        regional.
                      </span>
                    )}
                </p>
              )}
            </div>

            <div className="mb-4">
              <p className="text-sm text-text-secondary">
                <span className="font-medium">Loja:</span> {produto.unidade.mercado.nome}
              </p>
              <p className="text-xs text-text-tertiary">
                {produto.unidade.nome} - {produto.unidade.cidade}
              </p>
            </div>

            <Button
              variant={produto.disponivel ? 'primary' : 'ghost'}
              size="md"
              icon={ShoppingCart}
              onClick={() => onAdicionar(produto)}
              disabled={!produto.disponivel}
              className="w-full"
            >
              {produto.disponivel ? 'Adicionar à lista' : 'Indisponível'}
            </Button>

            {!produto.disponivel && pid && (
              <div className="mt-4 space-y-2 rounded-lg border border-amber-200 bg-amber-50/80 p-3">
                <p className="text-xs font-semibold text-amber-950">Indisponível nesta unidade</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => carregarSubs('categoria')}
                    className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-amber-900 shadow-sm ring-1 ring-amber-200 hover:bg-amber-100"
                  >
                    Quero manter a mesma categoria
                  </button>
                  <button
                    type="button"
                    onClick={() => carregarSubs('equivalente')}
                    className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-amber-900 shadow-sm ring-1 ring-amber-200 hover:bg-amber-100"
                  >
                    Sugira equivalente
                  </button>
                </div>
                {loadingSub && <p className="text-xs text-amber-900/80">Carregando…</p>}
                {!loadingSub && subs.length > 0 && (
                  <ul className="mt-2 space-y-2">
                    {subs.slice(0, 4).map((s) => (
                      <li
                        key={s.id}
                        className="flex items-center justify-between gap-2 rounded-md bg-white/90 px-2 py-1.5 text-xs"
                      >
                        <span className="line-clamp-2 font-medium text-gray-900">{s.nome}</span>
                        <button
                          type="button"
                          onClick={() => usarSubstituto(s)}
                          className="shrink-0 rounded bg-emerald-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700"
                        >
                          Usar
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </Card>
  );
}

