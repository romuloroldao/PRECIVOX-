// Página Inicial - Buscar Produtos (Jornada do Cliente)
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ComparacaoProdutos from '@/components/ComparacaoProdutos';
import ModuloIA from '@/components/ModuloIA';
import Header from '@/components/Header';

interface Produto {
  id: string;
  nome: string;
  preco: number;
  precoPromocional?: number;
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
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [mercados, setMercados] = useState([]);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [marcas, setMarcas] = useState<string[]>([]);
  const [cidades, setCidades] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (filtros.busca || filtros.categoria || filtros.marca || filtros.precoMin || filtros.precoMax || filtros.disponivel || filtros.emPromocao || filtros.mercado || filtros.cidade) {
      buscarProdutos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
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

    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error);
    } finally {
      setLoading(false);
    }
  };

  const buscarProdutos = async () => {
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
        const produto = item?.produto ?? {};
        const unidade = item?.unidade ?? {};
        const mercado = unidade?.mercado ?? {};

        return {
          ...item,
          produto: {
            ...produto,
            id: produto?.id ?? '',
            nome: produto?.nome ?? 'Produto sem nome',
            marca: produto?.marca ?? null,
            categoria: produto?.categoria ?? null,
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
          emPromocao: Boolean(item?.emPromocao),
          disponivel: Boolean(item?.disponivel),
          quantidade: Number.isFinite(item?.quantidade) ? item.quantidade : 0,
          preco: typeof item?.preco === 'number' ? item.preco : 0,
          precoPromocional: typeof item?.precoPromocional === 'number' ? item.precoPromocional : null,
        };
      });
      setProdutos(listaNormalizada);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      setProdutos([]); // Define array vazio em caso de erro de rede
    } finally {
      setLoading(false);
    }
  };

  const adicionarALista = (produto: Produto) => {
    if (!listaProdutos.find(p => p.id === produto.id)) {
      setListaProdutos([...listaProdutos, produto]);
    }
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
    if (!nomeLista.trim()) {
      alert('Digite um nome para a lista');
      return;
    }

    const lista = {
      nome: nomeLista,
      produtos: listaProdutos.map(p => ({
        produtoId: p.produto.id,
        unidadeId: p.unidade.id,
        quantidade: 1
      })),
      dataCriacao: new Date().toISOString()
    };

    // Salvar no localStorage por enquanto
    const listasSalvas = JSON.parse(localStorage.getItem('listas') || '[]');
    listasSalvas.push({ ...lista, id: Date.now().toString() });
    localStorage.setItem('listas', JSON.stringify(listasSalvas));

    alert('Lista salva com sucesso!');
    setListaProdutos([]);
    setNomeLista('');
    setShowLista(false);
  };

  const calcularTotalLista = () => {
    return listaProdutos.reduce((total, produto) => {
      const preco = produto.emPromocao && produto.precoPromocional 
        ? produto.precoPromocional 
        : produto.preco;
      return total + preco;
    }, 0);
  };

  if (loading) {
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header title="PRECIVOX - Buscar Produtos" />
      
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
          
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Buscar Produtos</h1>
            <p className="text-lg text-gray-600">Encontre os melhores preços e monte sua lista de compras</p>
            <div className="mt-4 flex items-center text-sm text-gray-500">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Buscando em Franco da Rocha, SP
            </div>
          </div>
          
          {/* Barra de Busca Principal */}
          <div className="mt-6">
            <div className="flex gap-2">
              <input
                type="text"
                value={filtros.busca}
                onChange={(e) => setFiltros({...filtros, busca: e.target.value})}
                placeholder="Digite o produto que você procura (ex: carne, arroz, detergente...)"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
              />
              <button
                onClick={buscarProdutos}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
              >
                Buscar
              </button>
            </div>
          </div>
        </div>
        
        {/* Botões de Ação */}
        <div className="mb-6 flex justify-end items-center space-x-4">
            <button
              onClick={() => setShowLista(!showLista)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Minha Lista ({listaProdutos.length})
            </button>
            
            <button
              onClick={() => setShowComparacao(true)}
              disabled={produtosComparacao.length === 0}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Comparar ({produtosComparacao.length})
            </button>
            
            <button
              onClick={() => setShowFiltros(!showFiltros)}
              className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filtros
            </button>
            
            <button
              onClick={() => setShowIA(!showIA)}
              className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              IA
            </button>
        </div>
        
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {produtos.map((produto) => (
                  <div key={produto.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                          {produto.produto.nome}
                        </h3>
                        {produto.emPromocao && (
                          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded">
                            PROMOÇÃO
                          </span>
                        )}
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          {produto.unidade.mercado.nome}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {produto.unidade.cidade} - {produto.unidade.estado}
                        </div>
                        {produto.produto.marca && (
                          <div className="text-sm text-gray-600">
                            <strong>Marca:</strong> {produto.produto.marca}
                          </div>
                        )}
                        {produto.produto.categoria && (
                          <div className="text-sm text-gray-600">
                            <strong>Categoria:</strong> {produto.produto.categoria}
                          </div>
                        )}
                      </div>

                      <div className="flex justify-between items-center mb-4">
                        <div>
                          {produto.emPromocao && produto.precoPromocional ? (
                            <div>
                              <span className="text-2xl font-bold text-red-600">
                                R$ {produto.precoPromocional.toFixed(2)}
                              </span>
                              <span className="ml-2 text-lg text-gray-500 line-through">
                                R$ {produto.preco.toFixed(2)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-2xl font-bold text-gray-900">
                              R$ {produto.preco.toFixed(2)}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">
                          {produto.disponivel ? (
                            <span className="text-green-600 font-semibold">
                              {produto.quantidade} em estoque
                            </span>
                          ) : (
                            <span className="text-red-600 font-semibold">Indisponível</span>
                          )}
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <button
                          onClick={() => adicionarALista(produto)}
                          disabled={!produto.disponivel}
                          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Adicionar à Lista
                        </button>
                        <button
                          onClick={() => adicionarAComparacao(produto)}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                          Comparar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal da Lista */}
        {showLista && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
              <div className="p-6 border-b">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-gray-900">Minha Lista de Compras</h3>
                  <button
                    onClick={() => setShowLista(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-6 max-h-96 overflow-y-auto">
                {listaProdutos.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Sua lista está vazia</p>
                    <p className="text-sm text-gray-400">Adicione produtos para começar</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {listaProdutos.map((produto) => (
                      <div key={produto.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{produto.produto.nome}</h4>
                          <p className="text-sm text-gray-600">{produto.unidade.mercado.nome}</p>
                          <p className="text-sm text-gray-600">{produto.unidade.cidade}</p>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className="font-bold text-gray-900">
                            R$ {produto.emPromocao && produto.precoPromocional 
                              ? produto.precoPromocional.toFixed(2)
                              : produto.preco.toFixed(2)
                            }
                          </span>
                          <button
                            onClick={() => removerDaLista(produto.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {listaProdutos.length > 0 && (
                <div className="p-6 border-t bg-gray-50">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-semibold text-gray-900">
                      Total: R$ {calcularTotalLista().toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="flex space-x-4">
                    <input
                      type="text"
                      value={nomeLista}
                      onChange={(e) => setNomeLista(e.target.value)}
                      placeholder="Nome da lista"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={salvarLista}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Salvar Lista
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal de Comparação */}
        {showComparacao && (
          <ComparacaoProdutos
            produtos={produtosComparacao}
            onClose={() => setShowComparacao(false)}
          />
        )}
      </div>
    </div>
  );
}
