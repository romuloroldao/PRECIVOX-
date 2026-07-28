'use client';

import { useEffect, useRef, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { ProductCard } from '@/components/ProductCard';
import { ProductList } from '@/components/ProductList';
import { ListaLateral } from '@/components/ListaLateral';
import { SearchAutocomplete } from '@/components/SearchAutocomplete';
import { CategoryFilter } from '@/components/CategoryFilter';
import { BuscaSemResultadoInteligente } from '@/components/cliente/BuscaSemResultadoInteligente';
import { ListaSugestoesInline } from '@/components/cliente/ListaSugestoesInline';
import { CatalogoMercadosResumo } from '@/components/cliente/CatalogoMercadosResumo';
import { OfertaAgregadaRegiaoChip } from '@/components/cliente/OfertaAgregadaRegiaoChip';
import { ParceiroAncoraRegiaoChip } from '@/components/cliente/ParceiroAncoraRegiaoChip';
import { PromoDirecionadaChip } from '@/components/cliente/PromoDirecionadaChip';
import { ProductCompareGroup } from '@/components/cliente/ProductCompareGroup';
import { BuscaFiltrosSheet } from '@/components/cliente/BuscaFiltrosSheet';
import { useProdutos } from '@/app/hooks/useProdutos';
import { useLista } from '@/app/context/ListaContext';
import { CompraConfirmacaoPrompt } from '@/components/cliente/CompraConfirmacaoPrompt';
import { CasaCompartilharBanner } from '@/components/cliente/casa/CasaCompartilharBanner';
import { MercadoVivoBanner } from '@/components/cliente/MercadoVivoBanner';
import { ScanInteligenteEntry } from '@/components/cliente/ScanInteligenteEntry';
import {
  Chip,
  PageHeader,
  ProductGridSkeleton,
  ErrorState,
  EmptyState,
} from '@/components/ui';
import { UX, type OrdenacaoBusca } from '@/lib/ux-copy';
import { isAiNativeShellEnabled } from '@/lib/ai-native-shell';
import {
  Filter,
  ShoppingCart,
  ChevronDown,
  ChevronUp,
  PanelRightClose,
  PanelRightOpen,
  Home,
} from 'lucide-react';
import Link from 'next/link';

const STORAGE_LISTA_COLLAPSED = 'precivox_lista_desktop_collapsed';

export default function BuscaPage() {
  const [modo, setModo] = useState<'cards' | 'lista'>('cards');
  const [expandida, setExpandida] = useState(false);
  const { totalItens, itens, total: totalLista, listaAtivaId } = useLista();
  const [promptCompraAtivo, setPromptCompraAtivo] = useState(false);
  const desktopListaInitRef = useRef(false);

  const handleToggleLista = () => {
    setExpandida((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches) {
        sessionStorage.setItem(STORAGE_LISTA_COLLAPSED, next ? '0' : '1');
      }
      return next;
    });
  };

  const handleAbrirLista = () => {
    setExpandida(true);
    if (typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches) {
      sessionStorage.setItem(STORAGE_LISTA_COLLAPSED, '0');
    }
  };

  useEffect(() => {
    if (desktopListaInitRef.current || totalItens === 0) return;
    if (typeof window === 'undefined') return;
    if (!window.matchMedia('(min-width: 1024px)').matches) return;
    if (sessionStorage.getItem(STORAGE_LISTA_COLLAPSED) === '1') return;
    desktopListaInitRef.current = true;
    setExpandida(true);
  }, [totalItens]);

  useEffect(() => {
    if (totalItens < 2) {
      setPromptCompraAtivo(false);
      return;
    }
    const t = setTimeout(() => setPromptCompraAtivo(true), 90_000);
    const onVis = () => {
      if (document.visibilityState === 'hidden' && totalItens > 0) {
        setPromptCompraAtivo(true);
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      clearTimeout(t);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [totalItens]);

  const totalItensRef = useRef<number | null>(null);
  const [mercadoSugestao, setMercadoSugestao] = useState<string | null>(null);
  const mercadoContexto = mercadoSugestao ?? itens[0]?.unidade?.mercado?.id ?? null;

  const [mercadoFiltro, setMercadoFiltro] = useState('');
  const [modoComparativo, setModoComparativo] = useState(true);
  const [ordenacao, setOrdenacao] = useState<OrdenacaoBusca>('hibrido');
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);
  const [maisOpcoesAbertas, setMaisOpcoesAbertas] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/nps/suggest-mercado', { cache: 'no-store' });
        const data = await res.json();
        if (!cancelled && data.mercadoId) setMercadoSugestao(data.mercadoId);
      } catch {
        if (!cancelled) setMercadoSugestao(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (totalItens < 3 || typeof window === 'undefined') return;
    const k = 'precivox_nps_lista3';
    if (sessionStorage.getItem(k)) return;
    sessionStorage.setItem(k, '1');
    window.dispatchEvent(
      new CustomEvent('precivox-nps-prompt', {
        detail: { gatilho: 'lista_3_itens', delayMs: 2000, mercadoId: mercadoContexto },
      })
    );
  }, [totalItens, mercadoContexto]);

  useEffect(() => {
    totalItensRef.current = totalItens;
  }, [totalItens]);

  const [busca, setBusca] = useState('');
  const [categoria, setCategoria] = useState('');
  const [marca, setMarca] = useState('');
  const [precoMin, setPrecoMin] = useState('');
  const [precoMax, setPrecoMax] = useState('');
  const [emPromocao, setEmPromocao] = useState<boolean | undefined>(undefined);
  const [disponivel, setDisponivel] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const pref = params.get('pref') || params.get('q');
    if (pref?.trim()) setBusca(pref.trim());
    if (params.get('comparar') === '1') setModoComparativo(true);
  }, []);

  const { produtos, loading, loadingMore, error, total, hasMore, loadMore } = useProdutos({
    busca,
    categoria: categoria || undefined,
    marca: marca || undefined,
    precoMin: precoMin ? parseFloat(precoMin) : undefined,
    precoMax: precoMax ? parseFloat(precoMax) : undefined,
    emPromocao,
    disponivel,
    debounceDelay: 0,
    initialLimit: modoComparativo ? 80 : 100,
    mercado: mercadoFiltro || undefined,
    includeReferencia: Boolean(mercadoFiltro),
    includeEconomia: !modoComparativo,
    includeProvaSocial: Boolean(mercadoFiltro),
    modoComparativo,
    ordenacao,
  });

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hasMore || loading || loadingMore) return;
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: '250px 0px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, loadMore]);

  const limparFiltros = () => {
    setCategoria('');
    setMarca('');
    setPrecoMin('');
    setPrecoMax('');
    setEmPromocao(undefined);
    setDisponivel(undefined);
    setMercadoFiltro('');
    setOrdenacao('hibrido');
    setBusca('');
  };

  const temFiltros = Boolean(
    categoria || marca || precoMin || precoMax || emPromocao !== undefined ||
    disponivel !== undefined || mercadoFiltro || busca || ordenacao !== 'hibrido'
  );

  const filtrosAtivosCount = [
    marca, precoMin, precoMax, mercadoFiltro,
    emPromocao !== undefined, disponivel !== undefined,
    ordenacao !== 'hibrido',
  ].filter(Boolean).length;

  const mercadoSemResultado = mercadoFiltro || mercadoContexto;

  const filtrosState = {
    categoria,
    marca,
    precoMin,
    precoMax,
    emPromocao,
    disponivel,
    mercadoFiltro,
    ordenacao,
    modoComparativo,
    modoVisual: modo,
  };

  const handleFiltrosChange = (patch: Partial<typeof filtrosState>) => {
    if (patch.marca !== undefined) setMarca(patch.marca);
    if (patch.precoMin !== undefined) setPrecoMin(patch.precoMin);
    if (patch.precoMax !== undefined) setPrecoMax(patch.precoMax);
    if (patch.emPromocao !== undefined) setEmPromocao(patch.emPromocao);
    if (patch.disponivel !== undefined) setDisponivel(patch.disponivel);
    if (patch.mercadoFiltro !== undefined) setMercadoFiltro(patch.mercadoFiltro);
    if (patch.ordenacao !== undefined) setOrdenacao(patch.ordenacao);
    if (patch.modoComparativo !== undefined) setModoComparativo(patch.modoComparativo);
    if (patch.modoVisual !== undefined) setModo(patch.modoVisual);
  };

  return (
    <DashboardLayout role="CLIENTE" fullWidth>
      <div className="flex min-h-[calc(100dvh-4rem)] flex-col lg:h-[calc(100dvh-4rem)] lg:flex-row lg:items-stretch lg:overflow-hidden">
        <main className="min-w-0 flex-1 lg:overflow-y-auto lg:overscroll-y-contain">
          <div className="mx-auto max-w-none px-4 py-4 md:px-6 md:py-6 lg:px-8 xl:max-w-[1200px]">
            <PageHeader
              title={UX.busca.titulo}
              mobileDescription={UX.busca.subtitulo}
            />

            {isAiNativeShellEnabled() && (
              <p className="mb-3 flex items-center gap-2 text-sm text-slate-600">
                <Home className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                <span>
                  Busca é um atalho.{' '}
                  <Link href="/cliente/casa" className="font-semibold text-primary-700 hover:underline">
                    Voltar à Casa
                  </Link>
                </span>
              </p>
            )}

            {/* Busca — elemento principal */}
            <div className="mb-3">
              <SearchAutocomplete
                value={busca}
                onChange={setBusca}
                placeholder={UX.busca.placeholder}
              />
            </div>

            {/* Ações essenciais — uma linha */}
            <div className="mb-3 flex items-center gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <Chip
                selected={filtrosAbertos || filtrosAtivosCount > 0}
                count={filtrosAtivosCount > 0 ? filtrosAtivosCount : undefined}
                onClick={() => setFiltrosAbertos(true)}
                aria-label={UX.busca.filtros}
              >
                <Filter className="h-4 w-4" />
                {UX.busca.filtros}
              </Chip>

              <Chip
                selected={expandida}
                variant="success"
                count={totalItens > 0 ? totalItens : undefined}
                onClick={handleToggleLista}
                aria-expanded={expandida}
                aria-controls="lista-inteligente-panel"
              >
                {expandida ? (
                  <PanelRightClose className="hidden h-4 w-4 lg:block" />
                ) : (
                  <PanelRightOpen className="hidden h-4 w-4 lg:block" />
                )}
                <ShoppingCart className="h-4 w-4 lg:hidden" />
                <span className="hidden lg:inline">
                  {expandida ? UX.busca.recolherLista : UX.busca.lista}
                </span>
                <span className="lg:hidden">{UX.busca.lista}</span>
              </Chip>
            </div>

            {/* Categorias — filtro rápido */}
            <CategoryFilter
              categoriaSelecionada={categoria}
              onCategoriaChange={setCategoria}
            />

            {/* Mais opções — progressive disclosure */}
            <button
              type="button"
              onClick={() => setMaisOpcoesAbertas(!maisOpcoesAbertas)}
              className="mt-2 flex w-full items-center justify-between rounded-lg px-1 py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
              aria-expanded={maisOpcoesAbertas}
            >
              <span>{UX.busca.maisOpcoes}</span>
              {maisOpcoesAbertas ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>

            {maisOpcoesAbertas && (
              <div className="mt-1 space-y-3 rounded-xl border border-slate-200 bg-slate-50/50 p-3">
                <MercadoVivoBanner />
                <ScanInteligenteEntry mercadoId={mercadoContexto} />
                {mercadoFiltro && (
                  <div className="flex flex-wrap gap-2">
                    <OfertaAgregadaRegiaoChip mercadoId={mercadoFiltro} />
                    <ParceiroAncoraRegiaoChip mercadoId={mercadoFiltro} />
                    <PromoDirecionadaChip mercadoId={mercadoFiltro} />
                  </div>
                )}
                <CatalogoMercadosResumo
                  mercadoFiltro={mercadoFiltro}
                  modoComparativo={modoComparativo}
                />
              </div>
            )}

            {/* Contador */}
            {!loading && total > 0 && (
              <p className="mt-3 text-xs text-slate-500">
                {UX.busca.resultados(produtos.length, total, modoComparativo)}
                {busca && <> para &quot;{busca}&quot;</>}
                {mercadoFiltro && <span className="text-primary-600"> · mercado selecionado</span>}
              </p>
            )}

            <CasaCompartilharBanner className="mt-3" />

            {/* Resultados */}
            {loading ? (
              <div className="mt-4">
                <ProductGridSkeleton count={6} />
              </div>
            ) : error ? (
              <ErrorState
                className="mt-4"
                title={UX.busca.erroTitulo}
                message={
                  error.includes('500') || error.includes('interno')
                    ? UX.busca.erroGenerico
                    : error
                }
                onRetry={() => window.location.reload()}
                retryLabel={UX.busca.tentarNovamente}
              />
            ) : produtos.length === 0 ? (
              busca.trim().length >= 2 && mercadoSemResultado ? (
                <BuscaSemResultadoInteligente
                  busca={busca}
                  mercadoId={mercadoSemResultado}
                  onEquivalenteAdicionado={() => {
                    if (typeof window !== 'undefined') {
                      window.dispatchEvent(
                        new CustomEvent('precivox-nps-prompt', {
                          detail: {
                            gatilho: 'busca_sem_resultado_adicionou_equivalente',
                            delayMs: 4000,
                            mercadoId: mercadoContexto,
                          },
                        })
                      );
                    }
                  }}
                />
              ) : (
                <EmptyState
                  className="mt-4"
                  title={UX.busca.semResultado}
                  message={
                    busca || categoria || temFiltros
                      ? UX.busca.semResultadoDica
                      : 'Ainda não há produtos disponíveis. Tente novamente mais tarde.'
                  }
                  action={
                    temFiltros
                      ? { label: UX.busca.limparFiltros, onClick: limparFiltros }
                      : undefined
                  }
                />
              )
            ) : (
              <>
                <ListaSugestoesInline mercadoId={mercadoContexto} />
                {modo === 'cards' ? (
                  modoComparativo ? (
                    <ProductCompareGroup produtos={produtos} onAbrirLista={handleAbrirLista} />
                  ) : (
                    <ProductCard produtos={produtos} onAbrirLista={handleAbrirLista} />
                  )
                ) : (
                  <ProductList produtos={produtos} onAbrirLista={handleAbrirLista} />
                )}
                {hasMore && (
                  <div className="mt-8 flex flex-col items-center gap-3 rounded-xl border border-dashed border-primary-200 bg-primary-50/30 px-4 py-6">
                    <div ref={sentinelRef} className="h-1 w-full" />
                    <button
                      type="button"
                      onClick={loadMore}
                      disabled={loadingMore}
                      className="rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 disabled:opacity-50"
                    >
                      {loadingMore
                        ? 'Carregando…'
                        : `${UX.busca.carregarMais} (+${Math.min(modoComparativo ? 80 : 100, total - produtos.length).toLocaleString('pt-BR')})`}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </main>

        <ListaLateral expandida={expandida} onToggle={handleToggleLista} />
      </div>

      <BuscaFiltrosSheet
        isOpen={filtrosAbertos}
        onClose={() => setFiltrosAbertos(false)}
        filtros={filtrosState}
        onChange={handleFiltrosChange}
        onLimpar={limparFiltros}
        temFiltros={temFiltros}
      />

      <CompraConfirmacaoPrompt
        mercadoId={mercadoContexto}
        listaId={listaAtivaId}
        itensCount={totalItens}
        valorEstimado={totalLista}
        ativo={promptCompraAtivo}
      />
    </DashboardLayout>
  );
}
