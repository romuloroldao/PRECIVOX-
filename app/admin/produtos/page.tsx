'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/DashboardLayout';
import { useToast } from '@/components/ToastContainer';
import Link from 'next/link';

interface Produto {
  id: string;
  nome: string;
  descricao?: string;
  categoria?: string;
  codigoBarras?: string;
  marca?: string;
  unidadeMedida?: string;
  ativo: boolean;
  precoMedio: string;
  quantidadeTotal: number;
  emPromocao: boolean;
  estoques: Array<{
    id: string;
    unidadeId: string;
    unidadeNome?: string;
    preco: number;
    precoPromocional?: number;
    quantidade: number;
    emPromocao: boolean;
    disponivel: boolean;
  }>;
}

export default function ProdutosPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const toast = useToast();

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState('');
  const [unidadeFilter, setUnidadeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [unidades, setUnidades] = useState<any[]>([]);

  // Debounce para busca
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); // Resetar página ao buscar
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Carregar categorias e unidades
  useEffect(() => {
    loadCategorias();
    loadUnidades();
  }, []);

  // Carregar produtos
  useEffect(() => {
    loadProdutos();
  }, [debouncedSearch, categoriaFilter, unidadeFilter, page]);

  const loadCategorias = async () => {
    try {
      const response = await fetch('/api/produtos/categorias');
      if (response.ok) {
        const data = await response.json();
        setCategorias(data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  const loadUnidades = async () => {
    try {
      const response = await fetch('/api/unidades');
      if (response.ok) {
        const data = await response.json();
        setUnidades(data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar unidades:', error);
    }
  };

  const loadProdutos = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });

      if (debouncedSearch) {
        params.append('busca', debouncedSearch);
      }
      if (categoriaFilter) {
        params.append('categoria', categoriaFilter);
      }
      if (unidadeFilter) {
        params.append('unidadeId', unidadeFilter);
      }

      const response = await fetch(`/api/produtos?${params.toString()}`);

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setProdutos(result.data || []);
          setTotalPages(result.pagination?.totalPages || 1);
          setTotal(result.pagination?.total || 0);
        } else {
          toast.error(result.error || 'Erro ao carregar produtos');
        }
      } else {
        toast.error('Erro ao carregar produtos');
      }
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      toast.error('Erro ao buscar produtos');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (produtoId: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;

    try {
      const response = await fetch(`/api/produtos/${produtoId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success('Produto excluído com sucesso!');
        await loadProdutos();
      } else {
        toast.error(result.error || 'Erro ao excluir produto');
      }
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
      toast.error('Erro ao excluir produto');
    }
  };

  // Verificar permissões
  if (session?.user && (session.user as any).role !== 'ADMIN' && (session.user as any).role !== 'GESTOR') {
    router.push('/dashboard');
    return null;
  }

  return (
    <DashboardLayout role={(session?.user as any)?.role || 'ADMIN'}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gerenciar Produtos</h1>
            <p className="text-gray-600 mt-1">Gerencie todos os produtos do sistema</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Busca */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar produtos
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nome, código de barras..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Filtro por Categoria */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoria
              </label>
              <select
                value={categoriaFilter}
                onChange={(e) => {
                  setCategoriaFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todas</option>
                {categorias.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro por Unidade */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unidade
              </label>
              <select
                value={unidadeFilter}
                onChange={(e) => {
                  setUnidadeFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todas</option>
                {unidades.map((unidade) => (
                  <option key={unidade.id} value={unidade.id}>
                    {unidade.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Tabela de Produtos */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Produtos ({total})
            </h2>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Carregando produtos...</p>
            </div>
          ) : produtos.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
              <p className="text-gray-500">Nenhum produto encontrado</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Produto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Código de Barras
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Categoria
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Preço Médio
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantidade Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {produtos.map((produto) => (
                      <tr key={produto.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {produto.nome}
                              </div>
                              {produto.marca && (
                                <div className="text-sm text-gray-500">
                                  {produto.marca}
                                </div>
                              )}
                            </div>
                            {produto.emPromocao && (
                              <span className="ml-2 px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                Promoção
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {produto.codigoBarras || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {produto.categoria || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          R$ {produto.precoMedio}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {produto.quantidadeTotal}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              produto.ativo
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {produto.ativo ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <Link
                              href={`/admin/produtos/${produto.id}`}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Editar
                            </Link>
                            {(session?.user as any)?.role === 'ADMIN' && (
                              <button
                                onClick={() => handleDelete(produto.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Excluir
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginação */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Mostrando página {page} de {totalPages} ({total} produtos)
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Anterior
                    </button>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Próxima
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

