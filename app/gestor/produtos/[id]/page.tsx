'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/DashboardLayout';
import { useToast } from '@/components/ToastContainer';

interface Estoque {
  id: string;
  unidadeId: string;
  unidades: {
    id: string;
    nome: string;
    mercados: {
      id: string;
      nome: string;
    };
  };
  preco: number;
  precoPromocional?: number;
  quantidade: number;
  emPromocao: boolean;
  disponivel: boolean;
}

interface Produto {
  id: string;
  nome: string;
  descricao?: string;
  categoria?: string;
  codigoBarras?: string;
  marca?: string;
  unidadeMedida?: string;
  imagem?: string;
  ativo: boolean;
  estoques: Estoque[];
}

export default function GestorProdutoEditPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const toast = useToast();
  const produtoId = params.id as string;

  const [produto, setProduto] = useState<Produto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categorias, setCategorias] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    categoria: '',
    codigoBarras: '',
    marca: '',
    unidadeMedida: '',
    ativo: true,
  });

  const [estoquesEditados, setEstoquesEditados] = useState<Record<string, any>>({});

  // Verificar permissões
  useEffect(() => {
    if (session?.user && (session.user as any).role !== 'GESTOR') {
      toast.error('Acesso não autorizado');
      router.push('/dashboard');
    }
  }, [session, router, toast]);

  useEffect(() => {
    if (produtoId && session?.user && (session.user as any).role === 'GESTOR') {
      loadProduto();
      loadCategorias();
    }
  }, [produtoId, session]);

  const loadProduto = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/produtos/${produtoId}`);

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          const produtoData = result.data;
          setProduto(produtoData);
          setFormData({
            nome: produtoData.nome || '',
            descricao: produtoData.descricao || '',
            categoria: produtoData.categoria || '',
            codigoBarras: produtoData.codigoBarras || '',
            marca: produtoData.marca || '',
            unidadeMedida: produtoData.unidadeMedida || '',
            ativo: produtoData.ativo !== false,
          });

          // Inicializar estoques editados (apenas do mercado do gestor)
          const estoquesInicial: Record<string, any> = {};
          produtoData.estoques?.forEach((estoque: Estoque) => {
            estoquesInicial[estoque.id] = {
              preco: estoque.preco,
              precoPromocional: estoque.precoPromocional || '',
              quantidade: estoque.quantidade,
              emPromocao: estoque.emPromocao,
              disponivel: estoque.disponivel,
            };
          });
          setEstoquesEditados(estoquesInicial);
        } else {
          toast.error(result.error || 'Produto não encontrado');
          router.push('/gestor/produtos');
        }
      } else {
        if (response.status === 403) {
          toast.error('Acesso negado: você não tem permissão para editar este produto');
        } else {
          toast.error('Erro ao carregar produto');
        }
        router.push('/gestor/produtos');
      }
    } catch (error) {
      console.error('Erro ao buscar produto:', error);
      toast.error('Erro ao carregar produto');
    } finally {
      setLoading(false);
    }
  };

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

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleEstoqueChange = (estoqueId: string, field: string, value: any) => {
    setEstoquesEditados((prev) => ({
      ...prev,
      [estoqueId]: {
        ...prev[estoqueId],
        [field]: value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Atualizar produto
      const response = await fetch(`/api/produtos/${produtoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          descricao: formData.descricao || null,
          categoria: formData.categoria || null,
          codigoBarras: formData.codigoBarras || null,
          marca: formData.marca || null,
          unidadeMedida: formData.unidadeMedida || null,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Atualizar estoques
        const estoquesPromises = Object.entries(estoquesEditados).map(([estoqueId, dados]) => {
          return fetch(`/api/produtos/${produtoId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              estoqueId,
              preco: parseFloat(dados.preco) || 0,
              precoPromocional: dados.precoPromocional ? parseFloat(dados.precoPromocional) : null,
              quantidade: parseInt(dados.quantidade) || 0,
              emPromocao: dados.emPromocao || false,
              disponivel: dados.disponivel !== false,
            }),
          });
        });

        await Promise.all(estoquesPromises);

        toast.success('Produto atualizado com sucesso!');
        router.push('/gestor/produtos');
      } else {
        if (response.status === 403) {
          toast.error('Acesso negado: você não tem permissão para editar este produto');
        } else {
          toast.error(result.error || 'Erro ao atualizar produto');
        }
      }
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      toast.error('Erro ao salvar produto');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;

    try {
      const response = await fetch(`/api/produtos/${produtoId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success('Produto excluído com sucesso!');
        router.push('/gestor/produtos');
      } else {
        if (response.status === 403) {
          toast.error('Acesso negado: você não tem permissão para excluir este produto');
        } else {
          toast.error(result.error || 'Erro ao excluir produto');
        }
      }
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
      toast.error('Erro ao excluir produto');
    }
  };

  if (!session || (session.user as any).role !== 'GESTOR') {
    return null;
  }

  if (loading) {
    return (
      <DashboardLayout role="GESTOR">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-4">Carregando dados do produto...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!produto) {
    return (
      <DashboardLayout role="GESTOR">
        <div className="text-center py-8">
          <p className="text-gray-500">Produto não encontrado</p>
          <button
            onClick={() => router.push('/gestor/produtos')}
            className="mt-4 text-blue-600 hover:text-blue-800"
          >
            Voltar para listagem
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="GESTOR">
      <div className="space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600">
          <button
            onClick={() => router.push('/gestor/produtos')}
            className="hover:text-blue-600"
          >
            Produtos
          </button>
          <span>/</span>
          <span className="text-gray-900">Editar Produto</span>
        </nav>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Editar Produto</h1>
            <p className="text-gray-600 mt-1">Atualize as informações do produto</p>
          </div>
          <button
            onClick={() => router.push('/gestor/produtos')}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Voltar
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6 space-y-6">
          {/* Informações Básicas */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Informações Básicas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nome */}
              <div className="md:col-span-2">
                <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Produto *
                </label>
                <input
                  type="text"
                  id="nome"
                  name="nome"
                  required
                  value={formData.nome}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Descrição */}
              <div className="md:col-span-2">
                <label htmlFor="descricao" className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição
                </label>
                <textarea
                  id="descricao"
                  name="descricao"
                  rows={3}
                  value={formData.descricao}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Categoria */}
              <div>
                <label htmlFor="categoria" className="block text-sm font-medium text-gray-700 mb-2">
                  Categoria
                </label>
                <select
                  id="categoria"
                  name="categoria"
                  value={formData.categoria}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Selecione uma categoria</option>
                  {categorias.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Marca */}
              <div>
                <label htmlFor="marca" className="block text-sm font-medium text-gray-700 mb-2">
                  Marca
                </label>
                <input
                  type="text"
                  id="marca"
                  name="marca"
                  value={formData.marca}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Código de Barras */}
              <div>
                <label htmlFor="codigoBarras" className="block text-sm font-medium text-gray-700 mb-2">
                  Código de Barras
                </label>
                <input
                  type="text"
                  id="codigoBarras"
                  name="codigoBarras"
                  value={formData.codigoBarras}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Unidade de Medida */}
              <div>
                <label htmlFor="unidadeMedida" className="block text-sm font-medium text-gray-700 mb-2">
                  Unidade de Medida
                </label>
                <input
                  type="text"
                  id="unidadeMedida"
                  name="unidadeMedida"
                  value={formData.unidadeMedida}
                  onChange={handleFormChange}
                  placeholder="Ex: UN, KG, L"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Status */}
              <div className="md:col-span-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="ativo"
                    checked={formData.ativo}
                    onChange={handleFormChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Produto ativo</span>
                </label>
              </div>
            </div>
          </div>

          {/* Estoque por Unidade */}
          {produto.estoques && produto.estoques.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Estoque por Unidade</h2>
              <div className="space-y-4">
                {produto.estoques.map((estoque) => {
                  const estoqueEditado = estoquesEditados[estoque.id] || {};
                  return (
                    <div
                      key={estoque.id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <h3 className="font-semibold text-gray-900 mb-3">
                        {estoque.unidades.nome} - {estoque.unidades.mercados.nome}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Preço */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Preço
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={estoqueEditado.preco || estoque.preco}
                            onChange={(e) =>
                              handleEstoqueChange(estoque.id, 'preco', e.target.value)
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>

                        {/* Preço Promocional */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Preço Promocional
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={estoqueEditado.precoPromocional || estoque.precoPromocional || ''}
                            onChange={(e) =>
                              handleEstoqueChange(estoque.id, 'precoPromocional', e.target.value)
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>

                        {/* Quantidade */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Quantidade
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={estoqueEditado.quantidade || estoque.quantidade}
                            onChange={(e) =>
                              handleEstoqueChange(estoque.id, 'quantidade', e.target.value)
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>

                        {/* Em Promoção */}
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={estoqueEditado.emPromocao !== undefined ? estoqueEditado.emPromocao : estoque.emPromocao}
                            onChange={(e) =>
                              handleEstoqueChange(estoque.id, 'emPromocao', e.target.checked)
                            }
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">Em promoção</span>
                        </div>

                        {/* Disponível */}
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={estoqueEditado.disponivel !== undefined ? estoqueEditado.disponivel : estoque.disponivel}
                            onChange={(e) =>
                              handleEstoqueChange(estoque.id, 'disponivel', e.target.checked)
                            }
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">Disponível</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Botões de Ação */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <div>
              <button
                type="button"
                onClick={handleDelete}
                className="px-6 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
              >
                Excluir Produto
              </button>
            </div>
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => router.push('/gestor/produtos')}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50"
              >
                {saving ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

