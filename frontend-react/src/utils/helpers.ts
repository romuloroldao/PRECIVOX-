// src/utils/helpers.ts

// Formata número para moeda brasileira (R$)
export const formatPrice = (value: number): string => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    });
  };
  
  // Formata data (ISO ou Date) para padrão brasileiro
  export const formatDate = (date: string | Date): string => {
    const d = new Date(date);
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };
  
  // Formata porcentagem com sinal (ex: +2.5%)
  export const formatPercent = (value: number, decimals: number = 2): string => {
    const formatted = value.toFixed(decimals).replace('.', ',');
    return `${value > 0 ? '+' : ''}${formatted}%`;
  };
  
  // Primeira letra maiúscula
  export const capitalize = (text: string): string => {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1);
  };
  
  // Limita texto a X caracteres e adiciona reticências
  export const truncateText = (text: string, maxLength: number = 100): string => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength).trim() + '...';
  };
  