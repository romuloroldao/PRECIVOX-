// Página Inicial - Buscar Produtos (Jornada do Cliente)
'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import ComparacaoProdutos from '@/components/ComparacaoProdutos';
import ModuloIA from '@/components/ModuloIA';
import Header from '@/components/Header';
import { SearchAutocomplete } from '@/components/SearchAutocomplete';
import { Card, Button } from '@/components/ui';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Sparkles, TrendingUp, MapPin, ArrowRight, Plus, ShoppingCart, Trash2, X } from 'lucide-react';
import { useToast } from '@/components/ToastContainer';

interface Produto {
  id: string;
  nome: string;
  preco: number;
  precoPromocional?: number | null;
  emPromocao: boolean;
  disponivel: boolean;
  quantidade: number;
  categoria?: string;
  marca?: string;
  unidade: {
    id: string;
    nome: string;
    endereco: string;
    cidade: string;
    estado: string;
    mercado: {
      id: string;
      nome: string;
    };
  };
  produto: {
    id: string;
    nome: string;
    descricao?: string;
    categoria?: string;
    marca?: string;
    codigoBarras?: string;
  };
}

interface Filtros {
  busca: string;
  categoria: string;
  marca: string;
  precoMin: string;
  precoMax: string;
  disponivel: boolean;
  emPromocao: boolean;
  mercado: string;
  cidade: string;
}

export default function HomePage() {
  const router = useRouter();
  const { success, error } = useToast();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [mercados, setMercados] = useState([]);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [marcas, setMarcas] = useState<string[]>([]);
  const [cidades, setCidades] = useState<string[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState<Filtros>({
    busca: '',
    categoria: '',
    marca: '',
    precoMin: '',
    precoMax: '',
    disponivel: true,
    emPromocao: false,
    mercado: '',
    cidade: ''
  });
  const [showFiltros, setShowFiltros] = useState(false);
  const [listaProdutos, setListaProdutos] = useState<Produto[]>([]);
  const [showLista, setShowLista] = useState(false);
  const [nomeLista, setNomeLista] = useState('');
  const [produtosComparacao, setProdutosComparacao] = useState<Produto[]>([]);
  const [showComparacao, setShowComparacao] = useState(false);
  const [showIA, setShowIA] = useState(false);
  const filtrosProntosRef = useRef(false);
  const [recentlyAdded, setRecentlyAdded] = useState<Record<string, boolean>>({});
  const addTimeoutsRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const economiaEstimativa = useMemo(() => {
    if (!produtos.length) return null;
    const economia = produtos.reduce((total, produto) => {
      if (produto.emPromocao && produto.precoPromocional && produto.precoPromocional < produto.preco) {
        return total + (produto.preco - produto.precoPromocional);
      }
      return total;
    }, 0);
    return economia > 0 ? economia : null;
  }, [produtos]);

  const produtoDestaque = useMemo(() => {
    if (!produtos.length) return null;
    const candidatos = produtos.filter((produto) => produto.disponivel && produto.preco > 0);
    const listaBase = candidatos.length ? candidatos : produtos;
    return listaBase.reduce<{ produto: Produto | null; score: number }>(
      (melhor, produto) => {
        const descontoAbsoluto =
          produto.emPromocao && produto.precoPromocional
            ? produto.preco - produto.precoPromocional
            : 0;
        const descontoPercentual =
          produto.emPromocao && produto.preco > 0 && produto.precoPromocional
            ? (produto.preco - produto.precoPromocional) / produto.preco
            : 0;
        const disponibilidadeScore = produto.disponivel ? 0.05 : 0;
        const score = descontoAbsoluto * 0.6 + descontoPercentual * 40 + disponibilidadeScore;
        if (!melhor.produto || score > melhor.score) {
          return { produto, score };
        }
        return melhor;
      },
      { produto: null, score: -Infinity },
    ).produto;
  }, [produtos]);

  const produtosListagem = useMemo(() => {
    if (!produtoDestaque) return produtos;
    return produtos.filter((produto) => produto.id !== produtoDestaque.id);
  }, [produtos, produtoDestaque]);

  const buscarProdutos = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filtros.busca) params.append('busca', filtros.busca);
      if (filtros.categoria) params.append('categoria', filtros.categoria);
      if (filtros.marca) params.append('marca', filtros.marca);
      if (filtros.precoMin) params.append('precoMin', filtros.precoMin);
      if (filtros.precoMax) params.append('precoMax', filtros.precoMax);
      if (filtros.disponivel) params.append('disponivel', 'true');
      if (filtros.emPromocao) params.append('emPromocao', 'true');
      if (filtros.mercado) params.append('mercado', filtros.mercado);
      if (filtros.cidade) params.append('cidade', filtros.cidade);

      const response = await fetch(`/api/produtos/buscar?${params.toString()}`, {
        cache: 'no-store',
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Erro ${response.status}: ${response.statusText}`;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorJson.error || errorMessage;
        } catch {
          // Se não conseguir parsear, usa o texto original
        }
        console.error('Erro ao buscar produtos:', errorMessage);
        setProdutos([]); // Define array vazio em caso de erro
        return;
      }
      
      const data = await response.json();
      const listaNormalizada = (Array.isArray(data) ? data : []).map((item: any) => {
        const toNumber = (value: any) => {
          if (typeof value === 'number' && Number.isFinite(value)) return value;
          if (typeof value === 'string') {
            const parsed = parseFloat(value.replace(',', '.'));
            if (Number.isFinite(parsed)) return parsed;
          }
          return 0;
        };

        const produto = item?.produto ?? item?.produtos ?? {};
        const unidade = item?.unidade ?? item?.unidades ?? {};
        const mercado = unidade?.mercado ?? unidade?.mercados ?? {};

        return {
          ...item,
          nome: item?.nome ?? produto?.nome ?? 'Produto sem nome',
          preco: toNumber(item?.preco ?? produto?.preco),
          precoPromocional:
            item?.precoPromocional !== undefined && item?.precoPromocional !== null
              ? toNumber(item.precoPromocional)
              : null,
          quantidade: toNumber(item?.quantidade),
          emPromocao: Boolean(item?.emPromocao),
          disponivel: Boolean(item?.disponivel),
          produto: {
            ...produto,
            id: produto?.id ?? '',
            nome: produto?.nome ?? item?.nome ?? 'Produto sem nome',
            marca: produto?.marca ?? item?.marca ?? null,
            categoria: produto?.categoria ?? item?.categoria ?? null,
          },
          unidade: {
            ...unidade,
            id: unidade?.id ?? '',
            nome: unidade?.nome ?? 'Unidade',
            cidade: unidade?.cidade ?? null,
            estado: unidade?.estado ?? null,
            mercado: {
              ...mercado,
              id: mercado?.id ?? '',
              nome: mercado?.nome ?? 'Mercado',
            },
          },
        };
      });
      setProdutos(listaNormalizada);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      setProdutos([]); // Define array vazio em caso de erro de rede
    } finally {
      setLoading(false);
    }
  }, [filtros]);

  const loadInitialData = useCallback(async () => {
    try {
      setInitialLoading(true);
      
      // Carrega mercados ativos
      try {
        const mercadosRes = await fetch('/api/public/mercados?ativo=true', {
          cache: 'no-store',
        });
        if (!mercadosRes.ok) {
          console.error(`Erro ao carregar mercados: ${mercadosRes.status} ${mercadosRes.statusText}`);
        } else {
          const mercadosData = await mercadosRes.json();
          const listaBruta = Array.isArray(mercadosData)
            ? mercadosData
            : Array.isArray(mercadosData?.mercados)
              ? mercadosData.mercados
              : Array.isArray(mercadosData?.data?.markets)
                ? mercadosData.data.markets
                : [];

          const mercadosNormalizados = listaBruta
            .map((mercado: any) => ({
              id: mercado?.id ?? mercado?.slug ?? null,
              nome: mercado?.nome ?? mercado?.name ?? 'Mercado sem nome',
              cidade: mercado?.cidade ?? mercado?.address_city ?? null,
              estado: mercado?.estado ?? mercado?.address_state ?? null,
            }))
            .filter((mercado: any) => Boolean(mercado.id));

          setMercados(mercadosNormalizados);
        }
      } catch (error) {
        console.error('Erro ao carregar mercados:', error);
        // Continua carregando outros dados mesmo se mercados falhar
      }

      // Carrega categorias e marcas únicas
      try {
        const categoriasRes = await fetch('/api/produtos/categorias', {
          cache: 'no-store',
        });
        if (!categoriasRes.ok) {
          console.error(`Erro ao carregar categorias: ${categoriasRes.status} ${categoriasRes.statusText}`);
        } else {
          const categoriasData = await categoriasRes.json();
          setCategorias(Array.isArray(categoriasData) ? categoriasData : []);
        }
      } catch (error) {
        console.error('Erro ao carregar categorias:', error);
      }

      try {
        const marcasRes = await fetch('/api/produtos/marcas', {
          cache: 'no-store',
        });
        if (!marcasRes.ok) {
          console.error(`Erro ao carregar marcas: ${marcasRes.status} ${marcasRes.statusText}`);
        } else {
          const marcasData = await marcasRes.json();
          setMarcas(Array.isArray(marcasData) ? marcasData : []);
        }
      } catch (error) {
        console.error('Erro ao carregar marcas:', error);
      }

      // Carrega cidades
      try {
        const cidadesRes = await fetch('/api/unidades/cidades', {
          cache: 'no-store',
        });
        if (!cidadesRes.ok) {
          console.error(`Erro ao carregar cidades: ${cidadesRes.status} ${cidadesRes.statusText}`);
        } else {
          const cidadesData = await cidadesRes.json();
          setCidades(Array.isArray(cidadesData) ? cidadesData : []);
        }
      } catch (error) {
        console.error('Erro ao carregar cidades:', error);
      }

      await buscarProdutos();
    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error);
    } finally {
      setInitialLoading(false);
    }
  }, [buscarProdutos]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    return () => {
      Object.values(addTimeoutsRef.current).forEach((timeoutId) => clearTimeout(timeoutId));
    };
  }, []);

  useEffect(() => {
    if (!filtrosProntosRef.current) {
      filtrosProntosRef.current = true;
      return;
    }
    buscarProdutos();
  }, [filtros, buscarProdutos]);

  const adicionarALista = (produto: Produto) => {
    if (!listaProdutos.find((p) => p.id === produto.id)) {
      setListaProdutos([...listaProdutos, produto]);
    }

    setRecentlyAdded((prev) => ({ ...prev, [produto.id]: true }));
    if (addTimeoutsRef.current[produto.id]) {
      clearTimeout(addTimeoutsRef.current[produto.id]);
    }
    addTimeoutsRef.current[produto.id] = setTimeout(() => {
      setRecentlyAdded((prev) => {
        const novoEstado = { ...prev };
        delete novoEstado[produto.id];
        return novoEstado;
      });
      delete addTimeoutsRef.current[produto.id];
    }, 2000);
  };

  const adicionarAComparacao = (produto: Produto) => {
    if (!produtosComparacao.find(p => p.id === produto.id)) {
      setProdutosComparacao([...produtosComparacao, produto]);
    }
  };

  const removerDaLista = (produtoId: string) => {
    setListaProdutos(listaProdutos.filter(p => p.id !== produtoId));
  };

  const salvarLista = () => {
    if (listaProdutos.length === 0) {
      error('Adicione produtos à lista antes de salvar.');
      return;
    }

    if (!nomeLista.trim()) {
      error('Informe um nome para salvar sua lista.');
      return;
    }

    if (typeof window === 'undefined') {
      error('Salvamento disponível apenas no navegador.');
      return;
    }

    try {
      const lista = {
        id: Date.now().toString(),
        nome: nomeLista.trim(),
        produtos: listaProdutos.map(p => ({
          produtoId: p.produto.id,
          unidadeId: p.unidade.id,
          quantidade: 1
        })),
        total: calcularTotalLista(),
        dataCriacao: new Date().toISOString()
      };

      // Salvar no localStorage
      const listasSalvas = JSON.parse(localStorage.getItem('precivox_listas_salvas') || '[]');
      localStorage.setItem('precivox_listas_salvas', JSON.stringify([lista, ...listasSalvas]));

      success('Lista salva com sucesso!');
      setListaProdutos([]);
      setNomeLista('');
      setShowLista(false);
    } catch (storageError) {
      console.error('Erro ao salvar lista:', storageError);
      error('Não foi possível salvar a lista. Tente novamente.');
    }
  };

  const calcularTotalLista = () => {
    return listaProdutos.reduce((total, produto) => {
      const preco = produto.emPromocao && produto.precoPromocional 
        ? produto.precoPromocional 
        : produto.preco;
      return total + preco;
    }, 0);
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando produtos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gray-50">
      {/* Header */}
      <Header title="PRECIVOX - Buscar Produtos" />
      
      <main className={`transition-all duration-300 ease-in-out ${showLista ? 'md:mr-96' : 'mr-0'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Título e Navegação */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.push('/cliente/home')}
              className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Dashboard
            </button>
          </div>
          
          <div className="mb-6 space-y-4">
            <div>
              <div className="flex items-center gap-2 text-promo-600">
                <Sparkles className="h-4 w-4" strokeWidth={2} />
                <span className="text-xs font-semibold uppercase tracking-wide">Ofertas inteligentes para sua lista</span>
              </div>
              <h1 className="mt-2 text-3xl font-bold text-gray-900 sm:text-4xl">Buscar Produtos</h1>
              <p className="text-lg text-gray-600">
                Encontre os melhores preços e monte sua lista de compras com experiências mais emocionantes.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
              <motion.button
                onClick={() => setShowFiltros(true)}
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-2 rounded-full border border-promo-200 bg-promo-50 px-4 py-2 font-medium text-promo-700 shadow-sm transition-all hover:shadow-md"
              >
                <MapPin className="h-4 w-4" strokeWidth={2.5} />
                <span>Buscando em Franco da Rocha, SP</span>
                <span className="flex items-center gap-1 rounded-full bg-promo-100 px-2 py-0.5 text-xs font-semibold text-promo-600">
                  Mudar local
                  <ArrowRight className="h-3 w-3" />
                </span>
              </motion.button>
            </div>
          </div>
          
          {/* Barra de Busca Principal */}
          <div className="mt-6">
            <div className="flex gap-2">
              <SearchAutocomplete
                value={filtros.busca}
                onChange={(valor) => setFiltros((prev) => ({ ...prev, busca: valor }))}
                placeholder="Digite o produto que você procura (ex: carne, arroz, detergente...)"
              />
              <button
                onClick={buscarProdutos}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
              >
                Buscar
              </button>
            </div>
            {loading && !initialLoading && (
              <div className="mt-2 text-sm text-gray-500 flex items-center gap-2">
                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                <span>Atualizando resultados...</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Botões de Ação */}
        <div className="mb-6 flex flex-wrap items-center justify-end gap-3">
          <div className="relative group">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowFiltros(!showFiltros)}
              aria-expanded={showFiltros}
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:border-gray-300 hover:bg-gray-50"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filtros
            </motion.button>
            <span className="pointer-events-none absolute -top-12 left-1/2 w-max -translate-x-1/2 rounded-md bg-gray-900 px-3 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition-all duration-200 group-hover:-translate-y-1 group-hover:opacity-100">
              Aplique filtros rápidos para refinar sua busca
            </span>
          </div>

          {/* Botão Minha Lista - ao lado do botão Filtros */}
          <div className="relative group">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowLista(!showLista)}
              aria-expanded={showLista}
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:border-gray-300 hover:bg-gray-50"
            >
              <ShoppingCart className="h-5 w-5" />
              <span>Minha Lista</span>
              {listaProdutos.length > 0 && (
                <span className="bg-blue-600 text-white text-xs font-bold rounded-full px-2 py-0.5">
                  {listaProdutos.length > 99 ? '99+' : listaProdutos.length}
                </span>
              )}
            </motion.button>
            <span className="pointer-events-none absolute -top-12 left-1/2 w-max -translate-x-1/2 rounded-md bg-gray-900 px-3 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition-all duration-200 group-hover:-translate-y-1 group-hover:opacity-100">
              Ver sua lista de compras
            </span>
          </div>

          <div className="relative group">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowIA(!showIA)}
              aria-expanded={showIA}
              className="relative flex items-center gap-2 overflow-hidden rounded-lg bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-md transition-all hover:shadow-xl"
            >
              <span className="absolute inset-0 rounded-lg bg-white/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <motion.span
                className="absolute -inset-1 rounded-lg bg-purple-400/40 blur-xl opacity-0 group-hover:opacity-80"
                animate={showIA ? { opacity: [0.2, 0.6, 0.2] } : {}}
                transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
              />
              <svg className="relative h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <span className="relative">IA</span>
            </motion.button>
            <span className="pointer-events-none absolute -top-12 left-1/2 w-max -translate-x-1/2 rounded-md bg-gray-900 px-3 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition-all duration-200 group-hover:-translate-y-1 group-hover:opacity-100">
              Use IA para encontrar o melhor custo-benefício automaticamente
            </span>
          </div>

          <motion.button
            whileHover="hover"
            whileTap={{ scale: 0.96 }}
            onClick={() => setShowComparacao(true)}
            disabled={produtosComparacao.length === 0}
            className="flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm transition-all hover:bg-emerald-100 disabled:cursor-not-allowed disabled:border-emerald-100 disabled:bg-gray-100 disabled:text-gray-400"
          >
            <motion.svg
              variants={{ hover: { rotate: -6, scale: 1.05 } }}
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </motion.svg>
            <span>Comparar</span>
            <span className="inline-flex h-6 min-w-[2rem] items-center justify-center rounded-full bg-white/80 px-2 text-xs font-bold">
              {produtosComparacao.length}
            </span>
          </motion.button>

        </div>

        {economiaEstimativa && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-white to-emerald-50 p-6 shadow-sm"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <TrendingUp className="h-6 w-6" strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
                    Economia estimada para hoje
                  </p>
                  <p className="text-lg font-semibold text-emerald-900">
                    💰 Você economizaria até{' '}
                    {economiaEstimativa.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                      minimumFractionDigits: 2,
                    })}
                    {' '}escolhendo os melhores preços!
                  </p>
                </div>
              </div>
              <motion.span
                whileHover={{ scale: 1.05 }}
                className="inline-flex items-center gap-1 rounded-full bg-white/70 px-4 py-2 text-sm font-semibold text-emerald-700 shadow-inner ring-1 ring-emerald-100"
              >
                Atualizamos os valores em tempo real
              </motion.span>
            </div>
          </motion.div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar de Filtros */}
          {showFiltros && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtros</h3>
                
                <div className="space-y-4">
                  {/* Busca */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Buscar produto
                    </label>
                    <input
                      type="text"
                      value={filtros.busca}
                      onChange={(e) => setFiltros({...filtros, busca: e.target.value})}
                      placeholder="Nome, marca ou código..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Categoria */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Categoria
                    </label>
                    <select
                      value={filtros.categoria}
                      onChange={(e) => setFiltros({...filtros, categoria: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Todas as categorias</option>
                      {categorias.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Marca */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Marca
                    </label>
                    <select
                      value={filtros.marca}
                      onChange={(e) => setFiltros({...filtros, marca: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Todas as marcas</option>
                      {marcas.map(marca => (
                        <option key={marca} value={marca}>{marca}</option>
                      ))}
                    </select>
                  </div>

                  {/* Preço */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Faixa de Preço
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        value={filtros.precoMin}
                        onChange={(e) => setFiltros({...filtros, precoMin: e.target.value})}
                        placeholder="Mín"
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="number"
                        value={filtros.precoMax}
                        onChange={(e) => setFiltros({...filtros, precoMax: e.target.value})}
                        placeholder="Máx"
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Mercado */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mercado
                    </label>
                    <select
                      value={filtros.mercado}
                      onChange={(e) => setFiltros({...filtros, mercado: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Todos os mercados</option>
                      {mercados.map((mercado: any) => {
                        const optionId = mercado?.id ?? mercado?.slug;
                        if (!optionId) return null;
                        const optionLabel = mercado?.nome ?? mercado?.name ?? 'Mercado';
                        return (
                          <option key={optionId} value={optionId}>
                            {optionLabel}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Cidade */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cidade
                    </label>
                    <select
                      value={filtros.cidade}
                      onChange={(e) => setFiltros({...filtros, cidade: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Todas as cidades</option>
                      {cidades.map(cidade => (
                        <option key={cidade} value={cidade}>{cidade}</option>
                      ))}
                    </select>
                  </div>

                  {/* Checkboxes */}
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filtros.disponivel}
                        onChange={(e) => setFiltros({...filtros, disponivel: e.target.checked})}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Apenas disponíveis</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filtros.emPromocao}
                        onChange={(e) => setFiltros({...filtros, emPromocao: e.target.checked})}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Apenas em promoção</span>
                    </label>
                  </div>

                  {/* Botão Limpar */}
                  <button
                    onClick={() => setFiltros({
                      busca: '',
                      categoria: '',
                      marca: '',
                      precoMin: '',
                      precoMax: '',
                      disponivel: true,
                      emPromocao: false,
                      mercado: '',
                      cidade: ''
                    })}
                    className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Limpar Filtros
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Lista de Produtos */}
          <div className={`${showFiltros ? 'lg:col-span-3' : 'lg:col-span-4'}`}>
            {/* Módulo de IA */}
            {showIA && (
              <div className="mb-8">
                <ModuloIA onRecomendacaoClick={(produtos) => {
                  // Implementar navegação para produtos recomendados
                  console.log('Produtos recomendados:', produtos);
                }} />
              </div>
            )}
            {produtos.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p className="text-gray-500 mb-2">Nenhum produto encontrado</p>
                <p className="text-sm text-gray-400">
                  {filtros.busca || filtros.categoria || filtros.marca ? 'Tente ajustar seus filtros' : 'Use os filtros para encontrar produtos'}
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {produtoDestaque && (
                  <motion.div
                    key={produtoDestaque.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative overflow-hidden rounded-3xl border border-promo-200 bg-gradient-to-r from-promo-50 via-white to-orange-50 p-6 shadow-lg"
                  >
                    <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                      <div className="max-w-xl space-y-4">
                        <span className="inline-flex items-center gap-2 rounded-full bg-promo-500 px-4 py-1 text-xs font-bold uppercase tracking-wide text-white shadow">
                          Melhor preço da cidade
                        </span>
                        <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">
                          {produtoDestaque.nome}
                        </h2>
                        <p className="text-sm text-gray-600">
                          Oferta destacada em {produtoDestaque.unidade.cidade} - {produtoDestaque.unidade.estado} no mercado {produtoDestaque.unidade.mercado.nome}.
                        </p>
                        <div className="flex flex-wrap items-center gap-4">
                          <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-black text-success-600">
                              R$ {produtoDestaque.emPromocao && produtoDestaque.precoPromocional
                                ? produtoDestaque.precoPromocional.toFixed(2)
                                : produtoDestaque.preco.toFixed(2)}
                            </span>
                            {produtoDestaque.emPromocao && produtoDestaque.precoPromocional && (
                              <span className="text-lg text-gray-500 line-through">
                                R$ {produtoDestaque.preco.toFixed(2)}
                              </span>
                            )}
                          </div>
                          {produtoDestaque.emPromocao && produtoDestaque.precoPromocional && produtoDestaque.preco > 0 && (
                            <div className="inline-flex items-center rounded-full bg-promo-100 px-3 py-1 text-xs font-semibold text-promo-700 shadow-inner">
                              {Math.round(((produtoDestaque.preco - produtoDestaque.precoPromocional) / produtoDestaque.preco) * 100)}% OFF
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-3 md:items-end">
                        <div className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                          Estoque disponível
                        </div>
                        <div className="text-base font-medium text-green-700">
                          {produtoDestaque.quantidade} unidades prontas para você
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => adicionarALista(produtoDestaque)}
                            disabled={!produtoDestaque.disponivel}
                            className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-md transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                          >
                            <Plus className="h-4 w-4" />
                            Adicionar à Lista
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => adicionarAComparacao(produtoDestaque)}
                            className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-white px-5 py-2 text-sm font-semibold text-emerald-600 shadow-sm transition-all hover:bg-emerald-50"
                          >
                            Comparar agora
                            <ArrowRight className="h-4 w-4" />
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {produtosListagem.map((produto) => {
                    const possuiPromocao =
                      produto.emPromocao && !!produto.precoPromocional && produto.precoPromocional < produto.preco;
                    const diferencaPromocao = possuiPromocao ? produto.preco - (produto.precoPromocional ?? 0) : 0;
                    const percentualPromocao =
                      possuiPromocao && produto.preco > 0
                        ? Math.round((diferencaPromocao / produto.preco) * 100)
                        : 0;
                    return (
                      <motion.div
                        key={produto.id}
                        whileHover={{ y: -6 }}
                        className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white/90 shadow-sm transition-all duration-300 hover:border-promo-200 hover:shadow-2xl"
                      >
                        <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                          <div className="h-full w-full bg-gradient-to-br from-promo-50 via-white to-transparent" />
                        </div>
                        {produto.emPromocao && (
                          <span className="absolute left-0 top-4 -rotate-3 rounded-r-lg bg-promo-500 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white shadow-md">
                            Promoção
                          </span>
                        )}
                        <div className="relative flex h-full flex-col p-6">
                          <div className="mb-4 flex items-start justify-between gap-4">
                            <h3 className="text-xl font-semibold text-gray-900 transition-colors duration-300 group-hover:text-gray-950">
                              {produto.nome}
                            </h3>
                            {percentualPromocao > 0 && (
                              <span className="rounded-full bg-promo-100 px-2 py-1 text-xs font-bold text-promo-700">
                                {percentualPromocao}% OFF
                              </span>
                            )}
                          </div>

                          <div className="mb-4 space-y-2 text-sm text-gray-500">
                            <div className="flex items-center gap-2">
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                              <span>{produto.unidade.mercado.nome}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span>{produto.unidade.cidade} - {produto.unidade.estado}</span>
                            </div>
                            {(produto.marca ?? produto.produto?.marca) && (
                              <div>
                                <span className="font-medium text-gray-600">Marca:</span>{' '}
                                <span>{produto.marca ?? produto.produto?.marca}</span>
                              </div>
                            )}
                            {(produto.categoria ?? produto.produto?.categoria) && (
                              <div>
                                <span className="font-medium text-gray-600">Categoria:</span>{' '}
                                <span>{produto.categoria ?? produto.produto?.categoria}</span>
                              </div>
                            )}
                          </div>

                          <div className="mb-6 flex items-end justify-between">
                            <div>
                              {possuiPromocao ? (
                                <>
                                  <div className="text-3xl font-black text-success-600">
                                    R$ {(produto.precoPromocional ?? produto.preco).toFixed(2)}
                                  </div>
                                  <div className="text-sm font-semibold text-gray-400 line-through">
                                    R$ {produto.preco.toFixed(2)}
                                  </div>
                                </>
                              ) : (
                                <div className="text-3xl font-black text-gray-900">
                                  R$ {produto.preco.toFixed(2)}
                                </div>
                              )}
                            </div>
                            <div className="text-xs font-semibold uppercase tracking-wide">
                              {produto.disponivel ? (
                                <span className="text-green-600">{produto.quantidade} em estoque</span>
                              ) : (
                                <span className="text-red-600">Indisponível</span>
                              )}
                            </div>
                          </div>

                          <div className="mt-auto flex flex-col gap-2 sm:flex-row">
                            <motion.button
                              whileTap={{ scale: 0.98 }}
                              onClick={() => adicionarALista(produto)}
                              disabled={!produto.disponivel}
                              className="relative flex-1 overflow-hidden rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                            >
                              <AnimatePresence mode="wait" initial={false}>
                                {recentlyAdded[produto.id] ? (
                                  <motion.span
                                    key="added"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.2 }}
                                    className="flex items-center justify-center gap-2"
                                  >
                                    <CheckCircle2 className="h-4 w-4" />
                                    Adicionado!
                                  </motion.span>
                                ) : (
                                  <motion.span
                                    key="default"
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -6 }}
                                    transition={{ duration: 0.2 }}
                                    className="flex items-center justify-center gap-2"
                                  >
                                    <Plus className="h-4 w-4" />
                                    Adicionar à Lista
                                  </motion.span>
                                )}
                              </AnimatePresence>
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => adicionarAComparacao(produto)}
                              className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50"
                            >
                              Comparar
                              <motion.span
                                animate={{ x: [0, 3, 0] }}
                                transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
                                className="inline-flex"
                              >
                                <ArrowRight className="h-4 w-4" />
                              </motion.span>
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        </div>
      </main>

      {/* Botão flutuante lateral (meio da página) - Desktop / Canto inferior direito - Mobile - Apenas ícone */}
      {!showLista && (
        <button
          id="shopping-list-float-btn"
          onClick={() => setShowLista(true)}
          title="Minha Lista de Compras"
          aria-label="Abrir lista de compras"
          className="flex items-center justify-center relative"
        >
          <ShoppingCart className="w-5 h-5" />
          {listaProdutos.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-white/90 text-blue-600 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {listaProdutos.length > 99 ? '99+' : listaProdutos.length}
            </span>
          )}
        </button>
      )}

      {/* Sidebar lateral da Lista - Funciona igual ao painel de Filtros */}
      {showLista && (
        <aside
          className={`
            fixed top-0 right-0 h-full w-full md:w-96 z-50
            bg-white shadow-lg
            transition-transform duration-300 ease-in-out
            flex flex-col
          `}
        >
          {/* Header da Sidebar */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-text-primary" />
              <span className="font-semibold text-text-primary">Minha Lista de Compras</span>
              {listaProdutos.length > 0 && (
                <span className="bg-success-100 text-success-700 px-2 py-0.5 rounded-full text-xs font-bold">
                  {listaProdutos.length}
                </span>
              )}
            </div>
            <button
              onClick={() => setShowLista(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Fechar lista"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Conteúdo da Sidebar */}
          <div className="flex-1 overflow-y-auto p-4">
            {listaProdutos.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center text-text-secondary py-12 px-4">
                <ShoppingCart className="w-16 h-16 mb-4 text-gray-300" />
                <p className="text-lg font-medium text-text-primary mb-2">Sua lista está vazia</p>
                <p className="text-sm text-text-secondary">Adicione produtos à sua lista de compras.</p>
              </div>
            ) : (
              <div className="space-y-3 pb-28">
                {listaProdutos.map((produto) => {
                  const precoFinal = produto.emPromocao && produto.precoPromocional ? produto.precoPromocional : produto.preco;
                  
                  return (
                    <Card key={produto.id} variant="default" className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-gray-400 text-2xl">📦</span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-text-primary text-sm line-clamp-2 mb-1">
                            {produto.produto.nome}
                          </h4>
                          <p className="text-xs text-text-secondary mb-2">
                            {produto.unidade.mercado.nome} - {produto.unidade.cidade}
                          </p>

                          <div className="mb-2">
                            {produto.emPromocao && produto.precoPromocional ? (
                              <div className="flex items-baseline gap-1">
                                <span className="text-sm font-bold text-success-600">
                                  R$ {produto.precoPromocional.toFixed(2).replace('.', ',')}
                                </span>
                                <span className="text-xs text-text-tertiary line-through">
                                  R$ {produto.preco.toFixed(2).replace('.', ',')}
                                </span>
                              </div>
                            ) : (
                              <span className="text-sm font-bold text-text-primary">
                                R$ {produto.preco.toFixed(2).replace('.', ',')}
                              </span>
                            )}
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            icon={Trash2}
                            onClick={() => removerDaLista(produto.id)}
                            className="w-full text-error-600 hover:text-error-700 hover:bg-error-50"
                            title="Remover item"
                            aria-label="Remover item"
                          >
                            Remover
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Rodapé fixo com total e botão salvar */}
          {listaProdutos.length > 0 && (
            <div className="border-t border-gray-200 bg-white p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-text-secondary block">Total estimado</span>
                    <span className="text-2xl font-bold text-success-600">
                      R$ {calcularTotalLista().toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                  <span className="rounded-full bg-success-100 px-3 py-1 text-xs font-semibold text-success-700">
                    {listaProdutos.length} {listaProdutos.length === 1 ? 'item' : 'itens'}
                  </span>
                </div>

                <div className="space-y-2">
                  <label htmlFor="nome-lista" className="text-xs font-medium text-text-secondary">
                    Nome da lista
                  </label>
                  <input
                    id="nome-lista"
                    type="text"
                    value={nomeLista}
                    onChange={(e) => setNomeLista(e.target.value)}
                    placeholder="Ex: Compras do mês"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-success-500 focus:outline-none focus:ring-2 focus:ring-success-200"
                  />
                </div>

                <Button
                  type="button"
                  variant="success"
                  className="w-full"
                  onClick={salvarLista}
                >
                  Salvar Lista
                </Button>
              </div>
            </div>
          )}
        </aside>
      )}

      {/* Modal de Comparação */}
      {showComparacao && (
        <ComparacaoProdutos
          produtos={produtosComparacao}
          onClose={() => setShowComparacao(false)}
        />
      )}
    </div>
  );
}
