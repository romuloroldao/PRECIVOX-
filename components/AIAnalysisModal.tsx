'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ToastContainer';

interface AIAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  produtoId?: string;
  mercadoId?: string;
}

interface AIStage {
  id: number;
  name: string;
  description: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
}

interface AISuggestion {
  id: string;
  type: 'preco' | 'promocao' | 'estoque' | 'posicionamento';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  economia: number;
  aplicavel: boolean;
}

export default function AIAnalysisModal({ isOpen, onClose, produtoId, mercadoId }: AIAnalysisModalProps) {
  const toast = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStage, setCurrentStage] = useState(0);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState<string[]>([]);

  const stages: AIStage[] = [
    {
      id: 1,
      name: 'Coleta de Dados',
      description: 'Analisando histórico de vendas e preços...',
      status: 'pending'
    },
    {
      id: 2,
      name: 'Análise de Mercado',
      description: 'Comparando com concorrentes e tendências...',
      status: 'pending'
    },
    {
      id: 3,
      name: 'Processamento IA',
      description: 'Aplicando algoritmos de machine learning...',
      status: 'pending'
    },
    {
      id: 4,
      name: 'Geração de Insights',
      description: 'Criando recomendações personalizadas...',
      status: 'pending'
    },
    {
      id: 5,
      name: 'Validação Final',
      description: 'Verificando consistência e aplicabilidade...',
      status: 'pending'
    }
  ];

  const [stagesState, setStagesState] = useState<AIStage[]>(stages);

  const startAnalysis = async () => {
    setIsAnalyzing(true);
    setCurrentStage(0);
    setSuggestions([]);
    setSelectedSuggestions([]);

    // Simular processo de análise em 5 etapas
    for (let i = 0; i < stages.length; i++) {
      // Atualizar status da etapa atual
      setStagesState(prev => prev.map((stage, index) => ({
        ...stage,
        status: index === i ? 'processing' : 
                index < i ? 'completed' : 'pending'
      })));
      
      setCurrentStage(i);
      
      // Simular tempo de processamento
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    // Gerar sugestões simuladas
    const mockSuggestions: AISuggestion[] = [
      {
        id: '1',
        type: 'preco',
        title: 'Ajuste de Preço Recomendado',
        description: 'Reduzir preço em 8% para aumentar competitividade',
        impact: 'high',
        economia: 1250.00,
        aplicavel: true
      },
      {
        id: '2',
        type: 'promocao',
        title: 'Promoção Estratégica',
        description: 'Criar promoção de 15% para produtos complementares',
        impact: 'medium',
        economia: 850.00,
        aplicavel: true
      },
      {
        id: '3',
        type: 'estoque',
        title: 'Otimização de Estoque',
        description: 'Ajustar quantidade mínima para evitar ruptura',
        impact: 'high',
        economia: 2100.00,
        aplicavel: true
      },
      {
        id: '4',
        type: 'posicionamento',
        title: 'Reposicionamento de Produto',
        description: 'Mover para área de maior visibilidade',
        impact: 'low',
        economia: 400.00,
        aplicavel: true
      }
    ];

    setSuggestions(mockSuggestions);
    setIsAnalyzing(false);
    toast.success('Análise IA concluída! Encontradas 4 sugestões.');
  };

  const handleSelectSuggestion = (suggestionId: string) => {
    setSelectedSuggestions(prev => 
      prev.includes(suggestionId) 
        ? prev.filter(id => id !== suggestionId)
        : [...prev, suggestionId]
    );
  };

  const handleSelectAll = () => {
    const allIds = suggestions.map(s => s.id);
    setSelectedSuggestions(allIds);
  };

  const handleDeselectAll = () => {
    setSelectedSuggestions([]);
  };

  const handleApplySelected = () => {
    const selectedCount = selectedSuggestions.length;
    toast.success(`${selectedCount} sugestões aplicadas com sucesso!`);
    onClose();
  };

  const handleApplyAll = () => {
    toast.success('Todas as sugestões foram aplicadas!');
    onClose();
  };

  const handleRevertAll = () => {
    toast.info('Todas as sugestões foram revertidas.');
    onClose();
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'preco': return '💰';
      case 'promocao': return '🎯';
      case 'estoque': return '📦';
      case 'posicionamento': return '📍';
      default: return '💡';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">🤖 Análise de Inteligência Artificial</h2>
              <p className="text-blue-100 mt-1">Insights preditivos para otimização de vendas</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {!isAnalyzing && suggestions.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🤖</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Iniciar Análise IA
              </h3>
              <p className="text-gray-600 mb-6">
                Clique no botão abaixo para iniciar a análise inteligente dos seus dados
              </p>
              <button
                onClick={startAnalysis}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
              >
                🚀 Iniciar Análise IA
              </button>
            </div>
          )}

          {/* Processo de Análise */}
          {isAnalyzing && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Processando Análise IA...
                </h3>
                <p className="text-gray-600">
                  Etapa {currentStage + 1} de {stages.length}
                </p>
              </div>

              <div className="space-y-4">
                {stagesState.map((stage, index) => (
                  <div
                    key={stage.id}
                    className={`flex items-center p-4 rounded-lg border-2 transition-all ${
                      stage.status === 'processing' 
                        ? 'border-blue-500 bg-blue-50' 
                        : stage.status === 'completed'
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 ${
                      stage.status === 'processing' 
                        ? 'bg-blue-500 text-white' 
                        : stage.status === 'completed'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-300 text-gray-600'
                    }`}>
                      {stage.status === 'processing' ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      ) : stage.status === 'completed' ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <span className="text-sm font-semibold">{stage.id}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{stage.name}</h4>
                      <p className="text-sm text-gray-600">{stage.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sugestões */}
          {!isAnalyzing && suggestions.length > 0 && (
            <div className="space-y-6">
              {/* Controles */}
              <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handleSelectAll}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    ✅ Selecionar Todas
                  </button>
                  <button
                    onClick={handleDeselectAll}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                  >
                    ❌ Desmarcar Todas
                  </button>
                </div>
                <div className="text-sm text-gray-600">
                  {selectedSuggestions.length} de {suggestions.length} selecionadas
                </div>
              </div>

              {/* Lista de Sugestões */}
              <div className="space-y-4">
                {suggestions.map((suggestion) => (
                  <div
                    key={suggestion.id}
                    className={`border-2 rounded-lg p-4 transition-all cursor-pointer ${
                      selectedSuggestions.includes(suggestion.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleSelectSuggestion(suggestion.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedSuggestions.includes(suggestion.id)}
                          onChange={() => handleSelectSuggestion(suggestion.id)}
                          className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-2xl">{getTypeIcon(suggestion.type)}</span>
                            <h4 className="font-semibold text-gray-900">{suggestion.title}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getImpactColor(suggestion.impact)}`}>
                              {suggestion.impact.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-gray-600 mb-2">{suggestion.description}</p>
                          <div className="flex items-center space-x-4 text-sm">
                            <span className="text-green-600 font-semibold">
                              💰 Economia: R$ {suggestion.economia.toFixed(2)}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              suggestion.aplicavel 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {suggestion.aplicavel ? 'Aplicável' : 'Não Aplicável'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Botões de Ação */}
              <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleApplySelected}
                    disabled={selectedSuggestions.length === 0}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ✅ Aplicar Selecionadas ({selectedSuggestions.length})
                  </button>
                  <button
                    onClick={handleApplyAll}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                  >
                    🚀 Aplicar Todas
                  </button>
                </div>
                <button
                  onClick={handleRevertAll}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
                >
                  ↩️ Reverter Todas
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
