import React from 'react';
import { ArrowLeft, Wifi, WifiOff, MapPin } from 'lucide-react';

interface DashboardHeaderProps {
  onBack?: () => void;
  location?: { city: string; region: string } | null;
  apiConnected: boolean;
  geolocationAccuracy: number;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  onBack,
  location,
  apiConnected,
  geolocationAccuracy
}) => {

  return (
    <div className="bg-white rounded-xl shadow-lg mb-6 relative">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Voltar ao início"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                🧠 Analytics IA PRECIVOX
                ⚡
              </h1>
              <p className="text-gray-600 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-green-600" />
                {location?.city || 'Franco da Rocha'}, {location?.region || 'SP'} 
                • Precisão GPS: {geolocationAccuracy}%
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Última atualização: {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>

          {/* Indicador API no canto superior direito */}
          <div className="absolute top-4 right-4">
            <div className="relative group">
              {apiConnected ? (
                <Wifi className="w-6 h-6 text-green-500 animate-pulse" />
              ) : (
                <WifiOff className="w-6 h-6 text-red-500" />
              )}
              
              {/* Tooltip */}
              <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block">
                <div className="bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                  {apiConnected ? 'API Online' : 'API Offline'}
                  <div className="absolute top-full right-2 w-0 h-0 border-l-2 border-r-2 border-t-4 border-transparent border-t-gray-900"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};