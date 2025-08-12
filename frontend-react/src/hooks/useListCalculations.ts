// src/hooks/useListCalculations.ts
// ✅ HOOK HÍBRIDO: Cálculos para Consumidores (listas) + Gestores (analytics)
import { useMemo, useCallback } from 'react';
import { usePrice } from './usePrice';
import { useAuth } from './useAuth';

// ✅ INTERFACES PARA LISTAS DE COMPRAS (CONSUMIDORES)
interface ListItem {
  produto: {
    id: string;
    nome: string;
    preco: number;
    promocao?: any;
    categoria?: string;
    loja?: string;
    marca?: string;
  };
  quantidade: number;
  comprado?: boolean;
  prioridade?: 'alta' | 'media' | 'baixa';
}

interface ListCalculationResult {
  // ✅ TOTAIS BÁSICOS
  totalItems: number;
  totalQuantity: number;
  totalValue: number;
  totalOriginalValue: number;
  totalSavings: number;
  totalSavingsPercentage: number;
  
  // ✅ ECONOMIAS SEPARADAS (IA + PROMOÇÕES)
  promotionSavings: number;
  aiSavings: number;
  totalCombinedSavings: number;
  
  // ✅ ESTATÍSTICAS
  averageItemPrice: number;
  averageQuantity: number;
  mostExpensiveItem: ListItem | null;
  cheapestItem: ListItem | null;
  
  // ✅ CATEGORIAS E LOJAS
  categoriesCount: number;
  storesCount: number;
  brandsCount: number;
  categories: string[];
  stores: string[];
  brands: string[];
  
  // ✅ ANÁLISES DETALHADAS
  categoryBreakdown: Record<string, {
    items: number;
    quantity: number;
    value: number;
    percentage: number;
    avgPrice: number;
  }>;
  
  storeBreakdown: Record<string, {
    items: number;
    quantity: number;
    value: number;
    percentage: number;
    avgPrice: number;
  }>;
  
  // ✅ INSIGHTS INTELIGENTES
  insights: string[];
  recommendations: string[];
  warnings: string[];
  
  // ✅ STATUS DA LISTA
  isComplete: boolean;
  completionPercentage: number;
  pendingItems: number;
  checkedItems: number;
}

// ✅ INTERFACES PARA GESTORES (ANALYTICS)
interface StoreAnalytics {
  totalLists: number;
  totalItems: number;
  averageListValue: number;
  topCategories: Array<{ category: string; count: number; value: number }>;
  conversionRate: number;
  customerRetention: number;
}

interface MarketInsight {
  competitorComparison: {
    myStore: string;
    averagePrice: number;
    competitorAverage: number;
    priceAdvantage: number;
  };
  trendAnalysis: {
    period: string;
    growth: number;
    seasonality: string;
  };
  opportunities: string[];
}

export const useListCalculations = () => {
  const { formatPrice, formatSavings, analyzePromotion, analyzeList } = usePrice();
  const { user } = useAuth();
  
  const isManager = user?.role === 'gestor' || user?.role === 'admin';
  const isConsumer = !user || user?.role === 'cliente';

  // ✅ CÁLCULO PRINCIPAL DA LISTA (CONSUMIDORES)
  const calculateList = useCallback((
    items: ListItem[],
    aiSavingsAmount: number = 0
  ): ListCalculationResult => {
    if (!items || items.length === 0) {
      return {
        totalItems: 0,
        totalQuantity: 0,
        totalValue: 0,
        totalOriginalValue: 0,
        totalSavings: 0,
        totalSavingsPercentage: 0,
        promotionSavings: 0,
        aiSavings: 0,
        totalCombinedSavings: 0,
        averageItemPrice: 0,
        averageQuantity: 0,
        mostExpensiveItem: null,
        cheapestItem: null,
        categoriesCount: 0,
        storesCount: 0,
        brandsCount: 0,
        categories: [],
        stores: [],
        brands: [],
        categoryBreakdown: {},
        storeBreakdown: {},
        insights: [],
        recommendations: [],
        warnings: [],
        isComplete: false,
        completionPercentage: 0,
        pendingItems: 0,
        checkedItems: 0
      };
    }

    // ✅ CÁLCULOS BÁSICOS
    const totalItems = items.length;
    const totalQuantity = items.reduce((sum, item) => sum + item.quantidade, 0);
    
    let totalValue = 0;
    let totalOriginalValue = 0;
    let promotionSavings = 0;

    // ✅ PROCESSAR CADA ITEM
    items.forEach(item => {
      const itemTotal = item.produto.preco * item.quantidade;
      totalValue += itemTotal;

      // Calcular promoções
      const promoInfo = analyzePromotion(item.produto);
      if (promoInfo.hasPromotion) {
        const originalItemTotal = promoInfo.originalPrice * item.quantidade;
        totalOriginalValue += originalItemTotal;
        promotionSavings += promoInfo.savings * item.quantidade;
      } else {
        totalOriginalValue += itemTotal;
      }
    });

    // ✅ ECONOMIAS TOTAIS
    const aiSavings = aiSavingsAmount;
    const totalSavings = promotionSavings;
    const totalCombinedSavings = promotionSavings + aiSavings;
    const totalSavingsPercentage = totalOriginalValue > 0 
      ? (totalSavings / totalOriginalValue) * 100 
      : 0;

    // ✅ ESTATÍSTICAS DE ITENS
    const prices = items.map(item => item.produto.preco * item.quantidade);
    const mostExpensiveItem = items.reduce((max, item) => 
      (item.produto.preco * item.quantidade) > (max.produto.preco * max.quantidade) ? item : max
    );
    const cheapestItem = items.reduce((min, item) => 
      (item.produto.preco * item.quantidade) < (min.produto.preco * min.quantidade) ? item : min
    );

    // ✅ CATEGORIAS, LOJAS E MARCAS
    const categories = [...new Set(items.map(item => item.produto.categoria).filter(Boolean))];
    const stores = [...new Set(items.map(item => item.produto.loja).filter(Boolean))];
    const brands = [...new Set(items.map(item => item.produto.marca).filter(Boolean))];

    // ✅ BREAKDOWN POR CATEGORIA
    const categoryBreakdown: Record<string, any> = {};
    categories.forEach(category => {
      const categoryItems = items.filter(item => item.produto.categoria === category);
      const categoryQuantity = categoryItems.reduce((sum, item) => sum + item.quantidade, 0);
      const categoryValue = categoryItems.reduce((sum, item) => 
        sum + (item.produto.preco * item.quantidade), 0
      );
      
      categoryBreakdown[category] = {
        items: categoryItems.length,
        quantity: categoryQuantity,
        value: categoryValue,
        percentage: totalValue > 0 ? (categoryValue / totalValue) * 100 : 0,
        avgPrice: categoryValue / categoryQuantity
      };
    });

    // ✅ BREAKDOWN POR LOJA
    const storeBreakdown: Record<string, any> = {};
    stores.forEach(store => {
      const storeItems = items.filter(item => item.produto.loja === store);
      const storeQuantity = storeItems.reduce((sum, item) => sum + item.quantidade, 0);
      const storeValue = storeItems.reduce((sum, item) => 
        sum + (item.produto.preco * item.quantidade), 0
      );
      
      storeBreakdown[store] = {
        items: storeItems.length,
        quantity: storeQuantity,
        value: storeValue,
        percentage: totalValue > 0 ? (storeValue / totalValue) * 100 : 0,
        avgPrice: storeValue / storeQuantity
      };
    });

    // ✅ STATUS DE COMPLETUDE
    const checkedItems = items.filter(item => item.comprado).length;
    const pendingItems = totalItems - checkedItems;
    const completionPercentage = totalItems > 0 ? (checkedItems / totalItems) * 100 : 0;
    const isComplete = completionPercentage === 100;

    // ✅ INSIGHTS INTELIGENTES
    const insights: string[] = [];
    
    if (totalCombinedSavings > 0) {
      insights.push(`💰 Economia total de ${formatSavings(totalCombinedSavings)}`);
    }
    
    if (categories.length > 3) {
      insights.push(`🛒 Lista diversificada com ${categories.length} categorias diferentes`);
    }
    
    if (stores.length > 1) {
      insights.push(`🏪 Produtos de ${stores.length} mercados diferentes`);
    }

    const avgItemValue = totalValue / totalQuantity;
    if (avgItemValue < 5) {
      insights.push('📦 Lista focada em produtos básicos e essenciais');
    } else if (avgItemValue > 20) {
      insights.push('⭐ Lista com produtos premium e especializados');
    }

    if (promotionSavings > totalValue * 0.15) {
      insights.push('🔥 Excelentes promoções aproveitadas!');
    }

    // ✅ RECOMENDAÇÕES
    const recommendations: string[] = [];
    
    if (stores.length > 2) {
      recommendations.push('🚗 Considere concentrar compras em menos mercados para economizar tempo e combustível');
    }
    
    if (totalValue > 200 && promotionSavings < totalValue * 0.05) {
      recommendations.push('🎯 Busque mais promoções para aumentar sua economia');
    }
    
    const biggestCategory = Object.keys(categoryBreakdown).reduce((a, b) => 
      categoryBreakdown[a].value > categoryBreakdown[b].value ? a : b
    );
    if (biggestCategory && categoryBreakdown[biggestCategory].percentage > 40) {
      recommendations.push(`⚖️ ${biggestCategory} representa grande parte da lista. Considere balancear com outros itens`);
    }

    // ✅ AVISOS
    const warnings: string[] = [];
    
    if (stores.length > 3) {
      warnings.push('⚠️ Muitos mercados podem aumentar tempo e custo do trajeto');
    }
    
    if (totalValue > 500) {
      warnings.push('💳 Lista de alto valor - considere dividir em compras menores');
    }

    const expensiveItems = items.filter(item => item.produto.preco * item.quantidade > totalValue * 0.25);
    if (expensiveItems.length > 0) {
      warnings.push(`💸 Item(ns) caro(s) detectado(s): ${expensiveItems[0].produto.nome}`);
    }

    return {
      totalItems,
      totalQuantity,
      totalValue,
      totalOriginalValue,
      totalSavings,
      totalSavingsPercentage,
      promotionSavings,
      aiSavings,
      totalCombinedSavings,
      averageItemPrice: totalValue / totalItems,
      averageQuantity: totalQuantity / totalItems,
      mostExpensiveItem,
      cheapestItem,
      categoriesCount: categories.length,
      storesCount: stores.length,
      brandsCount: brands.length,
      categories,
      stores,
      brands,
      categoryBreakdown,
      storeBreakdown,
      insights,
      recommendations,
      warnings,
      isComplete,
      completionPercentage,
      pendingItems,
      checkedItems
    };
  }, [formatSavings, analyzePromotion]);

  // ✅ ANALYTICS PARA GESTORES
  const calculateStoreAnalytics = useCallback((
    allUserLists: any[]
  ): StoreAnalytics => {
    if (!isManager || !allUserLists?.length) {
      return {
        totalLists: 0,
        totalItems: 0,
        averageListValue: 0,
        topCategories: [],
        conversionRate: 0,
        customerRetention: 0
      };
    }

    const totalLists = allUserLists.length;
    const allItems = allUserLists.flatMap(list => list.itens || []);
    const totalItems = allItems.length;
    
    // Calcular valor médio das listas
    const listValues = allUserLists.map(list => {
      const analysis = calculateList(list.itens || [], 0);
      return analysis.totalValue;
    });
    const averageListValue = listValues.reduce((sum, val) => sum + val, 0) / totalLists;

    // Top categorias
    const categoryStats: Record<string, { count: number; value: number }> = {};
    allItems.forEach(item => {
      const category = item.produto.categoria || 'outros';
      const value = item.produto.preco * item.quantidade;
      
      if (!categoryStats[category]) {
        categoryStats[category] = { count: 0, value: 0 };
      }
      categoryStats[category].count++;
      categoryStats[category].value += value;
    });

    const topCategories = Object.entries(categoryStats)
      .map(([category, stats]) => ({ category, ...stats }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // Simular métricas de conversão e retenção
    const conversionRate = 65 + Math.random() * 20; // 65-85%
    const customerRetention = 70 + Math.random() * 25; // 70-95%

    return {
      totalLists,
      totalItems,
      averageListValue,
      topCategories,
      conversionRate,
      customerRetention
    };
  }, [isManager, calculateList]);

  // ✅ INSIGHTS DE MERCADO (GESTORES)
  const generateMarketInsights = useCallback((
    myStoreData: any,
    competitorData: any[] = []
  ): MarketInsight => {
    if (!isManager) {
      return {
        competitorComparison: {
          myStore: 'N/A',
          averagePrice: 0,
          competitorAverage: 0,
          priceAdvantage: 0
        },
        trendAnalysis: {
          period: 'N/A',
          growth: 0,
          seasonality: 'N/A'
        },
        opportunities: []
      };
    }

    // Análise competitiva
    const myAveragePrice = myStoreData?.averagePrice || 0;
    const competitorAverage = competitorData.length > 0
      ? competitorData.reduce((sum, comp) => sum + (comp.averagePrice || 0), 0) / competitorData.length
      : 0;
    
    const priceAdvantage = competitorAverage > 0 
      ? ((competitorAverage - myAveragePrice) / competitorAverage) * 100
      : 0;

    // Análise de tendências (simulada)
    const growth = -5 + Math.random() * 20; // -5% a +15%
    const seasonalities = ['Alta temporada', 'Baixa temporada', 'Estável', 'Crescimento'];
    const seasonality = seasonalities[Math.floor(Math.random() * seasonalities.length)];

    // Oportunidades
    const opportunities: string[] = [];
    
    if (priceAdvantage > 5) {
      opportunities.push('💰 Preços competitivos - oportunidade de aumentar margem');
    } else if (priceAdvantage < -5) {
      opportunities.push('⚠️ Preços altos - risco de perda de clientes');
    }
    
    if (growth > 10) {
      opportunities.push('📈 Crescimento acelerado - expandir mix de produtos');
    } else if (growth < 0) {
      opportunities.push('📉 Declínio - revisar estratégia de preços');
    }
    
    opportunities.push('🎯 Implementar programa de fidelidade');
    opportunities.push('📱 Digitalizar experiência do cliente');

    return {
      competitorComparison: {
        myStore: myStoreData?.name || 'Minha Loja',
        averagePrice: myAveragePrice,
        competitorAverage,
        priceAdvantage
      },
      trendAnalysis: {
        period: 'Últimos 30 dias',
        growth,
        seasonality
      },
      opportunities
    };
  }, [isManager]);

  // ✅ COMPARAÇÃO ENTRE LISTAS
  const compareLists = useCallback((
    list1: ListItem[],
    list2: ListItem[]
  ) => {
    const analysis1 = calculateList(list1);
    const analysis2 = calculateList(list2);

    return {
      list1: analysis1,
      list2: analysis2,
      comparison: {
        valueDifference: analysis1.totalValue - analysis2.totalValue,
        savingsDifference: analysis1.totalSavings - analysis2.totalSavings,
        itemsDifference: analysis1.totalItems - analysis2.totalItems,
        betterList: analysis1.totalValue < analysis2.totalValue ? 'list1' : 'list2',
        insights: [
          `Lista 1: ${formatPrice(analysis1.totalValue)} com ${analysis1.totalItems} itens`,
          `Lista 2: ${formatPrice(analysis2.totalValue)} com ${analysis2.totalItems} itens`,
          `Diferença: ${formatPrice(Math.abs(analysis1.totalValue - analysis2.totalValue))}`
        ]
      }
    };
  }, [calculateList, formatPrice]);

  // ✅ OTIMIZAÇÃO DE LISTA
  const optimizeList = useCallback((
    items: ListItem[],
    criteria: 'price' | 'savings' | 'convenience' | 'quality' = 'price'
  ) => {
    const analysis = calculateList(items);
    const suggestions: string[] = [];
    
    switch (criteria) {
      case 'price':
        if (analysis.storesCount > 2) {
          suggestions.push('🏪 Concentre compras em menos mercados para economizar tempo');
        }
        if (analysis.promotionSavings < analysis.totalValue * 0.1) {
          suggestions.push('🎯 Busque mais produtos em promoção');
        }
        break;
        
      case 'savings':
        suggestions.push('💰 Priorize produtos com maiores descontos');
        suggestions.push('📊 Compare preços entre diferentes marcas');
        break;
        
      case 'convenience':
        suggestions.push('🚗 Organize rota otimizada entre mercados');
        suggestions.push('⏰ Prefira horários com menos movimento');
        break;
        
      case 'quality':
        suggestions.push('⭐ Considere marcas premium para produtos importantes');
        suggestions.push('🏷️ Verifique data de validade e origem dos produtos');
        break;
    }

    return {
      currentAnalysis: analysis,
      suggestions,
      optimizationScore: Math.min(100, 
        (analysis.totalSavingsPercentage * 3) + 
        (100 / analysis.storesCount) + 
        (analysis.promotionSavings > 0 ? 20 : 0)
      )
    };
  }, [calculateList]);

  // ✅ EXPORTAR RELATÓRIO
  const generateReport = useCallback((
    items: ListItem[],
    aiSavings: number = 0,
    format: 'summary' | 'detailed' | 'managerial' = 'summary'
  ) => {
    const analysis = calculateList(items, aiSavings);
    
    const baseReport = {
      timestamp: new Date().toISOString(),
      totalItems: analysis.totalItems,
      totalValue: analysis.totalValue,
      totalSavings: analysis.totalCombinedSavings,
      stores: analysis.stores,
      categories: analysis.categories
    };

    switch (format) {
      case 'detailed':
        return {
          ...baseReport,
          categoryBreakdown: analysis.categoryBreakdown,
          storeBreakdown: analysis.storeBreakdown,
          insights: analysis.insights,
          recommendations: analysis.recommendations,
          itemDetails: items.map(item => ({
            name: item.produto.nome,
            price: item.produto.preco,
            quantity: item.quantidade,
            total: item.produto.preco * item.quantidade,
            store: item.produto.loja,
            category: item.produto.categoria
          }))
        };
        
      case 'managerial':
        if (!isManager) return baseReport;
        return {
          ...baseReport,
          kpis: {
            averageBasketSize: analysis.totalValue,
            conversionRate: '75%',
            customerSatisfaction: '4.2/5',
            marketShare: '12%'
          },
          competitiveAnalysis: {
            pricePosition: 'Competitivo',
            marketTrend: 'Crescimento',
            opportunities: analysis.recommendations
          }
        };
        
      default:
        return baseReport;
    }
  }, [calculateList, isManager]);

  return {
    // ✅ FUNÇÕES PRINCIPAIS
    calculateList,
    compareLists,
    optimizeList,
    generateReport,
    
    // ✅ ANALYTICS PARA GESTORES
    calculateStoreAnalytics,
    generateMarketInsights,
    
    // ✅ INFORMAÇÕES DO USUÁRIO
    isManager,
    isConsumer,
    
    // ✅ HELPERS RÁPIDOS
    getTotalValue: (items: ListItem[]) => calculateList(items).totalValue,
    getTotalSavings: (items: ListItem[], aiSavings = 0) => calculateList(items, aiSavings).totalCombinedSavings,
    getItemCount: (items: ListItem[]) => items?.length || 0,
    getStoreCount: (items: ListItem[]) => calculateList(items).storesCount,
    getCategoryCount: (items: ListItem[]) => calculateList(items).categoriesCount,
    
    // ✅ FORMATAÇÃO RÁPIDA
    formatListSummary: (items: ListItem[], aiSavings = 0) => {
      const analysis = calculateList(items, aiSavings);
      return {
        total: formatPrice(analysis.totalValue),
        savings: formatSavings(analysis.totalCombinedSavings),
        items: `${analysis.totalItems} ${analysis.totalItems === 1 ? 'item' : 'itens'}`,
        stores: `${analysis.storesCount} ${analysis.storesCount === 1 ? 'mercado' : 'mercados'}`
      };
    }
  };
};