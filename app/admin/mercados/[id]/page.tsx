// Página de Detalhes do Mercado (Admin)
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import UnidadeForm from '@/components/UnidadeForm';
import UploadDatabase from '@/components/UploadDatabase';
import Breadcrumbs from '@/components/Breadcrumbs';
import { useToast } from '@/components/ToastContainer';
import { Button } from '@/components/ui/Button';
import { apiFetch } from '@/lib/api-client';

export default function MercadoDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const mercadoId = params.id as string;

  const [mercado, setMercado] = useState<any>(null);
  const [unidades, setUnidades] = useState([]);
  const [importacoes, setImportacoes] = useState([]);
  const [gestores, setGestores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'unidades' | 'upload' | 'historico'>('info');
  const [showUnidadeForm, setShowUnidadeForm] = useState(false);
  const [editingUnidade, setEditingUnidade] = useState(null);
  const [isEditingGestor, setIsEditingGestor] = useState(false);
  const [selectedGestorId, setSelectedGestorId] = useState<string>('');
  const [savingGestor, setSavingGestor] = useState(false);

  useEffect(() => {
    loadMercado();
    loadUnidades();
    loadImportacoes();
    loadGestores();
  }, [mercadoId]);

  const loadGestores = async () => {
    try {
      const response = await fetch('/api/admin/users?role=GESTOR');
      if (response.ok) {
        const data = await response.json();
        setGestores(data);
      }
    } catch (error) {
      console.error('Erro ao carregar gestores:', error);
    }
  };

  const loadMercado = async () => {
    try {
      const result = await apiFetch(`/api/markets/${mercadoId}`);
      
      if (result.error) {
        toast.error(result.error);
      } else if (result.data) {
        setMercado(result.data.data || result.data);
      }
    } catch (error) {
      console.error('Erro ao carregar mercado:', error);
      toast.error('Erro ao carregar mercado');
    } finally {
      setLoading(false);
    }
  };

  const loadUnidades = async () => {
    try {
      const result = await apiFetch(`/api/markets/${mercadoId}/unidades`);
      
      if (!result.error && result.data) {
        setUnidades(result.data.data || result.data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar unidades:', error);
    }
  };

  const loadImportacoes = async () => {
    try {
      const result = await apiFetch(`/api/markets/${mercadoId}/importacoes`);
      
      if (!result.error && result.data) {
        setImportacoes(result.data.data || result.data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar importações:', error);
    }
  };

  const handleCreateUnidade = async (data: any) => {
    try {
      const result = await apiFetch(`/api/markets/${mercadoId}/unidades`, {
        method: 'POST',
        body: JSON.stringify(data),
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        await loadUnidades();
        setShowUnidadeForm(false);
        toast.success('Unidade criada com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao criar unidade:', error);
      toast.error('Erro ao criar unidade');
    }
  };

  const handleUpdateUnidade = async (data: any) => {
    try {
      const result = await apiFetch(`/api/unidades/${editingUnidade.id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        await loadUnidades();
        setEditingUnidade(null);
        setShowUnidadeForm(false);
        toast.success('Unidade atualizada com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao atualizar unidade:', error);
      toast.error('Erro ao atualizar unidade');
    }
  };

  const handleDeleteUnidade = async (unidadeId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta unidade?')) return;

    try {
      const result = await apiFetch(`/api/unidades/${unidadeId}`, {
        method: 'DELETE',
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        await loadUnidades();
        toast.success('Unidade excluída com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao excluir unidade:', error);
      toast.error('Erro ao excluir unidade');
    }
  };

  const handleUploadComplete = async (resultado: any) => {
    toast.success(
      `Upload concluído! Total: ${resultado.resultado.totalLinhas}, Sucesso: ${resultado.resultado.sucesso}, Erros: ${resultado.resultado.erros}`
    );
    await loadImportacoes();
  };

  const handleSaveGestor = async () => {
    setSavingGestor(true);
    try {
      const result = await apiFetch(`/api/markets/${mercadoId}`, {
        method: 'PUT',
        body: JSON.stringify({
          gestorId: selectedGestorId || null,
        }),
      });

      if (result.error) {
        toast.error(result.error);
      } else if (result.data?.success) {
        toast.success('Gestor associado com sucesso!');
        setIsEditingGestor(false);
        await loadMercado();
      } else {
        toast.error('Erro ao associar gestor');
      }
    } catch (error) {
      console.error('Erro ao salvar gestor:', error);
      toast.error('Erro ao salvar gestor');
    } finally {
      setSavingGestor(false);
    }
  };

  const handleRemoveGestor = async () => {
    if (!confirm('Tem certeza que deseja remover o gestor deste mercado?')) return;

    setSavingGestor(true);
    try {
      const result = await apiFetch(`/api/markets/${mercadoId}`, {
        method: 'PUT',
        body: JSON.stringify({
          gestorId: null,
        }),
      });

      if (result.error) {
        toast.error(result.error);
      } else if (result.data?.success) {
        toast.success('Gestor removido com sucesso!');
        await loadMercado();
      } else {
        toast.error('Erro ao remover gestor');
      }
    } catch (error) {
      console.error('Erro ao remover gestor:', error);
      toast.error('Erro ao remover gestor');
    } finally {
      setSavingGestor(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      PROCESSANDO: 'bg-yellow-100 text-yellow-800',
      CONCLUIDO: 'bg-green-100 text-green-800',
      FALHA: 'bg-red-100 text-red-800',
      PARCIAL: 'bg-orange-100 text-orange-800',
    };
    return badges[status as keyof typeof badges] || badges.PROCESSANDO;
  };

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

  if (!mercado) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-600 mb-4">Mercado não encontrado</p>
          <button
            onClick={() => router.push('/admin/mercados')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Voltar para Mercados
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: 'Mercados', path: '/admin/mercados' },
            { label: mercado.nome },
          ]}
        />

        {/* Botão Voltar */}
        <button
          onClick={() => router.push('/admin/mercados')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Voltar para Mercados
        </button>

        {/* Cabeçalho do Mercado */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{mercado.nome}</h1>
              <p className="text-gray-600">CNPJ: {mercado.cnpj}</p>
            </div>
            {!mercado.ativo && (
              <span className="px-3 py-1 bg-red-100 text-red-800 text-sm font-semibold rounded-full">
                Inativo
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div>
              <p className="text-sm text-gray-600">Plano</p>
              <p className="text-lg font-semibold text-gray-900">
                {mercado.plano?.nome || 'Sem plano'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Gestor</p>
              {isEditingGestor ? (
                <div className="flex items-center space-x-2">
                  <select
                    value={selectedGestorId}
                    onChange={(e) => setSelectedGestorId(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={savingGestor}
                  >
                    <option value="">Selecione um gestor</option>
                    {gestores.map((gestor) => (
                      <option key={gestor.id} value={gestor.id}>
                        {gestor.nome} ({gestor.email})
                      </option>
                    ))}
                  </select>
                  <Button
                    onClick={handleSaveGestor}
                    disabled={savingGestor}
                    type="button"
                  >
                    {savingGestor ? 'Salvando...' : 'Salvar'}
                  </Button>
                  <button
                    onClick={() => {
                      setIsEditingGestor(false);
                      setSelectedGestorId(mercado.gestorId || mercado.gestor?.id || '');
                    }}
                    disabled={savingGestor}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <p className="text-lg font-semibold text-gray-900">
                    {mercado.gestor?.nome || 'Sem gestor'}
                  </p>
                  <button
                    onClick={() => {
                      setIsEditingGestor(true);
                      setSelectedGestorId(mercado.gestorId || mercado.gestor?.id || '');
                    }}
                    className="ml-2 px-2 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                    title="Editar gestor"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  {mercado.gestorId || mercado.gestor?.id ? (
                    <button
                      onClick={handleRemoveGestor}
                      className="ml-1 px-2 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                      title="Remover gestor"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  ) : null}
                </div>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-600">Unidades</p>
              <p className="text-lg font-semibold text-gray-900">{unidades.length}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px space-x-8 overflow-x-auto">
              {[
                { key: 'info', label: 'Informações', icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )},
                { key: 'unidades', label: 'Unidades', icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )},
                { key: 'upload', label: 'Upload de Base', icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                )},
                { key: 'historico', label: 'Histórico', icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )},
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 whitespace-nowrap ${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Conteúdo das Tabs */}
        <div>
          {/* Tab: Informações */}
          {activeTab === 'info' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Informações do Mercado</h2>
              
              {/* Informações Básicas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Nome</p>
                    <p className="text-gray-900 text-lg">{mercado.nome || 'Não informado'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium">CNPJ</p>
                    <p className="text-gray-900">{mercado.cnpj || 'Não informado'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Status</p>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      mercado.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {mercado.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Data de Criação</p>
                    <p className="text-gray-900">
                      {mercado.dataCriacao ? new Date(mercado.dataCriacao).toLocaleDateString('pt-BR') : 'Não informado'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Última Atualização</p>
                    <p className="text-gray-900">
                      {mercado.dataAtualizacao ? new Date(mercado.dataAtualizacao).toLocaleDateString('pt-BR') : 'Não informado'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Total de Unidades</p>
                    <p className="text-gray-900 text-lg font-semibold">{unidades.length}</p>
                  </div>
                </div>
              </div>

              {/* Informações de Contato */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações de Contato</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Telefone</p>
                    <p className="text-gray-900">{mercado.telefone || 'Não informado'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Email de Contato</p>
                    <p className="text-gray-900">{mercado.emailContato || 'Não informado'}</p>
                  </div>
                </div>
              </div>

              {/* Descrição */}
              {mercado.descricao && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Descrição</h3>
                  <p className="text-gray-700 leading-relaxed">{mercado.descricao}</p>
                </div>
              )}

              {/* Horário de Funcionamento */}
              {mercado.horarioFuncionamento && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Horário de Funcionamento</h3>
                  <p className="text-gray-700">{mercado.horarioFuncionamento}</p>
                </div>
              )}

              {/* Ações */}
              <div className="border-t pt-6 mt-6">
                <div className="flex space-x-4">
                  <button
                    onClick={() => setActiveTab('unidades')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Gerenciar Unidades
                  </button>
                  <button
                    onClick={() => setActiveTab('upload')}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Upload de Base
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Unidades */}
          {activeTab === 'unidades' && (
            <div>
              {showUnidadeForm ? (
                <UnidadeForm
                  unidade={editingUnidade}
                  onSubmit={editingUnidade ? handleUpdateUnidade : handleCreateUnidade}
                  onCancel={() => {
                    setShowUnidadeForm(false);
                    setEditingUnidade(null);
                  }}
                />
              ) : (
                <>
                  <div className="mb-4">
                    <button
                      onClick={() => setShowUnidadeForm(true)}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Nova Unidade
                    </button>
                  </div>

                  {unidades.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-12 text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      <p className="text-gray-500 mb-2">Nenhuma unidade cadastrada</p>
                      <p className="text-sm text-gray-400 mb-4">Clique em "Nova Unidade" para começar</p>
                      <button
                        onClick={() => setShowUnidadeForm(true)}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Criar Primeira Unidade
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {unidades && Array.isArray(unidades) && unidades.map((unidade: any) => (
                        <div key={unidade.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
                          <div className="flex justify-between items-start mb-4">
                            <h3 className="text-lg font-bold text-gray-900">{unidade.nome}</h3>
                            {!unidade.ativa && (
                              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                                Inativa
                              </span>
                            )}
                          </div>
                          <div className="space-y-2 text-sm text-gray-600 mb-4">
                            {unidade.endereco && <p>📍 {unidade.endereco}</p>}
                            {unidade.cidade && (
                              <p>🌆 {unidade.cidade} - {unidade.estado}</p>
                            )}
                            {unidade.telefone && <p>📞 {unidade.telefone}</p>}
                          </div>
                          <p className="text-sm text-gray-500 mb-4 flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                            {unidade._count?.estoques || 0} produtos em estoque
                          </p>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                setEditingUnidade(unidade);
                                setShowUnidadeForm(true);
                              }}
                              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleDeleteUnidade(unidade.id)}
                              className="flex-1 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
                            >
                              Excluir
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Tab: Upload */}
          {activeTab === 'upload' && (
            <UploadDatabase
              mercadoId={mercadoId}
              unidades={unidades}
            />
          )}

          {/* Tab: Histórico */}
          {activeTab === 'historico' && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6 border-b">
                <h2 className="text-xl font-bold text-gray-900">Histórico de Importações</h2>
              </div>
              {importacoes.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p>Nenhuma importação realizada ainda</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Arquivo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Data
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Resultados
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {importacoes && Array.isArray(importacoes) && importacoes.map((importacao: any) => (
                        <tr key={importacao.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {importacao.nomeArquivo}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(importacao.dataInicio).toLocaleString('pt-BR')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs font-semibold rounded ${getStatusBadge(
                                importacao.status
                              )}`}
                            >
                              {importacao.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex items-center space-x-4">
                              <span className="text-green-600">✅ {importacao.linhasSucesso}</span>
                              <span className="text-red-600">❌ {importacao.linhasErro}</span>
                              <span className="text-yellow-600">🔄 {importacao.linhasDuplicadas}</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
