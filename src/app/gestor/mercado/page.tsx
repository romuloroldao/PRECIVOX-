// Página do Gestor - Meu Mercado
'use client';

import { useState, useEffect } from 'react';
import UnidadeForm from '@/components/UnidadeForm';
import UploadDatabase from '@/components/UploadDatabase';

export default function GestorMercadoPage() {
  const [mercado, setMercado] = useState<any>(null);
  const [unidades, setUnidades] = useState([]);
  const [importacoes, setImportacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'unidades' | 'upload' | 'historico'>('info');
  const [showUnidadeForm, setShowUnidadeForm] = useState(false);
  const [editingUnidade, setEditingUnidade] = useState(null);
  const [editingInfo, setEditingInfo] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    telefone: '',
    emailContato: '',
    horarioFuncionamento: '',
  });

  useEffect(() => {
    loadMercado();
  }, []);

  const loadMercado = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Busca os mercados do gestor
      const mercadosResponse = await fetch('/api/mercados', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (mercadosResponse.ok) {
        const mercados = await mercadosResponse.json();
        if (mercados.length > 0) {
          const meuMercado = mercados[0]; // Gestor gerencia um mercado
          setMercado(meuMercado);
          setFormData({
            nome: meuMercado.nome,
            descricao: meuMercado.descricao || '',
            telefone: meuMercado.telefone || '',
            emailContato: meuMercado.emailContato || '',
            horarioFuncionamento: meuMercado.horarioFuncionamento || '',
          });

          // Carrega unidades do mercado
          await loadUnidades(meuMercado.id);
          await loadImportacoes(meuMercado.id);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar mercado:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUnidades = async (mercadoId: string) => {
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

  const loadImportacoes = async (mercadoId: string) => {
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

  const handleUpdateInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/mercados/${mercado.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await loadMercado();
        setEditingInfo(false);
        alert('Informações atualizadas com sucesso!');
      } else {
        const error = await response.json();
        alert(error.message || 'Erro ao atualizar informações');
      }
    } catch (error) {
      console.error('Erro ao atualizar informações:', error);
      alert('Erro ao atualizar informações');
    }
  };

  const handleCreateUnidade = async (data: any) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/mercados/${mercado.id}/unidades`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        await loadUnidades(mercado.id);
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
        await loadUnidades(mercado.id);
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
        await loadUnidades(mercado.id);
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
    await loadImportacoes(mercado.id);
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <p className="text-gray-600 mb-2">Você ainda não está gerenciando nenhum mercado</p>
          <p className="text-sm text-gray-500">Entre em contato com o administrador</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cabeçalho */}
        <div className="mb-8">
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
                <p className="text-sm text-gray-600">Plano Atual</p>
                <p className="text-lg font-semibold text-blue-600">
                  {mercado.plano?.nome || 'Sem plano'}
                </p>
                {mercado.plano && (
                  <p className="text-sm text-gray-500">
                    Limite: {mercado.plano.limiteUnidades} unidades
                  </p>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-600">Unidades Cadastradas</p>
                <p className="text-lg font-semibold text-gray-900">{unidades.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total de Produtos</p>
                <p className="text-lg font-semibold text-gray-900">
                  {unidades.reduce((acc: number, u: any) => acc + (u._count?.estoques || 0), 0)}
                </p>
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
                { key: 'unidades', label: 'Minhas Unidades' },
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
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Informações do Mercado</h2>
                {!editingInfo && (
                  <button
                    onClick={() => setEditingInfo(true)}
                    className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Editar
                  </button>
                )}
              </div>

              {editingInfo ? (
                <form onSubmit={handleUpdateInfo} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
                    <input
                      type="text"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                    <textarea
                      rows={4}
                      value={formData.descricao}
                      onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Telefone</label>
                    <input
                      type="text"
                      value={formData.telefone}
                      onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email de Contato</label>
                    <input
                      type="email"
                      value={formData.emailContato}
                      onChange={(e) => setFormData({ ...formData, emailContato: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Horário de Funcionamento</label>
                    <input
                      type="text"
                      value={formData.horarioFuncionamento}
                      onChange={(e) => setFormData({ ...formData, horarioFuncionamento: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex justify-end space-x-4 pt-4 border-t">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingInfo(false);
                        setFormData({
                          nome: mercado.nome,
                          descricao: mercado.descricao || '',
                          telefone: mercado.telefone || '',
                          emailContato: mercado.emailContato || '',
                          horarioFuncionamento: mercado.horarioFuncionamento || '',
                        });
                      }}
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Salvar Alterações
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Descrição</p>
                    <p className="text-gray-900">{mercado.descricao || 'Não informado'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Telefone</p>
                    <p className="text-gray-900">{mercado.telefone || 'Não informado'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="text-gray-900">{mercado.emailContato || 'Não informado'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Horário de Funcionamento</p>
                    <p className="text-gray-900">{mercado.horarioFuncionamento || 'Não informado'}</p>
                  </div>
                </div>
              )}
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
                  <div className="mb-4 flex justify-between items-center">
                    <button
                      onClick={() => setShowUnidadeForm(true)}
                      disabled={mercado.plano && unidades.length >= mercado.plano.limiteUnidades}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Nova Unidade
                    </button>
                    {mercado.plano && (
                      <p className="text-sm text-gray-600">
                        {unidades.length} de {mercado.plano.limiteUnidades} unidades utilizadas
                      </p>
                    )}
                  </div>

                  {unidades.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-12 text-center">
                      <p className="text-gray-500">Nenhuma unidade cadastrada</p>
                      <p className="text-sm text-gray-400 mt-2">Clique em "Nova Unidade" para começar</p>
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
              mercadoId={mercado.id}
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Arquivo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Data
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
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
                          <td className="px-6 py-4 text-sm text-gray-500">
                            <div className="space-y-1">
                              <div>✅ {importacao.linhasSucesso}</div>
                              <div>❌ {importacao.linhasErro}</div>
                              <div>🔄 {importacao.linhasDuplicadas}</div>
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

