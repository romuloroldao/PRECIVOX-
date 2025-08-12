// src/hooks/useViewMode.ts - Hook para gerenciar modos de visualização
import { useState, useEffect, useCallback, useMemo } from 'react';

// Tipos de visualização disponíveis
export type ViewModeType = 'grid' | 'list' | 'card' | 'compact' | 'table';

// Configurações para cada modo
interface ViewModeConfig {
  id: ViewModeType;
  name: string;
  icon: string;
  description: string;
  columns?: number;
  showImages: boolean;
  showDetails: boolean;
  showPrice: boolean;
  showStore: boolean;
  showRating: boolean;
  showDescription: boolean;
  density: 'comfortable' | 'compact' | 'dense';
}

// Configurações de responsividade
interface ResponsiveConfig {
  mobile: ViewModeType;
  tablet: ViewModeType;
  desktop: ViewModeType;
}

// Configurações dos modos de visualização
const VIEW_MODE_CONFIGS: Record<ViewModeType, ViewModeConfig> = {
  grid: {
    id: 'grid',
    name: 'Grade',
    icon: '⊞',
    description: 'Visualização em grade com imagens grandes',
    columns: 3,
    showImages: true,
    showDetails: true,
    showPrice: true,
    showStore: true,
    showRating: true,
    showDescription: false,
    density: 'comfortable'
  },
  list: {
    id: 'list',
    name: 'Lista',
    icon: '☰',
    description: 'Lista vertical com todas as informações',
    showImages: true,
    showDetails: true,
    showPrice: true,
    showStore: true,
    showRating: true,
    showDescription: true,
    density: 'comfortable'
  },
  card: {
    id: 'card',
    name: 'Cartões',
    icon: '🃏',
    description: 'Cartões grandes com foco visual',
    columns: 2,
    showImages: true,
    showDetails: true,
    showPrice: true,
    showStore: true,
    showRating: true,
    showDescription: true,
    density: 'comfortable'
  },
  compact: {
    id: 'compact',
    name: 'Compacto',
    icon: '⊟',
    description: 'Visualização compacta para mais itens',
    columns: 4,
    showImages: true,
    showDetails: false,
    showPrice: true,
    showStore: false,
    showRating: false,
    showDescription: false,
    density: 'compact'
  },
  table: {
    id: 'table',
    name: 'Tabela',
    icon: '⊞',
    description: 'Tabela detalhada para comparação',
    showImages: false,
    showDetails: true,
    showPrice: true,
    showStore: true,
    showRating: true,
    showDescription: false,
    density: 'dense'
  }
};

// Configurações responsivas padrão
const DEFAULT_RESPONSIVE_CONFIG: ResponsiveConfig = {
  mobile: 'list',
  tablet: 'grid',
  desktop: 'grid'
};

export const useViewMode = (defaultMode: ViewModeType = 'grid') => {
  // Estado do modo atual
  const [viewMode, setViewMode] = useState<ViewModeType>(() => {
    // Tentar recuperar do localStorage
    try {
      const saved = localStorage.getItem('precivox_view_mode');
      return (saved as ViewModeType) || defaultMode;
    } catch {
      return defaultMode;
    }
  });

  // Estado de responsividade
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [isResponsiveMode, setIsResponsiveMode] = useState(false);

  // Configuração do modo atual
  const currentConfig = useMemo(() => VIEW_MODE_CONFIGS[viewMode], [viewMode]);

  // Detectar tamanho da tela
  const detectScreenSize = useCallback(() => {
    const width = window.innerWidth;
    if (width < 768) {
      setScreenSize('mobile');
    } else if (width < 1024) {
      setScreenSize('tablet');
    } else {
      setScreenSize('desktop');
    }
  }, []);

  // Aplicar modo responsivo automaticamente
  const applyResponsiveMode = useCallback(() => {
    if (!isResponsiveMode) return;
    
    const responsiveMode = DEFAULT_RESPONSIVE_CONFIG[screenSize];
    if (responsiveMode !== viewMode) {
      setViewMode(responsiveMode);
    }
  }, [isResponsiveMode, screenSize, viewMode]);

  // Alterar modo de visualização
  const setViewModeAndSave = useCallback((mode: ViewModeType) => {
    setViewMode(mode);
    
    // Salvar no localStorage
    try {
      localStorage.setItem('precivox_view_mode', mode);
    } catch (error) {
      console.warn('⚠️ Erro ao salvar modo de visualização:', error);
    }
    
    // Desabilitar modo responsivo ao mudar manualmente
    setIsResponsiveMode(false);
  }, []);

  // Alternar entre modos
  const toggleViewMode = useCallback(() => {
    const modes: ViewModeType[] = ['grid', 'list', 'card', 'compact', 'table'];
    const currentIndex = modes.indexOf(viewMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setViewModeAndSave(modes[nextIndex]);
  }, [viewMode, setViewModeAndSave]);

  // Habilitar/desabilitar modo responsivo
  const toggleResponsiveMode = useCallback(() => {
    setIsResponsiveMode(prev => {
      const newValue = !prev;
      
      if (newValue) {
        // Se habilitando, aplicar modo responsivo imediatamente
        const responsiveMode = DEFAULT_RESPONSIVE_CONFIG[screenSize];
        setViewMode(responsiveMode);
      }
      
      return newValue;
    });
  }, [screenSize]);

  // Obter configuração para modo específico
  const getConfig = useCallback((mode: ViewModeType) => {
    return VIEW_MODE_CONFIGS[mode];
  }, []);

  // Obter todos os modos disponíveis
  const getAllModes = useCallback(() => {
    return Object.values(VIEW_MODE_CONFIGS);
  }, []);

  // Verificar se é um modo específico
  const isMode = useCallback((mode: ViewModeType) => {
    return viewMode === mode;
  }, [viewMode]);

  // Obter classes CSS baseadas no modo
  const getViewModeClasses = useCallback(() => {
    const config = currentConfig;
    const classes = [`view-mode-${config.id}`, `density-${config.density}`];
    
    if (config.columns) {
      classes.push(`columns-${config.columns}`);
    }
    
    if (isResponsiveMode) {
      classes.push('responsive-mode');
    }
    
    return classes.join(' ');
  }, [currentConfig, isResponsiveMode]);

  // Obter estilos CSS para grid
  const getGridStyles = useCallback(() => {
    if (!currentConfig.columns) return {};
    
    return {
      display: 'grid',
      gridTemplateColumns: `repeat(${currentConfig.columns}, 1fr)`,
      gap: currentConfig.density === 'dense' ? '8px' : 
           currentConfig.density === 'compact' ? '12px' : '16px'
    };
  }, [currentConfig]);

  // Setup de listeners para resize
  useEffect(() => {
    detectScreenSize();
    
    const handleResize = () => {
      detectScreenSize();
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [detectScreenSize]);

  // Aplicar modo responsivo quando necessário
  useEffect(() => {
    applyResponsiveMode();
  }, [applyResponsiveMode]);

  // Salvar preferência de modo responsivo
  useEffect(() => {
    try {
      localStorage.setItem('precivox_responsive_mode', String(isResponsiveMode));
    } catch (error) {
      console.warn('⚠️ Erro ao salvar modo responsivo:', error);
    }
  }, [isResponsiveMode]);

  // Recuperar preferência de modo responsivo na inicialização
  useEffect(() => {
    try {
      const saved = localStorage.getItem('precivox_responsive_mode');
      if (saved) {
        setIsResponsiveMode(saved === 'true');
      }
    } catch (error) {
      console.warn('⚠️ Erro ao recuperar modo responsivo:', error);
    }
  }, []);

  return {
    // Estado atual
    viewMode,
    currentConfig,
    screenSize,
    isResponsiveMode,
    
    // Funções de controle
    setViewMode: setViewModeAndSave,
    toggleViewMode,
    toggleResponsiveMode,
    
    // Funções utilitárias
    getConfig,
    getAllModes,
    isMode,
    getViewModeClasses,
    getGridStyles,
    
    // Estados computados
    isGrid: viewMode === 'grid',
    isList: viewMode === 'list',
    isCard: viewMode === 'card',
    isCompact: viewMode === 'compact',
    isTable: viewMode === 'table',
    
    // Configurações específicas
    showImages: currentConfig.showImages,
    showDetails: currentConfig.showDetails,
    showPrice: currentConfig.showPrice,
    showStore: currentConfig.showStore,
    showRating: currentConfig.showRating,
    showDescription: currentConfig.showDescription,
    density: currentConfig.density,
    columns: currentConfig.columns,
    
    // Meta informações
    availableModes: Object.keys(VIEW_MODE_CONFIGS) as ViewModeType[],
    modeCount: Object.keys(VIEW_MODE_CONFIGS).length
  };
};