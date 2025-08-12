import React, { useState, useEffect } from 'react';
import { MapPin, RefreshCw, Navigation, AlertCircle } from 'lucide-react';
import LocationService, { UserLocation } from '../../services/LocationService';

interface LocationDisplayProps {
  onLocationChange?: (location: UserLocation) => void;
  showDistanceFilter?: boolean;
  currentDistance?: number;
  onDistanceChange?: (distance: number) => void;
}

const LocationDisplay: React.FC<LocationDisplayProps> = ({
  onLocationChange,
  showDistanceFilter = false,
  currentDistance = 25,
  onDistanceChange
}) => {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const locationService = LocationService.getInstance();

  const distanceOptions = [
    { value: 5, label: '5 km', icon: '🚶' },
    { value: 10, label: '10 km', icon: '🚴' },
    { value: 25, label: '25 km', icon: '🚗' },
    { value: 50, label: '50 km', icon: '🛣️' },
    { value: 100, label: '100+ km', icon: '✈️' }
  ];

  useEffect(() => {
    detectLocation();
  }, []);

  const detectLocation = async () => {
    try {
      setLoading(true);
      setError(null);
      const userLocation = await locationService.detectUserLocation();
      setLocation(userLocation);
      onLocationChange?.(userLocation);
    } catch (err) {
      setError('Não foi possível detectar sua localização');
      console.error('Erro ao detectar localização:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshLocation = async () => {
    try {
      setRefreshing(true);
      setError(null);
      const userLocation = await locationService.refreshLocation();
      setLocation(userLocation);
      onLocationChange?.(userLocation);
    } catch (err) {
      setError('Erro ao atualizar localização');
      console.error('Erro ao atualizar localização:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const requestPermission = async () => {
    if (navigator.geolocation) {
      try {
        await navigator.permissions.query({ name: 'geolocation' });
        refreshLocation();
      } catch (err) {
        console.error('Erro de permissão:', err);
      }
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <span className="text-sm text-gray-600">Detectando sua localização...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-4 border border-red-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <div>
              <p className="text-sm font-medium text-red-800">Localização indisponível</p>
              <p className="text-xs text-red-600">{error}</p>
            </div>
          </div>
          <button
            onClick={requestPermission}
            className="px-3 py-1 bg-red-100 text-red-800 rounded-lg text-xs hover:bg-red-200 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (!location) return null;

  return (
    <div className="space-y-4">
      {/* Localização Atual */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <MapPin className="h-5 w-5 text-green-600" />
            <h3 className="text-sm font-semibold text-gray-800">Sua Localização</h3>
          </div>
          <button
            onClick={refreshLocation}
            disabled={refreshing}
            className="p-1 text-green-600 hover:text-green-700 transition-colors"
            title="Atualizar localização"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Navigation className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium text-gray-700">
              📍 {location.cidade}, {location.estado}
            </span>
          </div>
          
          {location.accuracy && (
            <p className="text-xs text-gray-500">
              Precisão: ~{Math.round(location.accuracy)}m
            </p>
          )}
          
          <p className="text-xs text-gray-500">
            Atualizado: {new Date(location.timestamp).toLocaleTimeString('pt-BR')}
          </p>
        </div>
      </div>

      {/* Filtro de Distância */}
      {showDistanceFilter && (
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="mb-3">
            <h4 className="text-sm font-medium text-gray-700 mb-1">
              Buscar em um raio de:
            </h4>
            <p className="text-xs text-gray-500">
              Encontre produtos próximos à sua localização
            </p>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {distanceOptions.map(option => (
              <button
                key={option.value}
                onClick={() => onDistanceChange?.(option.value)}
                className={`p-2 rounded-lg text-center transition-all duration-200 ${
                  currentDistance === option.value
                    ? 'bg-blue-500 text-white shadow-md transform scale-105'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100 hover:scale-102'
                }`}
              >
                <div className="text-lg mb-1">{option.icon}</div>
                <div className="text-xs font-medium">{option.label}</div>
              </button>
            ))}
          </div>

          <div className="mt-3 p-2 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-700 text-center">
              🔍 Buscando produtos em um raio de <strong>{currentDistance}km</strong>
            </p>
          </div>
        </div>
      )}

      {/* Dicas de Localização */}
      <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg p-3 border border-amber-100">
        <div className="flex items-start space-x-2">
          <div className="text-lg">💡</div>
          <div>
            <p className="text-xs font-medium text-amber-800 mb-1">Dica:</p>
            <p className="text-xs text-amber-700">
              Permitir localização precisa garante resultados mais relevantes e lojas próximas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationDisplay;