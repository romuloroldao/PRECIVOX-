// src/services/LocationService.ts - SERVIÇO DE GEOLOCALIZAÇÃO v5.0
export interface UserLocation {
  cidade: string;
  estado: string;
  pais: string;
  coords: {
    lat: number;
    lng: number;
  };
  accuracy?: number;
  timestamp: number;
}

export interface LojaComDistancia {
  id: string;
  nome: string;
  endereco: string;
  cidade: string;
  estado: string;
  coords: {
    lat: number;
    lng: number;
  };
  distancia: number; // em km
  tempoEstimado: string; // tempo estimado de viagem
}

class LocationService {
  private static instance: LocationService;
  private userLocation: UserLocation | null = null;
  private locationCache: Map<string, UserLocation> = new Map();

  static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  // Detectar localização do usuário
  async detectUserLocation(): Promise<UserLocation> {
    // Verificar cache primeiro (válido por 1 hora)
    const cachedLocation = this.getCachedLocation();
    if (cachedLocation) {
      this.userLocation = cachedLocation;
      return cachedLocation;
    }

    try {
      // Tentar geolocalização do navegador primeiro
      if (navigator.geolocation) {
        const position = await this.getCurrentPosition();
        const location = await this.reverseGeocode(position.coords.latitude, position.coords.longitude);
        
        this.userLocation = {
          ...location,
          coords: {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          },
          accuracy: position.coords.accuracy,
          timestamp: Date.now()
        };
        
        this.saveLocationToCache(this.userLocation);
        return this.userLocation;
      }
    } catch (error) {
      console.warn('Geolocalização falhou, tentando por IP:', error);
    }

    // Fallback: localização por IP
    try {
      const locationByIP = await this.getLocationByIP();
      this.userLocation = locationByIP;
      this.saveLocationToCache(locationByIP);
      return locationByIP;
    } catch (error) {
      console.warn('Localização por IP falhou, usando localização padrão:', error);
    }

    // Fallback final: Franco da Rocha, SP (localização padrão do usuário)
    const defaultLocation: UserLocation = {
      cidade: 'Franco da Rocha',
      estado: 'São Paulo',
      pais: 'Brasil',
      coords: {
        lat: -23.3319,
        lng: -46.7278
      },
      timestamp: Date.now()
    };

    this.userLocation = defaultLocation;
    return defaultLocation;
  }

  // Obter posição atual via navegador
  private getCurrentPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        resolve,
        reject,
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutos
        }
      );
    });
  }

  // Geocodificação reversa (coordenadas -> endereço)
  private async reverseGeocode(lat: number, lng: number): Promise<Partial<UserLocation>> {
    try {
      // Usando OpenStreetMap Nominatim (gratuito)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=pt-BR`
      );
      
      if (!response.ok) throw new Error('Geocoding failed');
      
      const data = await response.json();
      const address = data.address;
      
      return {
        cidade: address.city || address.town || address.village || 'Cidade não identificada',
        estado: address.state || 'Estado não identificado',
        pais: address.country || 'Brasil'
      };
    } catch (error) {
      console.error('Erro na geocodificação reversa:', error);
      return {
        cidade: 'Franco da Rocha',
        estado: 'São Paulo',
        pais: 'Brasil'
      };
    }
  }

  // Localização por IP
  private async getLocationByIP(): Promise<UserLocation> {
    try {
      const response = await fetch('https://ipapi.co/json/');
      if (!response.ok) throw new Error('IP location failed');
      
      const data = await response.json();
      
      return {
        cidade: data.city || 'Franco da Rocha',
        estado: data.region || 'São Paulo',
        pais: data.country_name || 'Brasil',
        coords: {
          lat: data.latitude || -23.3319,
          lng: data.longitude || -46.7278
        },
        timestamp: Date.now()
      };
    } catch (error) {
      throw new Error('Falha ao obter localização por IP');
    }
  }

  // Calcular distância entre duas coordenadas (Fórmula de Haversine)
  calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371; // Raio da Terra em km
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // Calcular tempo estimado de viagem
  calculateTravelTime(distanceKm: number): string {
    if (distanceKm <= 5) return '10-15 min';
    if (distanceKm <= 10) return '15-25 min';
    if (distanceKm <= 25) return '25-40 min';
    if (distanceKm <= 50) return '40-60 min';
    return '1h+';
  }

  // Filtrar lojas por proximidade
  filterStoresByDistance(
    lojas: any[],
    userLocation: UserLocation,
    maxDistance: number = 25
  ): LojaComDistancia[] {
    return lojas
      .map(loja => {
        const distancia = this.calculateDistance(
          userLocation.coords.lat,
          userLocation.coords.lng,
          loja.coords.lat,
          loja.coords.lng
        );
        
        return {
          ...loja,
          distancia: Math.round(distancia * 10) / 10, // 1 casa decimal
          tempoEstimado: this.calculateTravelTime(distancia)
        } as LojaComDistancia;
      })
      .filter(loja => loja.distancia <= maxDistance)
      .sort((a, b) => a.distancia - b.distancia);
  }

  // Cache management
  private getCachedLocation(): UserLocation | null {
    const cached = localStorage.getItem('user_location');
    if (cached) {
      const location = JSON.parse(cached) as UserLocation;
      // Cache válido por 1 hora
      if (Date.now() - location.timestamp < 3600000) {
        return location;
      }
    }
    return null;
  }

  private saveLocationToCache(location: UserLocation): void {
    localStorage.setItem('user_location', JSON.stringify(location));
  }

  // Getters
  getUserLocation(): UserLocation | null {
    return this.userLocation;
  }

  // Verificar se localização está disponível
  isLocationAvailable(): boolean {
    return !!this.userLocation;
  }

  // Força atualização da localização
  async refreshLocation(): Promise<UserLocation> {
    localStorage.removeItem('user_location');
    return this.detectUserLocation();
  }
}

export default LocationService;