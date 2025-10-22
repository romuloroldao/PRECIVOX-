// Página de Listagem de Mercados (Admin)
'use client';

import { useState, useEffect } from 'react';
import MercadoCard from '@/components/MercadoCard';
import MercadoForm from '@/components/MercadoForm';
import Header from '@/components/Header';

export default function MercadosPage() {
  const [mercados, setMercados] = useState([]);
  const [planos, setPlanos] = useState([]);
  const [gestores, setGestores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMercado, setEditingMercado] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAtivo, setFilterAtivo] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const [mercadosRes, planosRes, gestoresRes] = await Promise.all([
        fetch('/api/mercados', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/planos', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/users?role=GESTOR', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (mercadosRes.ok) setMercados(await mercadosRes.json());
      if (planosRes.ok) setPlanos(await planosRes.json());
      if (gestoresRes.ok) setGestores(await gestoresRes.json());
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMercado = async (data: any) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/mercados', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        await loadData();
        setShowForm(false);
        alert('Mercado criado com sucesso!');
      } else {
        const error = await response.json();
        alert(error.message || 'Erro ao criar mercado');
      }
    } catch (error) {
      console.error('Erro ao criar mercado:', error);
      alert('Erro ao criar mercado');
    }
  };

  const handleUpdateMercado = async (data: any) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/mercados/${editingMercado.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        await loadData();
        setEditingMercado(null);
        setShowForm(false);
        alert('Mercado atualizado com sucesso!');
      } else {
        const error = await response.json();
        alert(error.message || 'Erro ao atualizar mercado');
      }
    } catch (error) {
      console.error('Erro ao atualizar mercado:', error);
      alert('Erro ao atualizar mercado');
    }
  };

  const handleDeleteMercado = async (mercadoId: string) => {
    if (!confirm('Tem certeza que deseja excluir este mercado?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/mercados/${mercadoId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        await loadData();
        alert('Mercado excluído com sucesso!');
      } else {
        const error = await response.json();
        alert(error.message || 'Erro ao excluir mercado');
      }
    } catch (error) {
      console.error('Erro ao excluir mercado:', error);
      alert('Erro ao excluir mercado');
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
    <div className="min-h-screen bg-gray-50">
      <Header title="PRECIVOX - Gestão de Mercados" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Cabeçalho */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestão de Mercados</h1>
          <p className="text-gray-600">Gerenciamento completo de mercados e suas unidades</p>
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

            {/* Botão Novo */}
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
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
                <p className="text-sm text-gray-400">
                  {searchTerm ? 'Tente ajustar sua busca' : 'Clique em "Novo Mercado" para começar'}
                </p>
              </div>
            ) : (
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
            )}
          </>
        )}
      </div>
    </div>
  );
}

