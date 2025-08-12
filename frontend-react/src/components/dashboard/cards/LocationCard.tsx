// components/dashboard/cards/LocationCard.tsx
import React from 'react';
import { MapPin, Navigation, Wifi, Signal } from 'lucide-react';

interface LocationCardProps {
  location?: {
    city: string;
    region: string;
    lat: number;
    lng: number;
  };
  accuracy: number;
  radius: number;
  totalStores: number;
  className?: string;
}

export const LocationCard: React.FC<LocationCardProps> = ({
  location,
  accuracy,
  radius,
  totalStores,
  className = ''
}) => {
  const getAccuracyColor = (acc: number) => {
    if (acc >= 90) return 'text-green-600 bg-green-100';
    if (acc >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getSignalBars = (acc: number) => {
    const bars = Math.ceil(acc / 25);
    return Array.from({ length: 4 }, (_, i) => (
      <div
        key={i}
        className={`w-1 rounded-sm ${
          i < bars ? 'bg-green-500' : 'bg-gray-300'
        }`}
        style={{ height: `${(i + 1) * 4 + 8}px` }}
      />
    ));
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-green-600" />
          📍 Localização
        </h3>
        <div className="flex items-center gap-1">
          {getSignalBars(accuracy)}
        </div>
      </div>

      <div className="space-y-4">
        {/* Localização Atual */}
        <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg p-4 border border-green-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-green-500 rounded-lg">
              <Navigation className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">
                {location?.city || 'Franco da Rocha'}, {location?.region || 'SP'}
              </h4>
              <p className="text-sm text-gray-600">
                Cobertura em {radius}km de raio
              </p>
            </div>
          </div>

          {/* Coordenadas */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/60 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">Latitude</p>
              <p className="font-mono text-sm font-medium">
                {location?.lat?.toFixed(4) || '-23.3217'}
              </p>
            </div>
            <div className="bg-white/60 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">Longitude</p>
              <p className="font-mono text-sm font-medium">
                {location?.lng?.toFixed(4) || '-46.7317'}
              </p>
            </div>
          </div>
        </div>

        {/* Métricas da Região */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Wifi className="w-4 h-4 text-blue-600" />
              <p className="text-xs text-gray-500">Precisão GPS</p>
            </div>
            <p className={`text-lg font-bold rounded-full px-2 py-1 ${getAccuracyColor(accuracy)}`}>
              {accuracy}%
            </p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <MapPin className="w-4 h-4 text-purple-600" />
              <p className="text-xs text-gray-500">Lojas Próximas</p>
            </div>
            <p className="text-lg font-bold text-purple-600">
              {totalStores}
            </p>
          </div>
        </div>

        {/* Status da Conexão */}
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-blue-900">GPS Ativo</span>
          </div>
          <div className="flex items-center gap-1">
            <Signal className="w-4 h-4 text-blue-600" />
            <span className="text-xs text-blue-700">
              {accuracy >= 90 ? 'Excelente' : accuracy >= 70 ? 'Bom' : 'Médio'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};