// Página de Detalhes do Mercado (Admin)
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import UnidadeForm from '@/components/UnidadeForm';
import UploadDatabase from '@/components/UploadDatabase';

export default function MercadoDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const mercadoId = params.id as string;

  const [mercado, setMercado] = useState<any>(null);
  const [unidades, setUnidades] = useState([]);
  const [importacoes, setImportacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'unidades' | 'upload' | 'historico'>('info');
  const [showUnidadeForm, setShowUnidadeForm] = useState(false);
  const [editingUnidade, setEditingUnidade] = useState(null);

  useEffect(() => {
    loadMercado();
    loadUnidades();
    loadImportacoes();
  }, [mercadoId]);

  const loadMercado = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/mercados/${mercadoId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setMercado(await response.json());
      }
    } catch (error) {
      console.error('Erro ao carregar mercado:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUnidades = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/mercados/${mercadoId}/unidades`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setUnidades(await response.json());
      }
    } catch (error) {
      console.error('Erro ao carregar unidades:', error);
    }
  };

  const loadImportacoes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/mercados/${mercadoId}/importacoes`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setImportacoes(await response.json());
      }
    } catch (error) {
      console.error('Erro ao carregar importações:', error);
    }
  };

  const handleCreateUnidade = async (data: any) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/mercados/${mercadoId}/unidades`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        await loadUnidades();
        setShowUnidadeForm(false);
        alert('Unidade criada com sucesso!');
      } else {
        const error = await response.json();
        alert(error.message || 'Erro ao criar unidade');
      }
    } catch (error) {
      console.error('Erro ao criar unidade:', error);
      alert('Erro ao criar unidade');
    }
  };

  const handleUpdateUnidade = async (data: any) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/unidades/${editingUnidade.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        await loadUnidades();
        setEditingUnidade(null);
        setShowUnidadeForm(false);
        alert('Unidade atualizada com sucesso!');
      } else {
        const error = await response.json();
        alert(error.message || 'Erro ao atualizar unidade');
      }
    } catch (error) {
      console.error('Erro ao atualizar unidade:', error);
      alert('Erro ao atualizar unidade');
    }
  };

  const handleDeleteUnidade = async (unidadeId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta unidade?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/unidades/${unidadeId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        await loadUnidades();
        alert('Unidade excluída com sucesso!');
      } else {
        const error = await response.json();
        alert(error.message || 'Erro ao excluir unidade');
      }
    } catch (error) {
      console.error('Erro ao excluir unidade:', error);
      alert('Erro ao excluir unidade');
    }
  };

  const handleUploadComplete = async (resultado: any) => {
    alert(
      `Upload concluído!\n\nTotal: ${resultado.resultado.totalLinhas}\nSucesso: ${resultado.resultado.sucesso}\nErros: ${resultado.resultado.erros}\nDuplicados: ${resultado.resultado.duplicados}`
    );
    await loadImportacoes();
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
          <p className="text-gray-600 mb-4">Mercado não encontrado</p>
          <button
            onClick={() => router.push('/admin/mercados')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Voltar para Mercados
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cabeçalho */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/admin/mercados')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Voltar para Mercados
          </button>

          <div className="bg-white rounded-lg shadow p-6">
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
                <p className="text-lg font-semibold text-gray-900">
                  {mercado.gestor?.nome || 'Sem gestor'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Unidades</p>
                <p className="text-lg font-semibold text-gray-900">{unidades.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px space-x-8">
              {[
                { key: 'info', label: 'Informações' },
                { key: 'unidades', label: 'Unidades' },
                { key: 'upload', label: 'Upload de Base' },
                { key: 'historico', label: 'Histórico' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
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
              <h2 className="text-xl font-bold text-gray-900 mb-4">Informações do Mercado</h2>
              <div className="space-y-4">
                {mercado.descricao && (
                  <div>
                    <p className="text-sm text-gray-600">Descrição</p>
                    <p className="text-gray-900">{mercado.descricao}</p>
                  </div>
                )}
                {mercado.telefone && (
                  <div>
                    <p className="text-sm text-gray-600">Telefone</p>
                    <p className="text-gray-900">{mercado.telefone}</p>
                  </div>
                )}
                {mercado.emailContato && (
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="text-gray-900">{mercado.emailContato}</p>
                  </div>
                )}
                {mercado.horarioFuncionamento && (
                  <div>
                    <p className="text-sm text-gray-600">Horário de Funcionamento</p>
                    <p className="text-gray-900">{mercado.horarioFuncionamento}</p>
                  </div>
                )}
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
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Nova Unidade
                    </button>
                  </div>

                  {unidades.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-12 text-center">
                      <p className="text-gray-500">Nenhuma unidade cadastrada</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {unidades.map((unidade: any) => (
                        <div key={unidade.id} className="bg-white rounded-lg shadow p-6">
                          <div className="flex justify-between items-start mb-4">
                            <h3 className="text-lg font-bold text-gray-900">{unidade.nome}</h3>
                            {!unidade.ativa && (
                              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                                Inativa
                              </span>
                            )}
                          </div>
                          <div className="space-y-2 text-sm text-gray-600 mb-4">
                            {unidade.endereco && <p>{unidade.endereco}</p>}
                            {unidade.cidade && (
                              <p>
                                {unidade.cidade} - {unidade.estado}
                              </p>
                            )}
                            {unidade.telefone && <p>{unidade.telefone}</p>}
                          </div>
                          <p className="text-sm text-gray-500 mb-4">
                            {unidade._count?.estoques || 0} produtos em estoque
                          </p>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                setEditingUnidade(unidade);
                                setShowUnidadeForm(true);
                              }}
                              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleDeleteUnidade(unidade.id)}
                              className="flex-1 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50"
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
              onUploadComplete={handleUploadComplete}
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
                  Nenhuma importação realizada ainda
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
                      {importacoes.map((importacao: any) => (
                        <tr key={importacao.id}>
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
                            <div className="space-y-1">
                              <div>✅ Sucesso: {importacao.linhasSucesso}</div>
                              <div>❌ Erros: {importacao.linhasErro}</div>
                              <div>🔄 Duplicados: {importacao.linhasDuplicadas}</div>
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

