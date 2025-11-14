// Módulo de Inteligência Artificial - Recomendações e Análises
'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api-client';

interface Recomendacao {
  id: string;
  tipo: 'promocao' | 'economia' | 'tendencia' | 'personalizada';
  titulo: string;
  descricao: string;
  produtos: any[];
  economia?: number;
  confianca: number;
}

interface AnalisePreco {
  id: string;
  produtoId: string;
  produtoNome: string;
  data: string;
  preco: number;
  precoMedio: number;
  precoMin: number;
  precoMax: number;
  tendencia: 'alta' | 'baixa' | 'estavel';
  recomendacao: string;
  moeda: string;
}

interface ModuloIAProps {
  onRecomendacaoClick: (produtos: any[]) => void;
}

export default function ModuloIA({ onRecomendacaoClick }: ModuloIAProps) {
  const [recomendacoes, setRecomendacoes] = useState<Recomendacao[]>([]);
  const [analises, setAnalises] = useState<AnalisePreco[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'recomendacoes' | 'analises' | 'tendencias'>('recomendacoes');

  useEffect(() => {
    carregarDadosIA();
  }, []);

  const carregarDadosIA = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Carrega recomendações
      const recomendacoesRes = await apiFetch<{ recomendacoes?: Recomendacao[] }>('/api/produtos/recomendacoes');
      if (recomendacoesRes.data) {
        setRecomendacoes(recomendacoesRes.data.recomendacoes || []);
      }

      // Carrega análises de preços
      const analisesRes = await apiFetch<{ items?: AnalisePreco[]; count?: number }>('/api/produtos/analises-precos');
      
      if (analisesRes.error) {
        if (analisesRes.status === 404) {
          setError('Nenhum dado encontrado para análises de preços.');
          console.warn('Análises de preços não encontradas:', analisesRes.error);
        } else {
          setError(`Erro ao carregar análises: ${analisesRes.error}`);
          console.error('Erro ao carregar análises:', analisesRes.error);
        }
      } else if (analisesRes.data) {
        // Suporta tanto o formato novo (items) quanto o antigo (array direto)
        const items = analisesRes.data.items || (Array.isArray(analisesRes.data) ? analisesRes.data : []);
        setAnalises(items);
        
        // Log de telemetria em dev mode
        if (process.env.NODE_ENV === 'development') {
          console.log(`Análises carregadas: ${items.length} itens`);
        }
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao carregar dados';
      setError(errorMessage);
      console.error('Erro ao carregar dados de IA:', error);
      
      // Telemetria para produção (pode ser expandido para serviço externo)
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'api_request_failed', {
          event_category: 'API',
          event_label: 'analises-precos',
          value: 1,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const getTipoIcon = (tipo: string) => {
    const icons = {
      promocao: (
        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      ),
      economia: (
        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      ),
      tendencia: (
        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      personalizada: (
        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      )
    };
    return icons[tipo as keyof typeof icons] || icons.personalizada;
  };

  const getTendenciaIcon = (tendencia: string) => {
    if (tendencia === 'alta') {
      return (
        <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
        </svg>
      );
    } else if (tendencia === 'baixa') {
      return (
        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7l-9.2 9.2M7 7v10h10" />
        </svg>
      );
    } else {
      return (
        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
        </svg>
      );
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Analisando dados com IA...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-6 border-b bg-gradient-to-r from-purple-600 to-blue-600">
        <div className="flex items-center">
          <svg className="w-8 h-8 text-white mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <div>
            <h3 className="text-xl font-bold text-white">Inteligência Artificial</h3>
            <p className="text-purple-100">Recomendações e análises personalizadas</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex">
          {[
            { key: 'recomendacoes', label: 'Recomendações', count: recomendacoes.length },
            { key: 'analises', label: 'Análises', count: analises.length },
            { key: 'tendencias', label: 'Tendências', count: 0 }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-6 py-4 text-sm font-medium border-b-2 ${
                activeTab === tab.key
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </nav>
      </div>

      {/* Conteúdo */}
      <div className="p-6">
        {/* Tab: Recomendações */}
        {activeTab === 'recomendacoes' && (
          <div className="space-y-4">
            {recomendacoes.length === 0 ? (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <p className="text-gray-500">Nenhuma recomendação disponível</p>
                <p className="text-sm text-gray-400">Continue navegando para receber sugestões personalizadas</p>
              </div>
            ) : (
              recomendacoes.map((recomendacao) => (
                <div key={recomendacao.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start">
                      {getTipoIcon(recomendacao.tipo)}
                      <div className="ml-3">
                        <h4 className="font-semibold text-gray-900">{recomendacao.titulo}</h4>
                        <p className="text-sm text-gray-600 mt-1">{recomendacao.descricao}</p>
                        {recomendacao.economia && (
                          <p className="text-sm text-green-600 font-medium mt-1">
                            Economia potencial: R$ {recomendacao.economia.toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">
                        {Math.round(recomendacao.confianca * 100)}% confiança
                      </span>
                      <button
                        onClick={() => onRecomendacaoClick(recomendacao.produtos)}
                        className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded hover:bg-purple-200"
                      >
                        Ver Produtos
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab: Análises */}
        {activeTab === 'analises' && (
          <div className="space-y-4">
            {error ? (
              <div className="text-center py-8 bg-red-50 border border-red-200 rounded-lg">
                <svg className="mx-auto h-12 w-12 text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-600 font-medium mb-2">{error}</p>
                <p className="text-sm text-red-500 mb-4">
                  {process.env.NODE_ENV === 'development' && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs">Detalhes técnicos</summary>
                      <pre className="mt-2 text-left text-xs bg-red-100 p-2 rounded overflow-auto">
                        {error}
                      </pre>
                    </details>
                  )}
                </p>
                <button
                  onClick={carregarDadosIA}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Tentar Novamente
                </button>
              </div>
            ) : analises.length === 0 ? (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="text-gray-500">Nenhuma análise disponível</p>
                <p className="text-sm text-gray-400">As análises são geradas automaticamente</p>
              </div>
            ) : (
              analises.map((analise) => (
                <div key={analise.produtoId} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900">{analise.produtoNome}</h4>
                    <div className="flex items-center">
                      {getTendenciaIcon(analise.tendencia)}
                      <span className="ml-2 text-sm font-medium capitalize">
                        {analise.tendencia}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Preço Médio</p>
                      <p className="text-lg font-bold text-gray-900">
                        R$ {analise.precoMedio.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Menor Preço</p>
                      <p className="text-lg font-bold text-green-600">
                        R$ {analise.precoMin.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Maior Preço</p>
                      <p className="text-lg font-bold text-red-600">
                        R$ {analise.precoMax.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded p-3">
                    <p className="text-sm text-blue-800">
                      <strong>Recomendação:</strong> {analise.recomendacao}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab: Tendências */}
        {activeTab === 'tendencias' && (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <p className="text-gray-500">Análise de tendências em desenvolvimento</p>
            <p className="text-sm text-gray-400">Em breve: previsões de preços e tendências de mercado</p>
          </div>
        )}
      </div>
    </div>
  );
}
