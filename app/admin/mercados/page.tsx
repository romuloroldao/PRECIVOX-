// Página de Listagem de Mercados (Admin)
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MercadoCard from '@/components/MercadoCard';
import MercadoForm from '@/components/MercadoForm';
import MarketList from '@/components/MarketList';
import Breadcrumbs from '@/components/Breadcrumbs';
import { useToast } from '@/components/ToastContainer';

type ViewMode = 'cards' | 'list';

export default function MercadosPage() {
  const router = useRouter();
  const toast = useToast();
  
  const [mercados, setMercados] = useState([]);
  const [planos, setPlanos] = useState([]);
  const [gestores, setGestores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMercado, setEditingMercado] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAtivo, setFilterAtivo] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');

  // Carregar preferência de visualização do localStorage
  useEffect(() => {
    const savedView = localStorage.getItem('mercados-view-mode');
    if (savedView === 'cards' || savedView === 'list') {
      setViewMode(savedView);
    }
  }, []);

  // Salvar preferência de visualização
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('mercados-view-mode', mode);
    toast.info(`Visualização alterada para ${mode === 'cards' ? 'cards' : 'lista'}`);
  };

  // Atalhos de teclado
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl/Cmd + N = Novo Mercado
      if ((e.ctrlKey || e.metaKey) && e.key === 'n' && !showForm) {
        e.preventDefault();
        setShowForm(true);
        toast.info('Abrindo formulário de novo mercado');
      }
      
      // ESC = Voltar/Cancelar
      if (e.key === 'Escape' && showForm) {
        e.preventDefault();
        setShowForm(false);
        setEditingMercado(null);
        toast.info('Formulário cancelado');
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showForm, toast]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Usar fetch autenticado que adiciona token automaticamente
      const { authenticatedFetch } = await import('@/lib/auth-client');
      
      const [mercadosRes, planosRes, gestoresRes] = await Promise.all([
        authenticatedFetch('/api/markets'),
        authenticatedFetch('/api/planos'),
        authenticatedFetch('/api/admin/users?role=GESTOR'),
      ]);

      if (mercadosRes.ok) {
        const response = await mercadosRes.json();
        setMercados(response.success ? response.data : []);
      }
      if (planosRes.ok) {
        const response = await planosRes.json();
        setPlanos(response.success ? response.data : []);
      }
      if (gestoresRes.ok) {
        const response = await gestoresRes.json();
        setGestores(response.success ? response.data : []);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMercado = async (data: any) => {
    try {
      // Usar fetch autenticado que adiciona token automaticamente
      const { authenticatedFetch } = await import('@/lib/auth-client');
      
      const response = await authenticatedFetch('/api/markets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        await loadData();
        setShowForm(false);
        toast.success(result.message || 'Mercado criado com sucesso!');
      } else {
        toast.error(result.error || 'Erro ao criar mercado');
      }
    } catch (error) {
      console.error('Erro ao criar mercado:', error);
      toast.error('Erro ao criar mercado');
    }
  };

  const handleUpdateMercado = async (data: any) => {
    try {
      // Usar fetch autenticado
      const { authenticatedFetch } = await import('@/lib/auth-client');
      const response = await authenticatedFetch(`/api/markets/${editingMercado.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        await loadData();
        setEditingMercado(null);
        setShowForm(false);
        toast.success(result.message || 'Mercado atualizado com sucesso!');
      } else {
        toast.error(result.error || 'Erro ao atualizar mercado');
      }
    } catch (error) {
      console.error('Erro ao atualizar mercado:', error);
      toast.error('Erro ao atualizar mercado');
    }
  };

  const handleDeleteMercado = async (mercadoId: string) => {
    if (!confirm('Tem certeza que deseja excluir este mercado?')) return;

    try {
      // Usar fetch autenticado
      const { authenticatedFetch } = await import('@/lib/auth-client');
      const response = await authenticatedFetch(`/api/markets/${mercadoId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (response.ok && result.success) {
        await loadData();
        toast.success(result.message || 'Mercado excluído com sucesso!');
      } else {
        toast.error(result.error || 'Erro ao excluir mercado');
      }
    } catch (error) {
      console.error('Erro ao excluir mercado:', error);
      toast.error('Erro ao excluir mercado');
    }
  };

  const filteredMercados = mercados.filter((mercado: any) => {
    const matchesSearch =
      mercado.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mercado.cnpj.includes(searchTerm);

    const matchesFilter =
      filterAtivo === 'all' ||
      (filterAtivo === 'ativo' && mercado.ativo) ||
      (filterAtivo === 'inativo' && !mercado.ativo);

    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumbs */}
        <Breadcrumbs />

        {/* Cabeçalho */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestão de Mercados</h1>
          <p className="text-gray-600">Gerenciamento completo de mercados e suas unidades</p>
          <div className="mt-2 text-sm text-gray-500">
            💡 <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl+N</kbd> para novo mercado • 
            <kbd className="px-2 py-1 bg-gray-100 rounded text-xs ml-1">ESC</kbd> para cancelar
          </div>
        </div>

        {/* Formulário de Criação/Edição */}
        {showForm && (
          <div className="mb-8">
            <MercadoForm
              mercado={editingMercado}
              onSubmit={editingMercado ? handleUpdateMercado : handleCreateMercado}
              onCancel={() => {
                setShowForm(false);
                setEditingMercado(null);
              }}
              planos={planos}
              gestores={gestores}
              isAdmin={true}
            />
          </div>
        )}

        {/* Barra de Ações */}
        {!showForm && (
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            {/* Busca */}
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar por nome ou CNPJ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <svg
                  className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>

            {/* Filtro */}
            <select
              value={filterAtivo}
              onChange={(e) => setFilterAtivo(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos</option>
              <option value="ativo">Ativos</option>
              <option value="inativo">Inativos</option>
            </select>

            {/* Botões de Visualização */}
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => handleViewModeChange('cards')}
                className={`px-4 py-2 flex items-center space-x-2 transition-colors ${
                  viewMode === 'cards'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
                title="Visualização em Cards"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                <span className="hidden sm:inline">Cards</span>
              </button>
              <button
                onClick={() => handleViewModeChange('list')}
                className={`px-4 py-2 flex items-center space-x-2 transition-colors border-l ${
                  viewMode === 'list'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border-gray-300'
                }`}
                title="Visualização em Lista"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                <span className="hidden sm:inline">Lista</span>
              </button>
            </div>

            {/* Botão Novo (Desktop) */}
            <button
              onClick={() => setShowForm(true)}
              className="hidden sm:flex px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Novo Mercado
            </button>
          </div>
        )}

        {/* Estatísticas */}
        {!showForm && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-full">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Total de Mercados</p>
                  <p className="text-2xl font-bold text-gray-900">{mercados.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-full">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Mercados Ativos</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {mercados.filter((m: any) => m.ativo).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-full">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Total de Unidades</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {mercados.reduce((acc: number, m: any) => acc + (m._count?.unidades || 0), 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Lista de Mercados */}
        {!showForm && (
          <>
            {filteredMercados.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
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
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
                <p className="text-gray-500 mb-2">Nenhum mercado encontrado</p>
                <p className="text-sm text-gray-400 mb-4">
                  {searchTerm ? 'Tente ajustar sua busca' : 'Clique em "Novo Mercado" para começar'}
                </p>
                {!searchTerm && (
                  <button
                    onClick={() => setShowForm(true)}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Criar Primeiro Mercado
                  </button>
                )}
              </div>
            ) : (
              <>
                {viewMode === 'cards' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredMercados.map((mercado: any) => (
                      <MercadoCard
                        key={mercado.id}
                        mercado={mercado}
                        isAdmin={true}
                        onEdit={() => {
                          setEditingMercado(mercado);
                          setShowForm(true);
                        }}
                        onDelete={() => handleDeleteMercado(mercado.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <MarketList
                    mercados={filteredMercados}
                    isAdmin={true}
                    onEdit={(mercado) => {
                      setEditingMercado(mercado);
                      setShowForm(true);
                    }}
                    onDelete={handleDeleteMercado}
                  />
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* FAB Mobile */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="sm:hidden fixed bottom-6 right-6 z-30 p-4 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label="Novo Mercado"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
