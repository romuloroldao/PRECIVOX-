import React from 'react';
import { 
  Search, 
  Loader2, 
  Wifi, 
  WifiOff, 
  Clock, 
  TrendingUp,
  Package,
  Store,
  MapPin,
  BarChart3
} from 'lucide-react';

interface SearchLoadingStatesProps {
  // Estado de loading
  type: 'initial' | 'searching' | 'loading-results' | 'loading-more' | 'no-connection' | 'slow-network' | 'ai-processing';
  
  // Configurações
  searchQuery?: string;
  progress?: number; // 0-100 para loading com progresso
  estimatedTime?: number; // em segundos
  retryCount?: number;
  
  // Callbacks
  onRetry?: () => void;
  onCancel?: () => void;
  
  // Layout
  variant?: 'full' | 'inline' | 'overlay' | 'skeleton';
  size?: 'sm' | 'md' | 'lg';
  showProgress?: boolean;
  showTips?: boolean;
  
  className?: string;
}

const SearchLoadingStates: React.FC<SearchLoadingStatesProps> = ({
  type = 'searching',
  searchQuery = '',
  progress = 0,
  estimatedTime = 0,
  retryCount = 0,
  onRetry,
  onCancel,
  variant = 'full',
  size = 'md',
  showProgress = false,
  showTips = true,
  className = ''
}) => {
  
  const getLoadingConfig = () => {
    switch (type) {
      case 'initial':
        return {
          icon: Search,
          title: 'Pronto para buscar',
          message: 'Digite um produto ou categoria para começar',
          color: 'text-gray-500',
          bgColor: 'bg-gray-50',
          animation: 'pulse',
          tips: [
            'Digite pelo menos 3 caracteres',
            'Use termos específicos para melhores resultados',
            'Experimente buscar por categoria'
          ]
        };
      
      case 'searching':
        return {
          icon: Loader2,
          title: 'Buscando produtos...',
          message: searchQuery ? `Procurando por "${searchQuery}"` : 'Procurando produtos',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          animation: 'spin',
          tips: [
            'Buscando nos melhores supermercados',
            'Comparando preços em tempo real',
            'Aplicando filtros inteligentes'
          ]
        };
      
      case 'loading-results':
        return {
          icon: Package,
          title: 'Carregando resultados...',
          message: 'Organizando e comparando preços',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          animation: 'bounce',
          tips: [
            'Ordenando por melhor preço',
            'Verificando disponibilidade',
            'Calculando economia'
          ]
        };
      
      case 'loading-more':
        return {
          icon: TrendingUp,
          title: 'Carregando mais produtos...',
          message: 'Buscando produtos adicionais',
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
          animation: 'pulse',
          tips: [
            'Encontrando mais opções',
            'Expandindo busca para outras lojas',
            'Mantendo qualidade dos resultados'
          ]
        };
      
      case 'ai-processing':
        return {
          icon: BarChart3,
          title: 'IA analisando...',
          message: 'Processando dados com inteligência artificial',
          color: 'text-indigo-600',
          bgColor: 'bg-indigo-50',
          animation: 'spin',
          tips: [
            'Analisando padrões de preço',
            'Gerando insights personalizados',
            'Otimizando recomendações'
          ]
        };
      
      case 'slow-network':
        return {
          icon: Wifi,
          title: 'Conexão lenta detectada',
          message: 'A busca pode demorar um pouco mais',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          animation: 'pulse',
          tips: [
            'Verifique sua conexão com a internet',
            'Tente simplificar sua busca',
            'Use menos filtros para acelerar'
          ]
        };
      
      case 'no-connection':
        return {
          icon: WifiOff,
          title: 'Sem conexão',
          message: 'Verifique sua internet e tente novamente',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          animation: '',
          tips: [
            'Verifique sua conexão Wi-Fi',
            'Tente desligar e ligar a internet',
            'Contate seu provedor se o problema persistir'
          ]
        };
      
      default:
        return {
          icon: Loader2,
          title: 'Carregando...',
          message: 'Aguarde um momento',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          animation: 'spin',
          tips: []
        };
    }
  };

  const config = getLoadingConfig();
  const IconComponent = config.icon;

  const renderSkeleton = () => (
    <div className={`search-loading-skeleton ${className}`}>
      {/* Header Skeleton */}
      <div className="animate-pulse space-y-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
          <div className="flex-1">
            <div className="w-3/4 h-4 bg-gray-200 rounded"></div>
            <div className="w-1/2 h-3 bg-gray-200 rounded mt-2"></div>
          </div>
        </div>
        
        {/* Results Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="border rounded-lg p-4 space-y-3">
              <div className="w-full h-32 bg-gray-200 rounded"></div>
              <div className="w-3/4 h-4 bg-gray-200 rounded"></div>
              <div className="w-1/2 h-3 bg-gray-200 rounded"></div>
              <div className="flex justify-between">
                <div className="w-1/4 h-4 bg-gray-200 rounded"></div>
                <div className="w-1/3 h-4 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderInline = () => (
    <div className={`search-loading-inline flex items-center space-x-2 ${className}`}>
      <IconComponent className={`w-4 h-4 ${config.color} ${config.animation}`} />
      <span className={`text-sm ${config.color}`}>{config.title}</span>
      {showProgress && progress > 0 && (
        <div className="flex-1 max-w-32">
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );

  const renderOverlay = () => (
    <div className={`search-loading-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${className}`}>
      <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
        <div className="text-center">
          <div className={`inline-flex items-center justify-center w-16 h-16 ${config.bgColor} rounded-full mb-4`}>
            <IconComponent className={`w-8 h-8 ${config.color} ${config.animation}`} />
          </div>
          
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {config.title}
          </h3>
          
          <p className="text-gray-600 mb-4">
            {config.message}
          </p>
          
          {showProgress && progress > 0 && (
            <div className="mb-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-500 mt-1">{progress}% concluído</p>
            </div>
          )}
          
          {estimatedTime > 0 && (
            <div className="flex items-center justify-center text-sm text-gray-500 mb-4">
              <Clock className="w-4 h-4 mr-1" />
              Tempo estimado: {estimatedTime}s
            </div>
          )}
          
          {(onCancel || onRetry) && (
            <div className="flex space-x-2">
              {onCancel && (
                <button
                  onClick={onCancel}
                  className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancelar
                </button>
              )}
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {retryCount > 0 ? `Tentar novamente (${retryCount})` : 'Tentar novamente'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderFull = () => (
    <div className={`search-loading-full ${config.bgColor} rounded-lg p-8 text-center ${className}`}>
      <div className="max-w-md mx-auto">
        {/* Icon */}
        <div className={`inline-flex items-center justify-center w-20 h-20 bg-white rounded-full mb-6 shadow-sm`}>
          <IconComponent className={`w-10 h-10 ${config.color} ${config.animation}`} />
        </div>
        
        {/* Title */}
        <h3 className={`text-xl font-semibold mb-2 ${config.color}`}>
          {config.title}
        </h3>
        
        {/* Message */}
        <p className="text-gray-600 mb-6">
          {config.message}
        </p>
        
        {/* Progress Bar */}
        {showProgress && progress > 0 && (
          <div className="mb-6">
            <div className="w-full bg-white rounded-full h-3 shadow-inner">
              <div 
                className="bg-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-sm text-gray-500 mt-2">
              <span>{progress}% concluído</span>
              {estimatedTime > 0 && (
                <span className="flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {estimatedTime}s restantes
                </span>
              )}
            </div>
          </div>
        )}
        
        {/* Tips */}
        {showTips && config.tips.length > 0 && (
          <div className="text-left">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              💡 Dica {type === 'no-connection' ? 'de Conexão' : 'do PRECIVOX'}:
            </h4>
            <ul className="space-y-2">
              {config.tips.map((tip, index) => (
                <li key={index} className="flex items-start text-sm text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Actions */}
        {(onCancel || onRetry) && (
          <div className="flex space-x-3 mt-6">
            {onCancel && (
              <button
                onClick={onCancel}
                className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-white hover:shadow-sm transition-all"
              >
                Cancelar
              </button>
            )}
            {onRetry && (
              <button
                onClick={onRetry}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                {retryCount > 0 ? `Tentar novamente (${retryCount})` : 'Tentar novamente'}
              </button>
            )}
          </div>
        )}
        
        {/* Location indicator for some states */}
        {(type === 'searching' || type === 'loading-results') && (
          <div className="flex items-center justify-center text-xs text-gray-500 mt-4">
            <MapPin className="w-3 h-3 mr-1" />
            <span>Franco da Rocha, SP</span>
            <span className="mx-2">•</span>
            <Store className="w-3 h-3 mr-1" />
            <span>15+ supermercados</span>
          </div>
        )}
      </div>
    </div>
  );

  // Renderizar baseado na variante
  switch (variant) {
    case 'inline':
      return renderInline();
    case 'overlay':
      return renderOverlay();
    case 'skeleton':
      return renderSkeleton();
    case 'full':
    default:
      return renderFull();
  }
};

export default SearchLoadingStates;