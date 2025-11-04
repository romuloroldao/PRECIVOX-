'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { ProductCard } from '@/components/ProductCard';
import { ProductList } from '@/components/ProductList';
import { ListaLateral } from '@/components/ListaLateral';
import { ToggleViewButton } from '@/components/ToggleViewButton';
import { useProdutos } from '@/app/hooks/useProdutos';
import { Search, Filter, X } from 'lucide-react';

export default function BuscaPage() {
  const [modo, setModo] = useState<'cards' | 'lista'>('cards');
  const [expandida, setExpandida] = useState(false);
  const [busca, setBusca] = useState('');
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);
  
  // Filtros
  const [categoria, setCategoria] = useState('');
  const [marca, setMarca] = useState('');
  const [precoMin, setPrecoMin] = useState('');
  const [precoMax, setPrecoMax] = useState('');
  const [emPromocao, setEmPromocao] = useState<boolean | undefined>(undefined);
  const [disponivel, setDisponivel] = useState<boolean | undefined>(undefined);

  const { produtos, loading, error } = useProdutos({
    busca,
    categoria: categoria || undefined,
    marca: marca || undefined,
    precoMin: precoMin ? parseFloat(precoMin) : undefined,
    precoMax: precoMax ? parseFloat(precoMax) : undefined,
    emPromocao,
    disponivel,
  });

  const limparFiltros = () => {
    setCategoria('');
    setMarca('');
    setPrecoMin('');
    setPrecoMax('');
    setEmPromocao(undefined);
    setDisponivel(undefined);
  };

  const temFiltros = categoria || marca || precoMin || precoMax || emPromocao !== undefined || disponivel !== undefined;

  return (
    <DashboardLayout role="CLIENTE">
      <div className="relative min-h-screen">
        {/* Conteúdo Principal */}
        <main
          className={`transition-all duration-300 ${
            expandida ? 'md:mr-96' : 'mr-0'
          }`}
        >
          <div className="max-w-7xl mx-auto p-6">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Buscar Produtos
              </h1>

              {/* Barra de Busca */}
              <div className="flex gap-4 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder="Digite o nome do produto, marca ou código de barras..."
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-precivox-blue focus:outline-none transition-colors"
                  />
                </div>
                <button
                  onClick={() => setFiltrosAbertos(!filtrosAbertos)}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                    filtrosAbertos || temFiltros
                      ? 'bg-precivox-blue text-white hover:bg-blue-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Filter className="w-5 h-5" />
                  <span className="hidden sm:inline">Filtros</span>
                  {temFiltros && (
                    <span className="bg-white text-precivox-blue px-2 py-0.5 rounded-full text-xs font-bold">
                      !
                    </span>
                  )}
                </button>
                <ToggleViewButton modo={modo} setModo={setModo} />
              </div>

              {/* Painel de Filtros */}
              {filtrosAbertos && (
                <div className="bg-white border-2 border-gray-200 rounded-lg p-4 mb-4 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Filtros</h3>
                    {temFiltros && (
                      <button
                        onClick={limparFiltros}
                        className="text-sm text-precivox-blue hover:underline flex items-center gap-1"
                      >
                        <X className="w-4 h-4" />
                        Limpar filtros
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Categoria
                      </label>
                      <input
                        type="text"
                        value={categoria}
                        onChange={(e) => setCategoria(e.target.value)}
                        placeholder="Ex: Alimentícios"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-precivox-blue focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Marca
                      </label>
                      <input
                        type="text"
                        value={marca}
                        onChange={(e) => setMarca(e.target.value)}
                        placeholder="Ex: Nestlé"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-precivox-blue focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Preço Mínimo
                      </label>
                      <input
                        type="number"
                        value={precoMin}
                        onChange={(e) => setPrecoMin(e.target.value)}
                        placeholder="R$ 0,00"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-precivox-blue focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Preço Máximo
                      </label>
                      <input
                        type="number"
                        value={precoMax}
                        onChange={(e) => setPrecoMax(e.target.value)}
                        placeholder="R$ 1000,00"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-precivox-blue focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="emPromocao"
                        checked={emPromocao === true}
                        onChange={(e) => setEmPromocao(e.target.checked ? true : undefined)}
                        className="w-4 h-4 text-precivox-blue border-gray-300 rounded focus:ring-precivox-blue"
                      />
                      <label htmlFor="emPromocao" className="text-sm text-gray-700">
                        Apenas produtos em promoção
                      </label>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="disponivel"
                        checked={disponivel === true}
                        onChange={(e) => setDisponivel(e.target.checked ? true : undefined)}
                        className="w-4 h-4 text-precivox-blue border-gray-300 rounded focus:ring-precivox-blue"
                      />
                      <label htmlFor="disponivel" className="text-sm text-gray-700">
                        Apenas produtos disponíveis
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Contador de resultados */}
              {!loading && (
                <div className="text-sm text-gray-600 mb-4">
                  {produtos.length} {produtos.length === 1 ? 'produto encontrado' : 'produtos encontrados'}
                </div>
              )}
            </div>

            {/* Lista de Produtos */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-precivox-blue"></div>
                <span className="ml-4 text-gray-600">Carregando produtos...</span>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <p className="text-red-800 font-medium">Erro ao carregar produtos</p>
                <p className="text-red-600 text-sm mt-1">{error}</p>
              </div>
            ) : (
              <>
                {modo === 'cards' ? (
                  <ProductCard produtos={produtos} />
                ) : (
                  <ProductList produtos={produtos} />
                )}
              </>
            )}
          </div>
        </main>

        {/* Lista Lateral */}
        <ListaLateral expandida={expandida} onToggle={() => setExpandida(!expandida)} />
      </div>
    </DashboardLayout>
  );
}

