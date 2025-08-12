import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Minus, Trash2, ArrowLeft, Brain, Eye, Sparkles, DollarSign, TrendingUp } from 'lucide-react';
import { useAIAnalysis } from '../../hooks/useAIAnalysis';
import AIAnalysisModal from '../ai/AIDrawerBottomSheet';

// ✅ MODAL LISTA COM ANÁLISE IA RESTAURADA - v7.1
const ModalLista = ({ 
  isOpen, 
  onClose, 
  listItems = [], 
  currentListName = '',
  onUpdateQuantity,
  onRemoveItem,
  onSaveList,
  onUpdateList,
  onGoToListaCompleta,
  onGoToMyLists,
  onApplySuggestion
}) => {
  // ===== ESTADOS =====
  const [listName, setListName] = useState(currentListName || 'Minha Lista');
  const [isMinimized, setIsMinimized] = useState(false);
  const [toast, setToast] = useState(null);
  const [expandedInsights, setExpandedInsights] = useState(true);

  // ✅ HOOK DE IA RESTAURADO
  const {
    isAnalysisModalOpen,
    openAnalysisModal,
    closeAnalysisModal,
    appliedSuggestions,
    totalEconomiaAplicada,
    getAnalysisStats
  } = useAIAnalysis();

  // ===== EFFECTS =====
  useEffect(() => {
    if (currentListName) {
      setListName(currentListName);
    }
  }, [currentListName]);

  // ✅ SALVAMENTO AUTOMÁTICO - CORRIGIDO PARA EVITAR LOOPS
  const lastSaveRef = useRef<string>('');
  
  useEffect(() => {
    if (listItems && listItems.length > 0 && onSaveList) {
      // Criar hash dos dados para comparação
      const currentData = JSON.stringify({ listName, items: listItems.map(item => ({ id: item.produto.id, quantidade: item.quantidade })) });
      
      // Só salvar se realmente mudou
      if (currentData !== lastSaveRef.current) {
        const timeoutId = setTimeout(() => {
          console.log('💾 Salvamento automático da lista:', listName);
          onSaveList(listName, listItems);
          lastSaveRef.current = currentData;
          
          // Toast mais discreto
          if (process.env.NODE_ENV === 'development') {
            console.log('✅ Lista salva automaticamente');
          }
        }, 2000); // Salva 2 segundos após mudanças

        return () => clearTimeout(timeoutId);
      }
    }
  }, [listItems, listName, onSaveList]);

  // ✅ MONITORAMENTO DO ESTADO DA LISTA
  useEffect(() => {
    console.log('🎯 ModalLista - Props receberam:', {
      isOpen,
      itemsCount: listItems?.length || 0,
      listName: currentListName,
      hasOnGoToListaCompleta: typeof onGoToListaCompleta === 'function',
      hasOnGoToMyLists: typeof onGoToMyLists === 'function',
      onGoToListaCompletaValue: onGoToListaCompleta,
      items: listItems?.slice(0, 3)?.map(item => ({
        id: item.produto?.id,
        nome: item.produto?.nome,
        quantidade: item.quantidade
      }))
    });
  }, [isOpen, listItems, currentListName, onGoToListaCompleta, onGoToMyLists]);

  // ✅ MONITORAR ATUALIZAÇÕES DA LISTA - SEM TOASTS EXCESSIVOS
  useEffect(() => {
    if (listItems && listItems.length > 0) {
      console.log('📋 ModalLista - Lista atualizada:', listItems.length, 'itens');
      // Removido toast excessivo - apenas log para debug
    }
  }, [listItems]);

  // ===== HELPER FUNCTIONS =====
  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const formatPrice = (price) => {
    if (typeof price !== 'number') return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const getTotalPrice = () => {
    if (!listItems || !Array.isArray(listItems) || listItems.length === 0) return 0;
    return listItems.reduce((total, item) => {
      if (!item || !item.produto || typeof item.produto.preco !== 'number') return total;
      return total + (item.produto.preco * (item.quantidade || 1));
    }, 0);
  };

  const getTotalItems = () => {
    if (!listItems || !Array.isArray(listItems) || listItems.length === 0) return 0;
    return listItems.reduce((total, item) => total + (item.quantidade || 1), 0);
  };

  const getTotalEconomy = () => {
    if (!listItems || !Array.isArray(listItems)) return 0;
    return listItems.reduce((total, item) => {
      if (item?.produto?.promocao) {
        return total + ((item.produto.promocao.precoOriginal - item.produto.preco) * item.quantidade);
      }
      return total;
    }, 0);
  };

  // ✅ ANÁLISE INTELIGENTE SIMPLIFICADA PARA MODAL
  const getSmartAnalytics = () => {
    if (!listItems || listItems.length === 0) {
      return {
        totalMercados: 0,
        itensPromo: 0,
        economiaPromo: 0,
        eficiencia: 0,
        melhorMercado: 'Nenhum',
        tempoEstimado: 0,
        distanciaTotal: 0
      };
    }

    const mercados = listItems.reduce((acc, item) => {
      const mercado = item.produto.loja;
      if (!acc[mercado]) {
        acc[mercado] = { total: 0, itens: 0 };
      }
      acc[mercado].total += item.produto.preco * item.quantidade;
      acc[mercado].itens += 1;
      return acc;
    }, {});

    const mercadosArray = Object.entries(mercados);
    const itensPromo = listItems.filter(item => item.produto.promocao);
    const melhorMercado = mercadosArray.length > 0 
      ? mercadosArray.reduce((best, current) => 
          current[1].total > best[1].total ? current : best
        )[0]
      : 'Nenhum';

    return {
      totalMercados: mercadosArray.length,
      itensPromo: itensPromo.length,
      economiaPromo: getTotalEconomy(),
      eficiencia: Math.max(0, 100 - (mercadosArray.length * 10)),
      melhorMercado,
      tempoEstimado: mercadosArray.length * 15,
      distanciaTotal: mercadosArray.length * 2.5
    };
  };

  // ✅ SUGESTÕES RÁPIDAS PARA MODAL
  const getQuickSuggestions = () => {
    const analytics = getSmartAnalytics();
    const suggestions = [];

    if (analytics.totalMercados > 2) {
      suggestions.push({
        id: 'concentrar',
        titulo: `Concentrar no ${analytics.melhorMercado}`,
        descricao: 'Reduza mercados para economizar tempo',
        economia: analytics.tempoEstimado * 0.3,
        icon: '🎯'
      });
    }

    if (analytics.itensPromo > 0) {
      suggestions.push({
        id: 'promocoes',
        titulo: `${analytics.itensPromo} itens em promoção`,
        descricao: 'Aumente quantidade dos promocionais',
        economia: analytics.economiaPromo * 0.5,
        icon: '🏷️'
      });
    }

    if (listItems.length < 8) {
      suggestions.push({
        id: 'completar',
        titulo: 'Complete sua lista',
        descricao: 'IA detectou itens essenciais faltando',
        economia: getTotalPrice() * 0.1,
        icon: '🧠'
      });
    }

    return suggestions.slice(0, 3);
  };

  // ===== EVENT HANDLERS =====

  const handleGoToListaCompleta = () => {
    console.log('🔍 MODAL - handleGoToListaCompleta chamado');
    console.log('🔍 MODAL - onGoToListaCompleta existe?', typeof onGoToListaCompleta);
    console.log('🔍 MODAL - onGoToListaCompleta valor:', onGoToListaCompleta);
    
    if (!onGoToListaCompleta) {
      console.log('❌ MODAL - onGoToListaCompleta é undefined/null');
      showToast('Erro: Função não disponível', 'error');
      return;
    }

    console.log('📋 MODAL - Indo para Lista Completa');
    console.log('🛒 listItems:', listItems);
    console.log('📊 Quantidade:', listItems?.length || 0);
    
    if (!listItems || !Array.isArray(listItems)) {
      console.error('❌ MODAL - listItems inválido:', listItems);
      showToast('Erro: dados da lista inválidos', 'error');
      return;
    }

    if (listItems.length === 0) {
      showToast('Adicione itens à lista primeiro', 'error');
      return;
    }

    // ✅ CRIAR LISTA COMPLETA
    const listaCompleta = {
      id: `lista-${Date.now()}`,
      nome: listName || 'Minha Lista',
      itens: listItems,
      dataUltimaEdicao: new Date().toISOString(),
      dataCriacao: new Date().toISOString(),
      isFavorita: false,
      cor: 'bg-gradient-to-r from-blue-500 to-purple-600'
    };
    
    console.log('📋 Lista completa criada:', listaCompleta);
    
    try {
      onGoToListaCompleta(listaCompleta);
      showToast('📋 Abrindo lista completa...', 'info');
    } catch (error) {
      console.error('❌ MODAL - Erro:', error);
      showToast('Erro ao abrir lista completa', 'error');
    }
  };

  // ✅ APLICAR SUGESTÃO IA - COMPATÍVEL COM LISTACOMPLETA
  const handleApplySuggestion = (suggestion) => {
    if (!onApplySuggestion) {
      console.warn('❌ MODAL - onApplySuggestion não fornecida');
      showToast('Erro: Função de aplicar sugestão não disponível', 'error');
      return;
    }

    try {
      console.log('🎯 MODAL - Aplicando sugestão:', suggestion);
      console.log('📋 MODAL - Lista atual antes da sugestão:', {
        items: listItems?.length || 0,
        sample: listItems?.slice(0, 2)?.map(item => ({
          id: item.produto?.id,
          nome: item.produto?.nome,
          quantidade: item.quantidade
        }))
      });
      
      // ✅ CONVERTER FORMATO DA SUGESTÃO PARA COMPATIBILIDADE
      let normalizedSuggestion = { ...suggestion };
      
      // Se a sugestão vem do formato ListaCompleta, converter para o formato SearchPage
      if (suggestion.action?.type && !suggestion.tipo) {
        console.log('🔄 Convertendo formato de sugestão ListaCompleta → SearchPage');
        
        switch (suggestion.action.type) {
          case 'change_store':
            normalizedSuggestion = {
              tipo: 'store',
              action: {
                productId: suggestion.action.productId,
                preferredStore: suggestion.mercadoSugerido
              },
              mensagem: `Produto transferido para ${suggestion.mercadoSugerido}`
            };
            break;
            
          case 'increase_quantity':
            normalizedSuggestion = {
              tipo: 'ajustar_quantidade',
              action: {
                productId: suggestion.action.productId,
                newQuantity: suggestion.action.newQuantity
              },
              mensagem: `Quantidade ajustada para ${suggestion.action.newQuantity}`
            };
            break;
            
          case 'add_product':
            normalizedSuggestion = {
              tipo: 'adicionar_produto',
              action: {
                newProduct: suggestion.action.newProduct,
                quantity: 1
              },
              mensagem: `Produto ${suggestion.item} adicionado`
            };
            break;
        }
        
        console.log('✅ Sugestão convertida:', normalizedSuggestion);
      }
      
      // Aplicar a sugestão via callback do componente pai
      const result = onApplySuggestion(normalizedSuggestion);
      
      console.log('🔄 MODAL - Resultado da aplicação:', result);
      
      if (result?.success) {
        console.log('✅ MODAL - Sugestão aplicada com sucesso');
        showToast(result.message || '✅ Sugestão aplicada com sucesso!', 'success');
      } else {
        console.log('❌ MODAL - Falha na aplicação:', result?.message);
        showToast(result?.message || 'Erro ao aplicar sugestão', 'error');
      }
    } catch (error) {
      console.error('❌ MODAL - Erro ao aplicar sugestão:', error);
      showToast('Erro inesperado ao aplicar sugestão', 'error');
    }
  };

  // ✅ FUNÇÃO PRINCIPAL DE ANÁLISE IA
  const handleAIAnalysis = () => {
    if (!listItems || listItems.length === 0) {
      showToast('Adicione itens à lista para análise IA', 'error');
      return;
    }

    try {
      console.log('🧠 MODAL - Abrindo análise IA com', listItems.length, 'itens');
      console.log('🎯 Itens para análise:', listItems);
      
      // Converter para formato esperado pelo AIAnalysisModal
      const itemsForAI = listItems.map(item => ({
        produto: item.produto,
        quantidade: item.quantidade
      }));
      
      openAnalysisModal(itemsForAI);
      showToast('🧠 Abrindo análise IA avançada...', 'smart');
    } catch (error) {
      console.error('❌ MODAL - Erro na análise IA:', error);
      showToast('Erro ao abrir análise IA', 'error');
    }
  };

  // ===== EARLY RETURN =====
  if (!isOpen) return null;

  const hasItems = listItems && Array.isArray(listItems) && listItems.length > 0;
  const totalPrice = getTotalPrice();
  const totalItems = getTotalItems();
  const analytics = getSmartAnalytics();
  const quickSuggestions = getQuickSuggestions();
  const analysisStats = getAnalysisStats();

  console.log('🎯 MODAL v7.1 - Renderizando:', { 
    hasItems, 
    totalPrice, 
    totalItems, 
    appliedSuggestions: appliedSuggestions?.length || 0,
    totalEconomiaAplicada 
  });

  return (
    <>
      {/* ✅ MODAL DE ANÁLISE IA */}
      <AIAnalysisModal
        isOpen={isAnalysisModalOpen}
        onClose={closeAnalysisModal}
        listItems={listItems}
        listName={listName}
        onApplySuggestion={handleApplySuggestion}
      />

      {/* ✅ OVERLAY */}
      <div 
        className={`fixed inset-0 bg-black bg-opacity-30 z-40 transition-opacity ${
          isMinimized ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
        onClick={onClose}
      />

      {/* ✅ MODAL CONTAINER */}
      <div className={`
        fixed transition-all duration-300 z-50 bg-white rounded-xl shadow-xl
        ${isMinimized 
          ? 'bottom-4 right-4 w-80 h-36' 
          : 'inset-4 md:right-4 md:top-4 md:bottom-4 md:left-auto md:w-[480px]'
        }
      `}>
        
        {isMinimized ? (
          /* ✅ MODO MINIMIZADO COM STATUS IA */
          <div 
            className="p-4 cursor-pointer h-full flex flex-col justify-between bg-gradient-to-r from-blue-50 to-purple-50"
            onClick={() => setIsMinimized(false)}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900">{totalItems} itens</p>
                <p className="text-sm text-gray-600">{formatPrice(totalPrice)}</p>
              </div>
              <div className="text-3xl">📋</div>
            </div>
            
            <div className="flex items-center justify-between">
              {appliedSuggestions && appliedSuggestions.length > 0 ? (
                <>
                  <span className="text-xs text-purple-600 font-medium flex items-center space-x-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Análise IA</span>
                    {appliedSuggestions?.length > 0 && (
                      <span className="ml-1 bg-white bg-opacity-20 px-1 py-0.5 rounded text-xs">
                        {appliedSuggestions.length}
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-green-600 font-bold">
                    -{formatPrice(totalEconomiaAplicada || 0)}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-xs text-blue-600 font-medium">
                    Eficiência: {analytics.eficiencia}%
                  </span>
                  <span className="text-xs text-orange-600">
                    ~{analytics.tempoEstimado}min
                  </span>
                </>
              )}
            </div>
          </div>
        ) : (
          /* ✅ MODO COMPLETO */
          <div className="flex flex-col h-full">
            {/* ✅ HEADER COM STATUS IA */}
            <div className="flex-shrink-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">📋</div>
                  <div>
                    <h2 className="text-lg font-semibold">Lista Inteligente</h2>
                    <p className="text-blue-100 text-sm">
                      {totalItems} itens • Franco da Rocha, SP
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsMinimized(true)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors md:hidden"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* ✅ STATUS IA APLICAÇÕES */}
              {appliedSuggestions && appliedSuggestions.length > 0 && (
                <div className="mt-3 flex items-center justify-between bg-white bg-opacity-20 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      ✨ {appliedSuggestions.length} otimizações IA ativas
                    </span>
                  </div>
                  <span className="text-sm font-bold">
                    -{formatPrice(totalEconomiaAplicada || 0)}
                  </span>
                </div>
              )}
            </div>

            {/* ✅ CONTEÚDO PRINCIPAL */}
            <div className="flex-1 overflow-y-auto">
              {!hasItems ? (
                /* ✅ EMPTY STATE */
                <div className="flex flex-col items-center justify-center p-8 text-center h-full">
                  <div className="text-6xl mb-4">🧠</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Lista inteligente vazia
                  </h3>
                  <p className="text-gray-600 mb-6 max-w-sm">
                    Adicione produtos e deixe nossa IA otimizar suas compras automaticamente
                  </p>
                  <button 
                    onClick={onClose}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-colors"
                  >
                    🔍 Buscar Produtos
                  </button>
                </div>
              ) : (
                /* ✅ CONTEÚDO COM INSIGHTS IA */
                <div className="p-4 space-y-4">
                  {/* Campo Nome da Lista */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-700">
                        Nome da Lista
                      </label>
                      <span className="text-xs text-green-600 flex items-center gap-1">
                        💾 Salvamento automático
                      </span>
                    </div>
                    <input
                      type="text"
                      value={listName}
                      onChange={(e) => setListName(e.target.value)}
                      placeholder="Digite o nome da sua lista..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  {/* ✅ LISTA DOS ITENS */}
                  <div className="space-y-3">
                    {listItems.map((item, index) => {
                      // ✅ VALIDAÇÃO DE SEGURANÇA
                      if (!item || !item.produto) {
                        console.warn(`❌ Item ${index} inválido:`, item);
                        return null;
                      }

                      return (
                        <div
                          key={item.produto.id || index}
                          className="bg-gray-50 border border-gray-200 rounded-lg p-3"
                        >
                          <div className="flex items-center space-x-3">
                            {/* Ícone do Produto */}
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 text-lg flex-shrink-0 relative">
                              📦
                              {/* Badge de posição */}
                              <div className="absolute -top-1 -left-1 bg-purple-500 text-white text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center">
                                {index + 1}
                              </div>
                            </div>

                            {/* Info do Produto */}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900 text-sm truncate">
                                {item.produto.nome || 'Produto sem nome'}
                              </h4>
                              <div className="flex items-center space-x-2 text-xs text-gray-600 mt-1">
                                <span>🏪 {item.produto.loja || 'Loja não informada'}</span>
                                {item.produto.distancia && (
                                  <span>📍 {item.produto.distancia.toFixed(1)}km</span>
                                )}
                                {item.produto.promocao && (
                                  <span className="bg-red-100 text-red-700 px-1 rounded text-xs font-medium">
                                    PROMOÇÃO
                                  </span>
                                )}
                              </div>
                              <div className="text-sm font-semibold text-green-600 mt-1">
                                {formatPrice((item.produto.preco || 0) * (item.quantidade || 1))}
                                <span className="text-xs text-gray-500 ml-1">
                                  ({formatPrice(item.produto.preco || 0)}/un)
                                </span>
                              </div>
                            </div>

                            {/* Controles de Quantidade */}
                            <div className="flex flex-col items-center space-y-2">
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => onUpdateQuantity?.(item.produto.id, (item.quantidade || 1) - 1)}
                                  className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-300 transition-colors"
                                >
                                  <Minus className="w-4 h-4" />
                                </button>
                                <span className="w-8 text-center font-medium text-sm">
                                  {item.quantidade || 1}
                                </span>
                                <button
                                  onClick={() => onUpdateQuantity?.(item.produto.id, (item.quantidade || 1) + 1)}
                                  className="w-8 h-8 bg-purple-600 text-white rounded-lg flex items-center justify-center hover:bg-purple-700 transition-colors"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              </div>
                              
                              <button
                                onClick={() => onRemoveItem?.(item.produto.id)}
                                className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* ✅ FOOTER COM AÇÕES */}
            {hasItems && (
              <div className="flex-shrink-0 bg-gray-50 p-4 border-t">
                {/* Resumo Financeiro */}
                <div className="bg-white rounded-lg p-3 mb-4 border">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-lg font-bold text-gray-900">
                        {formatPrice(totalPrice)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {totalItems} {totalItems === 1 ? 'item' : 'itens'}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm font-medium text-blue-600">
                        ⚡ Eficiência: {analytics.eficiencia}%
                      </div>
                      <div className="text-xs text-gray-500">
                        {analytics.totalMercados} mercados
                      </div>
                    </div>
                  </div>
                </div>

                {/* Botões de Ação */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleAIAnalysis}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-3 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Análise IA</span>
                  </button>

                  <button
                    onClick={handleGoToListaCompleta}
                    className="bg-blue-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Ver Lista</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ✅ TOAST REUTILIZADO */}
      {toast && (
        <div 
          className={`
            fixed top-4 right-4 z-[60] px-4 py-3 rounded-lg shadow-lg text-white font-medium
            transform transition-all duration-300 flex items-center space-x-2
            ${toast.type === 'success' ? 'bg-green-600' : 
              toast.type === 'error' ? 'bg-red-600' : 
              toast.type === 'smart' ? 'bg-gradient-to-r from-purple-600 to-blue-600' :
              'bg-blue-600'}
          `}
        >
          {toast.type === 'success' && <span>✅</span>}
          {toast.type === 'error' && <span>❌</span>}
          {toast.type === 'smart' && <Sparkles className="w-4 h-4" />}
          {toast.type === 'info' && <span>ℹ️</span>}
          <span>{toast.message}</span>
        </div>
      )}
    </>
  );
};

export default ModalLista;