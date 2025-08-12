import React from 'react';
import { 
  Package, 
  TrendingDown, 
  Star, 
  ShoppingCart, 
  Eye, 
  DollarSign,
  Store,
  Tag,
  Zap,
  Award,
  Flame,
  Trophy,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';

interface SearchStats {
  total: number;
  totalAll: number;
  inPromotion: number;
  bestPrice: number;
  newProducts: number;
  available: number;
  totalViews: number;
  avgPrice: number;
  maxPrice: number;
  minPrice: number;
  totalValue: number;
  uniqueMarkets: number;
  uniqueBrands: number;
}

interface SearchStatsProps {
  stats: SearchStats;
  className?: string;
  showDetailed?: boolean;
  format?: 'compact' | 'detailed';
  onStatClick?: (statType: string) => void;
}

const SearchStats: React.FC<SearchStatsProps> = ({
  stats,
  className = "",
  showDetailed = false,
  format = 'compact',
  onStatClick
}) => {
  const [currentSlide, setCurrentSlide] = React.useState(0);
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  const getStatColor = (type: string) => {
    const colors = {
      total: 'bg-blue-50 text-blue-700 border-blue-200',
      promotion: 'bg-gradient-to-br from-orange-50 to-orange-100 text-orange-700 border-orange-200',
      bestPrice: 'bg-gradient-to-br from-green-50 to-emerald-100 text-green-700 border-green-200',
      newProducts: 'bg-gradient-to-br from-purple-50 to-purple-100 text-purple-700 border-purple-200',
      available: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      views: 'bg-orange-50 text-orange-700 border-orange-200',
      price: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      markets: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      brands: 'bg-pink-50 text-pink-700 border-pink-200'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  // Stats principais para formato compacto
  const mainStats = [
    {
      key: 'total',
      label: 'Produtos encontrados',
      value: stats.total,
      icon: Package,
      format: 'number',
      highlight: false
    },
    {
      key: 'promotion',
      label: 'Em promoção',
      value: stats.inPromotion,
      icon: Flame,
      format: 'number',
      percentage: stats.total > 0 ? (stats.inPromotion / stats.total) * 100 : 0,
      highlight: stats.inPromotion > 0,
      badge: '🔥'
    },
    {
      key: 'bestPrice',
      label: 'Melhor preço',
      value: stats.bestPrice,
      icon: Trophy,
      format: 'number',
      percentage: stats.total > 0 ? (stats.bestPrice / stats.total) * 100 : 0,
      highlight: stats.bestPrice > 0,
      badge: '🏆'
    },
    {
      key: 'price',
      label: 'Preço médio',
      value: stats.avgPrice,
      icon: DollarSign,
      format: 'currency',
      highlight: false
    }
  ];

  // Stats detalhadas para formato detailed
  const detailedStats = [
    ...mainStats,
    {
      key: 'newProducts',
      label: 'Produtos novos',
      value: stats.newProducts,
      icon: Zap,
      format: 'number',
      percentage: stats.total > 0 ? (stats.newProducts / stats.total) * 100 : 0,
      highlight: stats.newProducts > 0,
      badge: '✨'
    },
    {
      key: 'available',
      label: 'Disponíveis',
      value: stats.available,
      icon: ShoppingCart,
      format: 'number',
      percentage: stats.total > 0 ? (stats.available / stats.total) * 100 : 0,
      highlight: false
    },
    {
      key: 'views',
      label: 'Visualizações',
      value: stats.totalViews,
      icon: Eye,
      format: 'number',
      highlight: false
    },
    {
      key: 'markets',
      label: 'Mercados',
      value: stats.uniqueMarkets,
      icon: Store,
      format: 'number',
      highlight: false
    },
    {
      key: 'brands',
      label: 'Marcas',
      value: stats.uniqueBrands,
      icon: Tag,
      format: 'number',
      highlight: false
    }
  ];

  const statsToShow = format === 'detailed' || showDetailed ? detailedStats : mainStats;
  const itemsPerSlide = isMobile ? 2 : 4;
  const totalSlides = Math.ceil(statsToShow.length / itemsPerSlide);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const getCurrentStats = () => {
    const startIndex = currentSlide * itemsPerSlide;
    return statsToShow.slice(startIndex, startIndex + itemsPerSlide);
  };

  const StatCard = ({ stat }: { stat: any }) => {
    const Icon = stat.icon;
    const formattedValue = stat.format === 'currency' 
      ? formatCurrency(stat.value)
      : formatNumber(stat.value);

    return (
      <div
        className={`
          relative p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer 
          hover:shadow-lg hover:scale-105 hover:-translate-y-1
          ${getStatColor(stat.key)}
          ${format === 'compact' ? 'min-w-[140px]' : 'min-w-[160px]'}
          ${stat.highlight ? 'ring-2 ring-offset-2 ring-current' : ''}
        `}
        onClick={() => onStatClick?.(stat.key)}
      >
        {/* Badge de destaque */}
        {stat.badge && stat.highlight && (
          <div className="absolute -top-2 -right-2 text-lg animate-bounce">
            {stat.badge}
          </div>
        )}

        <div className="flex items-center gap-3">
          <div className={`
            p-2 rounded-lg transition-all duration-300
            ${stat.highlight ? 'bg-white shadow-md' : 'bg-white/60'}
          `}>
            <Icon className={`w-5 h-5 ${stat.highlight ? 'animate-pulse' : ''}`} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="text-xl font-bold leading-tight">
              {formattedValue}
            </div>
            <div className="text-xs font-medium opacity-80 truncate">
              {stat.label}
            </div>
            {stat.percentage !== undefined && stat.percentage > 0 && (
              <div className="text-xs opacity-70 mt-1 font-medium">
                {stat.percentage.toFixed(1)}%
              </div>
            )}
          </div>
        </div>

        {/* Indicador de animação para destaques */}
        {stat.highlight && (
          <div className="absolute inset-0 rounded-xl border-2 border-current opacity-20 animate-ping" />
        )}
      </div>
    );
  };

  // Informações resumidas no topo
  const SummaryInfo = () => (
    <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 shadow-sm">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span className="font-medium">
            📦 {formatNumber(stats.total)} produtos encontrados
          </span>
          {stats.totalAll > stats.total && (
            <span className="text-gray-500">
              de {formatNumber(stats.totalAll)} total
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span>🏪 {stats.uniqueMarkets} mercados</span>
          <span>🏷️ {stats.uniqueBrands} marcas</span>
        </div>
      </div>
    </div>
  );

  if (format === 'compact') {
    if (isMobile && totalSlides > 1) {
      // Carrossel para mobile
      return (
        <div className={`space-y-4 ${className}`}>
          <SummaryInfo />
          
          <div className="relative">
            {/* Carrossel */}
            <div className="overflow-hidden rounded-xl">
              <div 
                className="flex transition-transform duration-300 ease-in-out gap-4"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              >
                {Array.from({ length: totalSlides }).map((_, slideIndex) => (
                  <div key={slideIndex} className="flex-shrink-0 w-full">
                    <div className="grid grid-cols-2 gap-4">
                      {statsToShow
                        .slice(slideIndex * itemsPerSlide, (slideIndex + 1) * itemsPerSlide)
                        .map((stat) => (
                          <StatCard key={stat.key} stat={stat} />
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Controles do carrossel */}
            {totalSlides > 1 && (
              <div className="flex items-center justify-between mt-4">
                <button
                  onClick={prevSlide}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 
                           bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Anterior
                </button>

                <div className="flex items-center gap-2">
                  {Array.from({ length: totalSlides }).map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSlide(index)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        currentSlide === index ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>

                <button
                  onClick={nextSlide}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 
                           bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Próximo
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      );
    }

    // Desktop - layout horizontal
    return (
      <div className={`space-y-4 ${className}`}>
        <SummaryInfo />
        
        <div className="flex items-center gap-4 overflow-x-auto pb-2">
          {statsToShow.map((stat) => (
            <StatCard key={stat.key} stat={stat} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <SummaryInfo />
      
      {/* Header com totais */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-500" />
          Estatísticas da Busca
        </h3>
      </div>

      {/* Grid de estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {statsToShow.map((stat) => (
          <StatCard key={stat.key} stat={stat} />
        ))}
      </div>

      {/* Resumo de preços aprimorado */}
      <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 border border-gray-200">
        <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <DollarSign className="w-4 h-4" />
          Análise de Preços
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-xs text-gray-500 mb-1">Menor preço</div>
            <div className="text-lg font-bold text-green-600">
              {formatCurrency(stats.minPrice)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500 mb-1">Preço médio</div>
            <div className="text-lg font-bold text-blue-600">
              {formatCurrency(stats.avgPrice)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500 mb-1">Maior preço</div>
            <div className="text-lg font-bold text-red-600">
              {formatCurrency(stats.maxPrice)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500 mb-1">Valor total</div>
            <div className="text-lg font-bold text-purple-600">
              {formatCurrency(stats.totalValue)}
            </div>
          </div>
        </div>
      </div>

      {/* Insights melhorados */}
      {(stats.inPromotion > 0 || stats.bestPrice > 0 || stats.newProducts > 0) && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
          <h4 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Destaques da Busca
          </h4>
          <div className="grid gap-3">
            {stats.inPromotion > 0 && (
              <div className="flex items-center gap-3 text-sm">
                <span className="text-lg">🔥</span>
                <span className="text-blue-700">
                  <strong>{stats.inPromotion}</strong> produtos em promoção 
                  <span className="text-blue-600 ml-1">
                    ({((stats.inPromotion / stats.total) * 100).toFixed(1)}%)
                  </span>
                </span>
              </div>
            )}
            {stats.bestPrice > 0 && (
              <div className="flex items-center gap-3 text-sm">
                <span className="text-lg">🏆</span>
                <span className="text-blue-700">
                  <strong>{stats.bestPrice}</strong> produtos com melhor preço 
                  <span className="text-blue-600 ml-1">
                    ({((stats.bestPrice / stats.total) * 100).toFixed(1)}%)
                  </span>
                </span>
              </div>
            )}
            {stats.newProducts > 0 && (
              <div className="flex items-center gap-3 text-sm">
                <span className="text-lg">✨</span>
                <span className="text-blue-700">
                  <strong>{stats.newProducts}</strong> produtos novos 
                  <span className="text-blue-600 ml-1">
                    ({((stats.newProducts / stats.total) * 100).toFixed(1)}%)
                  </span>
                </span>
              </div>
            )}
            {stats.uniqueMarkets > 1 && (
              <div className="flex items-center gap-3 text-sm">
                <span className="text-lg">🏪</span>
                <span className="text-blue-700">
                  Produtos disponíveis em <strong>{stats.uniqueMarkets}</strong> mercados diferentes
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchStats;