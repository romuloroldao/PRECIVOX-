/**
 * Dashboard de IA Explicável - Completo
 * 
 * Seções:
 * - Saúde do mercado
 * - Alertas inteligentes
 * - Sugestões de promoção
 * - Insights de comportamento
 * - GROOC (chat)
 * 
 * Princípios:
 * - Nunca quebra por falta de dados
 * - Sempre exibe estado vazio explicativo
 * - GROOC atua como assistente, não decisor final
 */

'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useSession } from 'next-auth/react';
import { useApiQuery, useApiMutation } from '@/lib/hooks';
import { SkeletonStats, SkeletonCard, SkeletonCardList } from '@/components/SkeletonLoader';
import { ErrorDisplay } from '@/components/ErrorBoundary';
import { EmptyState } from '@/components/EmptyState';

interface HealthScore {
  score: number;
  dataCalculo: string;
  metricas: {
    rupturaEstoque: { valor: number; impacto: number };
    giroProdutos: { valor: number; impacto: number };
    conversaoListaCompra: { valor: number; impacto: number };
    usoPromocoes: { valor: number; impacto: number };
    engajamentoUsuarios: { valor: number; impacto: number };
  };
  recomendacoes: Array<{
    prioridade: string;
    acao: string;
    motivo: string;
    impactoEsperado: number;
  }>;
  explicacao: string;
}

interface PromotionSuggestion {
  id: string;
  produtoId: string;
  tipo: string;
  valor: number;
  duracao: number;
  motivo: string;
  impactoEsperado: {
    aumentoVendas: number;
    impactoMargem: number;
    impactoGiro: number;
  };
  confianca: number;
}

interface GroocAnswer {
  resposta: string;
  explicacao: string;
  acoesSugeridas?: Array<{
    acao: string;
    motivo: string;
    impactoEsperado: string;
    prioridade: string;
  }>;
  confianca: number;
  fontes: string[];
}

export default function IADashboardPage() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const [selectedMercadoId, setSelectedMercadoId] = useState<string>('');
  const [groocPergunta, setGroocPergunta] = useState<string>('');
  const [groocHistorico, setGroocHistorico] = useState<Array<{ pergunta: string; resposta: GroocAnswer }>>([]);

  // Query para health score
  const {
    data: healthScore,
    isLoading: healthLoading,
    isError: healthError,
    error: healthErrorMsg,
    refetch: refetchHealth,
  } = useApiQuery<HealthScore>(
    selectedMercadoId ? `/api/ai/health/${selectedMercadoId}` : '',
    {
      enabled: !!selectedMercadoId && status === 'authenticated',
    }
  );

  // Query para sugestões de promoção
  const {
    data: promocoes,
    isLoading: promocoesLoading,
    isError: promocoesError,
    error: promocoesErrorMsg,
    refetch: refetchPromocoes,
  } = useApiQuery<PromotionSuggestion[]>(
    selectedMercadoId ? `/api/ai/promotions/${selectedMercadoId}` : '',
    {
      enabled: !!selectedMercadoId && status === 'authenticated',
    }
  );

  // Mutation para GROOC
  const {
    mutate: askGrooc,
    isLoading: groocLoading,
    error: groocError,
    data: groocResposta,
  } = useApiMutation<GroocAnswer, { pergunta: string; mercadoId: string }>(
    '/api/ai/grooc',
    {
      method: 'POST',
      onSuccess: (data) => {
        if (data && groocPergunta) {
          setGroocHistorico(prev => [
            ...prev,
            { pergunta: groocPergunta, resposta: data },
          ]);
          setGroocPergunta('');
        }
      },
    }
  );

  const handleGroocSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groocPergunta.trim() || !selectedMercadoId) return;

    askGrooc({
      pergunta: groocPergunta,
      mercadoId: selectedMercadoId,
    });
  };

  if (status === 'loading') {
    return (
      <DashboardLayout role="ADMIN">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Carregando...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!session || !user || (user.role !== 'ADMIN' && user.role !== 'GESTOR')) {
    return (
      <DashboardLayout role="ADMIN">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-red-600 mb-2">Acesso Negado</h2>
            <p className="text-gray-600">Você não tem permissão para acessar esta página.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="ADMIN">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-8 text-white">
          <h1 className="text-3xl font-bold mb-2">Dashboard de IA - GROOC</h1>
          <p className="text-lg opacity-90">
            Inteligência de mercado explicável. Pergunte ao GROOC sobre seu negócio.
          </p>
        </div>

        {/* Seleção de Mercado */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Selecionar Mercado
          </label>
          <input
            type="text"
            value={selectedMercadoId}
            onChange={(e) => setSelectedMercadoId(e.target.value)}
            placeholder="ID do mercado"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          />
          <p className="text-xs text-gray-500 mt-2">
            Digite o ID do mercado para ver insights de IA
          </p>
        </div>

        {/* GROOC Chat */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            💬 GROOC - Seu Assistente de IA
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Faça perguntas sobre saúde do mercado, promoções, comportamento dos clientes ou produtos.
          </p>

          {/* Histórico de Conversa */}
          <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
            {groocHistorico.length === 0 ? (
              <EmptyState
                title="Nenhuma conversa ainda"
                message="Faça uma pergunta ao GROOC para começar. Exemplos: 'Como está a saúde do meu mercado?', 'Quais produtos devo promover?', 'Quando são os horários de pico?'"
                className="py-8"
              />
            ) : (
              groocHistorico.map((item, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="text-sm font-medium text-blue-900 mb-1">Você perguntou:</div>
                    <div className="text-blue-800">{item.pergunta}</div>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="text-sm font-medium text-purple-900 mb-1">GROOC respondeu:</div>
                    <div className="text-purple-800 mb-2">{item.resposta.resposta}</div>
                    <div className="text-xs text-purple-600 mt-2">
                      {item.resposta.explicacao}
                    </div>
                    {item.resposta.acoesSugeridas && item.resposta.acoesSugeridas.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-purple-200">
                        <div className="text-xs font-medium text-purple-900 mb-2">Ações sugeridas:</div>
                        {item.resposta.acoesSugeridas.map((acao, i) => (
                          <div key={i} className="text-xs text-purple-700 mb-1">
                            • {acao.acao} - {acao.motivo}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Input de Pergunta */}
          <form onSubmit={handleGroocSubmit} className="flex gap-2">
            <input
              type="text"
              value={groocPergunta}
              onChange={(e) => setGroocPergunta(e.target.value)}
              placeholder={selectedMercadoId ? "Pergunte ao GROOC..." : "Selecione um mercado primeiro"}
              disabled={!selectedMercadoId || groocLoading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
            />
            <button
              type="submit"
              disabled={!selectedMercadoId || !groocPergunta.trim() || groocLoading}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {groocLoading ? 'Pensando...' : 'Perguntar'}
            </button>
          </form>

          {groocError && (
            <ErrorDisplay
              title="Erro ao processar pergunta"
              message={groocError}
              onRetry={() => handleGroocSubmit(new Event('submit') as any)}
              className="mt-4"
            />
          )}
        </div>

        {selectedMercadoId && (
          <>
            {/* Saúde do Mercado */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Saúde do Mercado</h2>
              
              {healthError ? (
                <ErrorDisplay
                  title="Erro ao carregar Health Score"
                  message={healthErrorMsg || 'Não foi possível calcular o health score'}
                  onRetry={refetchHealth}
                />
              ) : healthLoading ? (
                <SkeletonCard />
              ) : healthScore ? (
                <div className="space-y-4">
                  {/* Score Principal */}
                  <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                    <div className="text-5xl font-bold text-purple-600 mb-2">
                      {healthScore.score}/100
                    </div>
                    <div className="text-sm text-gray-600">
                      {healthScore.score >= 80 ? 'Excelente' :
                       healthScore.score >= 60 ? 'Bom' :
                       healthScore.score >= 40 ? 'Regular' :
                       'Precisa Atenção'}
                    </div>
                  </div>

                  {/* Explicação */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 mb-2">📊 Explicação</h3>
                    <p className="text-sm text-blue-800 whitespace-pre-line">
                      {healthScore.explicacao}
                    </p>
                  </div>

                  {/* Métricas */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(healthScore.metricas).map(([key, metrica]) => (
                      <div key={key} className="border rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-700 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                          <span className={`text-sm font-bold ${
                            metrica.impacto > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {metrica.impacto > 0 ? '+' : ''}{metrica.impacto.toFixed(1)}
                          </span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                          {typeof metrica.valor === 'number' 
                            ? metrica.valor.toFixed(1) 
                            : metrica.valor}
                          {key === 'rupturaEstoque' || key === 'conversaoListaCompra' || key === 'usoPromocoes' ? '%' : ''}
                          {key === 'giroProdutos' ? ' unidades/dia' : ''}
                          {key === 'engajamentoUsuarios' ? ' eventos/usuário/dia' : ''}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Recomendações */}
                  {healthScore.recomendacoes && healthScore.recomendacoes.length > 0 && (
                    <div className="mt-4">
                      <h3 className="font-semibold text-gray-900 mb-3">Recomendações</h3>
                      <div className="space-y-2">
                        {healthScore.recomendacoes.map((rec, i) => (
                          <div
                            key={i}
                            className={`border-l-4 p-4 rounded ${
                              rec.prioridade === 'alta'
                                ? 'border-red-500 bg-red-50'
                                : rec.prioridade === 'media'
                                ? 'border-yellow-500 bg-yellow-50'
                                : 'border-blue-500 bg-blue-50'
                            }`}
                          >
                            <div className="flex justify-between items-start mb-1">
                              <span className="font-medium text-gray-900">{rec.acao}</span>
                              <span className="text-xs px-2 py-1 rounded bg-white">
                                {rec.prioridade.toUpperCase()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-1">{rec.motivo}</p>
                            <p className="text-xs text-gray-500">
                              Impacto esperado: +{rec.impactoEsperado} pontos no Health Score
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <EmptyState
                  title="Nenhum dado disponível"
                  message="Selecione um mercado para ver o Health Score"
                />
              )}
            </div>

            {/* Alertas Inteligentes */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Alertas Inteligentes</h2>
              
              {healthScore && healthScore.recomendacoes ? (
                healthScore.recomendacoes.filter(r => r.prioridade === 'alta').length > 0 ? (
                  <div className="space-y-3">
                    {healthScore.recomendacoes
                      .filter(r => r.prioridade === 'alta')
                      .map((alerta, i) => (
                        <div key={i} className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                          <div className="flex items-start">
                            <svg className="w-6 h-6 text-red-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <div className="flex-1">
                              <h3 className="font-semibold text-red-900 mb-1">{alerta.acao}</h3>
                              <p className="text-sm text-red-700 mb-2">{alerta.motivo}</p>
                              <p className="text-xs text-red-600">
                                Impacto: +{alerta.impactoEsperado} pontos no Health Score
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <EmptyState
                    title="Nenhum alerta prioritário"
                    message="Seu mercado está em boa saúde. Continue monitorando as métricas."
                    icon={
                      <svg className="mx-auto h-12 w-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    }
                  />
                )
              ) : (
                <EmptyState
                  title="Carregando alertas"
                  message="Aguarde enquanto analisamos o mercado..."
                />
              )}
            </div>

            {/* Sugestões de Promoção */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Sugestões de Promoção</h2>
              
              {promocoesError ? (
                <ErrorDisplay
                  title="Erro ao carregar sugestões"
                  message={promocoesErrorMsg || 'Não foi possível gerar sugestões de promoção'}
                  onRetry={refetchPromocoes}
                />
              ) : promocoesLoading ? (
                <SkeletonCardList count={3} />
              ) : promocoes && promocoes.length > 0 ? (
                <div className="space-y-4">
                  {promocoes.map((promo) => (
                    <div key={promo.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">Produto {promo.produtoId}</h3>
                          <p className="text-sm text-gray-600 mt-1">{promo.motivo}</p>
                        </div>
                        <div className="text-right ml-4">
                          <div className="text-2xl font-bold text-green-600">
                            -{promo.valor}%
                          </div>
                          <div className="text-xs text-gray-500">
                            {promo.duracao} dias
                          </div>
                        </div>
                      </div>

                      {/* Impacto Esperado */}
                      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
                        <div>
                          <div className="text-xs text-gray-500">Aumento Vendas</div>
                          <div className="text-lg font-bold text-green-600">
                            +{promo.impactoEsperado.aumentoVendas}%
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Impacto Margem</div>
                          <div className="text-lg font-bold text-red-600">
                            {promo.impactoEsperado.impactoMargem}%
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Confiança</div>
                          <div className="text-lg font-bold text-blue-600">
                            {promo.confianca}%
                          </div>
                        </div>
                      </div>

                      {/* Ação */}
                      <div className="mt-4 pt-4 border-t">
                        <button
                          className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                          onClick={() => {
                            if (confirm(`Aplicar promoção de ${promo.valor}% no produto ${promo.produtoId}?`)) {
                              alert('Funcionalidade de aplicar promoção será implementada');
                            }
                          }}
                        >
                          Aplicar Promoção (Requer Confirmação)
                        </button>
                        <p className="text-xs text-gray-500 mt-2 text-center">
                          ⚠️ Esta ação requer confirmação do administrador
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="Nenhuma sugestão no momento"
                  message="Não há oportunidades de promoção identificadas para este mercado. Todos os produtos estão com giro adequado."
                />
              )}
            </div>

            {/* Insights de Comportamento */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Insights de Comportamento</h2>
              
              {healthScore ? (
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4">
                    <h3 className="font-semibold text-purple-900 mb-2">Engajamento dos Usuários</h3>
                    <p className="text-sm text-purple-800">
                      {healthScore.metricas.engajamentoUsuarios.valor.toFixed(1)} eventos por usuário por dia.
                      {healthScore.metricas.engajamentoUsuarios.impacto > 0 
                        ? ' Isso indica bom engajamento.' 
                        : ' Considere estratégias para aumentar o engajamento.'}
                    </p>
                  </div>

                  <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4">
                    <h3 className="font-semibold text-green-900 mb-2">Conversão Lista → Compra</h3>
                    <p className="text-sm text-green-800">
                      {healthScore.metricas.conversaoListaCompra.valor.toFixed(1)}% das listas resultam em compra.
                      {healthScore.metricas.conversaoListaCompra.impacto > 0
                        ? ' Taxa de conversão saudável.'
                        : ' Há oportunidade de melhorar a conversão através de notificações e lembretes.'}
                    </p>
                  </div>
                </div>
              ) : (
                <EmptyState
                  title="Insights não disponíveis"
                  message="Selecione um mercado para ver insights de comportamento"
                />
              )}
            </div>
          </>
        )}

        {!selectedMercadoId && (
          <EmptyState
            title="Selecione um mercado"
            message="Digite o ID do mercado acima para ver insights de IA e conversar com o GROOC"
          />
        )}
      </div>
    </DashboardLayout>
  );
}
