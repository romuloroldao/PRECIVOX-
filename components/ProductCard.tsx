'use client';

import { useCallback, useMemo, useState } from 'react';
import { useMercadoSelos } from '@/app/hooks/useMercadoSelos';
import { MercadoSeloBadge } from '@/components/cliente/MercadoSeloBadge';
import { useLista } from '@/app/context/ListaContext';
import { Produto } from '@/app/hooks/useProdutos';
import { useToast } from '@/components/ToastContainer';
import { recordProdutoSubstituicaoAceita } from '@/lib/events/frontend-events';
import { inferirAcaoElAoAdicionar, registrarRespostaEl } from '@/lib/el-sugestao-client';
import { ShoppingCart, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, Button, ProductImage } from '@/components/ui';
import { UX } from '@/lib/ux-copy';
import { PrecoTruthBadge } from '@/components/cliente/PrecoTruthBadge';
import { EconomiaLiquidaChip } from '@/components/cliente/EconomiaLiquidaChip';
import { PrecoCrowdActions } from '@/components/cliente/PrecoCrowdActions';
import { EsperaQueValeChip } from '@/components/cliente/EsperaQueValeChip';
import { AtacadoVarejoChip } from '@/components/cliente/AtacadoVarejoChip';
import { SkuNacionalChip } from '@/components/cliente/SkuNacionalChip';

interface ProductCardProps {
  produtos: Produto[];
  onAdicionar?: () => void;
  /** Callback para abrir a lista lateral — usado no toast "Ver lista". */
  onAbrirLista?: () => void;
}

export function ProductCard({ produtos, onAdicionar, onAbrirLista }: ProductCardProps) {
  const { adicionarItem, listaAtivaId } = useLista();
  const { listaAdicionado } = useToast();
  const mercadoIds = useMemo(
    () => [...new Set(produtos.map((p) => p.unidade?.mercado?.id).filter(Boolean) as string[])],
    [produtos]
  );
  const selosMercado = useMercadoSelos(mercadoIds);

  const handleAdicionar = (produto: Produto) => {
    const el = produto.melhorAlternativa?.economiaLiquida;
    const mid = produto.unidade?.mercado?.id;
    if (el && mid) {
      const acao = inferirAcaoElAoAdicionar(el.recomendacao);
      if (acao) {
        registrarRespostaEl(
          {
            estoqueId: produto.estoqueId,
            produtoCatalogoId: produto.produtoCatalogoId ?? produto.produto?.id,
            mercadoOrigemId: mid,
            melhorAlternativa: produto.melhorAlternativa,
          },
          acao
        );
      }
    }
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
      imagemThumb: produto.imagemThumb,
      imagemStatus: produto.imagemStatus,
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

  const registrarSubstituicao = useCallback(
    (origem: Produto, substituto: Produto, modo: 'categoria' | 'equivalente') => {
      const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') || 'anonymous' : 'anonymous';
      const mid = origem.unidade?.mercado?.id ?? '';
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
          seloMercado={selosMercado[produto.unidade?.mercado?.id ?? '']?.selo ?? null}
          seloCurto={selosMercado[produto.unidade?.mercado?.id ?? '']?.seloCurto ?? null}
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
  const [detalhesAbertos, setDetalhesAbertos] = useState(false);
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
  const mercadoId = produto.unidade?.mercado?.id ?? '';

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
          {/* Imagem do produto — reconhecimento sem competir com preço/ações */}
          <div className="relative">
            <ProductImage
              src={produto.imagem}
              thumbSrc={produto.imagemThumb}
              alt={produto.nome}
              size="card"
              status={produto.imagemStatus}
            />
            {produto.emPromocao && (
              <div className="absolute top-2 right-2 rounded-full bg-promo-500 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white shadow-sm">
                Promoção
              </div>
            )}
          </div>

          {/* Conteúdo do card — hierarquia simplificada */}
          <div className="p-4 md:p-5">
            <h3 className="mb-2 line-clamp-2 text-sm font-semibold text-text-primary md:text-base">
              {produto.nome}
            </h3>

            <div className="mb-3 flex items-baseline gap-2">
              {produto.emPromocao && produto.precoPromocional ? (
                <>
                  <span className="text-xl font-bold text-success-600 md:text-2xl">
                    R$ {produto.precoPromocional.toFixed(2).replace('.', ',')}
                  </span>
                  <span className="text-sm text-text-tertiary line-through">
                    R$ {produto.preco.toFixed(2).replace('.', ',')}
                  </span>
                </>
              ) : (
                <span className="text-xl font-bold text-text-primary md:text-2xl">
                  R$ {produto.preco.toFixed(2).replace('.', ',')}
                </span>
              )}
            </div>

            <p className="mb-4 text-sm text-text-secondary">
              {produto.unidade?.mercado?.nome ?? 'Mercado'}
              {seloMercado && (
                <MercadoSeloBadge
                  selo={seloMercado}
                  seloCurto={seloCurto}
                  compact
                  className="ml-1 align-middle"
                />
              )}
            </p>

            <Button
              variant={produto.disponivel ? 'primary' : 'ghost'}
              size="md"
              icon={ShoppingCart}
              onClick={() => onAdicionar(produto)}
              disabled={!produto.disponivel}
              className="w-full"
            >
              {produto.disponivel ? UX.produto.adicionar : 'Indisponível'}
            </Button>

            {/* Detalhes secundários — progressive disclosure */}
            {(produto.marca ||
              produto.categoria ||
              produto.truth ||
              produto.melhorAlternativa ||
              produto.provaSocial ||
              pid ||
              produto.referenciaRegiao) && (
              <button
                type="button"
                onClick={() => setDetalhesAbertos(!detalhesAbertos)}
                className="mt-3 flex w-full items-center justify-center gap-1 py-2 text-xs font-medium text-primary-600 hover:text-primary-700"
                aria-expanded={detalhesAbertos}
              >
                {detalhesAbertos ? UX.produto.ocultarDetalhes : UX.produto.verDetalhes}
                {detalhesAbertos ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </button>
            )}

            {detalhesAbertos && (
              <div className="mt-2 space-y-2 border-t border-slate-100 pt-3">
                {produto.marca && (
                  <p className="text-xs text-text-secondary">Marca: {produto.marca}</p>
                )}
                {produto.categoria && (
                  <p className="text-xs text-text-secondary">Categoria: {produto.categoria}</p>
                )}
                <p className="text-xs text-text-tertiary">
                  {produto.unidade?.nome ?? '—'} — {produto.unidade?.cidade ?? '—'}
                </p>
                {produto.truth && (
                  <PrecoTruthBadge
                    compact
                    verificadoEm={produto.truth.verificadoEm}
                    atualizadoEm={produto.truth.atualizadoEm}
                    confianca={confiancaLocal ?? produto.truth.confianca}
                    fonte={produto.truth.fonte}
                  />
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
                    tracking={
                      produto.estoqueId && mercadoId
                        ? {
                            estoqueId: produto.estoqueId,
                            mercadoOrigemId: mercadoId,
                            produtoCatalogoId: pid ? String(pid) : undefined,
                          }
                        : undefined
                    }
                  />
                )}
                {produto.provaSocial?.mensagem && (
                  <p className="flex items-start gap-1 text-[11px] leading-snug text-sky-800">
                    <Users className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
                    <span>{produto.provaSocial.mensagem}</span>
                  </p>
                )}
                {pid && mercadoId && (
                  <div className="flex flex-wrap gap-1">
                    <EsperaQueValeChip produtoId={String(pid)} mercadoId={mercadoId} />
                    <AtacadoVarejoChip produtoId={String(pid)} mercadoId={mercadoId} />
                    <SkuNacionalChip produtoCatalogoId={String(pid)} mercadoId={mercadoId} />
                  </div>
                )}
                {produto.referenciaRegiao?.media != null && !produto.melhorAlternativa && (
                  <p className="text-xs text-text-secondary">
                    Média na região:{' '}
                    <span className="font-semibold">
                      R$ {produto.referenciaRegiao.media.toFixed(2).replace('.', ',')}
                    </span>
                  </p>
                )}
                {pid && blocoTroca}
              </div>
            )}
          </div>
        </Card>
  );
}

