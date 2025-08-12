// services/autoDiscoveryApi.ts - Sistema de Autodescoberta de Fontes JSON
import { Product } from '../types/product';

interface DiscoveredSource {
  id: string;
  name: string;
  filename: string;
  url: string;
  market: string;
  enabled: boolean;
  lastUpdated: string;
}

interface AutoDiscoveryResult {
  sources: DiscoveredSource[];
  products: Product[];
  markets: string[];
  categories: any[];
  totalProducts: number;
  loadTime: number;
  errors: string[];
}

class AutoDiscoveryAPI {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutos
  private isLoading = false;
  private lastDiscovery: AutoDiscoveryResult | null = null;

  constructor() {
    console.log('🔍 AutoDiscovery API inicializada');
  }

  // ✅ MÉTODO LEGACY - NÃO USADO MAIS (USANDO API DO BACKEND)
  private async discoverJSONSources(): Promise<DiscoveredSource[]> {
    console.log('⚠️ Método discoverJSONSources não é mais usado - usando API do backend');
    return [];
  }

  // ✅ EXTRAIR NOME DO MERCADO DO FILENAME
  private extractMarketName(filename: string): string {
    const cleanName = filename
      .replace('.json', '')
      .replace(/_/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2');

    // Mapeamento de nomes especiais
    const nameMap: Record<string, string> = {
      'atacadao franco': 'Atacadão Franco',
      'extra franco': 'Extra Franco',
      'hiper franco': 'Hiper Franco',
      'mercadinho vila bela': 'Mercadinho Vila Bela',
      'mercado 120': 'Mercado 120',
      'mercado central franco': 'Mercado Central Franco',
      'mercado da família': 'Mercado da Família',
      'mercado popular': 'Mercado Popular',
      'mercado porto': 'Mercado Porto',
      'mercado sao joao': 'Mercado São João',
      'padaria central': 'Padaria Central',
      'supermercado vila nova': 'Supermercado Vila Nova'
    };

    return nameMap[cleanName.toLowerCase()] || 
           cleanName.split(' ')
             .map(word => word.charAt(0).toUpperCase() + word.slice(1))
             .join(' ');
  }

  // ✅ CARREGAR DADOS DE UMA FONTE JSON
  private async loadSourceData(source: DiscoveredSource): Promise<Product[]> {
    const cacheKey = source.id;
    const cached = this.cache.get(cacheKey);
    
    // Verificar cache
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      console.log(`💾 Cache hit para ${source.name}`);
      return cached.data;
    }

    try {
      console.log(`📥 Carregando ${source.name} de ${source.filename}`);
      
      const response = await fetch(source.url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Normalizar estrutura do JSON
      let products: Product[] = [];
      
      if (data.produtos && Array.isArray(data.produtos)) {
        products = data.produtos;
      } else if (Array.isArray(data)) {
        products = data;
      } else {
        console.warn(`⚠️ Estrutura JSON não reconhecida em ${source.filename}`);
        return [];
      }

      // Adicionar informações do mercado aos produtos
      products = products.map(product => ({
        ...product,
        loja: product.loja || source.market,
        mercado: product.mercado || source.market,
        fonte: source.id
      }));

      // Salvar no cache
      this.cache.set(cacheKey, {
        data: products,
        timestamp: Date.now()
      });

      // Product loading success logging removed for production
      return products;

    } catch (error) {
      console.error(`❌ Erro ao carregar ${source.name}:`, error);
      return [];
    }
  }

  // ✅ CARREGAR TODOS OS DADOS AUTOMATICAMENTE
  async loadAllData(): Promise<AutoDiscoveryResult> {
    console.log('🎯 loadAllData chamado - status:', {
      isLoading: this.isLoading,
      hasLastDiscovery: !!this.lastDiscovery
    });

    if (this.isLoading) {
      console.log('⏳ Carregamento já em andamento...');
      // Wait for current loading to complete instead of returning empty result
      return new Promise((resolve) => {
        const checkLoading = () => {
          if (!this.isLoading) {
            resolve(this.lastDiscovery || this.getEmptyResult());
          } else {
            setTimeout(checkLoading, 100);
          }
        };
        checkLoading();
      });
    }

    this.isLoading = true;
    const startTime = Date.now();
    
    console.log('🚀 Iniciando autodescoberta e carregamento de dados...');

    try {
      // ✅ CONFIGURAÇÃO SIMPLIFICADA - APENAS AMBIENTE PRINCIPAL
      const getApiURL = () => {
        if (typeof window !== 'undefined') {
          const hostname = window.location.hostname;
          
          console.log('🌍 AutoDiscovery - Ambiente principal:', {
            hostname,
            origin: window.location.origin
          });
          
          // Se não é localhost, usar proxy relativo
          if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
            console.log('🔄 AutoDiscovery - Usando proxy relativo');
            return '/api';
          }
        }
        
        // Localhost: usar backend direto na porta 3001
        console.log('🏠 AutoDiscovery - Backend direto localhost:3001');
        return 'http://localhost:3001/api';
      };
      
      const apiBaseURL = getApiURL();
      console.log('📡 AutoDiscovery - URL Final escolhida:', apiBaseURL);
      
      console.log('📡 Carregando produtos via API backend...');
      console.log('🌍 API Base URL:', apiBaseURL);
      const [productsResponse, categoriesResponse] = await Promise.all([
        fetch(`${apiBaseURL}/produtos?limit=1000`),
        fetch(`${apiBaseURL}/categorias`)
      ]);
      
      console.log('📡 Respostas da API:', {
        productsStatus: productsResponse.status,
        categoriesStatus: categoriesResponse.status,
        productsOk: productsResponse.ok,
        categoriesOk: categoriesResponse.ok
      });
      
      if (!productsResponse.ok) {
        console.warn(`⚠️ API falhou: ${productsResponse.status} ${productsResponse.statusText}`);
        console.log('🔄 Tentando fallback com arquivos JSON diretamente...');
        return await this.loadFromJSONFiles();
      }
      
      const apiData = await productsResponse.json();
      const products = apiData.produtos || [];
      
      // Carregar categorias da API
      let categories: any[] = [];
      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json();
        categories = categoriesData.categorias || [];
        console.log(`📂 ${categories.length} categorias carregadas da API`);
        console.log('📂 Amostra categorias da API:', categories.slice(0, 3));
      } else {
        console.warn('⚠️ Falha ao carregar categorias, extraindo dos produtos...');
        // Fallback: extrair categorias dos produtos
        const uniqueCategories = Array.from(new Set(products.map((p: any) => p.categoria).filter(Boolean)));
        console.log('📂 Categorias únicas dos produtos:', uniqueCategories);
        categories = uniqueCategories.map((cat: string) => ({
          id: cat,
          nome: cat,
          label: cat.charAt(0).toUpperCase() + cat.slice(1),
          total_produtos: products.filter((p: any) => p.categoria === cat).length
        }));
        console.log('📂 Categorias processadas do fallback:', categories.slice(0, 3));
      }
      
      // Extrair mercados únicos dos produtos
      const markets = Array.from(new Set(products.map((p: any) => p.loja || p.mercado).filter(Boolean)));
      
      // Criar fontes simuladas baseadas nos mercados
      const sources: DiscoveredSource[] = markets.map((market: string) => ({
        id: market.toLowerCase().replace(/\s+/g, '_'),
        name: market,
        filename: `${market.toLowerCase().replace(/\s+/g, '_')}.json`,
        url: `${apiBaseURL}/produtos?mercado=${encodeURIComponent(market)}`,
        market: market,
        enabled: true,
        lastUpdated: new Date().toISOString()
      }));
      
      const loadTime = Date.now() - startTime;
      
      const result: AutoDiscoveryResult = {
        sources,
        products,
        markets,
        categories,
        totalProducts: products.length,
        loadTime,
        errors: []
      };

      this.lastDiscovery = result;
      console.log(`🎉 Autodescoberta concluída em ${loadTime}ms:`);
      console.log(`📊 ${products.length} produtos de ${markets.length} mercados`);
      console.log(`🏪 Mercados: ${markets.join(', ')}`);
      
      return result;

    } catch (error: any) {
      console.error('❌ Erro na autodescoberta:', error);
      console.log('🔄 Tentando fallback com arquivos JSON...');
      
      try {
        return await this.loadFromJSONFiles();
      } catch (fallbackError: any) {
        console.error('❌ Fallback também falhou:', fallbackError);
        const result = this.getEmptyResult();
        result.errors = [error.message || 'Erro na API', fallbackError.message || 'Erro no fallback'];
        this.lastDiscovery = result;
        return result;
      }
    } finally {
      this.isLoading = false;
    }
  }

  // ✅ BUSCAR PRODUTOS POR TERMO
  async searchProducts(term: string, result?: AutoDiscoveryResult): Promise<Product[]> {
    try {
      console.log(`🔍 searchProducts chamado com termo: "${term}" (length: ${term ? term.length : 0})`);
      
      if (!term || term.trim().length === 0) {
        console.log(`📝 Termo vazio, carregando todos os produtos...`);
        // Se não há termo, carregar todos os produtos
        if (!result) {
          console.log(`📝 Nenhum result fornecido, chamando loadAllData...`);
          result = await this.loadAllData();
        }
        console.log(`📝 Retornando ${result.products.length} produtos do result`);
        return result.products;
      }

      // ✅ CONFIGURAÇÃO SIMPLIFICADA - BUSCA
      const getApiURL = () => {
        if (typeof window !== 'undefined') {
          const hostname = window.location.hostname;
          
          // Se não é localhost, usar proxy relativo
          if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
            console.log('🔄 Search - Proxy relativo');
            return '/api';
          }
        }
        
        // Localhost: backend direto
        console.log('🏠 Search - Backend direto localhost:3001');
        return 'http://localhost:3001/api';
      };
      
      const apiBaseURL = getApiURL();
      console.log('📡 Search - URL Final escolhida:', apiBaseURL);
      
      // Usar API de busca do backend
      console.log(`🔍 Buscando produtos na API: "${term}"`);
      const url = `${apiBaseURL}/produtos?q=${encodeURIComponent(term)}&limit=100`;
      console.log(`📡 URL da requisição: ${url}`);
      
      const response = await fetch(url);
      console.log(`📡 Resposta recebida: status ${response.status}`);
      
      if (!response.ok) {
        throw new Error(`Erro na busca: ${response.status} ${response.statusText}`);
      }
      
      const apiData = await response.json();
      const products = apiData.produtos || [];
      
      console.log(`✅ Busca API retornou ${products.length} produtos`);
      console.log(`📊 Primeiros 3 produtos:`, products.slice(0, 3).map(p => p.nome));
      return products;
      
    } catch (error) {
      console.error('❌ Erro na busca via API:', error);
      // Fallback para busca local se a API falhar
      if (!result) {
        result = await this.loadAllData();
      }
      
      const searchTerm = term.toLowerCase().trim();
      return result.products.filter(product => {
        const searchableText = [
          product.nome,
          product.categoria,
          product.marca || '',
          product.loja || '',
          product.mercado || '',
          product.descricao || ''
        ].join(' ').toLowerCase();

        return searchableText.includes(searchTerm);
      });
    }
  }

  // ✅ OBTER PRODUTOS POR MERCADO
  async getProductsByMarket(marketName: string, result?: AutoDiscoveryResult): Promise<Product[]> {
    if (!result) {
      result = await this.loadAllData();
    }

    return result.products.filter(product => 
      (product.loja || product.mercado) === marketName
    );
  }

  // ✅ FORÇAR ATUALIZAÇÃO (LIMPAR CACHE)
  async forceRefresh(): Promise<AutoDiscoveryResult> {
    // Force refresh logging removed for production
    this.cache.clear();
    this.lastDiscovery = null;
    return this.loadAllData();
  }

  // ✅ RESULTADO VAZIO
  private getEmptyResult(): AutoDiscoveryResult {
    return {
      sources: [],
      products: [],
      markets: [],
      categories: [],
      totalProducts: 0,
      loadTime: 0,
      errors: ['Nenhuma fonte de dados encontrada']
    };
  }

  // ✅ MÉTODO FALLBACK - CARREGAMENTO DIRETO DOS ARQUIVOS JSON
  private async loadFromJSONFiles(): Promise<AutoDiscoveryResult> {
    const startTime = Date.now();
    console.log('📁 Iniciando carregamento direto dos arquivos JSON...');
    
    const jsonFiles = [
      'atacadao_franco.json',
      'extra_franco.json', 
      'hiper_franco.json',
      'mercadinho_vila_bela.json',
      'mercado_120.json',
      'mercado_central_franco.json',
      'mercado_da_família.json',
      'mercado_popular.json',
      'mercado_porto.json',
      'mercado_sao_joao.json',
      'padaria_central.json',
      'santa_fe_pq_paulista.json',
      'supermercado_vila_nova.json'
    ];

    const allProducts: Product[] = [];
    const markets: string[] = [];
    const loadedSources: DiscoveredSource[] = [];
    const errors: string[] = [];

    for (const filename of jsonFiles) {
      try {
        console.log(`📥 Carregando ${filename}...`);
        // 🔧 MOBILE FIX: usar URL absoluta com protocolo correto para mobile
        const baseUrl = typeof window !== 'undefined' ? 
          `${window.location.protocol}//${window.location.hostname}` : '';
        const response = await fetch(`${baseUrl}/${filename}`);
        
        if (!response.ok) {
          console.warn(`⚠️ Falha ao carregar ${filename}: ${response.status}`);
          errors.push(`Falha ao carregar ${filename}: ${response.status}`);
          continue;
        }

        const data = await response.json();
        const products = data.produtos || [];
        
        if (products.length > 0) {
          allProducts.push(...products);
          const marketName = this.extractMarketName(filename);
          if (!markets.includes(marketName)) {
            markets.push(marketName);
          }
          
          loadedSources.push({
            id: filename.replace('.json', ''),
            name: marketName,
            filename,
            url: `/${filename}`,
            market: marketName,
            enabled: true,
            lastUpdated: new Date().toISOString()
          });
          
          console.log(`✅ ${filename}: ${products.length} produtos carregados`);
        }
        
      } catch (error: any) {
        console.error(`❌ Erro ao processar ${filename}:`, error);
        errors.push(`Erro ao processar ${filename}: ${error.message}`);
      }
    }

    // Extrair categorias dos produtos
    const uniqueCategories = Array.from(new Set(allProducts.map((p: any) => p.categoria).filter(Boolean)));
    const categories = uniqueCategories.map((cat: string) => ({
      id: cat,
      nome: cat,
      label: cat.charAt(0).toUpperCase() + cat.slice(1),
      total_produtos: allProducts.filter((p: any) => p.categoria === cat).length
    }));

    const result: AutoDiscoveryResult = {
      sources: loadedSources,
      products: allProducts,
      markets,
      categories,
      totalProducts: allProducts.length,
      loadTime: Date.now() - startTime,
      errors
    };

    console.log(`🎉 Fallback concluído: ${allProducts.length} produtos de ${markets.length} mercados`);
    this.lastDiscovery = result;
    return result;
  }

  // ✅ ESTATÍSTICAS DO SISTEMA
  getStats(): any {
    return {
      cacheSources: this.cache.size,
      isLoading: this.isLoading,
      lastDiscovery: this.lastDiscovery ? {
        totalProducts: this.lastDiscovery.totalProducts,
        markets: this.lastDiscovery.markets.length,
        sources: this.lastDiscovery.sources.length,
        loadTime: this.lastDiscovery.loadTime
      } : null
    };
  }
}

// ✅ SINGLETON GLOBAL
export const autoDiscoveryAPI = new AutoDiscoveryAPI();
export default autoDiscoveryAPI;