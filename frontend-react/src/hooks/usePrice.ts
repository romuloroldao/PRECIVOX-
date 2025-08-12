// src/hooks/usePrice.ts
// ✅ HOOK CENTRALIZADO PARA FORMATAÇÃO DE PREÇOS - ZERO REDUNDÂNCIAS
import { useCallback, useMemo } from 'react';
import { useLocation } from './useLocation';

// ✅ INTERFACES PADRONIZADAS
interface PriceFormatOptions {
  currency?: 'BRL' | 'USD' | 'EUR';
  locale?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  showSymbol?: boolean;
  compact?: boolean;
}

interface PriceCalculation {
  originalPrice: number;
  discount: number;
  finalPrice: number;
  savings: number;
  discountPercentage: number;
}

interface PriceComparisonResult {
  isLowestPrice: boolean;
  priceDifference: number;
  percentageDifference: number;
  rank: number;
}

// ✅ CONFIGURAÇÕES PADRÃO PRECIVOX
const DEFAULT_OPTIONS: PriceFormatOptions = {
  currency: 'BRL',
  locale: 'pt-BR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  showSymbol: true,
  compact: false
};

export const usePrice = () => {
  const { location } = useLocation();

  // ✅ FORMATAÇÃO PRINCIPAL DE PREÇOS
  const formatPrice = useCallback((
    price: number | string, 
    options: Partial<PriceFormatOptions> = {}
  ): string => {
    const config = { ...DEFAULT_OPTIONS, ...options };
    const numericPrice = typeof price === 'string' ? parseFloat(price) : price;

    if (isNaN(numericPrice)) return 'R$ 0,00';

    try {
      // ✅ FORMATAÇÃO COMPACTA (K, M, B)
      if (config.compact && numericPrice >= 1000) {
        if (numericPrice >= 1000000000) {
          return `R$ ${(numericPrice / 1000000000).toFixed(1)}B`;
        }
        if (numericPrice >= 1000000) {
          return `R$ ${(numericPrice / 1000000).toFixed(1)}M`;
        }
        if (numericPrice >= 1000) {
          return `R$ ${(numericPrice / 1000).toFixed(1)}K`;
        }
      }

      // ✅ FORMATAÇÃO PADRÃO BRASILEIRA
      const formatter = new Intl.NumberFormat(config.locale, {
        style: config.showSymbol ? 'currency' : 'decimal',
        currency: config.currency,
        minimumFractionDigits: config.minimumFractionDigits,
        maximumFractionDigits: config.maximumFractionDigits
      });

      return formatter.format(numericPrice);
    } catch (error) {
      // ✅ FALLBACK MANUAL
      return `R$ ${numericPrice.toFixed(2).replace('.', ',')}`;
    }
  }, []);

  // ✅ CÁLCULO DE PROMOÇÕES/DESCONTOS
  const calculateDiscount = useCallback((
    originalPrice: number,
    discountPercentage: number
  ): PriceCalculation => {
    const discount = (originalPrice * discountPercentage) / 100;
    const finalPrice = originalPrice - discount;

    return {
      originalPrice,
      discount,
      finalPrice,
      savings: discount,
      discountPercentage
    };
  }, []);

  // ✅ CÁLCULO DE PROMOÇÃO REVERSA (FINAL → ORIGINAL)
  const calculateOriginalPrice = useCallback((
    finalPrice: number,
    discountPercentage: number
  ): PriceCalculation => {
    const originalPrice = finalPrice / (1 - discountPercentage / 100);
    const discount = originalPrice - finalPrice;

    return {
      originalPrice,
      discount,
      finalPrice,
      savings: discount,
      discountPercentage
    };
  }, []);

  // ✅ COMPARAÇÃO DE PREÇOS
  const comparePrice = useCallback((
    currentPrice: number,
    comparisonPrice: number
  ): PriceComparisonResult => {
    const priceDifference = currentPrice - comparisonPrice;
    const percentageDifference = ((priceDifference / comparisonPrice) * 100);
    
    return {
      isLowestPrice: currentPrice <= comparisonPrice,
      priceDifference: Math.abs(priceDifference),
      percentageDifference: Math.abs(percentageDifference),
      rank: currentPrice <= comparisonPrice ? 1 : 2
    };
  }, []);

  // ✅ FORMATAÇÃO DE ECONOMIA/DESCONTO
  const formatSavings = useCallback((
    savings: number,
    showPercentage: boolean = false,
    originalPrice?: number
  ): string => {
    let result = `−${formatPrice(savings)}`;
    
    if (showPercentage && originalPrice && originalPrice > 0) {
      const percentage = (savings / originalPrice) * 100;
      result += ` (${percentage.toFixed(0)}%)`;
    }
    
    return result;
  }, [formatPrice]);

  // ✅ VERIFICAR SE PREÇO É VÁLIDO
  const isValidPrice = useCallback((price: any): boolean => {
    if (price === null || price === undefined) return false;
    const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
    return !isNaN(numericPrice) && numericPrice >= 0;
  }, []);

  // ✅ CONVERTER PREÇO PARA NÚMERO
  const parsePrice = useCallback((price: string | number): number => {
    if (typeof price === 'number') return price;
    
    // ✅ LIMPAR FORMATAÇÃO BRASILEIRA
    const cleaned = price
      .replace(/[^\d,.-]/g, '') // Remove tudo exceto dígitos, vírgula, ponto, hífen
      .replace(/\./g, '')       // Remove pontos (separadores de milhares)
      .replace(',', '.');       // Converte vírgula para ponto decimal
    
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }, []);

  // ✅ FORMATAÇÃO POR CONTEXTO
  const formatByContext = useCallback((
    price: number,
    context: 'card' | 'list' | 'detail' | 'summary' | 'compact'
  ): string => {
    switch (context) {
      case 'compact':
        return formatPrice(price, { compact: true });
      case 'summary':
        return formatPrice(price, { minimumFractionDigits: 2 });
      case 'detail':
        return formatPrice(price, { maximumFractionDigits: 2 });
      case 'card':
      case 'list':
      default:
        return formatPrice(price);
    }
  }, [formatPrice]);

  // ✅ ANÁLISE DE LISTA DE PREÇOS
  const analyzePrices = useCallback((prices: number[]) => {
    if (!prices.length) {
      return {
        total: 0,
        average: 0,
        lowest: 0,
        highest: 0,
        count: 0,
        range: 0
      };
    }

    const total = prices.reduce((sum, price) => sum + price, 0);
    const average = total / prices.length;
    const lowest = Math.min(...prices);
    const highest = Math.max(...prices);

    return {
      total,
      average,
      lowest,
      highest,
      count: prices.length,
      range: highest - lowest
    };
  }, []);

  // ✅ FORMATAÇÃO DE FAIXA DE PREÇOS
  const formatPriceRange = useCallback((
    minPrice: number,
    maxPrice: number
  ): string => {
    if (minPrice === maxPrice) {
      return formatPrice(minPrice);
    }
    return `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`;
  }, [formatPrice]);

  // ✅ HELPERS PARA PROMOÇÕES
  const getPromotionInfo = useCallback((product: any) => {
    if (!product.promocao) {
      return {
        hasPromotion: false,
        originalPrice: product.preco,
        finalPrice: product.preco,
        savings: 0,
        discountPercentage: 0
      };
    }

    // ✅ SUPORTE A ESTRUTURAS DIFERENTES DE PROMOÇÃO
    if (typeof product.promocao === 'object') {
      const promo = product.promocao;
      const originalPrice = promo.precoOriginal || product.preco;
      const finalPrice = product.preco;
      const savings = originalPrice - finalPrice;
      const discountPercentage = promo.desconto || ((savings / originalPrice) * 100);

      return {
        hasPromotion: promo.ativo !== false,
        originalPrice,
        finalPrice,
        savings,
        discountPercentage
      };
    }

    // ✅ PROMOÇÃO BOOLEAN (FALLBACK)
    return {
      hasPromotion: Boolean(product.promocao),
      originalPrice: product.preco,
      finalPrice: product.preco,
      savings: 0,
      discountPercentage: 0
    };
  }, []);

  // ✅ CONFIGURAÇÕES REGIONAIS (FRANCO DA ROCHA)
  const regionalConfig = useMemo(() => {
    const isLocalRegion = location?.city?.includes('Franco da Rocha') || 
                         location?.city?.includes('São Paulo');
    
    return {
      currency: 'BRL' as const,
      locale: 'pt-BR',
      taxRate: 0, // Para futuras implementações
      shippingCosts: isLocalRegion ? 0 : 5.99,
      regionCode: isLocalRegion ? 'SP-FDR' : 'SP-OTHER'
    };
  }, [location]);

  return {
    // ✅ FUNÇÕES PRINCIPAIS
    formatPrice,
    formatSavings,
    formatByContext,
    formatPriceRange,
    
    // ✅ CÁLCULOS
    calculateDiscount,
    calculateOriginalPrice,
    comparePrice,
    analyzePrices,
    
    // ✅ VALIDAÇÃO E CONVERSÃO
    isValidPrice,
    parsePrice,
    
    // ✅ HELPERS PARA COMPONENTES
    getPromotionInfo,
    
    // ✅ CONFIGURAÇÕES
    regionalConfig,
    
    // ✅ FUNÇÕES DE CONVENIÊNCIA
    formatCurrency: formatPrice, // Alias
    formatMoney: formatPrice,    // Alias
    toCurrency: formatPrice,     // Alias
    
    // ✅ CONSTANTES ÚTEIS
    CURRENCY_SYMBOL: 'R$',
    DECIMAL_SEPARATOR: ',',
    THOUSANDS_SEPARATOR: '.'
  };
};