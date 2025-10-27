// Serviço para busca de imagens em APIs externas
import axios from 'axios';

export interface ImageSearchResult {
  url: string;
  title: string;
  source: string;
  width?: number;
  height?: number;
}

export class ImageSearchService {
  private readonly googleApiKey: string;
  private readonly googleSearchEngineId: string;
  private readonly bingApiKey: string;

  constructor() {
    this.googleApiKey = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY || '';
    this.googleSearchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID || '';
    this.bingApiKey = process.env.BING_SEARCH_API_KEY || '';
  }

  /**
   * Busca imagem usando Google Custom Search API
   */
  async buscarImagemGoogle(query: string): Promise<ImageSearchResult | null> {
    if (!this.googleApiKey || !this.googleSearchEngineId) {
      throw new Error('Configurações do Google Custom Search não encontradas');
    }

    try {
      const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
        params: {
          key: this.googleApiKey,
          cx: this.googleSearchEngineId,
          q: query,
          searchType: 'image',
          num: 1,
          safe: 'medium',
          imgSize: 'medium',
          imgType: 'photo'
        }
      });

      const items = response.data.items;
      if (items && items.length > 0) {
        const item = items[0];
        return {
          url: item.link,
          title: item.title,
          source: 'Google Custom Search',
          width: item.image?.width,
          height: item.image?.height
        };
      }

      return null;
    } catch (error) {
      console.error('Erro ao buscar imagem no Google:', error);
      throw new Error('Falha na busca de imagem via Google');
    }
  }

  /**
   * Busca imagem usando Bing Image Search API
   */
  async buscarImagemBing(query: string): Promise<ImageSearchResult | null> {
    if (!this.bingApiKey) {
      throw new Error('Configuração da API do Bing não encontrada');
    }

    try {
      const response = await axios.get('https://api.bing.microsoft.com/v7.0/images/search', {
        headers: {
          'Ocp-Apim-Subscription-Key': this.bingApiKey
        },
        params: {
          q: query,
          count: 1,
          offset: 0,
          imageType: 'Photo',
          size: 'Medium',
          safeSearch: 'Moderate'
        }
      });

      const images = response.data.value;
      if (images && images.length > 0) {
        const image = images[0];
        return {
          url: image.contentUrl,
          title: image.name,
          source: 'Bing Image Search',
          width: image.width,
          height: image.height
        };
      }

      return null;
    } catch (error) {
      console.error('Erro ao buscar imagem no Bing:', error);
      throw new Error('Falha na busca de imagem via Bing');
    }
  }

  /**
   * Busca imagem com fallback entre diferentes APIs
   */
  async buscarImagemNaWeb(tituloProduto: string): Promise<string> {
    const query = this.otimizarQueryBusca(tituloProduto);
    
    try {
      // Tenta primeiro com Google Custom Search
      const resultadoGoogle = await this.buscarImagemGoogle(query);
      if (resultadoGoogle) {
        return resultadoGoogle.url;
      }
    } catch (error) {
      console.warn('Google Custom Search falhou, tentando Bing...', error);
    }

    try {
      // Fallback para Bing
      const resultadoBing = await this.buscarImagemBing(query);
      if (resultadoBing) {
        return resultadoBing.url;
      }
    } catch (error) {
      console.warn('Bing Image Search falhou', error);
    }

    // Se ambas as APIs falharem, retorna uma imagem placeholder
    return this.getPlaceholderImage(tituloProduto);
  }

  /**
   * Otimiza a query de busca para melhores resultados
   */
  private otimizarQueryBusca(tituloProduto: string): string {
    // Remove caracteres especiais e normaliza
    let query = tituloProduto
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Adiciona palavras-chave para melhorar a busca
    const palavrasChave = ['produto', 'embalagem', 'foto'];
    query += ' ' + palavrasChave.join(' ');

    return query;
  }

  /**
   * Retorna uma imagem placeholder quando não encontra resultados
   */
  private getPlaceholderImage(tituloProduto: string): string {
    // Usa um serviço de placeholder ou imagem padrão
    const encodedTitle = encodeURIComponent(tituloProduto);
    return `https://via.placeholder.com/300x300/cccccc/666666?text=${encodedTitle}`;
  }

  /**
   * Valida se a URL da imagem é acessível
   */
  async validarUrlImagem(url: string): Promise<boolean> {
    try {
      const response = await axios.head(url, { timeout: 5000 });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
}
