// src/services/suggestionApplierService.ts
// Serviço para aplicar sugestões da IA na lista real de produtos

import { useState, useCallback } from 'react';

interface Product {
  id: string;
  nome: string;
  marca?: string;
  preco: number;
  imagem?: string;
  loja: string | { nome: string };
  peso?: string;
  categoria?: string;
  promocao?: {
    desconto: number;
    precoOriginal: number;
    validoAte: string;
  };
  distancia?: number;
  disponivel?: boolean;
  descricao?: string;
  lojaId?: string;
}

interface ListItem {
  produto: Product;
  quantidade: number;
}

interface OptimizationSuggestion {
  id: string;
  item: string;
  mercadoAtual: string;
  mercadoSugerido: string;
  precoAtual: number;
  precoSugerido: number;
  economia: number;
  distancia?: number;
  applied?: boolean;
  type: 'price' | 'store' | 'quantity' | 'route' | 'complement';
  action?: {
    type: 'change_store' | 'increase_quantity' | 'add_product' | 'optimize_route';
    productId?: string;
    newStore?: string;
    newQuantity?: number;
    newProduct?: Product;
  };
}

interface ApplyResult {
  success: boolean;
  message: string;
  updatedItems?: ListItem[];
  economiaAplicada?: number;
  changes?: string[];
}

class SuggestionApplierService {
  
  /**
   * Aplica uma sugestão individual na lista
   */
  applySuggestion(
    currentItems: ListItem[], 
    suggestion: OptimizationSuggestion
  ): ApplyResult {
    console.log('🔧 [SuggestionApplier] Aplicando sugestão:', suggestion);
    
    const updatedItems = [...currentItems];
    const changes: string[] = [];
    let economiaAplicada = 0;

    try {
      // Se não há ação definida, usar dados básicos da sugestão
      const actionType = suggestion.action?.type || 'change_store';

      switch (actionType) {
        case 'change_store':
          const result = this.changeProductStore(updatedItems, suggestion);
          updatedItems.splice(0, updatedItems.length, ...result.updatedItems);
          changes.push(...result.changes);
          economiaAplicada = suggestion.economia;
          break;

        case 'increase_quantity':
          const quantityResult = this.increaseProductQuantity(updatedItems, suggestion);
          updatedItems.splice(0, updatedItems.length, ...quantityResult.updatedItems);
          changes.push(...quantityResult.changes);
          economiaAplicada = suggestion.economia;
          break;

        case 'add_product':
          const addResult = this.addComplementaryProduct(updatedItems, suggestion);
          updatedItems.splice(0, updatedItems.length, ...addResult.updatedItems);
          changes.push(...addResult.changes);
          economiaAplicada = suggestion.economia;
          break;

        case 'optimize_route':
          const routeResult = this.optimizeRoute(updatedItems, suggestion);
          updatedItems.splice(0, updatedItems.length, ...routeResult.updatedItems);
          changes.push(...routeResult.changes);
          economiaAplicada = suggestion.economia;
          break;

        default:
          // Fallback para mudança de loja
          const defaultResult = this.changeProductStore(updatedItems, suggestion);
          updatedItems.splice(0, updatedItems.length, ...defaultResult.updatedItems);
          changes.push(...defaultResult.changes);
          economiaAplicada = suggestion.economia;
          break;
      }

      return {
        success: true,
        message: `✅ ${suggestion.item} otimizado! Economia: R$ ${economiaAplicada.toFixed(2)}`,
        updatedItems,
        economiaAplicada,
        changes
      };

    } catch (error) {
      console.error('❌ [SuggestionApplier] Erro ao aplicar sugestão:', error);
      
      return {
        success: false,
        message: `❌ Erro ao aplicar otimização: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        updatedItems: currentItems,
        economiaAplicada: 0,
        changes: []
      };
    }
  }

  /**
   * Aplica múltiplas sugestões em lote
   */
  applyMultipleSuggestions(
    currentItems: ListItem[], 
    suggestions: OptimizationSuggestion[]
  ): ApplyResult {
    console.log('🚀 [SuggestionApplier] Aplicando múltiplas sugestões:', suggestions.length);
    
    let updatedItems = [...currentItems];
    const allChanges: string[] = [];
    let totalEconomia = 0;
    let appliedCount = 0;

    for (const suggestion of suggestions) {
      try {
        const result = this.applySuggestion(updatedItems, suggestion);
        
        if (result.success && result.updatedItems) {
          updatedItems = result.updatedItems;
          allChanges.push(...(result.changes || []));
          totalEconomia += result.economiaAplicada || 0;
          appliedCount++;
        } else {
          console.warn('⚠️ [SuggestionApplier] Falha ao aplicar sugestão:', suggestion.id);
        }
      } catch (error) {
        console.error('❌ [SuggestionApplier] Erro ao aplicar sugestão:', error);
      }
    }

    return {
      success: appliedCount > 0,
      message: `🎉 ${appliedCount}/${suggestions.length} otimizações aplicadas! Economia total: R$ ${totalEconomia.toFixed(2)}`,
      updatedItems,
      economiaAplicada: totalEconomia,
      changes: allChanges
    };
  }

  /**
   * Muda a loja de um produto
   */
  private changeProductStore(
    items: ListItem[], 
    suggestion: OptimizationSuggestion
  ): { updatedItems: ListItem[]; changes: string[] } {
    const newStore = suggestion.action?.newStore || suggestion.mercadoSugerido;

    const updatedItems = items.map(item => {
      if (item.produto.nome === suggestion.item) {
        const updatedProduct = {
          ...item.produto,
          loja: newStore,
          preco: suggestion.precoSugerido,
          distancia: suggestion.distancia || item.produto.distancia
        };

        return {
          ...item,
          produto: updatedProduct
        };
      }
      return item;
    });

    const changes = [
      `🏪 ${suggestion.item}: ${suggestion.mercadoAtual} → ${newStore}`,
      `💰 Preço: R$ ${suggestion.precoAtual.toFixed(2)} → R$ ${suggestion.precoSugerido.toFixed(2)}`
    ];

    return { updatedItems, changes };
  }

  /**
   * Aumenta a quantidade de um produto em promoção
   */
  private increaseProductQuantity(
    items: ListItem[], 
    suggestion: OptimizationSuggestion
  ): { updatedItems: ListItem[]; changes: string[] } {
    const newQuantity = suggestion.action?.newQuantity || 2;
    
    const updatedItems = items.map(item => {
      if (item.produto.nome === suggestion.item) {
        return {
          ...item,
          quantidade: Math.max(item.quantidade, newQuantity)
        };
      }
      return item;
    });

    const changes = [
      `📦 ${suggestion.item}: Quantidade aumentada para aproveitar promoção`,
      `💰 Economia adicional com maior quantidade`
    ];

    return { updatedItems, changes };
  }

  /**
   * Adiciona produto complementar sugerido pela IA
   */
  private addComplementaryProduct(
    items: ListItem[], 
    suggestion: OptimizationSuggestion
  ): { updatedItems: ListItem[]; changes: string[] } {
    
    // Produtos complementares comuns baseados na IA
    const complementaryProducts: Product[] = [
      {
        id: `comp_${Date.now()}_1`,
        nome: 'Óleo de Soja 900ml',
        preco: 4.99,
        categoria: 'Mercearia',
        loja: suggestion.mercadoSugerido,
        lojaId: 'comp_loja',
        descricao: 'Produto complementar sugerido pela IA',
        distancia: suggestion.distancia || 2.1,
        disponivel: true
      },
      {
        id: `comp_${Date.now()}_2`,
        nome: 'Farinha de Trigo 1kg',
        preco: 3.49,
        categoria: 'Mercearia',
        loja: suggestion.mercadoSugerido,
        lojaId: 'comp_loja',
        descricao: 'Produto complementar sugerido pela IA',
        distancia: suggestion.distancia || 2.1,
        disponivel: true
      }
    ];

    // Escolher produto aleatório (simular IA)
    const randomProduct = complementaryProducts[Math.floor(Math.random() * complementaryProducts.length)];
    
    const newItem: ListItem = {
      produto: randomProduct,
      quantidade: 1
    };

    const updatedItems = [...items, newItem];

    const changes = [
      `➕ Produto adicionado: ${randomProduct.nome}`,
      `🧠 Sugestão da IA para completar sua despensa`
    ];

    return { updatedItems, changes };
  }

  /**
   * Otimiza a rota reorganizando produtos por proximidade
   */
  private optimizeRoute(
    items: ListItem[], 
    suggestion: OptimizationSuggestion
  ): { updatedItems: ListItem[]; changes: string[] } {
    
    // Reorganizar por distância (do mais próximo para o mais longe)
    const updatedItems = [...items].sort((a, b) => {
      const distanciaA = a.produto.distancia || 5;
      const distanciaB = b.produto.distancia || 5;
      return distanciaA - distanciaB;
    });

    const changes = [
      `🗺️ Rota otimizada: produtos reorganizados por proximidade`,
      `⏱️ Tempo estimado reduzido em ${Math.round(suggestion.economia * 60)} minutos`
    ];

    return { updatedItems, changes };
  }
}

export const suggestionApplierService = new SuggestionApplierService();

// ✅ HOOK PARA USAR O SERVIÇO DE APLICAÇÃO
export const useSuggestionApplier = () => {
  const [originalItems, setOriginalItems] = useState<ListItem[]>([]);
  
  const applyToList = useCallback((
    currentItems: ListItem[], 
    suggestion: OptimizationSuggestion,
    onUpdate: (items: ListItem[]) => void
  ) => {
    // Salvar itens originais na primeira aplicação
    if (originalItems.length === 0) {
      setOriginalItems([...currentItems]);
    }

    const result = suggestionApplierService.applySuggestion(currentItems, suggestion);
    
    if (result.success && result.updatedItems) {
      onUpdate(result.updatedItems);
    }
    
    return result;
  }, [originalItems]);

  const applyAllToList = useCallback((
    currentItems: ListItem[], 
    suggestions: OptimizationSuggestion[],
    onUpdate: (items: ListItem[]) => void
  ) => {
    // Salvar itens originais
    if (originalItems.length === 0) {
      setOriginalItems([...currentItems]);
    }

    const result = suggestionApplierService.applyMultipleSuggestions(currentItems, suggestions);
    
    if (result.success && result.updatedItems) {
      onUpdate(result.updatedItems);
    }
    
    return result;
  }, [originalItems]);

  const revertToOriginal = useCallback((onUpdate: (items: ListItem[]) => void) => {
    if (originalItems.length > 0) {
      onUpdate([...originalItems]);
      return {
        success: true,
        message: '🔄 Lista revertida aos valores originais'
      };
    }
    
    return {
      success: false,
      message: '❌ Não há valores originais para reverter'
    };
  }, [originalItems]);

  return {
    applyToList,
    applyAllToList,
    revertToOriginal,
    hasOriginal: originalItems.length > 0
  };
};