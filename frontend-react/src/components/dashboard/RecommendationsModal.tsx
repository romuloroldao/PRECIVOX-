import React, { useState, useEffect } from 'react';
import { X, ChevronRight, AlertCircle, CheckCircle2, TrendingUp, Target, Brain, Lightbulb, ArrowRight } from 'lucide-react';

interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: 'alta' | 'media' | 'baixa';
  category: 'preco' | 'estoque' | 'marketing' | 'operacional';
  impact: 'alto' | 'medio' | 'baixo';
  effort: 'alto' | 'medio' | 'baixo';
  estimatedSavings?: number;
  estimatedTimeToImplement?: string;
  steps: string[];
  metrics?: {
    before: string;
    after: string;
    improvement: string;
  };
  relatedInsightId?: string;
}

interface RecommendationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  insightData: {
    id: string;
    title: string;
    description: string;
    type: 'tendencia' | 'economia' | 'alerta' | 'oportunidade';
    priority: 'alta' | 'media' | 'baixa';
    confidence?: number;
    recommendations?: string[];
  };
}

export const RecommendationsModal: React.FC<RecommendationsModalProps> = ({
  isOpen,
  onClose,
  insightData
}) => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [selectedRecommendation, setSelectedRecommendation] = useState<Recommendation | null>(null);
  const [loading, setLoading] = useState(true);

  // Simular busca de recomendações baseadas no insight
  useEffect(() => {
    if (isOpen && insightData) {
      setLoading(true);
      
      // Simulação de API call
      setTimeout(() => {
        const mockRecommendations = generateRecommendationsForInsight(insightData);
        setRecommendations(mockRecommendations);
        setLoading(false);
      }, 1000);
    }
  }, [isOpen, insightData]);

  const generateRecommendationsForInsight = (insight: any): Recommendation[] => {
    const baseRecommendations: { [key: string]: Recommendation[] } = {
      tendencia: [
        {
          id: 'trend-1',
          title: 'Otimizar Estoque para Tendência',
          description: 'Ajustar níveis de estoque baseado na tendência identificada',
          priority: 'alta',
          category: 'estoque',
          impact: 'alto',
          effort: 'medio',
          estimatedSavings: 5000,
          estimatedTimeToImplement: '1-2 semanas',
          steps: [
            'Analisar histórico de vendas do produto',
            'Calcular demanda projetada baseada na tendência',
            'Ajustar pedidos de compra',
            'Implementar alertas automáticos de estoque baixo'
          ],
          metrics: {
            before: 'Giro de estoque: 2.1x/mês',
            after: 'Giro de estoque: 3.4x/mês',
            improvement: '+62% eficiência'
          }
        },
        {
          id: 'trend-2',
          title: 'Campanha de Marketing Direcionada',
          description: 'Criar campanha específica para capitalizar a tendência',
          priority: 'media',
          category: 'marketing',
          impact: 'medio',
          effort: 'alto',
          estimatedSavings: 3000,
          estimatedTimeToImplement: '3-4 semanas',
          steps: [
            'Definir público-alvo baseado na análise',
            'Criar materiais promocionais',
            'Configurar campanhas digitais',
            'Monitorar performance e ajustar'
          ]
        }
      ],
      economia: [
        {
          id: 'savings-1',
          title: 'Implementar Precificação Dinâmica',
          description: 'Ajustar preços automaticamente baseado na oportunidade identificada',
          priority: 'alta',
          category: 'preco',
          impact: 'alto',
          effort: 'medio',
          estimatedSavings: 8500,
          estimatedTimeToImplement: '2-3 semanas',
          steps: [
            'Configurar regras de precificação automática',
            'Implementar monitoramento de concorrência',
            'Definir margens mínimas de segurança',
            'Testar em produtos piloto'
          ],
          metrics: {
            before: 'Margem média: 15.2%',
            after: 'Margem média: 19.8%',
            improvement: '+4.6% margem'
          }
        },
        {
          id: 'savings-2',
          title: 'Negociar com Fornecedores',
          description: 'Aproveitar dados de mercado para renegociar custos',
          priority: 'media',
          category: 'operacional',
          impact: 'alto',
          effort: 'alto',
          estimatedSavings: 12000,
          estimatedTimeToImplement: '4-6 semanas',
          steps: [
            'Compilar dados de preços do mercado',
            'Preparar proposta de renegociação',
            'Agendar reuniões com fornecedores',
            'Implementar novos acordos'
          ]
        }
      ],
      alerta: [
        {
          id: 'alert-1',
          title: 'Ação Imediata Necessária',
          description: 'Resolver problema crítico identificado no sistema',
          priority: 'alta',
          category: 'operacional',
          impact: 'alto',
          effort: 'baixo',
          estimatedTimeToImplement: '24-48 horas',
          steps: [
            'Verificar configurações do sistema',
            'Contatar suporte técnico se necessário',
            'Implementar correção',
            'Monitorar estabilidade'
          ],
          metrics: {
            before: 'Disponibilidade: 95.2%',
            after: 'Disponibilidade: 99.8%',
            improvement: '+4.6% uptime'
          }
        }
      ],
      oportunidade: [
        {
          id: 'opp-1',
          title: 'Expandir Categoria de Produtos',
          description: 'Aproveitar oportunidade de mercado identificada',
          priority: 'media',
          category: 'estoque',
          impact: 'alto',
          effort: 'alto',
          estimatedSavings: 15000,
          estimatedTimeToImplement: '6-8 semanas',
          steps: [
            'Pesquisar fornecedores da categoria',
            'Analisar viabilidade financeira',
            'Negociar condições de compra',
            'Implementar nova linha de produtos'
          ],
          metrics: {
            before: 'Receita categoria: R$ 45.000/mês',
            after: 'Receita categoria: R$ 68.000/mês',
            improvement: '+51% receita'
          }
        }
      ]
    };

    const recommendationsForType = baseRecommendations[insight.type] || [];
    
    // Personalizar recomendações baseadas no insight específico
    return recommendationsForType.map(rec => ({
      ...rec,
      relatedInsightId: insight.id,
      description: `${rec.description} - Baseado no insight: "${insight.title}"`
    }));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'alta': return 'text-red-600 bg-red-50 border-red-200';
      case 'media': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'baixa': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'preco': return TrendingUp;
      case 'estoque': return Target;
      case 'marketing': return Lightbulb;
      case 'operacional': return Brain;
      default: return AlertCircle;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'alto': return 'text-green-600';
      case 'medio': return 'text-yellow-600';
      case 'baixo': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
        {/* Header - Responsivo */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="text-lg sm:text-2xl font-bold leading-tight">Recomendações Disponíveis</h2>
              <p className="text-blue-100 mt-1 text-sm truncate">
                Baseado no insight: "{insightData.title}"
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-blue-500 rounded-lg transition-colors flex-shrink-0"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row h-[75vh] sm:h-[70vh]">
          {/* Lista de Recomendações - Responsivo */}
          <div className="w-full lg:w-1/2 lg:border-r border-gray-200 overflow-y-auto">
            <div className="p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
                Ações Recomendadas ({recommendations.length})
              </h3>
              
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {recommendations.map((rec) => {
                    const CategoryIcon = getCategoryIcon(rec.category);
                    const isSelected = selectedRecommendation?.id === rec.id;
                    
                    return (
                      <div
                        key={rec.id}
                        onClick={() => setSelectedRecommendation(rec)}
                        className={`p-3 sm:p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md ${
                          isSelected 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <div className={`p-2 rounded-lg ${
                              isSelected ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                            }`}>
                              <CategoryIcon className="w-4 h-4" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 text-sm leading-tight">
                                {rec.title}
                              </h4>
                              <p className="text-gray-600 text-xs mt-1 line-clamp-2 leading-relaxed">
                                {rec.description}
                              </p>
                              <div className="flex flex-wrap items-center gap-2 mt-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(rec.priority)}`}>
                                  {rec.priority}
                                </span>
                                {rec.estimatedSavings && (
                                  <span className="text-green-600 text-xs font-medium bg-green-50 px-2 py-1 rounded">
                                    R$ {rec.estimatedSavings.toLocaleString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <ChevronRight className={`w-4 h-4 ${
                            isSelected ? 'text-blue-600' : 'text-gray-400'
                          }`} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Detalhes da Recomendação - Responsivo */}
          <div className="w-full lg:w-1/2 overflow-y-auto border-t lg:border-t-0 lg:border-l border-gray-200">
            <div className="p-4 sm:p-6">
              {selectedRecommendation ? (
                <div className="space-y-6">
                  {/* Header da recomendação */}
                  <div>
                    <div className="flex items-center space-x-3 mb-3">
                      {(() => {
                        const CategoryIcon = getCategoryIcon(selectedRecommendation.category);
                        return <CategoryIcon className="w-6 h-6 text-blue-600" />;
                      })()}
                      <h3 className="text-xl font-bold text-gray-900">
                        {selectedRecommendation.title}
                      </h3>
                    </div>
                    <p className="text-gray-600">
                      {selectedRecommendation.description}
                    </p>
                  </div>

                  {/* Métricas */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                        Impacto
                      </div>
                      <div className={`text-lg font-semibold ${getImpactColor(selectedRecommendation.impact)}`}>
                        {selectedRecommendation.impact.charAt(0).toUpperCase() + selectedRecommendation.impact.slice(1)}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                        Esforço
                      </div>
                      <div className={`text-lg font-semibold ${getImpactColor(selectedRecommendation.effort)}`}>
                        {selectedRecommendation.effort.charAt(0).toUpperCase() + selectedRecommendation.effort.slice(1)}
                      </div>
                    </div>
                  </div>

                  {/* Estimativas */}
                  {(selectedRecommendation.estimatedSavings || selectedRecommendation.estimatedTimeToImplement) && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h4 className="font-semibold text-green-800 mb-2">Estimativas</h4>
                      <div className="space-y-2">
                        {selectedRecommendation.estimatedSavings && (
                          <div className="flex justify-between">
                            <span className="text-green-700">Economia esperada:</span>
                            <span className="font-semibold text-green-800">
                              R$ {selectedRecommendation.estimatedSavings.toLocaleString()}
                            </span>
                          </div>
                        )}
                        {selectedRecommendation.estimatedTimeToImplement && (
                          <div className="flex justify-between">
                            <span className="text-green-700">Tempo para implementar:</span>
                            <span className="font-semibold text-green-800">
                              {selectedRecommendation.estimatedTimeToImplement}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Métricas de melhoria */}
                  {selectedRecommendation.metrics && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-800 mb-3">Resultado Esperado</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-blue-700">Antes:</span>
                          <span className="text-blue-800">{selectedRecommendation.metrics.before}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-blue-700">Depois:</span>
                          <span className="font-semibold text-blue-800">{selectedRecommendation.metrics.after}</span>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-blue-200">
                          <span className="text-blue-700">Melhoria:</span>
                          <span className="font-bold text-green-600">{selectedRecommendation.metrics.improvement}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Passos para implementação */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Passos para Implementação</h4>
                    <div className="space-y-3">
                      {selectedRecommendation.steps.map((step, index) => (
                        <div key={index} className="flex items-start space-x-3">
                          <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                            {index + 1}
                          </div>
                          <p className="text-gray-700 text-sm">{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex space-x-3 pt-4 border-t border-gray-200">
                    <button className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Implementar Agora</span>
                    </button>
                    <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center space-x-2">
                      <ArrowRight className="w-4 h-4" />
                      <span>Ver Mais</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <Brain className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Selecione uma recomendação para ver os detalhes</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer - Responsivo */}
        <div className="bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
              Recomendações geradas com base na análise de IA • Confiança: {insightData.confidence || 85}%
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium text-sm rounded-lg hover:bg-gray-100 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecommendationsModal;