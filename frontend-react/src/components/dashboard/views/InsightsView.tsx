import React, { useState, useEffect } from 'react';
import { AlertTriangle, TrendingUp, Zap, Target, Brain, CheckCircle, Clock, AlertCircle, DollarSign, BarChart3, Lightbulb, ArrowRight, Star, Award, Flame, Eye, RefreshCw } from 'lucide-react';
import { MetricCard } from '../cards/MetricCard';
import { useApiServices } from '../../../hooks/useApiServices';
import { useLocation } from '../../../hooks/useLocation';
import "../../../styles/animations.css";
import "../../../styles/dashboard-complete.css";

// ===== INTERFACES PREMIUM =====

interface SupermarketAlert {
  id: string;
  priority: 'Alto' | 'Médio' | 'Baixo';
  title: string;
  description: string;
  action: string;
  impact: number;
  category: 'Preços' | 'Estoque' | 'Concorrência' | 'Promoção' | 'Demanda';
  timestamp: Date;
  roi?: number;
  urgency: 'critical' | 'warning' | 'info';
  confidence: number;
}

interface SupermarketMetric {
  id: string;
  title: string;
  value: string | number;
  trend: number;
  icon: any;
  subtitle?: string;
  format: 'currency' | 'percentage' | 'number' | 'text';
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'cyan' | 'pink';
  gradient: string;
  animated?: boolean;
}

interface ActionableInsight {
  id: string;
  title: string;
  description: string;
  action: string;
  effort: 'Baixo' | 'Médio' | 'Alto';
  roi: number;
  category: string;
  confidence: number;
  estimatedTime: string;
  difficulty: 'easy' | 'medium' | 'hard';
  priority: 'critical' | 'high' | 'medium' | 'low';
}

// ===== DADOS MOCKADOS PARA DEMONSTRAÇÃO =====
// TODO: Substituir por dados reais da API quando disponível

const supermarketMetrics: SupermarketMetric[] = [
  {
    id: '1',
    title: 'Margem Bruta Média',
    value: '18.5%',
    trend: 2.3,
    icon: DollarSign,
    subtitle: '+R$ 2.4k vs. mês anterior',
    format: 'percentage',
    color: 'green',
    gradient: 'from-green-500 to-emerald-500',
    animated: true
  },
  {
    id: '2',
    title: 'Economia Identificada',
    value: 'R$ 12.847',
    trend: 15.8,
    icon: Lightbulb,
    subtitle: 'Potencial esta semana',
    format: 'currency',
    color: 'blue',
    gradient: 'from-blue-500 to-cyan-500',
    animated: true
  },
  {
    id: '3',
    title: 'Produtos Monitorados',
    value: 2847,
    trend: 5.2,
    icon: BarChart3,
    subtitle: 'Ativos em tempo real',
    format: 'number',
    color: 'purple',
    gradient: 'from-purple-500 to-violet-500',
    animated: true
  },
  {
    id: '4',
    title: 'Alertas Críticos',
    value: 3,
    trend: -42.5,
    icon: AlertTriangle,
    subtitle: 'Requerem ação imediata',
    format: 'number',
    color: 'red',
    gradient: 'from-red-500 to-orange-500',
    animated: true
  }
];

// ===== ALERTAS MOCKADOS - SUBSTITUIR POR IA REAL =====
const urgentAlerts: SupermarketAlert[] = [
  {
    id: '1',
    priority: 'Alto',
    urgency: 'critical',
    title: 'Concorrente reduziu preços em 15%',
    description: 'Supermercado Rival baixou preços de itens básicos (arroz, feijão, açúcar, óleo). Impacto estimado: perda de 18% nas vendas desta categoria se não reagir em 24h.',
    action: 'Revisar preços ou criar campanha promocional urgente',
    impact: 92,
    category: 'Concorrência',
    timestamp: new Date(),
    roi: 2850,
    confidence: 0.94
  },
  {
    id: '2',
    priority: 'Alto',
    urgency: 'critical',
    title: 'Ruptura iminente - produtos essenciais',
    description: 'Leite integral, pão francês e ovos com estoque crítico (<48h). Histórico mostra aumento de 35% na demanda às sextas-feiras.',
    action: 'Contatar fornecedores urgente + comunicação aos clientes',
    impact: 88,
    category: 'Estoque',
    timestamp: new Date(),
    roi: 1950,
    confidence: 0.91
  },
  {
    id: '3',
    priority: 'Médio',
    urgency: 'warning',
    title: 'Oportunidade de margem - Hortifruti',
    description: 'Preços de atacado caíram 25% (tomate, cebola, batata), mas varejo mantém preços. Oportunidade de aumentar margem ou ganhar market share.',
    action: 'Estratégia de preço: aumentar margem OU reduzir preço',
    impact: 74,
    category: 'Preços',
    timestamp: new Date(),
    roi: 1240,
    confidence: 0.87
  },
  {
    id: '4',
    priority: 'Médio',
    urgency: 'info',
    title: 'Padrão sazonal detectado',
    description: 'IA detectou aumento de 28% na demanda por produtos de limpeza nos últimos 3 dias. Padrão típico pré-final de semana.',
    action: 'Aumentar exposição e criar bundle promocional',
    impact: 65,
    category: 'Demanda',
    timestamp: new Date(),
    roi: 890,
    confidence: 0.82
  }
];

// ===== INSIGHTS MOCKADOS - SUBSTITUIR POR IA REAL =====
// Dados mockados como fallback - serão substituídos pelos dados do backend
const mockActionableInsights: ActionableInsight[] = [
  {
    id: '1',
    title: 'Cross-selling estratégico subutilizado',
    description: 'Apenas 23% dos clientes que compram carne levam temperos, vs 67% na concorrência. Oportunidade de aumentar ticket médio.',
    action: 'Reposicionar temperos próximo às carnes + treinar equipe para sugestão ativa',
    effort: 'Baixo',
    roi: 2340,
    category: 'Layout & Vendas',
    confidence: 0.89,
    estimatedTime: '2-3 dias',
    difficulty: 'easy',
    priority: 'high'
  },
  {
    id: '2',
    title: 'Horário de pico mal aproveitado',
    description: 'Das 18h às 20h movimento aumenta 45%, mas mix de produtos promocionais não se adapta. Receita por hora 18% abaixo do potencial.',
    action: 'Criar "Happy Hour Premium" com ofertas estratégicas para alta margem',
    effort: 'Médio',
    roi: 1890,
    category: 'Estratégia Comercial',
    confidence: 0.92,
    estimatedTime: '1 semana',
    difficulty: 'medium',
    priority: 'high'
  },
  {
    id: '3',
    title: 'Desperdício evitável - gestão de validade',
    description: 'R$ 1.2k/semana em produtos próximos ao vencimento sem estratégia de liquidação. Sistema manual é ineficiente.',
    action: 'Implementar desconto progressivo automático por proximidade de vencimento',
    effort: 'Alto',
    roi: 4680,
    category: 'Operações & TI',
    confidence: 0.94,
    estimatedTime: '2-3 semanas',
    difficulty: 'hard',
    priority: 'critical'
  },
  {
    id: '4',
    title: 'Fidelização digital inexplorada',
    description: 'Apenas 12% dos clientes têm cadastro ativo. Programas de fidelidade podem aumentar frequência em 35% e ticket em 22%.',
    action: 'Lançar programa de pontos digital com app próprio',
    effort: 'Alto',
    roi: 8950,
    category: 'Marketing Digital',
    confidence: 0.87,
    estimatedTime: '4-6 semanas',
    difficulty: 'hard',
    priority: 'medium'
  }
];

// ===== COMPONENTE PRINCIPAL PREMIUM =====

interface InsightsViewProps {
  onInsightAction?: (insight: any) => void;
}

export const InsightsView: React.FC<InsightsViewProps> = ({ onInsightAction }) => {
  const { analyticsData, loading } = useApiServices();
  const { location } = useLocation();
  
  // ✅ VERIFICAR SE TEMOS DADOS REAIS DA API
  const hasRealData = analyticsData && Object.keys(analyticsData).length > 0;
  
  // DEBUG: Comentado para evitar logs excessivos
  // console.log('📊 InsightsView - Estado dos dados:', {
  //   hasRealData,
  //   analyticsData: analyticsData ? Object.keys(analyticsData) : 'null',
  //   loading
  // });
  
  const [activeTab, setActiveTab] = useState<'urgente' | 'oportunidades' | 'performance' | 'previsoes'>('urgente');
  const [activeFilter, setActiveFilter] = useState<'todos' | 'precos' | 'estoque' | 'concorrencia'>('todos');
  const [animatedROI, setAnimatedROI] = useState(0);
  const [aiInsights, setAiInsights] = useState<ActionableInsight[]>([]);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [metricsAnimated, setMetricsAnimated] = useState(false);
  const [loadingTutorial, setLoadingTutorial] = useState<string | null>(null);

  // ✅ BUSCAR INSIGHTS IA DO BACKEND
  useEffect(() => {
    const fetchAIInsights = async () => {
      setLoadingInsights(true);
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const response = await fetch(`${API_URL}/analytics/insights`);
        
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            // Converter dados do backend para formato ActionableInsight
            const insights: ActionableInsight[] = result.data.map((item: any, index: number) => ({
              id: item.id || `insight_${index}`,
              title: item.title,
              description: item.description,
              action: item.action || 'Tutorial IA',
              effort: item.effort || (item.priority === 'alta' ? 'Alto' : item.priority === 'media' ? 'Médio' : 'Baixo'),
              roi: Math.floor(Math.random() * 50) + 20, // ROI simulado
              category: item.category || 'Geral',
              confidence: Math.floor((item.confidence || 0.8) * 100),
              estimatedTime: item.estimatedTime || '15-30 min',
              difficulty: item.difficulty || (item.priority === 'alta' ? 'medium' : 'easy'),
              priority: item.priority === 'alta' ? 'high' : item.priority === 'media' ? 'medium' : 'low'
            }));
            
            setAiInsights(insights);
            console.log('✅ Insights IA carregados do backend:', insights.length);
          }
        } else {
          console.warn('⚠️ Falha ao carregar insights, usando dados simulados');
        }
      } catch (error) {
        console.error('❌ Erro ao buscar insights IA:', error);
      } finally {
        setLoadingInsights(false);
      }
    };

    fetchAIInsights();
  }, []);

  // ✅ ANIMAÇÃO DO ROI PROGRESSIVA
  useEffect(() => {
    const totalROI = urgentAlerts.reduce((sum, alert) => sum + (alert.roi || 0), 0);
    let start = 0;
    const end = totalROI;
    const duration = 2500;
    const increment = end / (duration / 16);

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setAnimatedROI(end);
        clearInterval(timer);
      } else {
        setAnimatedROI(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, []);

  // ✅ ANIMAÇÃO DAS MÉTRICAS
  useEffect(() => {
    const timer = setTimeout(() => {
      setMetricsAnimated(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // ✅ FUNÇÕES DE FILTRO
  const getFilteredAlerts = () => {
    if (activeFilter === 'todos') return urgentAlerts;
    return urgentAlerts.filter(alert => 
      alert.category.toLowerCase().includes(activeFilter) ||
      (activeFilter === 'precos' && alert.category === 'Preços') ||
      (activeFilter === 'concorrencia' && alert.category === 'Concorrência')
    );
  };

  // ✅ COMPONENTES PREMIUM

  const PremiumAlertCard = ({ alert }: { alert: SupermarketAlert }) => {
    const getUrgencyStyle = (urgency: string) => {
      switch (urgency) {
        case 'critical':
          return 'border-l-red-500 bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 hover:from-red-100 hover:via-orange-100 hover:to-yellow-100';
        case 'warning':
          return 'border-l-yellow-500 bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 hover:from-yellow-100 hover:via-amber-100 hover:to-orange-100';
        case 'info':
          return 'border-l-blue-500 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 hover:from-blue-100 hover:via-indigo-100 hover:to-purple-100';
        default:
          return 'border-l-gray-500 bg-gradient-to-br from-gray-50 to-slate-50';
      }
    };

    const getUrgencyIcon = (urgency: string) => {
      switch (urgency) {
        case 'critical': return <AlertTriangle className="w-6 h-6 text-red-600" />;
        case 'warning': return <AlertCircle className="w-6 h-6 text-yellow-600" />;
        case 'info': return <Lightbulb className="w-6 h-6 text-blue-600" />;
        default: return <CheckCircle className="w-6 h-6 text-gray-600" />;
      }
    };

    return (
      <div className={`relative overflow-hidden rounded-2xl border-l-4 ${getUrgencyStyle(alert.urgency)} p-6 shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 group`}>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transform -skew-x-12 transition-all duration-1000 group-hover:translate-x-full"></div>
        
        <div className="absolute top-4 right-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xs font-bold ${
            alert.confidence >= 0.9 ? 'bg-green-100 text-green-700' :
            alert.confidence >= 0.8 ? 'bg-yellow-100 text-yellow-700' :
            'bg-red-100 text-red-700'
          }`}>
            {Math.round(alert.confidence * 100)}%
          </div>
        </div>

        <div className="flex items-start space-x-4 mb-4">
          <div className={`p-3 rounded-xl ${
            alert.urgency === 'critical' ? 'bg-red-500' :
            alert.urgency === 'warning' ? 'bg-yellow-500' :
            'bg-blue-500'
          } shadow-lg`}>
            {getUrgencyIcon(alert.urgency)}
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                alert.priority === 'Alto' ? 'bg-red-500 text-white' :
                alert.priority === 'Médio' ? 'bg-yellow-500 text-white' :
                'bg-green-500 text-white'
              }`}>
                {alert.priority}
              </span>
              <span className="text-xs text-gray-500 flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>{alert.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
              </span>
            </div>
            <h4 className="font-bold text-gray-900 text-lg group-hover:text-gray-800 transition-colors">
              {alert.title}
            </h4>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Impacto no Negócio</span>
            <span className="text-lg font-bold text-gray-700">{alert.impact}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 bg-gradient-to-r ${
                alert.impact >= 80 ? 'from-red-400 to-red-600' :
                alert.impact >= 60 ? 'from-yellow-400 to-orange-500' :
                'from-green-400 to-green-600'
              }`}
              style={{ 
                width: `${alert.impact}%`,
                boxShadow: `0 0 20px ${
                  alert.impact >= 80 ? 'rgba(239, 68, 68, 0.5)' :
                  alert.impact >= 60 ? 'rgba(245, 158, 11, 0.5)' :
                  'rgba(34, 197, 94, 0.5)'
                }`
              }}
            >
              <div className="h-full bg-gradient-to-r from-white/30 to-transparent"></div>
            </div>
          </div>
        </div>

        <p className="text-gray-700 mb-4 leading-relaxed">
          {alert.description}
        </p>

        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 mb-4 border border-white/50">
          <div className="flex items-center space-x-2 mb-2">
            <Target className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold text-blue-900">Ação Recomendada:</span>
          </div>
          <p className="text-sm text-blue-800 font-medium">{alert.action}</p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-xs bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 px-3 py-1 rounded-full font-medium">
              {alert.category}
            </span>
            {alert.roi && (
              <span className="text-xs bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 px-3 py-1 rounded-full flex items-center space-x-1 font-bold">
                <DollarSign className="w-3 h-3" />
                <span>ROI: R$ {alert.roi.toLocaleString()}</span>
              </span>
            )}
          </div>
          
          <button className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 transition-all duration-300 group-hover:translate-x-2 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg">
            <span className="text-sm font-medium">Agir Agora</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  const PremiumInsightCard = ({ 
    insight, 
    onAction 
  }: { 
    insight: ActionableInsight;
    onAction?: (insight: ActionableInsight) => void;
  }) => {
    
    const handleTutorialClick = async (insight: ActionableInsight) => {
      setLoadingTutorial(insight.id);
      
      try {
        // Simular aguardar 2 segundos como solicitado
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Chamar a ação original
        if (onAction) {
          onAction(insight);
        }
      } catch (error) {
        console.error('Erro ao carregar tutorial:', error);
      } finally {
        setLoadingTutorial(null);
      }
    };
    const getDifficultyColor = (difficulty: string) => {
      switch (difficulty) {
        case 'easy': return 'text-green-600 bg-gradient-to-r from-green-100 to-emerald-100';
        case 'medium': return 'text-yellow-600 bg-gradient-to-r from-yellow-100 to-orange-100';
        case 'hard': return 'text-red-600 bg-gradient-to-r from-red-100 to-rose-100';
        default: return 'text-gray-600 bg-gradient-to-r from-gray-100 to-slate-100';
      }
    };

    const getDifficultyIcon = (difficulty: string) => {
      switch (difficulty) {
        case 'easy': return '🟢';
        case 'medium': return '🟡';
        case 'hard': return '🔴';
        default: return '⚪';
      }
    };

    const getPriorityGradient = (priority: string) => {
      switch (priority) {
        case 'critical': return 'from-red-500 to-orange-500';
        case 'high': return 'from-orange-500 to-amber-500';
        case 'medium': return 'from-blue-500 to-indigo-500';
        case 'low': return 'from-gray-500 to-slate-500';
        default: return 'from-blue-500 to-indigo-500';
      }
    };

    return (
      <div className="group relative overflow-hidden rounded-2xl bg-white border border-gray-100 p-6 shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-3">
        <div className={`absolute inset-0 bg-gradient-to-br ${getPriorityGradient(insight.priority)} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-0 group-hover:opacity-20 rounded-full -translate-y-16 translate-x-16 transition-all duration-700"></div>

        <div className="relative z-10 flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-xl bg-gradient-to-br ${getPriorityGradient(insight.priority)} text-white shadow-lg`}>
              <Lightbulb className="w-6 h-6" />
            </div>
            <span className="text-2xl">💡</span>
          </div>
          
          <div className="text-right">
            <div className="text-lg font-bold text-blue-600 mb-1">{Math.round(insight.confidence * 100)}%</div>
            <div className="text-xs text-gray-500">Confiança</div>
            
            <div className="w-16 h-2 bg-gray-200 rounded-full mt-1 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-1000"
                style={{ width: `${insight.confidence * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <h4 className="font-bold text-gray-900 text-lg mb-2 group-hover:text-blue-900 transition-colors">
            {insight.title}
          </h4>
          
          <p className="text-gray-700 mb-4 leading-relaxed text-sm">
            {insight.description}
          </p>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-3 border border-green-100">
              <div className="text-xl font-bold text-green-600 font-mono">R$ {insight.roi.toLocaleString()}</div>
              <div className="text-xs text-gray-500">ROI Potencial</div>
            </div>
            <div className="text-center bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-100">
              <div className="text-xl font-bold text-blue-600">{insight.estimatedTime}</div>
              <div className="text-xs text-gray-500">Implementação</div>
            </div>
            <div className="text-center bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg p-3 border border-purple-100">
              <div className="text-xl">{getDifficultyIcon(insight.difficulty)}</div>
              <div className="text-xs text-gray-500">Dificuldade</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-4 border border-blue-100">
            <div className="flex items-center space-x-2 mb-2">
              <Target className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-semibold text-purple-900">Plano de Ação:</span>
            </div>
            <p className="text-sm text-purple-800 font-medium">{insight.action}</p>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xs bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 px-3 py-1 rounded-full font-medium">
                {insight.category}
              </span>
              <span className={`text-xs px-3 py-1 rounded-full font-medium ${getDifficultyColor(insight.difficulty)}`}>
                {insight.effort}
              </span>
            </div>
            
            <button 
              onClick={() => handleTutorialClick(insight)}
              disabled={loadingTutorial === insight.id}
              className={`flex items-center space-x-1 transition-all duration-300 px-3 py-2 rounded-lg hover:shadow-md ${
                loadingTutorial === insight.id 
                  ? 'bg-purple-100 text-purple-400 cursor-not-allowed'
                  : 'text-purple-600 hover:text-purple-800 group-hover:translate-x-2 bg-purple-50 hover:bg-purple-100'
              }`}
            >
              {loadingTutorial === insight.id ? (
                <>
                  <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm font-medium">Carregando...</span>
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4" />
                  <span className="text-sm font-medium">Tutorial IA</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ✅ RENDER DOS FILTROS PREMIUM
  const renderPremiumFilters = () => (
    <div className="flex items-center space-x-3 mb-6 overflow-x-auto pb-2">
      {[
        { id: 'todos', label: 'Todos', count: urgentAlerts.length, icon: '📊', gradient: 'from-blue-500 to-indigo-500' },
        { id: 'precos', label: 'Preços', count: urgentAlerts.filter(a => a.category === 'Preços').length, icon: '💰', gradient: 'from-green-500 to-emerald-500' },
        { id: 'estoque', label: 'Estoque', count: urgentAlerts.filter(a => a.category === 'Estoque').length, icon: '📦', gradient: 'from-orange-500 to-amber-500' },
        { id: 'concorrencia', label: 'Concorrência', count: urgentAlerts.filter(a => a.category === 'Concorrência').length, icon: '⚔️', gradient: 'from-red-500 to-rose-500' }
      ].map(filter => (
        <button
          key={filter.id}
          className={`relative overflow-hidden flex items-center space-x-2 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-300 whitespace-nowrap group ${
            activeFilter === filter.id
              ? `bg-gradient-to-r ${filter.gradient} text-white shadow-lg transform scale-105`
              : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 hover:scale-105'
          }`}
          onClick={() => setActiveFilter(filter.id as any)}
        >
          {activeFilter === filter.id && (
            <div className="absolute inset-0 bg-white bg-opacity-5"></div>
          )}
          <span>{filter.icon}</span>
          <span>{filter.label}</span>
          {filter.count > 0 && (
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
              activeFilter === filter.id
                ? 'bg-white bg-opacity-20 text-white'
                : 'bg-gray-100 text-gray-600'
            }`}>
              {filter.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );

  // ✅ TABS PREMIUM
  const renderPremiumTabs = () => (
    <div className="flex items-center space-x-2 mb-8 bg-white rounded-2xl p-2 shadow-sm border border-gray-100">
      {[
        { id: 'urgente', label: 'Urgente', icon: Flame, count: urgentAlerts.filter(a => a.urgency === 'critical').length, gradient: 'from-red-500 to-orange-500' },
        { id: 'oportunidades', label: 'Oportunidades', icon: Lightbulb, count: aiInsights.length || mockActionableInsights.length, gradient: 'from-blue-500 to-indigo-500' },
        { id: 'performance', label: 'Performance', icon: BarChart3, count: 0, gradient: 'from-green-500 to-emerald-500' },
        { id: 'previsoes', label: 'Previsões', icon: TrendingUp, count: 0, gradient: 'from-purple-500 to-violet-500' }
      ].map(tab => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            className={`relative overflow-hidden flex items-center space-x-2 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-300 min-w-0 group ${
              activeTab === tab.id
                ? `bg-gradient-to-r ${tab.gradient} text-white shadow-lg`
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
            }`}
            onClick={() => setActiveTab(tab.id as any)}
          >
            {activeTab === tab.id && (
              <div className="absolute inset-0 bg-white bg-opacity-5"></div>
            )}
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span className="hidden sm:block">{tab.label}</span>
            {tab.count > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${
                activeTab === tab.id
                  ? 'bg-white bg-opacity-20 text-white'
                  : 'bg-red-100 text-red-600'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );

  // ✅ RENDER DO CONTEÚDO POR ABA
  const renderTabContent = () => {
    switch (activeTab) {
      case 'urgente':
        return (
          <div className="space-y-8">
            {renderPremiumFilters()}
            
            {/* Métricas rápidas premium */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
              {supermarketMetrics.map((metric, index) => (
                <div
                  key={metric.id}
                  className={`relative overflow-hidden bg-white rounded-2xl shadow-sm border border-gray-100 p-4 hover:shadow-xl transition-all duration-500 hover:-translate-y-2 group ${
                    metricsAnimated ? 'animate-fade-in' : 'opacity-0'
                  }`}
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${metric.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
                  
                  {metric.animated && (
                    <div className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDuration: '2s' }}></div>
                  )}
                  
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${metric.gradient} bg-opacity-10`}>
                        <metric.icon className={`w-5 h-5 text-${metric.color}-600`} />
                      </div>
                      {metric.trend !== 0 && (
                        <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                          metric.trend > 0 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {metric.trend > 0 ? '+' : ''}{metric.trend}%
                        </span>
                      )}
                    </div>
                    
                    <div className="text-2xl font-bold text-gray-900 mb-1 font-mono">
                      {typeof metric.value === 'number' ? metric.value.toLocaleString() : metric.value}
                    </div>
                    
                    {metric.subtitle && (
                      <div className="text-xs text-gray-500 font-medium">
                        {metric.subtitle}
                      </div>
                    )}
                    
                    <div className="text-xs font-semibold text-gray-800 mt-1">
                      {metric.title}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Alertas urgentes */}
            <div className="space-y-4">
              {/* Header com contador de alertas */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Alertas Urgentes</h3>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-1 bg-red-100 text-red-600 rounded-full text-sm font-medium">
                    {getFilteredAlerts().length} alertas
                  </span>
                  {/* Indicador de scroll no mobile */}
                  <div className="lg:hidden text-xs text-gray-500 flex items-center space-x-1">
                    <span>Deslize</span>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
              
              {/* Container com scroll horizontal no mobile */}
              <div className="lg:grid lg:grid-cols-2 lg:gap-6">
                {/* Mobile: Scroll horizontal */}
                <div className="lg:hidden overflow-x-auto pb-4 mobile-scroll-container relative">
                  <div className="flex space-x-4 px-1" style={{ width: `${getFilteredAlerts().length * 320}px` }}>
                    {getFilteredAlerts().map((alert, index) => (
                      <div
                        key={alert.id}
                        className="flex-shrink-0 w-80 animate-fade-in"
                        style={{ animationDelay: `${index * 200}ms` }}
                      >
                        <PremiumAlertCard alert={alert} />
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Desktop: Grid normal */}
                <div className="hidden lg:grid lg:grid-cols-2 lg:gap-6 lg:col-span-2">
                  {getFilteredAlerts().map((alert, index) => (
                    <div
                      key={alert.id}
                      className="animate-fade-in"
                      style={{ animationDelay: `${index * 200}ms` }}
                    >
                      <PremiumAlertCard alert={alert} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ROI Total com animação avançada */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-green-500 via-emerald-600 to-teal-700 p-8 text-white shadow-2xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-32 translate-x-32 animate-float"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full translate-y-24 -translate-x-24 animate-float" style={{ animationDelay: '1s' }}></div>
              
              <div className="relative z-10 text-center">
                <div className="flex items-center justify-center space-x-3 mb-4">
                  <div className="p-3 bg-white bg-opacity-20 rounded-2xl backdrop-blur-sm">
                    <DollarSign className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold">Potencial de Economia Total</h3>
                </div>
                
                <div className="text-6xl font-bold mb-2 font-mono">
                  R$ {animatedROI.toLocaleString()}
                </div>
                
                <p className="text-green-100 text-lg">
                  Aplicando todas as ações recomendadas
                </p>
                
                <div className="mt-6 max-w-md mx-auto">
                  <div className="w-full bg-white bg-opacity-20 rounded-full h-3 overflow-hidden">
                    <div 
                      className="h-full bg-white rounded-full transition-all duration-2000"
                      style={{ width: '85%' }}
                    ></div>
                  </div>
                  <div className="text-sm text-green-100 mt-2">85% das oportunidades identificadas</div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'oportunidades':
        return (
          <div>
            {loadingInsights && (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Carregando insights IA...</span>
              </div>
            )}
            {/* Mobile: Scroll horizontal */}
            <div className="lg:hidden overflow-x-auto pb-4 mobile-scroll-container relative">
              <div className="flex space-x-4 px-1" style={{ width: `${(aiInsights.length || mockActionableInsights.length) * 320}px` }}>
                {(aiInsights.length > 0 ? aiInsights : mockActionableInsights).map((insight, index) => (
                  <div
                    key={insight.id}
                    className="flex-shrink-0 w-80 animate-fade-in"
                    style={{ animationDelay: `${index * 200}ms` }}
                  >
                    <PremiumInsightCard insight={insight} onAction={onInsightAction} />
                  </div>
                ))}
              </div>
              
              {/* Indicador visual para scroll */}
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm flex items-center space-x-1">
                <span>Deslize</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>

            {/* Desktop: Grid layout */}
            <div className="hidden lg:grid grid-cols-2 gap-6">
              {(aiInsights.length > 0 ? aiInsights : mockActionableInsights).map((insight, index) => (
                <div
                  key={insight.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 200}ms` }}
                >
                  <PremiumInsightCard insight={insight} onAction={onInsightAction} />
                </div>
              ))}
            </div>
          </div>
        );

      case 'performance':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 overflow-hidden">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">📊 Performance do Supermercado</h3>
                  <p className="text-gray-600">Métricas avançadas de performance operacional</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
                {[
                  { label: 'Margem Bruta Média', value: '18.5%', change: '+2.3%', trend: 'success', icon: '💰', gradient: 'from-green-400 to-emerald-500' },
                  { label: 'Giro de Estoque', value: '12.4x', change: '+0.8x', trend: 'success', icon: '🔄', gradient: 'from-blue-400 to-cyan-500' },
                  { label: 'Ticket Médio', value: 'R$ 47.30', change: '+5.2%', trend: 'success', icon: '🛒', gradient: 'from-purple-400 to-violet-500' },
                  { label: 'Ruptura de Estoque', value: '3.2%', change: '+0.5%', trend: 'warning', icon: '⚠️', gradient: 'from-yellow-400 to-orange-500' }
                ].map((metric, index) => (
                  <div
                    key={index}
                    className={`group relative overflow-hidden rounded-xl p-6 transition-all duration-500 hover:-translate-y-2 hover:shadow-xl ${
                      metric.trend === 'success'
                        ? 'bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border border-green-200 hover:border-green-300'
                        : 'bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 border border-yellow-200 hover:border-yellow-300'
                    }`}
                  >
                    <div className="absolute top-4 right-4 text-2xl opacity-20 group-hover:opacity-40 transition-opacity">
                      {metric.icon}
                    </div>
                    <div className={`absolute inset-0 bg-gradient-to-br ${metric.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>
                    
                    <div className="relative z-10">
                      <div className="text-sm text-gray-600 mb-2 font-medium">{metric.label}</div>
                      <div className={`text-3xl font-bold mb-2 ${
                        metric.trend === 'success' ? 'text-green-600' : 'text-yellow-600'
                      }`}>
                        {metric.value}
                      </div>
                      <div className={`text-sm font-medium ${
                        metric.trend === 'success' ? 'text-green-500' : 'text-yellow-500'
                      }`}>
                        {metric.change} vs. mês anterior
                      </div>
                      
                      <div className="mt-3 flex items-end space-x-1">
                        {Array.from({ length: 7 }, (_, i) => (
                          <div
                            key={i}
                            className={`w-2 rounded-full transition-all duration-300 ${
                              metric.trend === 'success' ? 'bg-green-300' : 'bg-yellow-300'
                            }`}
                            style={{
                              height: `${Math.random() * 20 + 10}px`,
                              animationDelay: `${i * 100}ms`
                            }}
                          ></div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 p-6 bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl border border-gray-200">
                <h4 className="text-lg font-bold text-gray-900 mb-4">Performance Temporal - Últimos 30 Dias</h4>
                <div className="h-64 flex items-end justify-center space-x-2">
                  {Array.from({ length: 30 }, (_, i) => {
                    const height = Math.random() * 60 + 20;
                    const isWeekend = i % 7 === 5 || i % 7 === 6;
                    return (
                      <div
                        key={i}
                        className={`w-2 rounded-t-sm transition-all duration-500 hover:scale-y-110 ${
                          isWeekend ? 'bg-gradient-to-t from-blue-400 to-blue-600' : 'bg-gradient-to-t from-green-400 to-green-600'
                        }`}
                        style={{
                          height: `${height}px`,
                          animationDelay: `${i * 50}ms`
                        }}
                        title={`Dia ${i + 1}: ${height.toFixed(0)}% performance`}
                      ></div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );

      case 'previsoes':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 overflow-hidden">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl shadow-lg">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">🔮 Previsões IA - Próximos 7 Dias</h3>
                  <p className="text-gray-600">Análise preditiva baseada em machine learning</p>
                </div>
              </div>
              
              {/* Mobile: Scroll horizontal */}
              <div className="lg:hidden overflow-x-auto pb-4 mobile-scroll-container relative">
                <div className="flex space-x-4 px-1" style={{ width: `${6 * 320}px` }}>
                  {[
                    {
                      icon: '📈',
                      title: 'Aumento de demanda esperado',
                      description: 'Produtos de limpeza (+28%) e higiene (+15%) devido ao final de semana prolongado',
                      confidence: 94,
                      impact: 'Alto',
                      color: 'green',
                      gradient: 'from-green-400 to-emerald-500'
                    },
                    {
                      icon: '⚠️',
                      title: 'Risco de ruptura detectado',
                      description: 'Papel higiênico, detergente e álcool gel com padrão de alta demanda iminente',
                      confidence: 87,
                      impact: 'Crítico',
                      color: 'red',
                      gradient: 'from-red-400 to-rose-500'
                    },
                    {
                      icon: '💰',
                      title: 'Oportunidade sazonal',
                      description: 'Bebidas geladas e sorvetes com potencial +35% devido à previsão de calor (28°C+)',
                      confidence: 91,
                      impact: 'Médio',
                      color: 'blue',
                      gradient: 'from-blue-400 to-cyan-500'
                    },
                    {
                      icon: '🎯',
                      title: 'Padrão comportamental',
                      description: 'Quinta e sexta: pico de compras para o fim de semana. Ajustar estoque accordingly',
                      confidence: 96,
                      impact: 'Alto',
                      color: 'purple',
                      gradient: 'from-purple-400 to-violet-500'
                    },
                    {
                      icon: '🏷️',
                      title: 'Momento ideal para promoções',
                      description: 'Produtos com giro lento: ofertas de 15-25% podem acelerar rotatividade',
                      confidence: 83,
                      impact: 'Médio',
                      color: 'orange',
                      gradient: 'from-orange-400 to-amber-500'
                    },
                    {
                      icon: '📊',
                      title: 'Tendência de preços',
                      description: 'Commodities básicas: estabilização esperada. Bom momento para contratos fixos',
                      confidence: 89,
                      impact: 'Médio',
                      color: 'cyan',
                      gradient: 'from-cyan-400 to-teal-500'
                    }
                  ].map((forecast, index) => (
                    <div
                      key={index}
                      className={`flex-shrink-0 w-80 group relative overflow-hidden rounded-xl p-6 bg-gradient-to-br ${
                        forecast.color === 'green' ? 'from-green-50 via-emerald-50 to-teal-50 border-green-200' :
                        forecast.color === 'red' ? 'from-red-50 via-rose-50 to-pink-50 border-red-200' :
                        forecast.color === 'blue' ? 'from-blue-50 via-indigo-50 to-purple-50 border-blue-200' :
                        forecast.color === 'purple' ? 'from-purple-50 via-violet-50 to-indigo-50 border-purple-200' :
                        forecast.color === 'orange' ? 'from-orange-50 via-amber-50 to-yellow-50 border-orange-200' :
                        'from-cyan-50 via-teal-50 to-emerald-50 border-cyan-200'
                      } border hover:shadow-xl transition-all duration-500 hover:-translate-y-2 animate-fade-in`}
                      style={{ animationDelay: `${index * 150}ms` }}
                    >
                      <div className="absolute top-0 right-0 w-20 h-20 bg-white opacity-0 group-hover:opacity-10 rounded-full -translate-y-10 translate-x-10 transition-opacity duration-500"></div>
                      <div className={`absolute inset-0 bg-gradient-to-br ${forecast.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>
                      
                      <div className="relative z-10 flex items-start space-x-3">
                        <div className="text-4xl animate-float" style={{ animationDelay: `${index * 200}ms` }}>
                          {forecast.icon}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900 mb-2 group-hover:text-gray-800 transition-colors">
                            {forecast.title}
                          </h4>
                          <p className="text-sm text-gray-700 mb-3 leading-relaxed">
                            {forecast.description}
                          </p>
                          
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                forecast.impact === 'Alto' || forecast.impact === 'Crítico' 
                                  ? 'bg-red-100 text-red-700' 
                                  : 'bg-yellow-100 text-yellow-700'
                              }`}>
                                {forecast.impact}
                              </span>
                              <span className="text-xs text-gray-500 font-medium">
                                {forecast.confidence}% confiança
                              </span>
                            </div>
                          </div>
                          
                          <div className={`w-full h-2 rounded-full ${
                            forecast.color === 'green' ? 'bg-green-200' :
                            forecast.color === 'red' ? 'bg-red-200' :
                            forecast.color === 'blue' ? 'bg-blue-200' :
                            forecast.color === 'purple' ? 'bg-purple-200' :
                            forecast.color === 'orange' ? 'bg-orange-200' :
                            'bg-cyan-200'
                          } overflow-hidden`}>
                            <div
                              className={`h-full rounded-full transition-all duration-1000 ${
                                forecast.color === 'green' ? 'bg-green-500' :
                                forecast.color === 'red' ? 'bg-red-500' :
                                forecast.color === 'blue' ? 'bg-blue-500' :
                                forecast.color === 'purple' ? 'bg-purple-500' :
                                forecast.color === 'orange' ? 'bg-orange-500' :
                                'bg-cyan-500'
                              }`}
                              style={{ 
                                width: `${forecast.confidence}%`,
                                animationDelay: `${index * 200 + 800}ms`
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Indicador visual para scroll */}
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm flex items-center space-x-1">
                  <span>Deslize</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>

              {/* Desktop: Grid layout */}
              <div className="hidden lg:grid grid-cols-3 gap-6">
                {[
                  {
                    icon: '📈',
                    title: 'Aumento de demanda esperado',
                    description: 'Produtos de limpeza (+28%) e higiene (+15%) devido ao final de semana prolongado',
                    confidence: 94,
                    impact: 'Alto',
                    color: 'green',
                    gradient: 'from-green-400 to-emerald-500'
                  },
                  {
                    icon: '⚠️',
                    title: 'Risco de ruptura detectado',
                    description: 'Papel higiênico, detergente e álcool gel com padrão de alta demanda iminente',
                    confidence: 87,
                    impact: 'Crítico',
                    color: 'red',
                    gradient: 'from-red-400 to-rose-500'
                  },
                  {
                    icon: '💰',
                    title: 'Oportunidade sazonal',
                    description: 'Bebidas geladas e sorvetes com potencial +35% devido à previsão de calor (28°C+)',
                    confidence: 91,
                    impact: 'Médio',
                    color: 'blue',
                    gradient: 'from-blue-400 to-cyan-500'
                  },
                  {
                    icon: '🎯',
                    title: 'Padrão comportamental',
                    description: 'Quinta e sexta: pico de compras para o fim de semana. Ajustar estoque accordingly',
                    confidence: 96,
                    impact: 'Alto',
                    color: 'purple',
                    gradient: 'from-purple-400 to-violet-500'
                  },
                  {
                    icon: '🏷️',
                    title: 'Momento ideal para promoções',
                    description: 'Produtos com giro lento: ofertas de 15-25% podem acelerar rotatividade',
                    confidence: 83,
                    impact: 'Médio',
                    color: 'orange',
                    gradient: 'from-orange-400 to-amber-500'
                  },
                  {
                    icon: '📊',
                    title: 'Tendência de preços',
                    description: 'Commodities básicas: estabilização esperada. Bom momento para contratos fixos',
                    confidence: 89,
                    impact: 'Médio',
                    color: 'cyan',
                    gradient: 'from-cyan-400 to-teal-500'
                  }
                ].map((forecast, index) => (
                  <div
                    key={index}
                    className={`group relative overflow-hidden rounded-xl p-6 bg-gradient-to-br ${
                      forecast.color === 'green' ? 'from-green-50 via-emerald-50 to-teal-50 border-green-200' :
                      forecast.color === 'red' ? 'from-red-50 via-rose-50 to-pink-50 border-red-200' :
                      forecast.color === 'blue' ? 'from-blue-50 via-indigo-50 to-purple-50 border-blue-200' :
                      forecast.color === 'purple' ? 'from-purple-50 via-violet-50 to-indigo-50 border-purple-200' :
                      forecast.color === 'orange' ? 'from-orange-50 via-amber-50 to-yellow-50 border-orange-200' :
                      'from-cyan-50 via-teal-50 to-emerald-50 border-cyan-200'
                    } border hover:shadow-xl transition-all duration-500 hover:-translate-y-2`}
                    style={{ animationDelay: `${index * 150}ms` }}
                  >
                    <div className="absolute top-0 right-0 w-20 h-20 bg-white opacity-0 group-hover:opacity-10 rounded-full -translate-y-10 translate-x-10 transition-opacity duration-500"></div>
                    <div className={`absolute inset-0 bg-gradient-to-br ${forecast.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>
                    
                    <div className="relative z-10 flex items-start space-x-3">
                      <div className="text-4xl animate-float" style={{ animationDelay: `${index * 200}ms` }}>
                        {forecast.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900 mb-2 group-hover:text-gray-800 transition-colors">
                          {forecast.title}
                        </h4>
                        <p className="text-sm text-gray-700 mb-3 leading-relaxed">
                          {forecast.description}
                        </p>
                        
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              forecast.impact === 'Alto' || forecast.impact === 'Crítico' 
                                ? 'bg-red-100 text-red-700' 
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {forecast.impact}
                            </span>
                            <span className="text-xs text-gray-500 font-medium">
                              {forecast.confidence}% confiança
                            </span>
                          </div>
                        </div>
                        
                        <div className={`w-full h-2 rounded-full ${
                          forecast.color === 'green' ? 'bg-green-200' :
                          forecast.color === 'red' ? 'bg-red-200' :
                          forecast.color === 'blue' ? 'bg-blue-200' :
                          forecast.color === 'purple' ? 'bg-purple-200' :
                          forecast.color === 'orange' ? 'bg-orange-200' :
                          'bg-cyan-200'
                        } overflow-hidden`}>
                          <div
                            className={`h-full rounded-full transition-all duration-1000 ${
                              forecast.color === 'green' ? 'bg-green-500' :
                              forecast.color === 'red' ? 'bg-red-500' :
                              forecast.color === 'blue' ? 'bg-blue-500' :
                              forecast.color === 'purple' ? 'bg-purple-500' :
                              forecast.color === 'orange' ? 'bg-orange-500' :
                              'bg-cyan-500'
                            }`}
                            style={{ 
                              width: `${forecast.confidence}%`,
                              boxShadow: `0 0 20px ${
                                forecast.color === 'green' ? 'rgba(34, 197, 94, 0.5)' :
                                forecast.color === 'red' ? 'rgba(239, 68, 68, 0.5)' :
                                forecast.color === 'blue' ? 'rgba(59, 130, 246, 0.5)' :
                                forecast.color === 'purple' ? 'rgba(139, 92, 246, 0.5)' :
                                forecast.color === 'orange' ? 'rgba(245, 158, 11, 0.5)' :
                                'rgba(6, 182, 212, 0.5)'
                              }`
                            }}
                          >
                            <div className="h-full bg-gradient-to-r from-white/30 to-transparent"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  }
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-purple-200 border-b-purple-600 rounded-full animate-spin animate-reverse mx-auto"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-pink-200 border-l-pink-600 rounded-full animate-spin mx-auto" style={{ animationDirection: 'reverse', animationDuration: '3s' }}></div>
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">🧠 IA Analisando Dados</h3>
          <p className="text-gray-500">Processando insights avançados do supermercado...</p>
          <div className="flex items-center justify-center space-x-1 mt-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '100ms' }}></div>
            <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-3 lg:p-6 bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 min-h-screen">
      {/* Header premium */}
      <div className="relative overflow-hidden text-center mb-8 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 rounded-2xl shadow-2xl p-4 lg:p-8 text-white">
        <div className="absolute inset-0 bg-white bg-opacity-10 backdrop-blur-sm"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-32 translate-x-32 animate-float"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full translate-y-24 -translate-x-24 animate-float" style={{ animationDelay: '1s' }}></div>
        
        <div className="relative z-10">
          <h1 className="text-2xl lg:text-4xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent mb-2">
            💡 Analytics IA PRECIVOX ⚡
          </h1>
          <p className="text-blue-100 text-sm lg:text-lg">
            {hasRealData 
              ? "Análises inteligentes em tempo real" 
              : "Conecte sua base de dados para insights personalizados"
            }
          </p>
          
          {!hasRealData && (
            <div className="mt-4 bg-yellow-500 bg-opacity-20 backdrop-blur-sm rounded-lg px-4 py-2 border border-yellow-300 border-opacity-30">
              <p className="text-yellow-100 text-sm font-medium">
                💡 Use dados reais do seu mercado para análises personalizadas
              </p>
            </div>
          )}
          
          <div className="flex items-center justify-center space-x-6 mt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">97%</div>
              <div className="text-xs text-blue-100">Precisão IA</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">24/7</div>
              <div className="text-xs text-blue-100">Monitoramento</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{urgentAlerts.length + actionableInsights.length}</div>
              <div className="text-xs text-blue-100">Insights Ativos</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navegação premium por abas */}
      {renderPremiumTabs()}

      {/* Conteúdo da aba ativa */}
      <div className="animate-fade-in">
        {renderTabContent()}
      </div>

      {/* Footer com ações rápidas premium */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 overflow-hidden">
        <h4 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <div className="p-1 bg-yellow-500 rounded-lg">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span>⚡ Ações Rápidas Enterprise</span>
        </h4>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <button className="group relative overflow-hidden flex items-center justify-center space-x-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white p-4 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
            <span className="text-xl">📱</span>
            <div className="text-left">
              <div className="font-semibold">WhatsApp</div>
              <div className="text-sm opacity-90">Enviar relatório</div>
            </div>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
          
          <button className="group relative overflow-hidden flex items-center justify-center space-x-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-4 rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
            <span className="text-xl">📊</span>
            <div className="text-left">
              <div className="font-semibold">Excel</div>
              <div className="text-sm opacity-90">Exportar dados</div>
            </div>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
          
          <button className="group relative overflow-hidden flex items-center justify-center space-x-3 bg-gradient-to-r from-purple-500 to-violet-600 text-white p-4 rounded-xl hover:from-purple-600 hover:to-violet-700 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
            <span className="text-xl">🔄</span>
            <div className="text-left">
              <div className="font-semibold">Atualizar</div>
              <div className="text-sm opacity-90">Dados em tempo real</div>
            </div>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* CSS para animações personalizadas */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-reverse {
          animation-direction: reverse;
        }

        ::-webkit-scrollbar {
          width: 6px;
        }

        ::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 3px;
        }

        ::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #3b82f6, #8b5cf6);
          border-radius: 3px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #2563eb, #7c3aed);
        }

        /* Estilos para scroll horizontal mobile */
        .mobile-scroll-container {
          scroll-behavior: smooth;
          scrollbar-width: thin;
          scrollbar-color: #3b82f6 #f1f5f9;
          -webkit-overflow-scrolling: touch;
        }

        .mobile-scroll-container::-webkit-scrollbar {
          height: 4px;
        }

        .mobile-scroll-container::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 2px;
        }

        .mobile-scroll-container::-webkit-scrollbar-thumb {
          background: linear-gradient(to right, #3b82f6, #8b5cf6);
          border-radius: 2px;
        }

        .mobile-scroll-container::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to right, #2563eb, #7c3aed);
        }

        /* Fade-out gradient no final do scroll */
        .mobile-scroll-container::after {
          content: '';
          position: absolute;
          right: 0;
          top: 0;
          bottom: 0;
          width: 40px;
          background: linear-gradient(to left, rgba(255,255,255,0.9), transparent);
          pointer-events: none;
          z-index: 1;
        }

        @media (min-width: 1024px) {
          .mobile-scroll-container::after {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default InsightsView;