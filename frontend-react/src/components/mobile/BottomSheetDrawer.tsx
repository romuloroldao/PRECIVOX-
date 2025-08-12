import React, { useState, useEffect, useCallback } from 'react';
import { X, ChevronUp, ChevronDown, Sparkles, ShoppingCart, List, Plus, Minus, Trash2 } from 'lucide-react';
import { useBottomSheet } from '../../hooks/useBottomSheet';
import AIAnalysisModal from '../ai/AIDrawerBottomSheet';
import '../../styles/BottomSheetDrawer.styles.css';

interface Product {
  id: string;
  nome: string;
  preco: number;
  imagem?: string;
  loja: string;
  promocao?: {
    desconto: number;
    precoOriginal: number;
  };
}

interface ListItem {
  produto: Product;
  quantidade: number;
}

interface BottomSheetDrawerProps {
  listItems: ListItem[];
  onUpdateQuantity: (productId: string, newQuantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onAddToList: (product: Product, quantity?: number) => void;
  onSaveList: (name: string) => void;
  onGoToListaCompleta: () => void;
  onGoToMyLists: () => void;
  currentListName: string;
}

const BottomSheetDrawer: React.FC<BottomSheetDrawerProps> = ({
  listItems,
  onUpdateQuantity,
  onRemoveItem,
  onAddToList,
  onSaveList,
  onGoToListaCompleta,
  onGoToMyLists,
  currentListName
}) => {
  const {
    isOpen,
    position,
    isDragging,
    sheetRef,
    open,
    close,
    setToPosition
  } = useBottomSheet();

  const [showAIModal, setShowAIModal] = useState(false);
  const [aiAnalysisStep, setAiAnalysisStep] = useState(0);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [analysisComplete, setAnalysisComplete] = useState(false);

  // Cálculos da lista
  const totalItems = listItems.reduce((sum, item) => sum + item.quantidade, 0);
  const totalPrice = listItems.reduce((sum, item) => sum + (item.produto.preco * item.quantidade), 0);
  const totalEconomy = listItems.reduce((sum, item) => {
    if (item.produto.promocao) {
      return sum + ((item.produto.promocao.precoOriginal - item.produto.preco) * item.quantidade);
    }
    return sum;
  }, 0);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  // Simulação da análise IA
  const performAIAnalysis = async () => {
    setAiAnalysisStep(0);
    setAnalysisComplete(false);
    
    const steps = [
      'Analisando preços em Franco da Rocha...',
      'Comparando mercados próximos...',
      'Identificando promoções...',
      'Calculando rotas otimizadas...',
      'Gerando insights personalizados...'
    ];

    // Simular análise passo a passo
    for (let i = 0; i < steps.length; i++) {
      setAiAnalysisStep(i);
      await new Promise(resolve => setTimeout(resolve, 1200));
    }

    // Gerar sugestões baseadas nos itens da lista
    const generatedSuggestions = listItems.map((item, index) => {
      const alternatives = [
        { loja: 'Atacadão Franco da Rocha', economia: 1.15 + (index * 0.3) },
        { loja: 'Extra Franco', economia: 0.85 + (index * 0.2) },
        { loja: 'Vila Nova Supermercado', economia: 1.45 + (index * 0.4) }
      ];
      
      const bestAlternative = alternatives[Math.floor(Math.random() * alternatives.length)];
      
      return {
        id: `suggestion-${item.produto.id}`,
        type: 'store_change',
        item: item.produto.nome,
        currentStore: item.produto.loja,
        suggestedStore: bestAlternative.loja,
        currentPrice: item.produto.preco,
        suggestedPrice: item.produto.preco - bestAlternative.economia,
        economy: bestAlternative.economia * item.quantidade,
        description: `Troque ${item.produto.loja} por ${bestAlternative.loja}`,
        applied: false
      };
    });

    setAiSuggestions(generatedSuggestions);
    setAnalysisComplete(true);
  };

  const applySuggestion = (suggestionId: string) => {
    setAiSuggestions(prev => prev.map(s => 
      s.id === suggestionId ? { ...s, applied: !s.applied } : s
    ));
  };

  const applyAllSuggestions = () => {
    setAiSuggestions(prev => prev.map(s => ({ ...s, applied: true })));
  };

  const resetSuggestions = () => {
    setAiSuggestions(prev => prev.map(s => ({ ...s, applied: false })));
  };

  const appliedCount = aiSuggestions.filter(s => s.applied).length;
  const totalAIEconomy = aiSuggestions
    .filter(s => s.applied)
    .reduce((sum, s) => sum + s.economy, 0);

  // Auto-open quando item é adicionado
  useEffect(() => {
    if (totalItems > 0 && position === 'minimized') {
      setToPosition('half');
    }
  }, [totalItems, position, setToPosition]);

  // Definir altura baseada na posição
  const getSheetHeight = () => {
    switch (position) {
      case 'minimized': return '80px';
      case 'half': return '60vh';
      case 'full': return '90vh';
      default: return '80px';
    }
  };

  const getSheetTransform = () => {
    if (!isOpen && position === 'minimized') {
      return 'translateY(calc(100% - 80px))';
    }
    return 'translateY(0)';
  };

  return (
    <>
      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className="bottom-sheet-container"
        style={{
          height: getSheetHeight(),
          transform: getSheetTransform()
        }}
      >
        {/* Handle para drag */}
        <div className="bottom-sheet-handle">
          <div className="bottom-sheet-handle-bar" />
        </div>

        {/* Header do Sheet */}
        <div className="bottom-sheet-header">
          <div className="bottom-sheet-header-content">
            <div className="bottom-sheet-header-info">
              <div className="bottom-sheet-icon">
                <ShoppingCart className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="bottom-sheet-title">Lista Inteligente 🧠</h2>
                <div className="bottom-sheet-subtitle">
                  <span>{totalItems} {totalItems === 1 ? 'item' : 'itens'}</span>
                  <span className="bottom-sheet-price">{formatPrice(totalPrice)}</span>
                  {(totalEconomy > 0 || totalAIEconomy > 0) && (
                    <div className="bottom-sheet-economy-badges">
                      {totalEconomy > 0 && (
                        <span className="economy-badge economy-promotion">
                          💰 -{formatPrice(totalEconomy)}
                        </span>
                      )}
                      {totalAIEconomy > 0 && (
                        <span className="economy-badge economy-ai">
                          🤖 -{formatPrice(totalAIEconomy)}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bottom-sheet-controls">
              {appliedCount > 0 && (
                <div className="applied-count-badge">
                  {appliedCount} IA
                </div>
              )}
              
              <button
                onClick={() => {
                  if (position === 'full') {
                    setToPosition('half');
                  } else if (position === 'half') {
                    setToPosition('full');
                  } else {
                    setToPosition('half');
                  }
                }}
                className="bottom-sheet-control-btn"
              >
                {position === 'full' ? (
                  <ChevronDown className="w-5 h-5 text-gray-600" />
                ) : (
                  <ChevronUp className="w-5 h-5 text-gray-600" />
                )}
              </button>

              {position !== 'minimized' && (
                <button
                  onClick={close}
                  className="bottom-sheet-control-btn"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Conteúdo do Sheet */}
        <div className="bottom-sheet-content">
          {position === 'minimized' ? (
            /* Estado minimizado */
            <div className="bottom-sheet-minimized">
              <button
                onClick={() => setToPosition('half')}
                className="bottom-sheet-expand-btn"
              >
                <Sparkles className="w-4 h-4" />
                <span>Ver Lista ({totalItems})</span>
              </button>
            </div>
          ) : (
            /* Estado expandido */
            <div className="bottom-sheet-expanded">
              {/* Lista de itens */}
              <div className="bottom-sheet-items">
                {listItems.length === 0 ? (
                  <div className="bottom-sheet-empty">
                    <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="bottom-sheet-empty-title">Sua lista está vazia</h3>
                    <p className="bottom-sheet-empty-text">Adicione produtos da busca acima</p>
                  </div>
                ) : (
                  <div className="bottom-sheet-items-list">
                    {listItems.map((item, index) => (
                      <div key={item.produto.id} className="bottom-sheet-item">
                        <div className="bottom-sheet-item-image">
                          <img
                            src={item.produto.imagem || `https://via.placeholder.com/48x48/e0e0e0/666666?text=${encodeURIComponent(item.produto.nome.slice(0, 3))}`}
                            alt={item.produto.nome}
                            className="bottom-sheet-item-img"
                          />
                          <div className="bottom-sheet-item-index">
                            {index + 1}
                          </div>
                          {item.produto.promocao && (
                            <div className="bottom-sheet-item-promo">
                              {Math.round(((item.produto.promocao.precoOriginal - item.produto.preco) / item.produto.promocao.precoOriginal) * 100)}%
                            </div>
                          )}
                        </div>

                        <div className="bottom-sheet-item-info">
                          <h4 className="bottom-sheet-item-name">
                            {item.produto.nome}
                          </h4>
                          <div className="bottom-sheet-item-store">
                            <span>{item.produto.loja}</span>
                          </div>
                          <div className="bottom-sheet-item-price">
                            {formatPrice(item.produto.preco * item.quantidade)}
                          </div>
                        </div>

                        <div className="bottom-sheet-item-controls">
                          <button
                            onClick={() => onUpdateQuantity(item.produto.id, item.quantidade - 1)}
                            className="quantity-btn quantity-btn-minus"
                          >
                            <Minus className="w-3 h-3" />
                          </button>

                          <span className="quantity-display">
                            {item.quantidade}
                          </span>

                          <button
                            onClick={() => onUpdateQuantity(item.produto.id, item.quantidade + 1)}
                            className="quantity-btn quantity-btn-plus"
                          >
                            <Plus className="w-3 h-3 text-white" />
                          </button>

                          <button
                            onClick={() => onRemoveItem(item.produto.id)}
                            className="quantity-btn quantity-btn-remove"
                          >
                            <Trash2 className="w-3 h-3 text-white" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Resumo total */}
                    {listItems.length > 0 && (
                      <div className="bottom-sheet-summary">
                        <div className="bottom-sheet-summary-content">
                          <div>
                            <span className="bottom-sheet-summary-label">Total:</span>
                            <div className="bottom-sheet-summary-details">
                              {totalItems} {totalItems === 1 ? 'item' : 'itens'}
                            </div>
                          </div>
                          <div className="bottom-sheet-summary-right">
                            <div className="bottom-sheet-summary-price">
                              {formatPrice(totalPrice)}
                            </div>
                            {(totalEconomy > 0 || totalAIEconomy > 0) && (
                              <div className="bottom-sheet-summary-economy">
                                {totalEconomy > 0 && (
                                  <div className="economy-line economy-promotion">
                                    Promoções: -{formatPrice(totalEconomy)}
                                  </div>
                                )}
                                {totalAIEconomy > 0 && (
                                  <div className="economy-line economy-ai">
                                    IA: -{formatPrice(totalAIEconomy)}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer com ações */}
              {listItems.length > 0 && (
                <div className="bottom-sheet-footer">
                  <div className="bottom-sheet-actions">
                    <button
                      onClick={() => {
                        setShowAIModal(true);
                        performAIAnalysis();
                      }}
                      className="bottom-sheet-action-btn bottom-sheet-action-primary"
                    >
                      <Sparkles className="w-4 h-4" />
                      Análise IA
                      {appliedCount > 0 && (
                        <span className="action-btn-badge">
                          {appliedCount}
                        </span>
                      )}
                    </button>

                    <button 
                      onClick={onGoToMyLists}
                      className="bottom-sheet-action-btn bottom-sheet-action-secondary"
                    >
                      <List className="w-4 h-4" />
                      Minhas Listas
                    </button>

                    <button 
                      onClick={onGoToListaCompleta}
                      className="bottom-sheet-action-btn bottom-sheet-action-secondary"
                    >
                      <List className="w-4 h-4" />
                      Ver Lista
                    </button>
                  </div>

                  <button
                    onClick={close}
                    className="bottom-sheet-continue-btn"
                  >
                    ← Continuar Comprando
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal IA */}
      <AIAnalysisModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        listItems={listItems}
        listName={currentListName}
        aiSuggestions={aiSuggestions}
        analysisComplete={analysisComplete}
        aiAnalysisStep={aiAnalysisStep}
        applySuggestion={applySuggestion}
        applyAllSuggestions={applyAllSuggestions}
        resetSuggestions={resetSuggestions}
        appliedCount={appliedCount}
        totalAIEconomy={totalAIEconomy}
      />
    </>
  );
};

export default BottomSheetDrawer;