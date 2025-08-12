// ListaCompleta.tsx - Versão Final com Análise IA Integrada
import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Edit3, Share2, FileDown, Plus, Minus, Trash2, Bot, Zap, 
  TrendingDown, TrendingUp, MapPin, Clock, Star, BarChart3, CheckCircle, 
  AlertTriangle, Route, Calculator, Target, Brain, ShoppingBag, Fuel, 
  Timer, Award, Filter, Search, ChevronDown, ChevronUp, Eye, Navigation, 
  Sparkles, DollarSign, Percent, X 
} from 'lucide-react';

// ✅ IMPORTAÇÕES DA ANÁLISE IA
import { useAIAnalysis } from '../../hooks/useAIAnalysis';
import AIAnalysisModal from '../ai/AIDrawerBottomSheet';

// Importar estilos customizados
import '../../styles/ListaCompleta.styles.css';

// Interfaces expandidas (mantidas igual)
interface Product {
  id: string;
  nome: string;
  preco: number;
  categoria: string;
  imagem?: string;
  loja: string;
  lojaId: string;
  descricao?: string;
  distancia?: number;
  promocao?: {
    desconto: number;
    precoOriginal: number;
    validoAte: string;
  };
  avaliacao?: number;
  numeroAvaliacoes?: number;
  disponivel: boolean;
  tempoEntrega?: string;
  isNovo?: boolean;
  isMelhorPreco?: boolean;
  marca?: string;
  codigo?: string;
  peso?: string;
  origem?: string;
  visualizacoes?: number;
  conversoes?: number;
  estoque?: number;
  endereco?: string;
  telefone?: string;
}

interface Lista {
  id: string;
  nome: string;
  itens: Array<{
    produto: Product;
    quantidade: number;
  }>;
  dataUltimaEdicao: string;
  dataCriacao?: string;
  cor?: string;
  isFavorita?: boolean;
}

interface ListaCompletaProps {
  lista: Lista;
  onBack: () => void;
  onUpdateList: (lista: Lista) => void;
  onProductClick: (product: Product) => void;
}

interface SmartSuggestion {
  id: string;
  tipo: 'economia' | 'rota' | 'complemento' | 'promocao' | 'otimizacao';
  titulo: string;
  descricao: string;
  impacto: 'alto' | 'medio' | 'baixo';
  economia?: number;
  tempoEconomizado?: number;
  icon: any;
  acao: string;
  detalhes?: string;
}

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info' | 'smart';
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const getToastClasses = () => {
    const baseClasses = 'fixed top-4 right-4 z-[70] animate-slide-in-from-right px-6 py-3 rounded-xl shadow-lg text-white';
    switch (type) {
      case 'success': return `${baseClasses} bg-gradient-to-r from-green-500 to-green-600`;
      case 'error': return `${baseClasses} bg-gradient-to-r from-red-500 to-red-600`;
      case 'info': return `${baseClasses} bg-gradient-to-r from-blue-500 to-blue-600`;
      case 'smart': return `${baseClasses} bg-gradient-to-r from-purple-500 to-purple-600`;
      default: return `${baseClasses} bg-gray-600`;
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5" />;
      case 'smart': return <Brain className="w-5 h-5" />;
      case 'info': return <Zap className="w-5 h-5" />;
      default: return null;
    }
  };

  return (
    <div className={getToastClasses()}>
      <div className="flex items-center space-x-2">
        {getIcon()}
        <span className="font-medium">{message}</span>
      </div>
    </div>
  );
};

const ListaCompleta: React.FC<ListaCompletaProps> = ({ 
  lista, 
  onBack, 
  onUpdateList, 
  onProductClick 
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [newListName, setNewListName] = useState(lista.nome);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'smart' } | null>(null);
  const [expandedInsights, setExpandedInsights] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [sortBy, setSortBy] = useState<'nome' | 'preco' | 'categoria' | 'loja'>('nome');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // ✅ HOOK DE ANÁLISE IA INTEGRADO
  const {
    isAnalysisModalOpen,
    openAnalysisModal,
    closeAnalysisModal
  } = useAIAnalysis();

  // 🔍 DEBUG: Log na montagem do componente
  useEffect(() => {
    console.log('🎯 LISTACOMPLETA - Componente montado');
    console.log('📋 Lista recebida via props:', lista);
    console.log('🏷️ Nome:', lista?.nome);
    console.log('🛒 Itens:', lista?.itens);
    console.log('📊 Quantidade:', lista?.itens?.length || 0);
    
    if (!lista) {
      console.error('❌ ERRO: Lista é null/undefined!');
    } else if (!lista.itens) {
      console.error('❌ ERRO: Lista.itens é null/undefined!');
    } else if (lista.itens.length === 0) {
      console.warn('⚠️ AVISO: Lista.itens está vazia!');
    } else {
      console.log('✅ Lista com dados válidos recebida');
      lista.itens.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.produto.nome} - ${item.quantidade}x - ${item.produto.loja}`);
      });
    }
  }, [lista]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const getTotalPrice = () => {
    return lista.itens.reduce((total, item) => total + (item.produto.preco * item.quantidade), 0);
  };

  const getTotalEconomy = () => {
    return lista.itens.reduce((total, item) => {
      if (item.produto.promocao) {
        return total + ((item.produto.promocao.precoOriginal - item.produto.preco) * item.quantidade);
      }
      return total;
    }, 0);
  };

  // ✅ FUNÇÃO PARA ABRIR ANÁLISE IA AVANÇADA
  const handleOpenAIAnalysis = () => {
    console.log('🧠 LISTACOMPLETA - Abrindo análise IA avançada');
    console.log('📋 Lista para análise:', lista);
    console.log('🛒 Itens:', lista.itens.length);
    
    try {
      // Converter lista para formato que o AIAnalysisModal espera
      const listItemsForAI = lista.itens.map(item => ({
        produto: item.produto,
        quantidade: item.quantidade
      }));
      
      openAnalysisModal(listItemsForAI);
      
      setToast({ 
        message: '🧠 Abrindo análise IA avançada da sua lista...', 
        type: 'smart' 
      });
    } catch (error) {
      console.error('💥 LISTACOMPLETA - Erro ao abrir análise IA:', error);
      setToast({
        message: 'Erro ao abrir análise inteligente',
        type: 'error'
      });
    }
  };

  // 🧠 INTELIGÊNCIA AVANÇADA: Análise completa da lista - CORRIGIDA
  const getAdvancedAnalytics = () => {
    if (lista.itens.length === 0) {
      return {
        mercados: [],
        totalMercados: 0,
        totalItens: 0,
        totalCategorias: 0,
        categorias: [],
        itensPromo: 0,
        economiaPromo: 0,
        distanciaTotal: 0,
        tempoEstimado: 0,
        custoGasolina: 0,
        precoMedio: 0,
        melhorMercado: 'Nenhum',
        concentracaoMelhorMercado: '0',
        eficiencia: 0
      };
    }

    const mercados = lista.itens.reduce((acc, item) => {
      const mercado = item.produto.loja;
      if (!acc[mercado]) {
        acc[mercado] = { 
          total: 0, 
          itens: 0, 
          distancia: item.produto.distancia || 2.5,
          endereco: item.produto.endereco || `Rua Principal, ${mercado}`,
          produtos: []
        };
      }
      acc[mercado].total += item.produto.preco * item.quantidade;
      acc[mercado].itens += 1;
      acc[mercado].produtos.push(item);
      return acc;
    }, {} as Record<string, any>);

    const mercadosArray = Object.entries(mercados);
    const totalItens = lista.itens.reduce((sum, item) => sum + item.quantidade, 0);
    const categorias = [...new Set(lista.itens.map(item => item.produto.categoria))];
    const itensPromo = lista.itens.filter(item => item.produto.promocao);
    
    const distanciaTotal = mercadosArray.reduce((sum, [_, data]) => sum + data.distancia, 0);
    const tempoEstimado = mercadosArray.length * 15 + distanciaTotal * 2;
    const custoGasolina = distanciaTotal * 0.8;
    const precoMedio = totalItens > 0 ? getTotalPrice() / totalItens : 0;
    
    const melhorMercado = mercadosArray.length > 0 
      ? mercadosArray.reduce((best, current) => 
          current[1].total > best[1].total ? current : best
        )
      : ['Nenhum', { total: 0 }];

    const totalPrice = getTotalPrice();

    return {
      mercados: mercadosArray.map(([nome, data]) => ({ nome, ...data })),
      totalMercados: mercadosArray.length,
      totalItens,
      totalCategorias: categorias.length,
      categorias,
      itensPromo: itensPromo.length,
      economiaPromo: getTotalEconomy(),
      distanciaTotal,
      tempoEstimado,
      custoGasolina,
      precoMedio,
      melhorMercado: melhorMercado[0],
      concentracaoMelhorMercado: totalPrice > 0 ? (melhorMercado[1].total / totalPrice * 100).toFixed(0) : '0',
      eficiencia: Math.max(0, 100 - (mercadosArray.length * 10))
    };
  };

  // 🚀 SUGESTÕES INTELIGENTES AVANÇADAS (mantida igual)
  const generateSmartSuggestions = (): SmartSuggestion[] => {
    const analytics = getAdvancedAnalytics();
    const suggestions: SmartSuggestion[] = [];

    if (lista.itens.length === 0) {
      return [];
    }

    if (analytics.totalMercados > 2) {
      suggestions.push({
        id: 'concentrar_mercado',
        tipo: 'rota',
        titulo: `Concentrar ${analytics.concentracaoMelhorMercado}% no ${analytics.melhorMercado}`,
        descricao: 'Reduza mercados para economizar tempo e combustível',
        impacto: 'alto',
        economia: analytics.custoGasolina * 0.6,
        tempoEconomizado: analytics.tempoEstimado * 0.4,
        icon: Route,
        acao: 'Otimizar Rota',
        detalhes: `Economize até ${Math.round(analytics.tempoEstimado * 0.4)} minutos`
      });
    }

    if (analytics.itensPromo > 0) {
      suggestions.push({
        id: 'aproveitar_promocoes',
        tipo: 'promocao',
        titulo: `${analytics.itensPromo} itens em promoção!`,
        descricao: 'Aumente quantidade dos itens promocionais',
        impacto: 'medio',
        economia: analytics.economiaPromo * 1.5,
        icon: Percent,
        acao: 'Aproveitar',
        detalhes: 'Duplique quantidades e economize mais'
      });
    }

    const hasBasicos = lista.itens.some(item => 
      ['arroz', 'feijão', 'açúcar', 'sal'].some(basico => 
        item.produto.nome.toLowerCase().includes(basico)
      )
    );
    
    if (hasBasicos && lista.itens.length < 8) {
      suggestions.push({
        id: 'completar_basicos',
        tipo: 'complemento',
        titulo: 'Complete sua despensa básica',
        descricao: 'IA detectou falta de itens essenciais',
        impacto: 'medio',
        icon: Brain,
        acao: 'Ver Sugestões',
        detalhes: 'Óleo, farinha, macarrão e temperos'
      });
    }

    if (analytics.precoMedio > 15) {
      suggestions.push({
        id: 'otimizar_precos',
        tipo: 'economia',
        titulo: 'Preço médio alto detectado',
        descricao: 'Busque alternativas mais baratas',
        impacto: 'alto',
        economia: getTotalPrice() * 0.15,
        icon: DollarSign,
        acao: 'Otimizar',
        detalhes: 'Encontre produtos similares mais baratos'
      });
    }

    if (analytics.eficiencia < 70) {
      suggestions.push({
        id: 'melhorar_eficiencia',
        tipo: 'otimizacao',
        titulo: 'Lista pouco eficiente',
        descricao: 'Muitos mercados para poucos itens',
        impacto: 'alto',
        tempoEconomizado: 45,
        icon: Target,
        acao: 'Reorganizar',
        detalhes: 'Concentre compras para ganhar tempo'
      });
    }

    return suggestions.sort((a, b) => {
      const impactoScore = { alto: 3, medio: 2, baixo: 1 };
      return impactoScore[b.impacto] - impactoScore[a.impacto];
    }).slice(0, 4);
  };

  const [smartSuggestions, setSmartSuggestions] = useState<SmartSuggestion[]>([]);

  useEffect(() => {
    const suggestions = generateSmartSuggestions();
    setSmartSuggestions(suggestions);
  }, [lista]);

  // ✅ CORREÇÃO DE IMAGENS SEM ERRO 404
  const getProductImageUrl = (produto: Product) => {
    if (produto.imagem && !produto.imagem.includes('placeholder')) {
      return produto.imagem;
    }
    
    // Gerar ID baseado no nome do produto para imagem consistente
    let hash = 0;
    for (let i = 0; i < produto.nome.length; i++) {
      const char = produto.nome.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    const productId = Math.abs(hash) % 1000;
    
    return `https://picsum.photos/300/300?random=${productId}`;
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>, productName: string) => {
    const target = e.target as HTMLImageElement;
    target.src = `https://via.placeholder.com/300x300/e0e0e0/666666?text=${encodeURIComponent(productName.slice(0, 10))}`;
  };


  const applySuggestion = (suggestionId: string) => {
    const suggestion = smartSuggestions.find(s => s.id === suggestionId);
    if (!suggestion) return;

    setSmartSuggestions(prev => prev.filter(s => s.id !== suggestionId));
    
    let message = `✅ ${suggestion.titulo} aplicada!`;
    if (suggestion.economia) {
      message += ` Economia: ${formatPrice(suggestion.economia)}`;
    }
    if (suggestion.tempoEconomizado) {
      message += ` Tempo: ${suggestion.tempoEconomizado}min`;
    }
    
    setToast({ message, type: 'success' });
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    console.log('🔄 LISTACOMPLETA - Atualizando quantidade');
    console.log('- Product ID:', productId);
    console.log('- Nova quantidade:', newQuantity);
    
    if (newQuantity <= 0) {
      removeItem(productId);
      return;
    }
    
    const updatedLista = {
      ...lista,
      itens: lista.itens.map(item => 
        item.produto.id === productId ? { ...item, quantidade: newQuantity } : item
      ),
      dataUltimaEdicao: new Date().toISOString()
    };
    
    onUpdateList(updatedLista);
  };

  const removeItem = (productId: string) => {
    console.log('🗑️ LISTACOMPLETA - Removendo item:', productId);
    
    const updatedLista = {
      ...lista,
      itens: lista.itens.filter(item => item.produto.id !== productId),
      dataUltimaEdicao: new Date().toISOString()
    };
    
    onUpdateList(updatedLista);
    setToast({ message: '🗑️ Item removido da lista!', type: 'error' });
  };

  const saveListName = () => {
    if (newListName.trim()) {
      const updatedLista = {
        ...lista,
        nome: newListName.trim(),
        dataUltimaEdicao: new Date().toISOString()
      };
      
      onUpdateList(updatedLista);
      setIsEditingName(false);
      setToast({ message: '✅ Nome da lista atualizado!', type: 'success' });
    }
  };

  // ✅ APLICAR SUGESTÃO IA
  const handleApplySuggestion = (suggestion: any) => {
    console.log('🎯 LISTACOMPLETA - Aplicando sugestão IA:', suggestion);
    
    try {
      const updatedLista = { ...lista };
      
      switch (suggestion.action?.type) {
        case 'change_store':
          console.log(`🏪 Mudando ${suggestion.item} de ${suggestion.mercadoAtual} para ${suggestion.mercadoSugerido}`);
          
          // Encontrar e atualizar o item na lista
          const storeItemIndex = updatedLista.itens.findIndex(item => 
            item.produto.id === suggestion.action?.productId
          );
          
          if (storeItemIndex !== -1) {
            updatedLista.itens[storeItemIndex] = {
              ...updatedLista.itens[storeItemIndex],
              produto: {
                ...updatedLista.itens[storeItemIndex].produto,
                loja: suggestion.mercadoSugerido,
                preco: suggestion.precoSugerido
              }
            };
            
            onUpdateList(updatedLista);
            console.log('✅ Lista atualizada com nova loja');
            setToast({ 
              message: `✅ ${suggestion.item} transferido para ${suggestion.mercadoSugerido}! Economia: R$ ${suggestion.economia.toFixed(2)}`, 
              type: 'smart' 
            });
          }
          
          return {
            success: true,
            message: `✅ ${suggestion.item} transferido para ${suggestion.mercadoSugerido}! Economia: R$ ${suggestion.economia.toFixed(2)}`
          };
        
        case 'increase_quantity':
          console.log(`📦 Aumentando quantidade de ${suggestion.item} para ${suggestion.action.newQuantity}`);
          
          const quantityItemIndex = updatedLista.itens.findIndex(item => 
            item.produto.id === suggestion.action?.productId
          );
          
          if (quantityItemIndex !== -1 && suggestion.action?.newQuantity) {
            updatedLista.itens[quantityItemIndex] = {
              ...updatedLista.itens[quantityItemIndex],
              quantidade: suggestion.action.newQuantity,
              produto: {
                ...updatedLista.itens[quantityItemIndex].produto,
                preco: suggestion.precoSugerido
              }
            };
            
            onUpdateList(updatedLista);
            console.log('✅ Lista atualizada com nova quantidade');
            setToast({ 
              message: `✅ Quantidade de ${suggestion.item} otimizada! Economia: R$ ${suggestion.economia.toFixed(2)}`, 
              type: 'smart' 
            });
          }
          
          return {
            success: true,
            message: `✅ Quantidade de ${suggestion.item} otimizada! Economia: R$ ${suggestion.economia.toFixed(2)}`
          };
        
        case 'add_product':
          console.log(`➕ Adicionando produto complementar: ${suggestion.item}`);
          
          if (suggestion.action?.newProduct) {
            const newItem = {
              produto: suggestion.action.newProduct,
              quantidade: 1
            };
            
            updatedLista.itens.push(newItem);
            onUpdateList(updatedLista);
            console.log('✅ Produto complementar adicionado à lista');
            setToast({ 
              message: `✅ Produto ${suggestion.item} adicionado à lista!`, 
              type: 'smart' 
            });
          }
          
          return {
            success: true,
            message: `✅ Produto ${suggestion.item} adicionado à lista!`
          };
        
        case 'optimize_route':
          console.log(`🗺️ Otimizando rota de compras`);
          // Para otimização de rota, vamos reordenar por loja
          updatedLista.itens.sort((a, b) => {
            const lojaA = typeof a.produto.loja === 'string' ? a.produto.loja : a.produto.loja;
            const lojaB = typeof b.produto.loja === 'string' ? b.produto.loja : b.produto.loja;
            return lojaA.localeCompare(lojaB);
          });
          
          onUpdateList(updatedLista);
          setToast({ 
            message: `✅ Rota de compras otimizada! Itens reordenados por loja.`, 
            type: 'smart' 
          });
          
          return {
            success: true,
            message: `✅ Rota de compras otimizada! Itens reordenados por loja.`
          };
        
        default:
          console.warn('⚠️ Tipo de ação não reconhecido:', suggestion.action?.type);
          setToast({ 
            message: `Tipo de sugestão "${suggestion.action?.type}" não suportado ainda`, 
            type: 'error' 
          });
          return {
            success: false,
            message: `Tipo de sugestão "${suggestion.action?.type}" não suportado ainda`
          };
      }
    } catch (error) {
      console.error('❌ LISTACOMPLETA - Erro ao aplicar sugestão:', error);
      setToast({ 
        message: 'Erro inesperado ao aplicar sugestão', 
        type: 'error' 
      });
      return {
        success: false,
        message: 'Erro inesperado ao aplicar sugestão'
      };
    }
  };

  const shareList = () => {
    const analytics = getAdvancedAnalytics();
    const text = `🛒 Lista: ${lista.nome}\n${analytics.totalItens} itens • ${formatPrice(getTotalPrice())}\n💡 ${analytics.totalMercados} mercados • Economia: ${formatPrice(analytics.economiaPromo)}`;
    
    if (navigator.share) {
      navigator.share({
        title: lista.nome,
        text: text,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(text);
      setToast({ message: '📋 Lista copiada!', type: 'info' });
    }
  };

  const exportPDF = () => {
    setToast({ message: '📄 Exportando relatório inteligente...', type: 'info' });
  };

  // Filtros e ordenação
  const getFilteredItems = () => {
    let filtered = lista.itens;
    
    if (filterCategory !== 'all') {
      filtered = filtered.filter(item => item.produto.categoria === filterCategory);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.produto.marca?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'preco':
          return (b.produto.preco * b.quantidade) - (a.produto.preco * a.quantidade);
        case 'categoria':
          return a.produto.categoria.localeCompare(b.produto.categoria);
        case 'loja':
          return a.produto.loja.localeCompare(b.produto.loja);
        default:
          return a.produto.nome.localeCompare(b.produto.nome);
      }
    });
  };

  const analytics = getAdvancedAnalytics();
  const filteredItems = getFilteredItems();

  // Estado vazio
  if (lista.itens.length === 0) {
    console.log('📭 LISTACOMPLETA - Renderizando estado vazio');
    
    return (
      <div className="min-h-screen bg-gray-50">
        {/* ✅ MODAL DE ANÁLISE IA */}
        <AIAnalysisModal
          isOpen={isAnalysisModalOpen}
          onClose={closeAnalysisModal}
          listItems={[]}
          listName={lista.nome}
          onApplySuggestion={handleApplySuggestion}
        />

        <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button 
                  onClick={onBack}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <h1 className="text-2xl font-bold text-gray-900">Lista Inteligente</h1>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-20">
          <div className="text-center">
            <div className="text-6xl mb-6">🧠</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Sua lista inteligente está vazia</h2>
            <p className="text-xl text-gray-600 mb-8">
              Comece adicionando produtos e deixe nossa IA otimizar suas compras
            </p>
            <button
              onClick={onBack}
              className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-colors shadow-lg"
            >
              🔍 Buscar Produtos Inteligentes
            </button>
          </div>
        </div>
      </div>
    );
  }

  console.log('📋 LISTACOMPLETA - Renderizando lista com', lista.itens.length, 'itens');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ✅ MODAL DE ANÁLISE IA */}
      <AIAnalysisModal
        isOpen={isAnalysisModalOpen}
        onClose={closeAnalysisModal}
        listItems={lista.itens}
        listName={lista.nome}
        onApplySuggestion={handleApplySuggestion}
      />

      {/* Toast */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      {/* ✅ Header - MOBILE FIRST */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 shadow-sm border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Mobile: Stack vertical */}
          <div className="block lg:hidden py-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <button 
                  onClick={onBack}
                  className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <Brain className="w-6 h-6 text-purple-600" />
              </div>
              
              <div className="text-right">
                <div className="text-lg font-bold text-green-600">
                  {formatPrice(getTotalPrice())}
                </div>
                <div className="text-xs text-gray-600">
                  {analytics.eficiencia}% eficiência
                </div>
              </div>
            </div>

            {/* Nome da lista - Mobile */}
            {isEditingName ? (
              <input
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                className="w-full text-lg font-bold text-gray-900 bg-transparent border-b-2 border-blue-500 outline-none mb-3"
                onBlur={saveListName}
                onKeyPress={(e) => e.key === 'Enter' && saveListName()}
                autoFocus
              />
            ) : (
              <div className="flex items-center justify-between mb-3">
                <h1 className="text-lg font-bold text-gray-900 flex-1 truncate">{lista.nome}</h1>
                <button
                  onClick={() => setIsEditingName(true)}
                  className="p-1 hover:bg-white/50 rounded ml-2"
                >
                  <Edit3 className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            )}

            {/* Stats - Mobile */}
            <div className="grid grid-cols-3 gap-2 mb-4 text-xs text-gray-600">
              <div className="text-center">
                <div className="font-semibold">{analytics.totalItens}</div>
                <div>itens</div>
              </div>
              <div className="text-center">
                <div className="font-semibold">{analytics.totalMercados}</div>
                <div>mercados</div>
              </div>
              <div className="text-center">
                <div className="font-semibold">~{analytics.tempoEstimado}min</div>
                <div>tempo</div>
              </div>
            </div>

            {analytics.economiaPromo > 0 && (
              <div className="text-center text-green-600 font-medium text-sm mb-4">
                Economia: -{formatPrice(analytics.economiaPromo)}
              </div>
            )}

            {/* Actions - Mobile */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleOpenAIAnalysis}
                className="bg-purple-600 text-white py-2 px-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
              >
                <Sparkles className="w-4 h-4" />
                Análise IA
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2">
              <button
                onClick={shareList}
                className="border border-blue-500 text-blue-600 py-2 px-3 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
              >
                <Share2 className="w-4 h-4" />
                Compartilhar
              </button>
              <button
                onClick={exportPDF}
                className="border border-purple-500 text-purple-600 py-2 px-3 rounded-lg hover:bg-purple-50 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
              >
                <FileDown className="w-4 h-4" />
                Relatório
              </button>
            </div>
          </div>

          {/* Desktop: Layout horizontal original */}
          <div className="hidden lg:flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <button 
                onClick={onBack}
                className="p-2 hover:bg-white/50 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              
              {isEditingName ? (
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    className="text-2xl font-bold text-gray-900 bg-transparent border-b-2 border-blue-500 outline-none"
                    onBlur={saveListName}
                    onKeyPress={(e) => e.key === 'Enter' && saveListName()}
                    autoFocus
                  />
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Brain className="w-8 h-8 text-purple-600" />
                  <div>
                    <div className="flex items-center space-x-2">
                      <h1 className="text-2xl font-bold text-gray-900">{lista.nome}</h1>
                      <button
                        onClick={() => setIsEditingName(true)}
                        className="p-1 hover:bg-white/50 rounded"
                      >
                        <Edit3 className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>{analytics.totalItens} itens</span>
                      <span>{analytics.totalMercados} mercados</span>
                      <span>~{analytics.tempoEstimado}min</span>
                      {analytics.economiaPromo > 0 && (
                        <span className="text-green-600 font-medium">
                          -{formatPrice(analytics.economiaPromo)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600">
                  {formatPrice(getTotalPrice())}
                </div>
                <div className="text-sm text-gray-600">
                  Eficiência: {analytics.eficiencia}%
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={handleOpenAIAnalysis}
                  className="bg-purple-600 text-white p-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-1"
                  title="Análise IA Avançada"
                >
                  <Sparkles className="w-5 h-5" />
                  <span>Análise IA</span>
                </button>

                
                <button
                  onClick={shareList}
                  className="border-2 border-blue-500 text-blue-600 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                  title="Compartilhar"
                >
                  <Share2 className="w-5 h-5" />
                </button>
                
                <button
                  onClick={exportPDF}
                  className="border-2 border-purple-500 text-purple-600 p-2 rounded-lg hover:bg-purple-50 transition-colors"
                  title="Relatório PDF"
                >
                  <FileDown className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ Content - MOBILE FIRST */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Mobile: Stack all content vertically */}
        <div className="space-y-6 lg:hidden">
          {/* Resumo Financeiro - Mobile First */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl shadow-sm p-4 border border-green-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Calculator className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-gray-900">Total</h3>
              </div>
              <div className="text-xl font-bold text-green-600">
                {formatPrice(getTotalPrice())}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Itens:</span>
                <span className="font-medium">{analytics.totalItens}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tempo:</span>
                <span className="font-medium">{analytics.tempoEstimado}min</span>
              </div>
              {analytics.economiaPromo > 0 && (
                <>
                  <div className="flex justify-between text-green-600">
                    <span>Economia:</span>
                    <span className="font-medium">-{formatPrice(analytics.economiaPromo)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between text-orange-600">
                <span>Combustível:</span>
                <span className="font-medium">{formatPrice(analytics.custoGasolina)}</span>
              </div>
            </div>

            <button
              onClick={handleOpenAIAnalysis}
              className="w-full mt-4 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center justify-center space-x-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Análise IA Completa</span>
            </button>
          </div>

          {/* Insights IA - Mobile */}
          {smartSuggestions.length > 0 && (
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl shadow-sm p-4 border border-purple-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Brain className="w-5 h-5 text-purple-600" />
                  <h3 className="font-semibold text-gray-900">IA Recomenda</h3>
                </div>
              </div>
              
              <div className="space-y-3">
                {smartSuggestions.slice(0, 2).map(suggestion => (
                  <div key={suggestion.id} className="bg-white rounded-lg p-3 border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <suggestion.icon className="w-4 h-4 text-purple-600" />
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          suggestion.impacto === 'alto' ? 'bg-red-100 text-red-800' :
                          suggestion.impacto === 'medio' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {suggestion.impacto.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    
                    <h4 className="font-semibold text-gray-900 text-sm mb-1">{suggestion.titulo}</h4>
                    <p className="text-xs text-gray-600 mb-2">{suggestion.descricao}</p>
                    
                    {(suggestion.economia || suggestion.tempoEconomizado) && (
                      <div className="flex items-center space-x-3 mb-2 text-xs">
                        {suggestion.economia && (
                          <span className="text-green-600 font-medium">
                            💰 {formatPrice(suggestion.economia)}
                          </span>
                        )}
                        {suggestion.tempoEconomizado && (
                          <span className="text-blue-600 font-medium">
                            ⏱️ {suggestion.tempoEconomizado}min
                          </span>
                        )}
                      </div>
                    )}
                    
                    <button
                      onClick={() => applySuggestion(suggestion.id)}
                      className="w-full bg-gray-100 text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors text-xs font-medium"
                    >
                      {suggestion.acao}
                    </button>
                  </div>
                ))}
              </div>

              {smartSuggestions.length > 2 && (
                <button
                  onClick={handleOpenAIAnalysis}
                  className="w-full mt-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 px-4 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors font-medium text-sm flex items-center justify-center space-x-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Ver Todas as {smartSuggestions.length} Sugestões</span>
                </button>
              )}
            </div>
          )}

          {/* Controles e Lista - Mobile */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                Produtos ({filteredItems.length})
              </h2>
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                    viewMode === 'table' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600'
                  }`}
                >
                  Lista
                </button>
                <button
                  onClick={() => setViewMode('cards')}
                  className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                    viewMode === 'cards' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600'
                  }`}
                >
                  Cards
                </button>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              {/* Busca mobile */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar produtos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004A7C] focus:border-transparent"
                />
              </div>

              {/* Filtros mobile */}
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004A7C] focus:border-transparent text-sm"
                >
                  <option value="all">Todas Categorias</option>
                  {analytics.categorias.map(categoria => (
                    <option key={categoria} value={categoria}>{categoria}</option>
                  ))}
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004A7C] focus:border-transparent text-sm"
                >
                  <option value="nome">Nome A-Z</option>
                  <option value="preco">Maior Valor</option>
                  <option value="categoria">Categoria</option>
                  <option value="loja">Mercado</option>
                </select>
              </div>
            </div>

            {/* Lista de Produtos - Mobile FIRST */}
            {viewMode === 'cards' ? (
              /* Cards - Mobile otimizado */
              <div className="space-y-3">
                {filteredItems.map((item, index) => (
                  <div key={item.produto.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <div className="flex items-start space-x-3">
                      <div className="relative flex-shrink-0">
                        <img 
                          src={getProductImageUrl(item.produto)} 
                          alt={item.produto.nome}
                          className="w-16 h-16 rounded-lg object-cover"
                          onClick={() => onProductClick(item.produto)}
                          onError={(e) => handleImageError(e, item.produto.nome)}
                        />
                        <div className="absolute -top-1 -left-1 bg-blue-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                          {index + 1}
                        </div>
                        {item.produto.promocao && (
                          <div className="absolute -bottom-1 -right-1 bg-red-500 text-white text-xs px-1 py-0.5 rounded">
                            {Math.round(((item.produto.promocao.precoOriginal - item.produto.preco) / item.produto.promocao.precoOriginal) * 100)}%
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <h3 
                              className="font-medium text-gray-900 text-sm truncate cursor-pointer hover:text-purple-600"
                              onClick={() => onProductClick(item.produto)}
                            >
                              {item.produto.nome}
                            </h3>
                            <div className="text-xs text-gray-500 mt-1">
                              {item.produto.marca && <span>{item.produto.marca} • </span>}
                              <span>{item.produto.categoria}</span>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {item.produto.loja} • {item.produto.distancia?.toFixed(1) || '1.2'} km
                            </div>
                          </div>
                          
                          <div className="text-right ml-2">
                            <div className="font-bold text-green-600">
                              {formatPrice(item.produto.preco * item.quantidade)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatPrice(item.produto.preco)}/un
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => updateQuantity(item.produto.id, item.quantidade - 1)}
                              className="w-6 h-6 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-full"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-8 text-center text-sm font-medium">
                              {item.quantidade}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.produto.id, item.quantidade + 1)}
                              className="w-6 h-6 flex items-center justify-center bg-blue-100 hover:bg-blue-200 rounded-full"
                            >
                              <Plus className="w-3 h-3 text-blue-600" />
                            </button>
                          </div>
                          
                          <button
                            onClick={() => removeItem(item.produto.id)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Lista compacta - Mobile */
              <div className="space-y-2">
                {filteredItems.map((item, index) => (
                  <div key={item.produto.id} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                    <div className="text-xs font-bold text-blue-600 w-6 text-center">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-gray-900 truncate">
                        {item.produto.nome}
                      </div>
                      <div className="text-xs text-gray-500">
                        {item.produto.loja} • {formatPrice(item.produto.preco)}/un
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(item.produto.id, item.quantidade - 1)}
                        className="w-6 h-6 flex items-center justify-center bg-gray-200 rounded-full"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-sm font-medium">
                        {item.quantidade}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.produto.id, item.quantidade + 1)}
                        className="w-6 h-6 flex items-center justify-center bg-blue-100 rounded-full"
                      >
                        <Plus className="w-3 h-3 text-blue-600" />
                      </button>
                    </div>
                    <div className="text-sm font-bold text-green-600">
                      {formatPrice(item.produto.preco * item.quantidade)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Desktop: Two column layout */}
        <div className="hidden lg:grid grid-cols-4 gap-8">
          {/* Coluna Principal - Lista de Itens */}
          <div className="col-span-3 space-y-6">
            {/* ✅ INSIGHTS INTELIGENTES COM BOTÃO DE ANÁLISE IA */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl shadow-lg border border-purple-200">
              <div 
                className="p-6 cursor-pointer"
                onClick={() => setExpandedInsights(!expandedInsights)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Brain className="w-8 h-8 text-purple-600" />
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Análise Inteligente da Lista</h2>
                      <p className="text-sm text-gray-600">IA analisou sua lista e encontrou oportunidades</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {/* ✅ BOTÃO ANÁLISE IA DENTRO DOS INSIGHTS */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenAIAnalysis();
                      }}
                      className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Análise Completa</span>
                    </button>
                    {expandedInsights ? (
                      <ChevronUp className="w-6 h-6 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-6 h-6 text-gray-500" />
                    )}
                  </div>
                </div>
              </div>

              {expandedInsights && (
                <div className="px-6 pb-6">
                  {/* Métricas Principais */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">{analytics.eficiencia}%</div>
                      <div className="text-sm text-gray-600">Eficiência</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">{formatPrice(analytics.economiaPromo)}</div>
                      <div className="text-sm text-gray-600">Economia</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-orange-600">{analytics.tempoEstimado}min</div>
                      <div className="text-sm text-gray-600">Tempo Est.</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-purple-600">{analytics.distanciaTotal.toFixed(1)}km</div>
                      <div className="text-sm text-gray-600">Distância</div>
                    </div>
                  </div>

                  {/* ✅ CALL TO ACTION PARA ANÁLISE IA */}
                  <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg p-4 mb-6 border border-purple-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Brain className="w-6 h-6 text-purple-700" />
                        <div>
                          <h3 className="font-semibold text-purple-900">Quer uma análise ainda mais detalhada?</h3>
                          <p className="text-sm text-purple-700">Nossa IA pode encontrar até 30% mais economia e otimizações</p>
                        </div>
                      </div>
                      <button
                        onClick={handleOpenAIAnalysis}
                        className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center space-x-2"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Análise IA Avançada</span>
                      </button>
                    </div>
                  </div>

                  {/* Sugestões Inteligentes */}
                  {smartSuggestions.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        💡 Sugestões rápidas da IA:
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {smartSuggestions.slice(0, 4).map(suggestion => (
                          <div key={suggestion.id} className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <suggestion.icon className="w-5 h-5 text-purple-600" />
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  suggestion.impacto === 'alto' ? 'bg-red-100 text-red-800' :
                                  suggestion.impacto === 'medio' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-green-100 text-green-800'
                                }`}>
                                  {suggestion.impacto.toUpperCase()}
                                </span>
                              </div>
                            </div>
                            
                            <h4 className="font-semibold text-gray-900 mb-2">{suggestion.titulo}</h4>
                            <p className="text-sm text-gray-600 mb-3">{suggestion.descricao}</p>
                            
                            {(suggestion.economia || suggestion.tempoEconomizado) && (
                              <div className="flex items-center space-x-4 mb-3 text-sm">
                                {suggestion.economia && (
                                  <span className="text-green-600 font-medium">
                                    💰 {formatPrice(suggestion.economia)}
                                  </span>
                                )}
                                {suggestion.tempoEconomizado && (
                                  <span className="text-blue-600 font-medium">
                                    ⏱️ {suggestion.tempoEconomizado}min
                                  </span>
                                )}
                              </div>
                            )}
                            
                            <button
                              onClick={() => applySuggestion(suggestion.id)}
                              className="w-full bg-gray-100 text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                            >
                              {suggestion.acao}
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* ✅ BOTÃO PARA VER MAIS SUGESTÕES NA ANÁLISE IA */}
                      {smartSuggestions.length > 4 && (
                        <div className="text-center mt-4">
                          <button
                            onClick={handleOpenAIAnalysis}
                            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors font-medium inline-flex items-center space-x-2"
                          >
                            <Sparkles className="w-4 h-4" />
                            <span>Ver Todas as {smartSuggestions.length} Sugestões da IA</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Controles e Filtros Avançados */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 space-y-4 md:space-y-0">
                <div className="flex items-center space-x-4">
                  <h2 className="text-xl font-bold text-gray-900">
                    Produtos da Lista ({filteredItems.length})
                  </h2>
                  
                  {/* Toggle de Visualização */}
                  <div className="flex items-center bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('table')}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        viewMode === 'table' 
                          ? 'bg-white text-gray-900 shadow-sm' 
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Tabela
                    </button>
                    <button
                      onClick={() => setViewMode('cards')}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        viewMode === 'cards' 
                          ? 'bg-white text-gray-900 shadow-sm' 
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Cards
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-3">
                {/* Busca */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Buscar produtos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Filtro por Categoria */}
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Todas Categorias</option>
                  {analytics.categorias.map(categoria => (
                    <option key={categoria} value={categoria}>{categoria}</option>
                  ))}
                </select>

                {/* Ordenação */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="nome">Nome A-Z</option>
                  <option value="preco">Maior Valor</option>
                  <option value="categoria">Categoria</option>
                  <option value="loja">Mercado</option>
                </select>
              </div>
            </div>

            {/* Lista de Produtos - Visualização Dinâmica */}
            {viewMode === 'table' ? (
              /* Visualização em Tabela */
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Produto</th>
                        <th className="px-6 py-4 text-center text-sm font-medium text-gray-900">Quantidade</th>
                        <th className="px-6 py-4 text-right text-sm font-medium text-gray-900">Preço Total</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Mercado</th>
                        <th className="px-6 py-4 text-center text-sm font-medium text-gray-900">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredItems.map((item, index) => (
                        <tr key={item.produto.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              <div className="relative">
                                {/* ✅ IMAGEM SEM ERRO 404 */}
                                <img 
                                  src={getProductImageUrl(item.produto)} 
                                  alt={item.produto.nome}
                                  className="w-12 h-12 rounded-lg object-cover cursor-pointer hover:scale-105 transition-transform shadow-sm"
                                  onClick={() => onProductClick(item.produto)}
                                  onError={(e) => handleImageError(e, item.produto.nome)}
                                />
                                {/* Badge de posição */}
                                <div className="absolute -top-2 -left-2 bg-blue-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                                  {index + 1}
                                </div>
                                
                                {/* Badge de promoção */}
                                {item.produto.promocao && (
                                  <div className="absolute -bottom-1 -right-1 bg-red-500 text-white text-xs px-1 py-0.5 rounded-md">
                                    {Math.round(((item.produto.promocao.precoOriginal - item.produto.preco) / item.produto.promocao.precoOriginal) * 100)}%
                                  </div>
                                )}
                              </div>
                              
                              <div className="min-w-0 flex-1">
                                <div 
                                  className="font-medium text-gray-900 cursor-pointer hover:text-purple-600 transition-colors"
                                  onClick={() => onProductClick(item.produto)}
                                >
                                  {item.produto.nome}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {item.produto.marca && <span>{item.produto.marca} • </span>}
                                  <span className="inline-flex items-center">
                                    <span className={`w-2 h-2 rounded-full mr-1 ${
                                      item.produto.categoria === 'Hortifruti' ? 'bg-green-400' :
                                      item.produto.categoria === 'Padaria' ? 'bg-yellow-400' :
                                      item.produto.categoria === 'Bebidas' ? 'bg-blue-400' :
                                      'bg-gray-400'
                                    }`}></span>
                                    {item.produto.categoria}
                                  </span>
                                </div>
                                
                                {item.produto.promocao && (
                                  <div className="flex items-center space-x-2 mt-1">
                                    <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-0.5 rounded">
                                      PROMOÇÃO
                                    </span>
                                    <span className="text-sm text-gray-500 line-through">
                                      {formatPrice(item.produto.promocao.precoOriginal)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center space-x-2">
                              <button
                                onClick={() => updateQuantity(item.produto.id, item.quantidade - 1)}
                                className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="w-12 text-center font-medium">
                                {item.quantidade}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.produto.id, item.quantidade + 1)}
                                className="w-8 h-8 flex items-center justify-center bg-blue-100 hover:bg-blue-200 rounded-full transition-colors"
                              >
                                <Plus className="w-4 h-4 text-blue-600" />
                              </button>
                            </div>
                          </td>
                          
                          <td className="px-6 py-4 text-right">
                            <div className="font-bold text-green-600 text-lg">
                              {formatPrice(item.produto.preco * item.quantidade)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {formatPrice(item.produto.preco)}/un
                            </div>
                            {item.produto.promocao && (
                              <div className="text-xs text-orange-600 font-medium">
                                Economia: {formatPrice((item.produto.promocao.precoOriginal - item.produto.preco) * item.quantidade)}
                              </div>
                            )}
                          </td>
                          
                          <td className="px-6 py-4">
                            <div>
                              <div className="font-medium text-gray-900">{item.produto.loja}</div>
                              <div className="flex items-center space-x-1 text-sm text-gray-500 mt-1">
                                <MapPin className="w-3 h-3" />
                                <span>{item.produto.distancia?.toFixed(1) || '1.2'} km</span>
                                <span>•</span>
                                <Clock className="w-3 h-3" />
                                <span>~15min</span>
                              </div>
                            </div>
                          </td>
                          
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center space-x-2">
                              <button
                                onClick={() => onProductClick(item.produto)}
                                className="p-1 text-blue-500 hover:bg-blue-50 rounded transition-colors"
                                title="Ver detalhes"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => removeItem(item.produto.id)}
                                className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                                title="Remover item"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* Visualização em Cards */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItems.map((item, index) => (
                  <div key={item.produto.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                    <div className="relative">
                      {/* ✅ IMAGEM SEM ERRO 404 */}
                      <img 
                        src={getProductImageUrl(item.produto)} 
                        alt={item.produto.nome}
                        className="w-full h-48 object-cover cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => onProductClick(item.produto)}
                        onError={(e) => handleImageError(e, item.produto.nome)}
                      />
                      
                      {/* Badge de posição */}
                      <div className="absolute top-3 left-3 bg-blue-500 text-white text-sm font-bold px-2 py-1 rounded-full">
                        #{index + 1}
                      </div>
                      
                      {/* Badge de promoção */}
                      {item.produto.promocao && (
                        <div className="absolute top-3 right-3 bg-red-500 text-white text-sm font-bold px-2 py-1 rounded-full">
                          {Math.round(((item.produto.promocao.precoOriginal - item.produto.preco) / item.produto.promocao.precoOriginal) * 100)}% OFF
                        </div>
                      )}
                    </div>
                    
                    <div className="p-4">
                      <div className="mb-3">
                        <h3 
                          className="font-semibold text-gray-900 text-lg cursor-pointer hover:text-purple-600 transition-colors"
                          onClick={() => onProductClick(item.produto)}
                        >
                          {item.produto.nome}
                        </h3>
                        <div className="text-sm text-gray-500 mt-1">
                          {item.produto.marca && <span>{item.produto.marca} • </span>}
                          <span className="inline-flex items-center">
                            <span className={`w-2 h-2 rounded-full mr-1 ${
                              item.produto.categoria === 'Hortifruti' ? 'bg-green-400' :
                              item.produto.categoria === 'Padaria' ? 'bg-yellow-400' :
                              item.produto.categoria === 'Bebidas' ? 'bg-blue-400' :
                              'bg-gray-400'
                            }`}></span>
                            {item.produto.categoria}
                          </span>
                        </div>
                      </div>
                      
                      {/* Preços */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-2xl font-bold text-green-600">
                              {formatPrice(item.produto.preco * item.quantidade)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {formatPrice(item.produto.preco)}/un
                            </div>
                          </div>
                          
                          {item.produto.promocao && (
                            <div className="text-right">
                              <div className="text-sm text-gray-500 line-through">
                                {formatPrice(item.produto.promocao.precoOriginal * item.quantidade)}
                              </div>
                              <div className="text-sm text-orange-600 font-medium">
                                -{formatPrice((item.produto.promocao.precoOriginal - item.produto.preco) * item.quantidade)}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Mercado */}
                      <div className="mb-4 p-2 bg-gray-50 rounded-lg">
                        <div className="font-medium text-gray-900">{item.produto.loja}</div>
                        <div className="flex items-center space-x-3 text-sm text-gray-500 mt-1">
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-3 h-3" />
                            <span>{item.produto.distancia?.toFixed(1) || '1.2'} km</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>~15min</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Controles */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateQuantity(item.produto.id, item.quantidade - 1)}
                            className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-12 text-center font-medium">
                            {item.quantidade}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.produto.id, item.quantidade + 1)}
                            className="w-8 h-8 flex items-center justify-center bg-blue-100 hover:bg-blue-200 rounded-full transition-colors"
                          >
                            <Plus className="w-4 h-4 text-blue-600" />
                          </button>
                        </div>
                        
                        <div className="flex space-x-2">
                          <button
                            onClick={() => onProductClick(item.produto)}
                            className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Ver detalhes"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => removeItem(item.produto.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remover"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar Inteligente */}
          <div className="space-y-6">
            {/* Resumo Financeiro Avançado */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl shadow-lg p-6 border border-green-200">
              <div className="flex items-center space-x-2 mb-4">
                <Calculator className="w-6 h-6 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">Resumo Financeiro</h3>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Subtotal ({analytics.totalItens} itens)</span>
                  <span className="font-medium">{formatPrice(getTotalPrice())}</span>
                </div>
                
                {analytics.economiaPromo > 0 && (
                  <div className="flex justify-between items-center text-green-600">
                    <span>Economia em promoções</span>
                    <span className="font-medium">-{formatPrice(analytics.economiaPromo)}</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center text-orange-600">
                  <span>Custo estimado gasolina</span>
                  <span className="font-medium">{formatPrice(analytics.custoGasolina)}</span>
                </div>
                
                <hr className="border-gray-200" />
                
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total Geral</span>
                  <span className="text-green-600">{formatPrice(getTotalPrice() + analytics.custoGasolina)}</span>
                </div>
                
                <div className="text-xs text-gray-500 mt-2 space-y-1">
                  <div>Preço médio por item: {formatPrice(analytics.precoMedio)}</div>
                  <div>Tempo estimado: {analytics.tempoEstimado} minutos</div>
                  <div>Última atualização: {new Date(lista.dataUltimaEdicao).toLocaleString('pt-BR')}</div>
                </div>
              </div>

              {/* ✅ BOTÃO ANÁLISE IA NO SIDEBAR */}
              <div className="mt-4 pt-4 border-t border-green-200">
                <button
                  onClick={handleOpenAIAnalysis}
                  className="w-full bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center justify-center space-x-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Análise IA Completa</span>
                </button>
              </div>
            </div>

            {/* Análise por Mercado Avançada */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Navigation className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Rota Otimizada</h3>
              </div>
              
              <div className="space-y-4">
                {analytics.mercados.map((mercado, index) => (
                  <div key={mercado.nome} className="relative">
                    {/* Linha conectora */}
                    {index < analytics.mercados.length - 1 && (
                      <div className="absolute left-4 top-8 w-0.5 h-16 bg-gray-200"></div>
                    )}
                    
                    <div className="flex items-start space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                        index === 0 ? 'bg-blue-500' : 'bg-gray-400'
                      }`}>
                        {index + 1}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 flex items-center space-x-2">
                          <span>{mercado.nome}</span>
                          {index === 0 && (
                            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full">
                              Principal
                            </span>
                          )}
                        </div>
                        
                        <div className="text-sm text-gray-500 mt-1 space-y-1">
                          <div className="flex items-center space-x-4">
                            <span>{mercado.itens} {mercado.itens === 1 ? 'item' : 'itens'}</span>
                            <span>{mercado.distancia.toFixed(1)} km</span>
                            <span>~{Math.round(mercado.distancia * 2 + 15)}min</span>
                          </div>
                          <div className="text-xs text-gray-400">
                            {mercado.endereco}
                          </div>
                        </div>
                        
                        <div className="mt-2 flex items-center justify-between">
                          <div className="font-bold text-gray-900">{formatPrice(mercado.total)}</div>
                          <div className="text-xs text-gray-500">
                            {((mercado.total / getTotalPrice()) * 100).toFixed(0)}% do total
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {analytics.totalMercados > 2 && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center space-x-2 text-yellow-800">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        Considere concentrar compras para economizar tempo
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ✅ CALL TO ACTION INTELIGENTE PARA ANÁLISE IA */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl shadow-lg p-6 border border-purple-200">
              <div className="flex items-center space-x-2 mb-4">
                <Award className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-900">IA Recomenda</h3>
              </div>
              
              <div className="space-y-3 text-sm mb-4">
                <div className="flex items-start space-x-2 p-3 bg-white rounded-lg">
                  <Star className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <span>
                    {analytics.totalItens > 10 
                      ? `Lista completa com ${analytics.totalItens} itens! Nossa IA pode encontrar mais otimizações.` 
                      : analytics.totalItens > 5
                      ? 'Lista bem balanceada. A IA pode sugerir complementos inteligentes.'
                      : 'Lista enxuta! A IA pode sugerir itens essenciais que você pode ter esquecido.'
                    }
                  </span>
                </div>
                
                <div className="flex items-start space-x-2 p-3 bg-white rounded-lg">
                  <Brain className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                  <span>
                    {analytics.eficiencia >= 80 
                      ? 'Excelente eficiência! A IA pode mostrar como manter esse nível.' 
                      : analytics.eficiencia >= 60
                      ? 'Boa eficiência. A IA encontrou formas de melhorar ainda mais.'
                      : 'A IA detectou várias oportunidades de otimização na sua lista.'
                    }
                  </span>
                </div>

                <div className="flex items-start space-x-2 p-3 bg-white rounded-lg">
                  <Sparkles className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span>
                    Nossa análise IA avançada pode encontrar até 30% mais economia e sugerir a rota perfeita para suas compras.
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleOpenAIAnalysis}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-4 rounded-lg font-bold hover:from-purple-700 hover:to-blue-700 transition-colors shadow-lg flex items-center justify-center space-x-2"
                >
                  <Sparkles className="w-5 h-5" />
                  <span>🚀 Análise IA Avançada</span>
                </button>

                <button
                  onClick={onBack}
                  className="w-full bg-white border-2 border-blue-500 text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
                >
                  🛒 Adicionar Mais Produtos
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListaCompleta;