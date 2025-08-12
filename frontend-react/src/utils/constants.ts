export const SEARCH_CONFIG = {
    ITEMS_PER_PAGE: 12,
    MAX_RESULTS: 50,
    DEBOUNCE_DELAY: 300
  };
  
  export const VIEW_MODES = [
    { id: 'grid', label: 'Cards', icon: 'Grid3x3' },
    { id: 'list', label: 'Lista', icon: 'List' }
  ];
  
  export const SORT_OPTIONS = [
    { value: 'relevance', label: '📊 Relevância' },
    { value: 'price_asc', label: '💰 Menor preço' },
    { value: 'price_desc', label: '💎 Maior preço' },
    { value: 'distance', label: '📍 Mais próximo' },
    { value: 'rating', label: '⭐ Melhor avaliado' },
    { value: 'discount', label: '🏷️ Maior desconto' },
    { value: 'newest', label: '🆕 Mais novos' },
    { value: 'popularity', label: '🔥 Mais visualizados' }
  ];