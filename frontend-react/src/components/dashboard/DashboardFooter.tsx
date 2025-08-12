// components/dashboard/DashboardFooter.tsx
import React from 'react';
import { RefreshCw, Activity, Wifi, WifiOff, MapPin, Brain, Clock, Zap } from 'lucide-react';

interface DashboardFooterProps {
  apiConnected: boolean;
  location?: { city: string; region: string };
  avgResponseTime: number;
  lastUpdate?: Date;
  realTimeEnabled?: boolean;
  nextSyncIn?: number; // seconds
  totalProducts?: number;
  totalStores?: number;
  aiInsights?: number;
  className?: string;
}

export const DashboardFooter: React.FC<DashboardFooterProps> = ({
  apiConnected,
  location,
  avgResponseTime,
  lastUpdate = new Date(),
  realTimeEnabled = false,
  nextSyncIn = 300, // 5 minutes
  totalProducts = 0,
  totalStores = 0,
  aiInsights = 0,
  className = ''
}) => {
  const formatNextSync = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    return `${Math.floor(seconds / 60)}min`;
  };

  const getConnectionStatus = () => {
    if (apiConnected) {
      return {
        icon: <Wifi className="w-4 h-4 text-green-500" />,
        text: 'Sistema Online',
        color: 'text-green-600',
        bg: 'bg-green-50'
      };
    }
    return {
      icon: <WifiOff className="w-4 h-4 text-red-500" />,
      text: 'Sistema Offline',
      color: 'text-red-600',
      bg: 'bg-red-50'
    };
  };

  const connectionStatus = getConnectionStatus();

  return (
    <div className={`mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6 ${className}`}>
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        
        {/* Logo e Título */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">
              🧠 PRECIVOX Analytics IA
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-sm bg-gradient-to-r from-purple-600 to-blue-600 text-transparent bg-clip-text font-medium">
                Powered by Groq
              </span>
              {apiConnected && <Zap className="w-4 h-4 text-yellow-500 animate-pulse" />}
            </div>
          </div>
          <p className="text-gray-600 text-sm">
            Sistema inteligente de monitoramento • Dados atualizados em tempo real • 
            IA generativa para insights estratégicos
          </p>
        </div>

        {/* Estatísticas Centrais */}
        <div className="flex items-center gap-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-gray-500 mb-1">Produtos</p>
              <p className="font-bold text-blue-600">{totalProducts.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Lojas</p>
              <p className="font-bold text-green-600">{totalStores}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Insights IA</p>
              <p className="font-bold text-purple-600">{aiInsights}</p>
            </div>
          </div>
        </div>

        {/* Status e Informações Técnicas */}
        <div className="flex items-center gap-4">
          
          {/* Localização */}
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-green-600" />
            <div className="text-right">
              <p className="text-xs text-gray-500">Localização</p>
              <p className="text-sm font-medium text-gray-700">
                {location?.city || 'Franco da Rocha'}, {location?.region || 'SP'}
              </p>
            </div>
          </div>

          {/* Última Atualização */}
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <div className="text-right">
              <p className="text-xs text-gray-500">Última sync</p>
              <p className="text-sm font-medium text-gray-700">
                {lastUpdate.toLocaleTimeString('pt-BR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
            </div>
          </div>

          {/* Performance */}
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-orange-600" />
            <div className="text-right">
              <p className="text-xs text-gray-500">Resposta</p>
              <p className="text-sm font-medium text-gray-700">
                {avgResponseTime}ms
              </p>
            </div>
          </div>

          {/* Status da Conexão */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${connectionStatus.bg}`}>
            {connectionStatus.icon}
            <div className="text-right">
              <p className="text-xs text-gray-500">Status</p>
              <p className={`text-sm font-medium ${connectionStatus.color}`}>
                {connectionStatus.text}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de Status Técnico */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          
          {/* Esquerda - Próxima Sincronização */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">
                Próxima sync em {formatNextSync(nextSyncIn)}
              </span>
            </div>
            
            {realTimeEnabled && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-600 font-medium">Tempo Real Ativo</span>
              </div>
            )}
          </div>

          {/* Centro - Indicadores de Serviço */}
          <div className="flex items-center gap-4">
            
            {/* API Status */}
            <div className="flex items-center gap-1">
              {apiConnected ? (
                <Wifi className="w-4 h-4 text-green-500" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-500" />
              )}
              <span className="text-xs text-gray-600">API</span>
            </div>

            {/* GPS Status */}
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4 text-green-500" />
              <span className="text-xs text-gray-600">GPS</span>
            </div>

            {/* IA Status */}
            <div className="flex items-center gap-1">
              <Brain className="w-4 h-4 text-purple-500" />
              <span className="text-xs text-gray-600">IA Groq</span>
            </div>

            {/* Sistema Status */}
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-600 font-medium">Operacional</span>
            </div>
          </div>

          {/* Direita - Informações da Versão */}
          <div className="text-right text-xs text-gray-500">
            <p>PRECIVOX Dashboard v2.0</p>
            <p>Build {lastUpdate.getTime().toString().slice(-6)}</p>
          </div>
        </div>
      </div>

      {/* Barra de Progresso de Sincronização (quando aplicável) */}
      {realTimeEnabled && (
        <div className="mt-3">
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div 
              className="bg-gradient-to-r from-blue-500 to-green-500 h-1 rounded-full transition-all duration-1000"
              style={{ 
                width: `${100 - (nextSyncIn / 300) * 100}%`,
                animation: nextSyncIn < 10 ? 'pulse 1s infinite' : 'none'
              }}
            />
          </div>
        </div>
      )}

      {/* Mensagem de Status Adicional */}
      {!apiConnected && (
        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2 text-yellow-800">
            <Wifi className="w-4 h-4" />
            <span className="text-sm">
              Modo offline ativo - Usando dados locais cached. 
              Algumas funcionalidades podem estar limitadas.
            </span>
          </div>
        </div>
      )}

      {/* Footer de Copyright */}
      <div className="mt-4 pt-3 border-t border-gray-100 text-center">
        <p className="text-xs text-gray-400">
          © 2024 PRECIVOX. Todos os direitos reservados. 
          <span className="mx-2">•</span>
          Monitoramento inteligente para Franco da Rocha, SP
          <span className="mx-2">•</span>
          <a href="#" className="text-blue-500 hover:text-blue-700">Suporte</a>
        </p>
      </div>
    </div>
  );
};