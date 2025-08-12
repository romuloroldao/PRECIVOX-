import { useState, useEffect, useCallback, useRef } from 'react';
import { geolocationService, useGeolocation } from '../services/geolocationService';

// Interfaces
interface LocationData {
  city: string;
  region: string;
  country: string;
  lat: number;
  lng: number;
  timezone?: string;
  estado?: string;
  cidade?: string;
}

interface GeolocationPosition {
  coords: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  timestamp: number;
}

interface LocationError {
  code: number;
  message: string;
}

interface LocationState {
  location: LocationData | null;
  loading: boolean;
  error: string | null;
  permission: 'granted' | 'denied' | 'prompt' | 'unknown';
  accuracy: number | null;
  lastUpdated: string | null;
}

// ✅ SINGLETON PARA EVITAR MÚLTIPLAS INSTÂNCIAS
let globalLocationState: LocationState | null = null;
const globalLocationListeners: Set<(state: LocationState) => void> = new Set();
let isInitializing = false;
let lastCacheCheck = 0;
const CACHE_CHECK_DEBOUNCE = 5000; // Só verifica cache a cada 5 segundos

export const useLocation = () => {
  // Estados locais
  const [state, setState] = useState<LocationState>(() => {
    // ✅ USAR ESTADO GLOBAL SE DISPONÍVEL
    return globalLocationState || {
      location: null,
      loading: false,
      error: null,
      permission: 'unknown',
      accuracy: null,
      lastUpdated: null
    };
  });

  // Refs para controle
  const watchIdRef = useRef<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  // ✅ CONFIGURAÇÕES OTIMIZADAS - TIMEOUT REDUZIDO
  const GEOLOCATION_TIMEOUT = 3000; // 3 segundos apenas
  const CACHE_DURATION = 5 * 60 * 1000; // ✅ 5 MINUTOS (conforme pedido)
  const HIGH_ACCURACY = false; // Reduzido para ser mais rápido

  // ✅ LOCALIZAÇÃO PADRÃO - FRANCO DA ROCHA
  const defaultLocation: LocationData = {
    city: 'Franco da Rocha',
    region: 'São Paulo',
    country: 'Brasil',
    lat: -23.3283,
    lng: -46.7267,
    timezone: 'America/Sao_Paulo',
    estado: 'São Paulo',
    cidade: 'Franco da Rocha'
  };

  // ✅ FUNÇÃO SUPER OTIMIZADA PARA VERIFICAR CACHE
  const isCacheValid = useCallback(() => {
    const now = Date.now();
    
    // ✅ DEBOUNCE DE VERIFICAÇÃO DE CACHE - Só verifica a cada 5 segundos
    if (now - lastCacheCheck < CACHE_CHECK_DEBOUNCE) {
      return globalLocationState?.location !== null;
    }
    
    lastCacheCheck = now;
    
    try {
      const cached = localStorage.getItem('precivox_location');
      if (!cached) return false;

      const { timestamp } = JSON.parse(cached);
      const timeDiff = now - timestamp;
      const isValid = timeDiff < CACHE_DURATION;
      
      // ✅ SÓ LOGGAR SE REALMENTE MUDOU O STATUS
      if (isValid && !globalLocationState?.location) {
        console.log(`⏰ Cache válido: ${Math.round(timeDiff / 60000)} min atrás`);
      }
      
      return isValid;
    } catch (error) {
      return false;
    }
  }, [CACHE_DURATION]);

  // ✅ FUNÇÃO PARA ATUALIZAR TODOS OS LISTENERS (SINGLETON PATTERN)
  const updateGlobalState = useCallback((newState: LocationState) => {
    globalLocationState = newState;
    globalLocationListeners.forEach(listener => listener(newState));
  }, []);

  // Função para geocodificação reversa
  const reverseGeocode = useCallback(async (lat: number, lng: number): Promise<LocationData> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=pt-BR`
      );

      if (response.ok) {
        const data = await response.json();
        
        return {
          city: data.address?.city || data.address?.town || data.address?.village || 'Cidade não identificada',
          region: data.address?.state || 'Estado não identificado',
          country: data.address?.country || 'Brasil',
          lat,
          lng,
          timezone: 'America/Sao_Paulo',
          estado: data.address?.state || 'Estado não identificado',
          cidade: data.address?.city || data.address?.town || data.address?.village || 'Cidade não identificada'
        };
      }
    } catch (error) {
      console.warn('⚠️ Geocodificação falhou:', error);
    }

    return { ...defaultLocation, lat, lng };
  }, [defaultLocation]);

  // ✅ INTEGRAÇÃO COM GEOLOCATION SERVICE - FUNÇÃO PRINCIPAL
  const getCurrentLocationFromService = useCallback(async (): Promise<LocationData> => {
    try {
      const locationData = await geolocationService.getCurrentLocation();
      
      // Converter formato do service para o formato esperado pelo hook
      return {
        city: locationData.city || 'Franco da Rocha',
        region: locationData.state || 'São Paulo',
        country: locationData.country || 'Brasil',
        lat: locationData.latitude,
        lng: locationData.longitude,
        timezone: 'America/Sao_Paulo',
        estado: locationData.state || 'São Paulo',
        cidade: locationData.city || 'Franco da Rocha'
      };
    } catch (error) {
      console.warn('⚠️ Falha no geolocation service, usando fallback:', error);
      return await getLocationByIPFallback();
    }
  }, []);

  // ✅ FUNÇÃO FALLBACK PARA LOCALIZAÇÃO VIA IP
  const getLocationByIPFallback = useCallback(async (): Promise<LocationData> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // Apenas 2 segundos

      const response = await fetch('https://ipapi.co/json/', {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.latitude && data.longitude) {
          console.log('✅ IP Location obtida:', data.city);
          return {
            city: data.city || 'Franco da Rocha',
            region: data.region || 'São Paulo',
            country: data.country_name || 'Brasil',
            lat: parseFloat(data.latitude),
            lng: parseFloat(data.longitude),
            timezone: data.timezone || 'America/Sao_Paulo',
            estado: data.region || 'São Paulo',
            cidade: data.city || 'Franco da Rocha'
          };
        }
      }
    } catch (error) {
      console.warn('⚠️ IP location falhou, usando fallback:', error.message);
    }

    console.log('🏠 Usando localização padrão: Franco da Rocha');
    return defaultLocation;
  }, [defaultLocation]);

  // Função para obter localização via GPS
  const getLocationByGPS = useCallback((): Promise<LocationData> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocalização não suportada'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position: GeolocationPosition) => {
          try {
            const { latitude, longitude, accuracy } = position.coords;
            const locationData = await reverseGeocode(latitude, longitude);
            
            if (mountedRef.current) {
              const newState = { 
                ...globalLocationState!, 
                accuracy: Math.round(accuracy),
                permission: 'granted' as const
              };
              updateGlobalState(newState);
            }

            resolve(locationData);
          } catch (error) {
            resolve({
              ...defaultLocation,
              lat: position.coords.latitude,
              lng: position.coords.longitude
            });
          }
        },
        (error: GeolocationPositionError) => {
          if (mountedRef.current) {
            const newState = { 
              ...globalLocationState!,
              permission: error.code === 1 ? 'denied' as const : 'unknown' as const
            };
            updateGlobalState(newState);
          }
          reject(new Error(`GPS: ${error.message}`));
        },
        {
          enableHighAccuracy: HIGH_ACCURACY,
          timeout: GEOLOCATION_TIMEOUT,
          maximumAge: CACHE_DURATION
        }
      );
    });
  }, [reverseGeocode, defaultLocation, CACHE_DURATION, updateGlobalState]);

  // ✅ FUNÇÃO PRINCIPAL COM TIMEOUT DE EMERGÊNCIA
  const refreshLocation = useCallback(async (forceRefresh: boolean = false) => {
    // ✅ EVITAR MÚLTIPLAS INICIALIZAÇÕES SIMULTÂNEAS
    if (isInitializing && !forceRefresh) {
      return globalLocationState?.location || defaultLocation;
    }

    // ✅ SE CACHE VÁLIDO E NÃO É FORCE, RETORNA CACHE
    if (!forceRefresh && isCacheValid() && globalLocationState?.location) {
      return globalLocationState.location;
    }

    // ✅ MARCAR COMO INICIALIZANDO PARA EVITAR DUPLICAÇÕES
    isInitializing = true;

    const newState = { 
      ...globalLocationState!,
      loading: true, 
      error: null 
    };
    updateGlobalState(newState);

    // ✅ TIMEOUT DE EMERGÊNCIA - EVITA TRAVAMENTO
    const emergencyTimeout = setTimeout(() => {
      console.log('⏰ Timeout de emergência - usando localização padrão');
      if (mountedRef.current) {
        const emergencyState = {
          ...globalLocationState!,
          location: defaultLocation,
          loading: false,
          error: 'Timeout na geolocalização'
        };
        updateGlobalState(emergencyState);
      }
      isInitializing = false;
    }, 5000); // 5 segundos máximo

    try {
      let locationData: LocationData;

      if (forceRefresh) {
        try {
          locationData = await Promise.race([
            getLocationByGPS(),
            new Promise<LocationData>((_, reject) => 
              setTimeout(() => reject(new Error('GPS timeout')), 3000)
            )
          ]);
        } catch (gpsError) {
          locationData = await getCurrentLocationFromService();
        }
      } else {
        try {
          locationData = await getCurrentLocationFromService();
          
          // GPS em background apenas se IP retornou padrão
          if (locationData === defaultLocation) {
            setTimeout(() => {
              getLocationByGPS()
                .then(gpsLocation => {
                  if (mountedRef.current) {
                    const backgroundState = {
                      ...globalLocationState!,
                      location: gpsLocation,
                      lastUpdated: new Date().toISOString()
                    };
                    updateGlobalState(backgroundState);
                    
                    try {
                      localStorage.setItem('precivox_location', JSON.stringify({
                        data: gpsLocation,
                        timestamp: Date.now()
                      }));
                    } catch (error) {
                      // Falha silenciosa no cache
                    }
                  }
                })
                .catch(() => {
                  // GPS falhou, mas já temos fallback
                });
            }, 1000);
          }
        } catch (ipError) {
          console.log('❌ IP falhou, tentando GPS...');
          try {
            locationData = await Promise.race([
              getLocationByGPS(),
              new Promise<LocationData>((_, reject) => 
                setTimeout(() => reject(new Error('GPS timeout')), 2000)
              )
            ]);
          } catch (gpsError) {
            console.log('❌ GPS também falhou, usando padrão');
            locationData = defaultLocation;
          }
        }
      }

      clearTimeout(emergencyTimeout);

      if (mountedRef.current) {
        const finalState = {
          ...globalLocationState!,
          location: locationData,
          loading: false,
          error: null,
          lastUpdated: new Date().toISOString()
        };
        updateGlobalState(finalState);
      }

      // ✅ SALVAR NO CACHE
      try {
        localStorage.setItem('precivox_location', JSON.stringify({
          data: locationData,
          timestamp: Date.now()
        }));
      } catch (error) {
        // Falha silenciosa no cache
      }

      return locationData;

    } catch (error: any) {
      clearTimeout(emergencyTimeout);
      
      if (mountedRef.current) {
        const errorState = {
          ...globalLocationState!,
          location: defaultLocation,
          loading: false,
          error: error.message
        };
        updateGlobalState(errorState);
      }

      return defaultLocation;
    } finally {
      isInitializing = false;
    }
  }, [getLocationByGPS, getLocationByIPFallback, defaultLocation, isCacheValid, updateGlobalState]);

  // ✅ FUNÇÃO SUPER OTIMIZADA PARA CARREGAR DO CACHE
  const loadCachedLocation = useCallback(() => {
    // ✅ SE JÁ TEM ESTADO GLOBAL, USA ELE
    if (globalLocationState?.location) {
      return true;
    }

    try {
      const cached = localStorage.getItem('precivox_location');
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        
        if (Date.now() - timestamp < CACHE_DURATION) {
          const cachedState = {
            location: data,
            loading: false,
            error: null,
            permission: 'unknown' as const,
            accuracy: null,
            lastUpdated: new Date(timestamp).toISOString()
          };
          
          updateGlobalState(cachedState);
          
          const minutesAgo = Math.round((Date.now() - timestamp) / 60000);
          console.log(`🎯 Cache carregado (${minutesAgo} min):`, data.cidade);
          return true;
        }
      }
    } catch (error) {
      // Falha silenciosa
    }
    return false;
  }, [CACHE_DURATION, updateGlobalState]);

  // Função para obter distância entre dois pontos
  const calculateDistance = useCallback((
    lat1: number, 
    lng1: number, 
    lat2: number, 
    lng2: number
  ): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }, []);

  // ✅ INICIALIZAÇÃO SUPER OTIMIZADA
  useEffect(() => {
    // ✅ REGISTRAR LISTENER NO ESTADO GLOBAL
    const updateState = (newState: LocationState) => {
      if (mountedRef.current) {
        setState(newState);
      }
    };
    
    globalLocationListeners.add(updateState);

    // ✅ INICIALIZAR APENAS SE NECESSÁRIO
    if (!globalLocationState) {
      globalLocationState = {
        location: null,
        loading: false,
        error: null,
        permission: 'unknown',
        accuracy: null,
        lastUpdated: null
      };
    }

    // ✅ CARREGAR CACHE OU USAR FALLBACK IMEDIATO
    const initialize = async () => {
      const hasCachedLocation = loadCachedLocation();
      
      if (!hasCachedLocation && !isInitializing) {
        // ✅ USAR FALLBACK IMEDIATO PARA EVITAR TRAVAMENTO
        console.log('🏠 Usando localização padrão imediatamente');
        const immediateState = {
          location: defaultLocation,
          loading: false,
          error: null,
          permission: 'unknown' as const,
          accuracy: null,
          lastUpdated: new Date().toISOString()
        };
        updateGlobalState(immediateState);
        
        // ✅ TENTAR OBTER LOCALIZAÇÃO REAL EM BACKGROUND
        setTimeout(() => {
          refreshLocation().catch(() => {
            console.log('📍 Mantendo localização padrão');
          });
        }, 100);
      }
    };

    initialize();

    // ✅ CLEANUP OTIMIZADO
    return () => {
      mountedRef.current = false;
      globalLocationListeners.delete(updateState);
      
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [loadCachedLocation, refreshLocation]);

  // Função para resetar para localização padrão
  const resetToDefault = useCallback(() => {
    const resetState = {
      ...globalLocationState!,
      location: defaultLocation,
      error: null,
      loading: false,
      lastUpdated: new Date().toISOString()
    };
    updateGlobalState(resetState);
  }, [defaultLocation, updateGlobalState]);

  // ✅ FUNÇÃO PARA FORÇAR ATUALIZAÇÃO
  const forceRefresh = useCallback(() => {
    console.log('🔄 Forçando atualização de localização');
    return refreshLocation(true);
  }, [refreshLocation]);

  return {
    // Estados
    ...state,
    
    // Funções
    refreshLocation,
    forceRefresh,
    resetToDefault,
    calculateDistance,
    
    // ✅ INFORMAÇÕES SOBRE CACHE
    isCacheValid,
    cacheAge: state.lastUpdated ? 
      Math.round((Date.now() - new Date(state.lastUpdated).getTime()) / 60000) : 
      null,
    
    // Informações úteis
    isDefault: state.location?.city === defaultLocation.city && 
               state.location?.region === defaultLocation.region,
    coordinates: state.location ? { 
      lat: state.location.lat, 
      lng: state.location.lng 
    } : null,
    
    // Formatação amigável
    displayName: state.location ? 
      `${state.location.cidade || state.location.city}, ${state.location.estado || state.location.region}` : 
      'Localização não disponível'
  };
};