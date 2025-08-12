// services/geolocationService.ts - SERVIÇO DE GEOLOCALIZAÇÃO AUTOMÁTICA
import { cacheService } from './cacheService';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  city?: string;
  state?: string;
  country?: string;
  address?: string;
  displayName?: string;
}

interface GeolocationConfig {
  enableHighAccuracy: boolean;
  timeout: number;
  maximumAge: number;
  retryAttempts: number;
  fallbackToIP: boolean;
}

interface LocationError {
  code: number;
  message: string;
  type: 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'NOT_SUPPORTED' | 'NETWORK_ERROR';
}

class GeolocationService {
  private config: GeolocationConfig = {
    enableHighAccuracy: true,
    timeout: 15000, // 15 segundos
    maximumAge: 10 * 60 * 1000, // 10 minutos
    retryAttempts: 3,
    fallbackToIP: true
  };

  private currentWatchId: number | null = null;
  private lastKnownPosition: LocationData | null = null;
  private isWatching = false;

  // ✅ OBTER LOCALIZAÇÃO ATUAL
  async getCurrentLocation(): Promise<LocationData> {
    console.log('📍 Solicitando localização atual...');

    // Verificar cache primeiro
    const cachedLocation = cacheService.getCachedLocation();
    if (cachedLocation && this.isLocationValid(cachedLocation)) {
      console.log('📦 Usando localização do cache');
      return cachedLocation;
    }

    // Verificar se geolocalização é suportada
    if (!this.isGeolocationSupported()) {
      throw this.createLocationError(
        'NOT_SUPPORTED',
        0,
        'Geolocalização não é suportada neste navegador'
      );
    }

    try {
      const position = await this.requestPosition();
      const locationData = await this.enrichLocationData(position);
      
      // Salvar no cache
      cacheService.cacheLocation(locationData);
      this.lastKnownPosition = locationData;
      
      console.log('✅ Localização obtida:', locationData.displayName);
      return locationData;
    } catch (error) {
      console.error('❌ Erro ao obter localização:', error);
      
      // Tentar fallback para IP se configurado
      if (this.config.fallbackToIP) {
        return await this.getLocationByIP();
      }
      
      throw error;
    }
  }

  // ✅ INICIAR MONITORAMENTO CONTÍNUO
  startWatching(
    onLocationUpdate: (location: LocationData) => void,
    onError?: (error: LocationError) => void
  ): void {
    if (this.isWatching) {
      console.log('⚠️ Já está monitorando localização');
      return;
    }

    if (!this.isGeolocationSupported()) {
      const error = this.createLocationError(
        'NOT_SUPPORTED',
        0,
        'Geolocalização não é suportada'
      );
      onError?.(error);
      return;
    }

    console.log('👁️ Iniciando monitoramento de localização...');
    
    this.currentWatchId = navigator.geolocation.watchPosition(
      async (position) => {
        try {
          const locationData = await this.enrichLocationData(position);
          
          // Verificar se a localização mudou significativamente
          if (this.hasLocationChanged(locationData)) {
            cacheService.cacheLocation(locationData);
            this.lastKnownPosition = locationData;
            onLocationUpdate(locationData);
            console.log('📍 Localização atualizada:', locationData.displayName);
          }
        } catch (error) {
          console.error('❌ Erro ao processar localização:', error);
          onError?.(error as LocationError);
        }
      },
      (error) => {
        const locationError = this.mapGeolocationError(error);
        console.error('❌ Erro no watch:', locationError);
        onError?.(locationError);
      },
      {
        enableHighAccuracy: this.config.enableHighAccuracy,
        timeout: this.config.timeout,
        maximumAge: this.config.maximumAge
      }
    );

    this.isWatching = true;
  }

  // ✅ PARAR MONITORAMENTO
  stopWatching(): void {
    if (this.currentWatchId !== null) {
      navigator.geolocation.clearWatch(this.currentWatchId);
      this.currentWatchId = null;
      this.isWatching = false;
      console.log('🛑 Monitoramento de localização parado');
    }
  }

  // ✅ OBTER ÚLTIMA LOCALIZAÇÃO CONHECIDA
  getLastKnownLocation(): LocationData | null {
    // Tentar do cache primeiro
    const cachedLocation = cacheService.getCachedLocation();
    if (cachedLocation && this.isLocationValid(cachedLocation)) {
      return cachedLocation;
    }

    return this.lastKnownPosition;
  }

  // ✅ VERIFICAR PERMISSÕES
  async checkPermission(): Promise<'granted' | 'denied' | 'prompt' | 'unsupported'> {
    if (!this.isGeolocationSupported()) {
      return 'unsupported';
    }

    if ('permissions' in navigator) {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        return permission.state;
      } catch (error) {
        console.warn('⚠️ Erro ao verificar permissões:', error);
      }
    }

    // Fallback: tentar uma posição rápida para verificar
    try {
      await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 100,
          maximumAge: Infinity
        });
      });
      return 'granted';
    } catch (error) {
      const geoError = error as GeolocationPositionError;
      return geoError.code === geoError.PERMISSION_DENIED ? 'denied' : 'prompt';
    }
  }

  // ✅ SOLICITAR PERMISSÃO EXPLICITAMENTE
  async requestPermission(): Promise<LocationData> {
    console.log('🔐 Solicitando permissão de localização...');
    
    const permission = await this.checkPermission();
    
    if (permission === 'unsupported') {
      throw this.createLocationError(
        'NOT_SUPPORTED',
        0,
        'Geolocalização não é suportada'
      );
    }

    if (permission === 'denied') {
      throw this.createLocationError(
        'PERMISSION_DENIED',
        1,
        'Permissão de localização negada'
      );
    }

    return await this.getCurrentLocation();
  }

  // ✅ CALCULAR DISTÂNCIA ENTRE DUAS COORDENADAS
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Raio da Terra em km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // ✅ HELPERS PRIVADOS
  private isGeolocationSupported(): boolean {
    return 'geolocation' in navigator;
  }

  private requestPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      
      const tryGetPosition = () => {
        attempts++;
        
        navigator.geolocation.getCurrentPosition(
          resolve,
          (error) => {
            if (attempts < this.config.retryAttempts) {
              console.log(`🔄 Tentativa ${attempts} falhou, tentando novamente...`);
              setTimeout(tryGetPosition, 1000 * attempts);
            } else {
              reject(this.mapGeolocationError(error));
            }
          },
          {
            enableHighAccuracy: this.config.enableHighAccuracy,
            timeout: this.config.timeout,
            maximumAge: this.config.maximumAge
          }
        );
      };
      
      tryGetPosition();
    });
  }

  private async enrichLocationData(position: GeolocationPosition): Promise<LocationData> {
    const locationData: LocationData = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: position.timestamp
    };

    // Tentar fazer geocoding reverso
    try {
      const address = await this.reverseGeocode(
        locationData.latitude,
        locationData.longitude
      );
      
      Object.assign(locationData, address);
    } catch (error) {
      console.warn('⚠️ Falha no geocoding reverso:', error);
      locationData.displayName = `${locationData.latitude.toFixed(4)}, ${locationData.longitude.toFixed(4)}`;
    }

    return locationData;
  }

  private async reverseGeocode(lat: number, lon: number): Promise<Partial<LocationData>> {
    // Usar API gratuita de geocoding reverso
    try {
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=pt`
      );
      
      if (!response.ok) throw new Error('Geocoding API falhou');
      
      const data = await response.json();
      
      return {
        city: data.city || data.locality || 'Cidade não identificada',
        state: data.principalSubdivision || 'Estado não identificado',
        country: data.countryName || 'Brasil',
        address: data.locality || `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
        displayName: data.city ? `${data.city}, ${data.principalSubdivision}` : `${lat.toFixed(4)}, ${lon.toFixed(4)}`
      };
    } catch (error) {
      // Fallback para coordenadas
      return {
        city: 'Franco da Rocha', // Cidade padrão
        state: 'São Paulo',
        country: 'Brasil',
        displayName: 'Franco da Rocha, SP'
      };
    }
  }

  private async getLocationByIP(): Promise<LocationData> {
    console.log('🌐 Tentando localização por IP...');
    
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const { ip } = await response.json();
      
      const geoResponse = await fetch(`https://ipapi.co/${ip}/json/`);
      const geoData = await geoResponse.json();
      
      const locationData: LocationData = {
        latitude: geoData.latitude,
        longitude: geoData.longitude,
        accuracy: 10000, // Baixa precisão para IP
        timestamp: Date.now(),
        city: geoData.city || 'Franco da Rocha',
        state: geoData.region || 'São Paulo',
        country: geoData.country_name || 'Brasil',
        displayName: `${geoData.city || 'Franco da Rocha'}, ${geoData.region || 'SP'}`
      };
      
      console.log('✅ Localização por IP obtida:', locationData.displayName);
      return locationData;
    } catch (error) {
      console.error('❌ Falha na localização por IP:', error);
      
      // Última tentativa: localização padrão de Franco da Rocha
      return {
        latitude: -23.3321,
        longitude: -46.7283,
        accuracy: 50000,
        timestamp: Date.now(),
        city: 'Franco da Rocha',
        state: 'São Paulo',
        country: 'Brasil',
        displayName: 'Franco da Rocha, SP'
      };
    }
  }

  private mapGeolocationError(error: GeolocationPositionError): LocationError {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return this.createLocationError(
          'PERMISSION_DENIED',
          error.code,
          'Permissão de localização negada pelo usuário'
        );
      case error.POSITION_UNAVAILABLE:
        return this.createLocationError(
          'POSITION_UNAVAILABLE',
          error.code,
          'Informações de localização não disponíveis'
        );
      case error.TIMEOUT:
        return this.createLocationError(
          'TIMEOUT',
          error.code,
          'Tempo limite para obter localização esgotado'
        );
      default:
        return this.createLocationError(
          'NETWORK_ERROR',
          error.code,
          error.message || 'Erro desconhecido'
        );
    }
  }

  private createLocationError(
    type: LocationError['type'],
    code: number,
    message: string
  ): LocationError {
    return { type, code, message };
  }

  private isLocationValid(location: LocationData): boolean {
    const age = Date.now() - location.timestamp;
    return age < this.config.maximumAge;
  }

  private hasLocationChanged(newLocation: LocationData): boolean {
    if (!this.lastKnownPosition) return true;
    
    const distance = this.calculateDistance(
      this.lastKnownPosition.latitude,
      this.lastKnownPosition.longitude,
      newLocation.latitude,
      newLocation.longitude
    );
    
    // Considera mudança se moveu mais de 100 metros
    return distance > 0.1;
  }

  private toRad(value: number): number {
    return (value * Math.PI) / 180;
  }

  // ✅ CONFIGURAÇÕES
  updateConfig(newConfig: Partial<GeolocationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ Configuração de geolocalização atualizada:', this.config);
  }

  getConfig(): GeolocationConfig {
    return { ...this.config };
  }
}

// ✅ INSTANCE SINGLETON
export const geolocationService = new GeolocationService();

// ✅ HOOK PARA USO EM COMPONENTES
export const useGeolocation = () => {
  return {
    getCurrentLocation: () => geolocationService.getCurrentLocation(),
    startWatching: (onUpdate: (location: LocationData) => void, onError?: (error: LocationError) => void) =>
      geolocationService.startWatching(onUpdate, onError),
    stopWatching: () => geolocationService.stopWatching(),
    getLastKnownLocation: () => geolocationService.getLastKnownLocation(),
    checkPermission: () => geolocationService.checkPermission(),
    requestPermission: () => geolocationService.requestPermission(),
    calculateDistance: (lat1: number, lon1: number, lat2: number, lon2: number) =>
      geolocationService.calculateDistance(lat1, lon1, lat2, lon2),
    updateConfig: (config: Partial<GeolocationConfig>) => geolocationService.updateConfig(config),
    getConfig: () => geolocationService.getConfig()
  };
};

export default geolocationService;