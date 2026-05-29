'use client';

import { useCallback, useMemo, useState } from 'react';
import { useMercadoSelos } from '@/app/hooks/useMercadoSelos';
import { MercadoSeloBadge } from '@/components/cliente/MercadoSeloBadge';
import { useLista } from '@/app/context/ListaContext';
import { Produto } from '@/app/hooks/useProdutos';
import { useToast } from '@/components/ToastContainer';
import { recordProdutoSubstituicaoAceita } from '@/lib/events/frontend-events';
import { ShoppingCart, Users } from 'lucide-react';
import { Card, Button } from '@/components/ui';
import { PrecoTruthBadge } from '@/components/cliente/PrecoTruthBadge';
import { EconomiaLiquidaChip } from '@/components/cliente/EconomiaLiquidaChip';
import { PrecoCrowdActions } from '@/components/cliente/PrecoCrowdActions';
import { EsperaQueValeChip } from '@/components/cliente/EsperaQueValeChip';
import { AtacadoVarejoChip } from '@/components/cliente/AtacadoVarejoChip';

interface ProductCardProps {
  produtos: Produto[];
  onAdicionar?: () => void;
}

export function ProductCard({ produtos, onAdicionar }: ProductCardProps) {
  const { adicionarItem, listaAtivaId } = useLista();
  const { success } = useToast();
  const mercadoIds = useMemo(
    () => [...new Set(produtos.map((p) => p.unidade.mercado.id))],
    [produtos]
  );
  const selosMercado = useMercadoSelos(mercadoIds);

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
          seloMercado={selosMercado[produto.unidade.mercado.id]?.selo ?? null}
          seloCurto={selosMercado[produto.unidade.mercado.id]?.seloCurto ?? null}
          onAdicionar={handleAdicionar}
          onSubstituir={registrarSubstituicao}
        />
      ))}
    </div>
  );
}

function CardLinhaSubstituto({
  produto,
  seloMercado,
  seloCurto,
  onAdicionar,
  onSubstituir,
}: {
  produto: Produto;
  seloMercado: string | null;
  seloCurto: string | null;
  onAdicionar: (p: Produto) => void;
  onSubstituir: (origem: Produto, sub: Produto, modo: 'categoria' | 'equivalente') => void;
}) {
  const [modoSub, setModoSub] = useState<'categoria' | 'equivalente' | null>(null);
  type SubComExplicacao = Produto & {
    explicacao?: string;
    motivos?: string[];
    economiaVsOrigem?: number | null;
    economiaPct?: number | null;
    aceitesBairro?: number;
  };
  const [subs, setSubs] = useState<SubComExplicacao[]>([]);
  const [loadingSub, setLoadingSub] = useState(false);
  const [confiancaLocal, setConfiancaLocal] = useState<number | null>(null);

  const precoExibido =
    produto.emPromocao && produto.precoPromocional ? produto.precoPromocional : produto.preco;

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
      const mapped: SubComExplicacao[] = raw.map((item: Record<string, unknown>) => ({
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
        produtoCatalogoId:
          (item.produtoCatalogoId as string) || (item.produto as { id?: string })?.id,
        produto: item.produto as Produto['produto'],
        unidade: item.unidade as Produto['unidade'],
        explicacao: item.explicacao as string | undefined,
        motivos: item.motivos as string[] | undefined,
        economiaVsOrigem: item.economiaVsOrigem as number | null | undefined,
        economiaPct: item.economiaPct as number | null | undefined,
        aceitesBairro: item.aceitesBairro as number | undefined,
      }));
      setSubs(mapped);
    } catch {
      setSubs([]);
    } finally {
      setLoadingSub(false);
    }
  };

  const usarSubstituto = (sub: SubComExplicacao) => {
    if (modoSub) onSubstituir(produto, sub, modoSub);
    onAdicionar(sub);
    setModoSub(null);
    setSubs([]);
  };

  const blocoTroca = (
    <div
      className={`mt-4 space-y-2 rounded-lg border p-3 ${
        produto.disponivel
          ? 'border-teal-200 bg-teal-50/60'
          : 'border-amber-200 bg-amber-50/80'
      }`}
    >
      <p
        className={`text-xs font-semibold ${
          produto.disponivel ? 'text-teal-950' : 'text-amber-950'
        }`}
      >
        {produto.disponivel ? 'Troca inteligente' : 'Indisponível — alternativas'}
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => carregarSubs('categoria')}
          className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-gray-800 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50"
        >
          Mesma categoria
        </button>
        <button
          type="button"
          onClick={() => carregarSubs('equivalente')}
          className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-gray-800 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50"
        >
          Equivalente
        </button>
      </div>
      {loadingSub && <p className="text-xs text-gray-600">Analisando substitutos…</p>}
      {!loadingSub && subs.length > 0 && (
        <ul className="mt-2 space-y-2">
          {subs.slice(0, 4).map((s) => (
            <li
              key={s.id}
              className="rounded-md bg-white/95 px-2.5 py-2 text-xs ring-1 ring-gray-100"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 line-clamp-2">{s.nome}</p>
                  <p className="mt-0.5 font-medium text-emerald-700">
                    R$ {(s.emPromocao && s.precoPromocional ? s.precoPromocional : s.preco)
                      .toFixed(2)
                      .replace('.', ',')}
                    {s.economiaVsOrigem != null && s.economiaVsOrigem > 0 && (
                      <span className="ml-1 text-emerald-600">
                        (−R$ {s.economiaVsOrigem.toFixed(2).replace('.', ',')})
                      </span>
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => usarSubstituto(s)}
                  className="shrink-0 rounded bg-emerald-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700"
                >
                  Usar
                </button>
              </div>
              {s.explicacao && (
                <p className="mt-1 text-[11px] leading-snug text-gray-600">{s.explicacao}</p>
              )}
              {s.motivos && s.motivos.length > 1 && (
                <ul className="mt-1 list-inside list-disc text-[10px] text-gray-500">
                  {s.motivos.slice(1, 3).map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
      {!loadingSub && modoSub && subs.length === 0 && (
        <p className="text-[11px] text-gray-500">Nenhum substituto encontrado neste modo.</p>
      )}
    </div>
  );

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
              {produto.truth && (
                <div className="mt-2">
                  <PrecoTruthBadge
                    compact
                    verificadoEm={produto.truth.verificadoEm}
                    atualizadoEm={produto.truth.atualizadoEm}
                    confianca={confiancaLocal ?? produto.truth.confianca}
                    fonte={produto.truth.fonte}
                  />
                </div>
              )}
              {produto.estoqueId && produto.disponivel && (
                <PrecoCrowdActions
                  estoqueId={produto.estoqueId}
                  precoExibido={precoExibido}
                  onFeedback={(c) => setConfiancaLocal(c)}
                />
              )}
              {produto.melhorAlternativa?.economiaLiquida && (
                <EconomiaLiquidaChip
                  recomendacao={produto.melhorAlternativa.economiaLiquida.recomendacao}
                  economiaLiquida={produto.melhorAlternativa.economiaLiquida.economiaLiquida}
                  explicacao={produto.melhorAlternativa.economiaLiquida.explicacao}
                  mercadoDestino={produto.melhorAlternativa.mercadoNome}
                  distanciaKm={produto.melhorAlternativa.distanciaKm}
                  tempoMinutos={produto.melhorAlternativa.economiaLiquida.tempoMinutos}
                />
              )}
              {produto.provaSocial?.mensagem && (
                <p className="mt-1 flex items-start gap-1 text-[11px] leading-snug text-sky-800">
                  <Users className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
                  <span>{produto.provaSocial.mensagem}</span>
                </p>
              )}
              {pid && mercadoId && (
                <>
                  <EsperaQueValeChip produtoId={String(pid)} mercadoId={mercadoId} />
                  <AtacadoVarejoChip produtoId={String(pid)} mercadoId={mercadoId} />
                </>
              )}
              {produto.referenciaRegiao?.media != null && !produto.melhorAlternativa && (
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
                {seloMercado && (
                  <MercadoSeloBadge
                    selo={seloMercado}
                    seloCurto={seloCurto}
                    compact
                    className="ml-1 align-middle"
                  />
                )}
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

            {pid && blocoTroca}
          </div>
        </Card>
  );
}

