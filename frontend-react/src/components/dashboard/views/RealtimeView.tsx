import React, { useState, useEffect } from 'react';
import { Activity, Users, Search, Package, TrendingUp, MapPin, Zap, Eye, Clock, Wifi, WifiOff, Play, Pause, RefreshCw } from 'lucide-react';
import { useAppState } from '../../../hooks/useAppState';
import { useLocation } from '../../../hooks/useLocation';
import { useMultiSourceData } from '../../../hooks/useMultiSourceData';
import { Product } from '../../../types';
import { MetricCard } from '../cards/MetricCard';

interface RealtimeViewProps {
  products: Product[];
  favorites: Product[];
  userPreferences: any;
  onProductSelect?: (product: Product) => void;
}

interface LiveActivity {
  id: number;
  type: 'search' | 'price_update' | 'new_product' | 'user_join' | 'favorite_add' | 'purchase' | 'view';
  location: string;
  product: string;
  timestamp: Date;
  user: string;
  value?: number;
  category?: string;
}

interface RegionData {
  name: string;
  users: number;
  searches: number;
  activity: number;
  trend: 'up' | 'down' | 'stable';
}

export const RealtimeView: React.FC<RealtimeViewProps> = ({
  products,
  favorites,
  userPreferences,
  onProductSelect
}) => {
  const { currentPage } = useAppState();
  const { location } = useLocation();
  const { reloadData: refreshData } = useMultiSourceData();
  
  // Estados premium
  const [liveData, setLiveData] = useState({
    activeUsers: 0,
    searchesPerMinute: 0,
    newProducts: 0,
    priceUpdates: 0,
    pageViews: 0,
    conversions: 0
  });
  
  const [activities, setActivities] = useState<LiveActivity[]>([]);
  const [isLive, setIsLive] = useState(true);
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'poor'>('excellent');
  const [animatedMetrics, setAnimatedMetrics] = useState(liveData);

  // Dados das regiões
  const [regionData, setRegionData] = useState<RegionData[]>([
    { name: 'Franco da Rocha', users: 0, searches: 0, activity: 75, trend: 'up' },
    { name: 'Caieiras', users: 0, searches: 0, activity: 60, trend: 'stable' },
    { name: 'Cajamar', users: 0, searches: 0, activity: 45, trend: 'up' },
    { name: 'Jundiaí', users: 0, searches: 0, activity: 35, trend: 'down' },
    { name: 'Osasco', users: 0, searches: 0, activity: 25, trend: 'stable' }
  ]);

  // ✅ SIMULAÇÃO DE DADOS EM TEMPO REAL COM ANIMAÇÃO PROGRESSIVA
  useEffect(() => {
    if (!isLive) return;

    const updateLiveData = () => {
      const newData = {
        activeUsers: Math.floor(Math.random() * 30) + 45,
        searchesPerMinute: Math.floor(Math.random() * 12) + 8,
        newProducts: Math.floor(Math.random() * 6) + 2,
        priceUpdates: Math.floor(Math.random() * 15) + 15,
        pageViews: Math.floor(Math.random() * 50) + 100,
        conversions: Math.floor(Math.random() * 8) + 12
      };
      
      setLiveData(newData);
      
      // Animação progressiva dos números com easing
      const animateNumbers = (target: typeof newData) => {
        const steps = 60;
        const interval = 16;
        let step = 0;
        
        const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
        
        const animate = () => {
          step++;
          const progress = step / steps;
          const eased = easeOutCubic(progress);
          
          setAnimatedMetrics(prev => ({
            activeUsers: Math.floor(prev.activeUsers + (target.activeUsers - prev.activeUsers) * eased / steps),
            searchesPerMinute: Math.floor(prev.searchesPerMinute + (target.searchesPerMinute - prev.searchesPerMinute) * eased / steps),
            newProducts: Math.floor(prev.newProducts + (target.newProducts - prev.newProducts) * eased / steps),
            priceUpdates: Math.floor(prev.priceUpdates + (target.priceUpdates - prev.priceUpdates) * eased / steps),
            pageViews: Math.floor(prev.pageViews + (target.pageViews - prev.pageViews) * eased / steps),
            conversions: Math.floor(prev.conversions + (target.conversions - prev.conversions) * eased / steps)
          }));
          
          if (step < steps) {
            requestAnimationFrame(animate);
          } else {
            setAnimatedMetrics(target);
          }
        };
        
        animate();
      };
      
      animateNumbers(newData);
      
      // Atualizar dados regionais
      setRegionData(prev => prev.map(region => ({
        ...region,
        users: Math.floor(newData.activeUsers * (region.activity / 100)) + Math.floor(Math.random() * 5),
        searches: Math.floor(newData.searchesPerMinute * (region.activity / 100)) + Math.floor(Math.random() * 3),
        activity: Math.max(20, Math.min(95, region.activity + (Math.random() - 0.5) * 10))
      })));
    };

    updateLiveData();
    const interval = setInterval(updateLiveData, 4000);
    return () => clearInterval(interval);
  }, [isLive]);

  // ✅ SIMULAÇÃO DE FEED DE ATIVIDADES
  useEffect(() => {
    if (!isLive) return;

    const generateActivity = () => {
      const activityTypes: LiveActivity['type'][] = [
        'search', 'price_update', 'new_product', 'user_join', 'favorite_add', 'purchase', 'view'
      ];
      const locations = ['Franco da Rocha', 'Caieiras', 'Cajamar', 'Jundiaí', 'Osasco'];
      const productList = [
        'Arroz Tipo 1 5kg', 'Feijão Carioca 1kg', 'Açúcar Cristal 1kg', 'Óleo de Soja 900ml',
        'Leite Integral 1L', 'Pão Francês', 'Ovos Brancos 12un', 'Frango Inteiro',
        'Coca-Cola 2L', 'Detergente Ypê', 'Papel Higiênico', 'Macarrão Espaguete'
      ];
      const categories = ['Grãos', 'Laticínios', 'Bebidas', 'Limpeza', 'Higiene', 'Carnes'];

      const type = activityTypes[Math.floor(Math.random() * activityTypes.length)];
      const newActivity: LiveActivity = {
        id: Date.now() + Math.random(),
        type,
        location: locations[Math.floor(Math.random() * locations.length)],
        product: productList[Math.floor(Math.random() * productList.length)],
        timestamp: new Date(),
        user: `Usuário${Math.floor(Math.random() * 9999).toString().padStart(4, '0')}`,
        category: categories[Math.floor(Math.random() * categories.length)]
      };

      if (type === 'price_update') {
        newActivity.value = Math.floor(Math.random() * 50) + 10;
      }

      setActivities(prev => [newActivity, ...prev.slice(0, 24)]);
    };

    generateActivity();
    const activityInterval = setInterval(generateActivity, Math.random() * 2000 + 1500);
    
    return () => clearInterval(activityInterval);
  }, [isLive]);

  // ✅ SIMULAÇÃO DE QUALIDADE DE CONEXÃO
  useEffect(() => {
    const checkConnection = () => {
      const qualities: Array<'excellent' | 'good' | 'poor'> = ['excellent', 'good', 'poor'];
      const weights = [0.8, 0.15, 0.05]; // 80% excellent, 15% good, 5% poor
      
      const random = Math.random();
      let cumulative = 0;
      
      for (let i = 0; i < qualities.length; i++) {
        cumulative += weights[i];
        if (random <= cumulative) {
          setConnectionQuality(qualities[i]);
          break;
        }
      }
    };

    const connectionInterval = setInterval(checkConnection, 15000);
    return () => clearInterval(connectionInterval);
  }, []);

  // ✅ FUNÇÕES AUXILIARES
  const getActivityIcon = (type: LiveActivity['type']) => {
    const icons = {
      search: '🔍',
      price_update: '💰',
      new_product: '🆕',
      user_join: '👤',
      favorite_add: '❤️',
      purchase: '🛒',
      view: '👁️'
    };
    return icons[type] || '📊';
  };

  const getActivityMessage = (activity: LiveActivity) => {
    const messages = {
      search: `pesquisou "${activity.product}"`,
      price_update: `preço atualizado: "${activity.product}" ${activity.value ? `R$ ${activity.value}` : ''}`,
      new_product: `novo produto: "${activity.product}"`,
      user_join: `entrou na plataforma`,
      favorite_add: `favoritou "${activity.product}"`,
      purchase: `comprou "${activity.product}"`,
      view: `visualizou "${activity.product}"`
    };
    return messages[activity.type] || 'atividade registrada';
  };

  const getActivityColor = (type: LiveActivity['type']) => {
    const colors = {
      search: 'text-blue-600 bg-gradient-to-br from-blue-50 to-blue-100',
      price_update: 'text-green-600 bg-gradient-to-br from-green-50 to-green-100',
      new_product: 'text-purple-600 bg-gradient-to-br from-purple-50 to-purple-100',
      user_join: 'text-indigo-600 bg-gradient-to-br from-indigo-50 to-indigo-100',
      favorite_add: 'text-pink-600 bg-gradient-to-br from-pink-50 to-pink-100',
      purchase: 'text-orange-600 bg-gradient-to-br from-orange-50 to-orange-100',
      view: 'text-gray-600 bg-gradient-to-br from-gray-50 to-gray-100'
    };
    return colors[type] || 'text-gray-600 bg-gradient-to-br from-gray-50 to-gray-100';
  };

  const toggleLive = () => {
    setIsLive(!isLive);
  };

  const getConnectionIcon = () => {
    switch (connectionQuality) {
      case 'excellent': return <Wifi className="w-4 h-4 text-green-600" />;
      case 'good': return <Wifi className="w-4 h-4 text-yellow-600" />;
      case 'poor': return <WifiOff className="w-4 h-4 text-red-600" />;
      default: return <Wifi className="w-4 h-4" />;
    }
  };

  const getConnectionColor = () => {
    switch (connectionQuality) {
      case 'excellent': return 'text-green-600 bg-gradient-to-r from-green-50 to-green-100 border-green-200';
      case 'good': return 'text-yellow-600 bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200';
      case 'poor': return 'text-red-600 bg-gradient-to-r from-red-50 to-red-100 border-red-200';
      default: return 'text-gray-600 bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200';
    }
  };

  return (
    <div className="space-y-6 p-3 lg:p-6 bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 min-h-screen">
      {/* ✅ HEADER PREMIUM COM CONTROLES E GLASS MORPHISM */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 rounded-2xl shadow-2xl p-4 lg:p-6 text-white">
        {/* Efeito glass morphism */}
        <div className="absolute inset-0 bg-white bg-opacity-10 backdrop-blur-sm"></div>
        
        {/* Elementos decorativos animados */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-32 translate-x-32 animate-float"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full translate-y-24 -translate-x-24 animate-float" style={{ animationDelay: '1s' }}></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="p-3 bg-white bg-opacity-20 rounded-2xl backdrop-blur-sm">
                <Zap className="w-8 h-8 lg:w-10 lg:h-10" />
              </div>
              {isLive && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-pulse">
                  <div className="w-4 h-4 bg-green-400 rounded-full animate-ping"></div>
                </div>
              )}
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold mb-2">⚡ Tempo Real Premium</h1>
              <p className="text-blue-100 text-sm lg:text-base">Monitoramento inteligente da plataforma</p>
            </div>
          </div>
          
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center space-y-2 lg:space-y-0 lg:space-x-4">
            {/* Status de conexão com glassmorphism */}
            <div className={`flex items-center justify-center lg:justify-start space-x-2 px-3 py-2 rounded-lg border backdrop-blur-sm ${getConnectionColor()}`}>
              {getConnectionIcon()}
              <span className="text-sm font-medium capitalize">{connectionQuality}</span>
            </div>
            
            {/* Controle ao vivo com efeito premium */}
            <button
              onClick={toggleLive}
              className={`relative overflow-hidden flex items-center justify-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                isLive 
                  ? 'bg-green-500 hover:bg-green-600 shadow-lg hover:shadow-green-500/50'
                  : 'bg-red-500 hover:bg-red-600 shadow-lg hover:shadow-red-500/50'
              }`}
            >
              <div className="absolute inset-0 bg-white opacity-0 hover:opacity-10 transition-opacity"></div>
              {isLive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isLive ? 'AO VIVO' : 'PAUSADO'}</span>
            </button>
            
            {/* Hora atual com design premium */}
            <div className="text-center lg:text-right bg-white bg-opacity-10 rounded-lg p-3 backdrop-blur-sm">
              <div className="text-xs lg:text-sm opacity-75">Última atualização</div>
              <div className="font-mono text-base lg:text-lg font-bold">
                {new Date().toLocaleTimeString('pt-BR')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ MÉTRICAS EM TEMPO REAL PREMIUM COM GRADIENTES */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 lg:gap-4">
        {[
          {
            title: "Usuários Ativos",
            value: animatedMetrics.activeUsers.toString(),
            trend: isLive ? Math.floor(Math.random() * 10) - 5 : 0,
            icon: Users,
            subtitle: "Online agora",
            color: "blue",
            gradient: "from-blue-500 to-cyan-500"
          },
          {
            title: "Buscas/Min",
            value: animatedMetrics.searchesPerMinute.toString(),
            trend: isLive ? Math.floor(Math.random() * 8) - 4 : 0,
            icon: Search,
            subtitle: "Por minuto",
            color: "green",
            gradient: "from-green-500 to-emerald-500"
          },
          {
            title: "Novos Produtos",
            value: animatedMetrics.newProducts.toString(),
            trend: isLive ? Math.floor(Math.random() * 6) : 0,
            icon: Package,
            subtitle: "Últimos 5 min",
            color: "purple",
            gradient: "from-purple-500 to-violet-500"
          },
          {
            title: "Preços Atualizados",
            value: animatedMetrics.priceUpdates.toString(),
            trend: isLive ? Math.floor(Math.random() * 12) : 0,
            icon: TrendingUp,
            subtitle: "Últimos 5 min",
            color: "orange",
            gradient: "from-orange-500 to-amber-500"
          },
          {
            title: "Visualizações",
            value: animatedMetrics.pageViews.toString(),
            trend: isLive ? Math.floor(Math.random() * 15) - 7 : 0,
            icon: Eye,
            subtitle: "Páginas vistas",
            color: "cyan",
            gradient: "from-cyan-500 to-teal-500"
          },
          {
            title: "Conversões",
            value: animatedMetrics.conversions.toString(),
            trend: isLive ? Math.floor(Math.random() * 6) - 3 : 0,
            icon: Activity,
            subtitle: "Esta hora",
            color: "pink",
            gradient: "from-pink-500 to-rose-500"
          }
        ].map((metric, index) => (
          <div
            key={metric.title}
            className={`relative overflow-hidden bg-white rounded-2xl shadow-sm border border-gray-100 p-4 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group animate-fade-in`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* Gradiente de fundo no hover */}
            <div className={`absolute inset-0 bg-gradient-to-br ${metric.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
            
            {/* Indicador ao vivo */}
            {isLive && (
              <div className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            )}
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg bg-gradient-to-br ${metric.gradient} bg-opacity-10`}>
                  <metric.icon className={`w-5 h-5 text-${metric.color}-600`} />
                </div>
                {metric.trend !== 0 && (
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    metric.trend > 0 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {metric.trend > 0 ? '+' : ''}{metric.trend}%
                  </span>
                )}
              </div>
              
              <div className="text-2xl font-bold text-gray-900 mb-1 font-mono">
                {metric.value}
              </div>
              
              <div className="text-xs text-gray-500 font-medium">
                {metric.subtitle}
              </div>
              
              <div className="text-xs font-semibold text-gray-800 mt-1">
                {metric.title}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ✅ LAYOUT PRINCIPAL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Feed de atividades premium */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-blue-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">📊 Feed de Atividades</h3>
                  <p className="text-sm text-gray-600">Monitoramento em tempo real</p>
                </div>
                {isLive && (
                  <div className="flex items-center space-x-2 bg-green-100 px-3 py-1 rounded-full">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-green-600 font-medium">AO VIVO</span>
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">{activities.length}</div>
                <div className="text-xs text-gray-500">Atividades</div>
              </div>
            </div>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {activities.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {activities.map((activity, index) => (
                  <div
                    key={activity.id}
                    className="p-4 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 transition-all duration-200 animate-fade-in group"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getActivityColor(activity.type)} group-hover:scale-110 transition-transform`}>
                        <span className="text-lg">{getActivityIcon(activity.type)}</span>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {activity.user}
                          </p>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 px-2 py-1 rounded-full">
                              {activity.category}
                            </span>
                            <span className="text-xs text-gray-500 flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>{activity.timestamp.toLocaleTimeString('pt-BR', { 
                                hour: '2-digit', 
                                minute: '2-digit',
                                second: '2-digit'
                              })}</span>
                            </span>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 mt-1">
                          {getActivityMessage(activity)}
                        </p>
                        
                        <div className="flex items-center space-x-3 mt-2">
                          <span className="text-xs text-gray-500 flex items-center space-x-1">
                            <MapPin className="w-3 h-3" />
                            <span>{activity.location}</span>
                          </span>
                          {activity.type === 'price_update' && activity.value && (
                            <span className="text-xs bg-gradient-to-r from-green-100 to-green-200 text-green-700 px-2 py-1 rounded-full font-medium">
                              R$ {activity.value.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Activity className="w-8 h-8 text-blue-500" />
                </div>
                <p className="text-gray-500">Aguardando atividades...</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar com estatísticas regionais */}
        <div className="space-y-6">
          
          {/* Mapa de atividade regional */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 overflow-hidden">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-purple-500 rounded-lg">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">🗺️ Atividade Regional</h3>
            </div>
            
            <div className="space-y-4">
              {regionData.map((region, index) => (
                <div
                  key={region.name}
                  className="group relative overflow-hidden p-4 rounded-xl bg-gradient-to-br from-gray-50 to-blue-50 hover:from-blue-50 hover:to-purple-50 transition-all duration-300 hover:shadow-md hover:-translate-y-1"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Efeito de brilho */}
                  <div className="absolute top-0 right-0 w-20 h-20 bg-white opacity-0 group-hover:opacity-10 rounded-full -translate-y-10 translate-x-10 transition-opacity duration-500"></div>
                  
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-900">{region.name}</h4>
                      <div className="flex items-center space-x-1">
                        {region.trend === 'up' && <TrendingUp className="w-4 h-4 text-green-500 animate-bounce" />}
                        {region.trend === 'down' && <TrendingUp className="w-4 h-4 text-red-500 transform rotate-180 animate-bounce" />}
                        {region.trend === 'stable' && <div className="w-4 h-4 flex items-center justify-center text-gray-500">→</div>}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="text-center bg-white bg-opacity-50 rounded-lg p-2">
                        <div className="text-lg font-bold text-blue-600">{region.users}</div>
                        <div className="text-xs text-gray-500">Usuários</div>
                      </div>
                      <div className="text-center bg-white bg-opacity-50 rounded-lg p-2">
                        <div className="text-lg font-bold text-green-600">{region.searches}</div>
                        <div className="text-xs text-gray-500">Buscas</div>
                      </div>
                    </div>
                    
                    {/* Barra de atividade com shimmer */}
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden relative">
                      <div
                        className={`h-full transition-all duration-1000 relative overflow-hidden ${
                          region.activity >= 70 ? 'bg-gradient-to-r from-green-400 to-green-600' :
                          region.activity >= 40 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                          'bg-gradient-to-r from-red-400 to-red-600'
                        }`}
                        style={{ width: `${region.activity}%` }}
                      >
                        {/* Efeito shimmer */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 transform -skew-x-12 animate-shimmer"></div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1 text-center font-medium">
                      {region.activity.toFixed(0)}% atividade
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Status do sistema */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 overflow-hidden">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-yellow-500 rounded-lg">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">⚡ Status do Sistema</h3>
            </div>
            
            <div className="space-y-4">
              {[
                { service: 'API Principal', status: 'online', latency: '12ms', uptime: '99.9%', color: 'green' },
                { service: 'Base de Dados', status: 'online', latency: '8ms', uptime: '100%', color: 'green' },
                { service: 'Processamento IA', status: 'online', latency: '45ms', uptime: '99.8%', color: 'green' },
                { service: 'Geolocalização', status: 'online', latency: '23ms', uptime: '99.9%', color: 'green' },
                { service: 'Cache Redis', status: 'online', latency: '3ms', uptime: '100%', color: 'blue' }
              ].map((service, index) => (
                <div
                  key={service.service}
                  className="group flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg hover:from-blue-50 hover:to-green-50 transition-all duration-300"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`relative w-3 h-3 rounded-full ${
                      service.status === 'online' ? 'bg-green-500' : 'bg-red-500'
                    }`}>
                      {service.status === 'online' && (
                        <>
                          <div className="absolute inset-0 bg-green-500 rounded-full animate-pulse"></div>
                          <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-75"></div>
                        </>
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
                      {service.service}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className={`text-xs font-medium ${
                      service.color === 'green' ? 'text-green-600' : 'text-blue-600'
                    }`}>
                      {service.latency}
                    </div>
                    <div className="text-xs text-gray-500">{service.uptime}</div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="relative w-2 h-2 bg-green-500 rounded-full">
                  <div className="absolute inset-0 bg-green-500 rounded-full animate-pulse"></div>
                </div>
                <span className="text-sm font-medium text-green-800">
                  Todos os sistemas operacionais
                </span>
              </div>
              <div className="text-xs text-green-600 mt-1">
                Última verificação: {new Date().toLocaleTimeString('pt-BR')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ GRÁFICO DE ATIVIDADE EM TEMPO REAL */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-500 rounded-lg">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">📈 Atividade em Tempo Real</h3>
              <p className="text-sm text-gray-600">Monitoramento contínuo de performance</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <div className="text-sm text-gray-500">Pico de hoje</div>
              <div className="text-lg font-bold text-indigo-600">
                {Math.max(...Object.values(animatedMetrics))}
              </div>
            </div>
            
            <button
              onClick={() => refreshData()}
              disabled={!isLive}
              className="relative overflow-hidden flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 rounded-lg hover:from-indigo-200 hover:to-purple-200 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
              <RefreshCw className={`w-4 h-4 ${isLive ? 'animate-spin' : ''}`} />
              <span className="text-sm font-medium">Atualizar</span>
            </button>
          </div>
        </div>
        
        {/* Gráfico simulado com barras animadas */}
        <div className="h-64 bg-gradient-to-br from-gray-50 via-indigo-50 to-purple-50 rounded-xl flex items-center justify-center border border-gray-200 relative overflow-hidden">
          {/* Elementos decorativos de fundo */}
          <div className="absolute inset-0">
            <div className="absolute top-4 left-4 w-32 h-32 bg-indigo-100 rounded-full opacity-20 animate-float"></div>
            <div className="absolute bottom-4 right-4 w-24 h-24 bg-purple-100 rounded-full opacity-20 animate-float" style={{ animationDelay: '1s' }}></div>
          </div>
          
          <div className="relative z-10 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Activity className="w-10 h-10 text-white" />
            </div>
            <h4 className="text-lg font-semibold text-gray-700 mb-2">Gráfico de Atividade Premium</h4>
            <p className="text-sm text-gray-500 mb-4">Visualização em tempo real dos dados</p>
            
            {/* Simulação de barras animadas com gradientes */}
            <div className="flex items-end justify-center space-x-1">
              {Array.from({ length: 12 }, (_, i) => {
                const height = Math.random() * 40 + 20;
                const colors = [
                  'from-blue-400 to-blue-600',
                  'from-green-400 to-green-600',
                  'from-purple-400 to-purple-600',
                  'from-pink-400 to-pink-600',
                  'from-indigo-400 to-indigo-600',
                  'from-cyan-400 to-cyan-600'
                ];
                const colorClass = colors[i % colors.length];
                
                return (
                  <div
                    key={i}
                    className={`bg-gradient-to-t ${colorClass} rounded-t-sm shadow-sm hover:shadow-md transition-all duration-300 hover:scale-110`}
                    style={{
                      width: '12px',
                      height: `${height}px`,
                      animation: `bounce 2s infinite ${i * 0.1}s`
                    }}
                  ></div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ✅ FOOTER COM CONTROLES PREMIUM */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="text-center group">
              <div className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                {animatedMetrics.activeUsers + animatedMetrics.searchesPerMinute + animatedMetrics.pageViews}
              </div>
              <div className="text-xs text-gray-500">Total de Eventos</div>
            </div>
            <div className="text-center group">
              <div className="text-lg font-bold text-blue-600 group-hover:text-purple-600 transition-colors">
                {regionData.length}
              </div>
              <div className="text-xs text-gray-500">Regiões Monitoradas</div>
            </div>
            <div className="text-center group">
              <div className="text-lg font-bold text-green-600 group-hover:text-emerald-600 transition-colors">
                {connectionQuality === 'excellent' ? '100%' : connectionQuality === 'good' ? '95%' : '78%'}
              </div>
              <div className="text-xs text-gray-500">Qualidade da Conexão</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg backdrop-blur-sm ${
              isLive ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800' : 'bg-gradient-to-r from-red-100 to-rose-100 text-red-800'
            }`}>
              <div className={`relative w-2 h-2 rounded-full ${isLive ? 'bg-green-500' : 'bg-red-500'}`}>
                {isLive && (
                  <>
                    <div className="absolute inset-0 bg-green-500 rounded-full animate-pulse"></div>
                    <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-75"></div>
                  </>
                )}
              </div>
              <span className="text-sm font-medium">
                {isLive ? 'Transmissão Ativa' : 'Transmissão Pausada'}
              </span>
            </div>
            
            <div className="text-right bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-3">
              <div className="text-xs text-gray-500">Última atualização</div>
              <div className="text-sm font-mono text-gray-700 font-bold">
                {new Date().toLocaleString('pt-BR')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ ESTILOS CSS INTEGRADOS */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        
        @keyframes ping {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        /* Scrollbar personalizada */
        .max-h-96::-webkit-scrollbar {
          width: 6px;
        }

        .max-h-96::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 3px;
        }

        .max-h-96::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #3b82f6, #8b5cf6);
          border-radius: 3px;
        }

        .max-h-96::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #2563eb, #7c3aed);
        }
      `}</style>
    </div>
  );
};

export default RealtimeView;