// services/multiSourceApi.ts - Sistema de Múltiplas Fontes por Mercado
import { Product, MarketDataSource, QueryResult, MultiSourceResult } from '../types/product';

// ✅ CONFIGURAÇÃO DAS FONTES POR MERCADO (TIPOS IMPORTADOS)

// ✅ MAPEAMENTO DOS MERCADOS E SUAS FONTES
const MARKET_DATA_SOURCES: Record<string, MarketDataSource[]> = {
  'Carrefour': [
    {
      id: 'carrefour-api',
      name: 'API Oficial Carrefour',
      apiUrl: 'http://localhost:3001/api/mercados/carrefour/produtos',
      type: 'api',
      enabled: true,
      priority: 1,
      timeout: 5000,
      headers: { 'Authorization': 'Bearer carrefour-token' },
      transformFunction: 'transformCarrefourData',
      cacheTTL: 30
    },
    {
      id: 'carrefour-fallback',
      name: 'JSON Backup Carrefour',
      apiUrl: '/produtos-carrefour.json',
      type: 'json',
      enabled: true,
      priority: 2,
      timeout: 3000,
      transformFunction: 'transformCarrefourJSON',
      cacheTTL: 60
    }
  ],
  
  'Extra': [
    {
      id: 'extra-api',
      name: 'API Extra',
      apiUrl: 'http://localhost:3001/api/mercados/extra/produtos',
      type: 'api',
      enabled: true,
      priority: 1,
      timeout: 5000,
      headers: { 'X-API-Key': 'extra-api-key' },
      transformFunction: 'transformExtraData',
      cacheTTL: 30
    },
    {
      id: 'extra-fallback',
      name: 'JSON Backup Extra',
      apiUrl: '/produtos-extra.json',
      type: 'json',
      enabled: true,
      priority: 2,
      timeout: 3000,
      transformFunction: 'transformExtraJSON',
      cacheTTL: 60
    }
  ],
  
  'Atacadão': [
    {
      id: 'atacadao-json',
      name: 'JSON Atacadão',
      apiUrl: '/produtos-atacadao.json',
      type: 'json',
      enabled: true,
      priority: 1,
      timeout: 4000,
      transformFunction: 'transformAtacadaoJSON',
      cacheTTL: 45
    },
    {
      id: 'atacadao-csv',
      name: 'CSV Atacadão',
      apiUrl: '/data/atacadao-produtos.csv',
      type: 'csv',
      enabled: false,
      priority: 2,
      timeout: 4000,
      transformFunction: 'transformAtacadaoCSV',
      cacheTTL: 45
    }
  ],
  
  'Assaí': [
    {
      id: 'assai-api',
      name: 'API Assaí',
      apiUrl: 'http://localhost:3001/api/mercados/assai/produtos',
      type: 'api',
      enabled: true,
      priority: 1,
      timeout: 5000,
      transformFunction: 'transformAssaiData',
      cacheTTL: 30
    },
    {
      id: 'assai-fallback',
      name: 'JSON Backup Assaí',
      apiUrl: '/produtos-assai.json',
      type: 'json',
      enabled: true,
      priority: 2,
      timeout: 3000,
      transformFunction: 'transformAssaiJSON',
      cacheTTL: 60
    }
  ],
  
  // Fonte unificada como principal
  'default': [
    {
      id: 'unified-api',
      name: 'API Principal Precivox',
      apiUrl: 'http://localhost:3001/api/produtos',
      type: 'api',
      enabled: true,
      priority: 1,
      timeout: 5000,
      transformFunction: 'transformPrecivoxAPI',
      cacheTTL: 30
    }
  ],
  
  // Adicionar fonte unificada para todos os mercados principais
  'Precivox': [
    {
      id: 'precivox-api',
      name: 'API Precivox Unificada',
      apiUrl: 'http://localhost:3001/api/produtos',
      type: 'api',
      enabled: true,
      priority: 1,
      timeout: 5000,
      transformFunction: 'transformPrecivoxAPI',
      cacheTTL: 30
    }
  ]
};

// ✅ INTERFACE PARA RESULTADO DA CONSULTA (TIPOS IMPORTADOS)

// ✅ CACHE POR MERCADO
class MultiSourceCache {
  private cache = new Map<string, { data: Product[]; timestamp: number; ttl: number }>();

  set(key: string, data: Product[], ttlMinutes: number = 30): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000
    });
  }

  get(key: string): Product[] | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > cached.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  clear(marketId?: string): void {
    if (marketId) {
      // Limpar apenas cache do mercado específico
      for (const key of this.cache.keys()) {
        if (key.startsWith(marketId)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  getStats(): { totalEntries: number; cacheSize: string } {
    const totalEntries = this.cache.size;
    const cacheSize = JSON.stringify([...this.cache.entries()]).length;
    return {
      totalEntries,
      cacheSize: `${(cacheSize / 1024).toFixed(2)} KB`
    };
  }
}

// ✅ INSTÂNCIA GLOBAL DO CACHE
const globalCache = new MultiSourceCache();

// ✅ FUNÇÕES DE TRANSFORMAÇÃO DE DADOS
const transformFunctions = {
  // Transformar dados da API do Carrefour
  transformCarrefourData: (rawData: any): Product[] => {
    if (!rawData.items) return [];
    
    return rawData.items.map((item: any) => ({
      id: `carrefour-${item.sku}`,
      nome: item.title || item.name,
      preco: parseFloat(item.price || item.value || '0'),
      categoria: item.category || 'outros',
      loja: 'Carrefour',
      lojaId: 'carrefour',
      imagem: item.image || item.thumbnail,
      disponivel: item.available !== false,
      promocao: item.discount ? {
        ativo: true,
        desconto: item.discount,
        precoOriginal: item.originalPrice,
        validoAte: item.validUntil
      } : false,
      marca: item.brand,
      distancia: Math.random() * 3 + 1, // 1-4km simulado
      avaliacao: item.rating || Math.random() * 2 + 3
    }));
  },

  // Transformar JSON backup do Carrefour
  transformCarrefourJSON: (rawData: any): Product[] => {
    if (!rawData.produtos) return [];
    
    return rawData.produtos.map((produto: any) => ({
      id: `carrefour-json-${produto.id}`,
      nome: produto.nome,
      preco: produto.preco,
      categoria: produto.categoria || 'outros',
      loja: 'Carrefour',
      lojaId: 'carrefour',
      imagem: produto.imagem,
      disponivel: produto.disponivel !== false,
      promocao: produto.promocao || false,
      marca: produto.marca,
      distancia: produto.distancia || Math.random() * 3 + 1,
      avaliacao: produto.avaliacao || Math.random() * 2 + 3
    }));
  },

  // Transformar JSON backup do Extra
  transformExtraJSON: (rawData: any): Product[] => {
    if (!rawData.produtos) return [];
    
    return rawData.produtos.map((produto: any) => ({
      id: `extra-json-${produto.id}`,
      nome: produto.nome,
      preco: produto.preco,
      categoria: produto.categoria || 'outros',
      loja: 'Extra',
      lojaId: 'extra',
      imagem: produto.imagem,
      disponivel: produto.disponivel !== false,
      promocao: produto.promocao || false,
      marca: produto.marca,
      distancia: produto.distancia || Math.random() * 3 + 2,
      avaliacao: produto.avaliacao || Math.random() * 2 + 3
    }));
  },

  // Transformar JSON do Atacadão
  transformAtacadaoJSON: (rawData: any): Product[] => {
    if (!rawData.produtos) return [];
    
    return rawData.produtos.map((produto: any) => ({
      id: `atacadao-json-${produto.id}`,
      nome: produto.nome,
      preco: produto.preco,
      categoria: produto.categoria || 'outros',
      loja: 'Atacadão',
      lojaId: 'atacadao',
      imagem: produto.imagem,
      disponivel: produto.disponivel !== false,
      promocao: produto.promocao || false,
      marca: produto.marca,
      distancia: produto.distancia || Math.random() * 4 + 1.5,
      avaliacao: produto.avaliacao || Math.random() * 2 + 3
    }));
  },

  // Transformar JSON backup do Assaí
  transformAssaiJSON: (rawData: any): Product[] => {
    if (!rawData.produtos) return [];
    
    return rawData.produtos.map((produto: any) => ({
      id: `assai-json-${produto.id}`,
      nome: produto.nome,
      preco: produto.preco,
      categoria: produto.categoria || 'outros',
      loja: 'Assaí',
      lojaId: 'assai',
      imagem: produto.imagem,
      disponivel: produto.disponivel !== false,
      promocao: produto.promocao || false,
      marca: produto.marca,
      distancia: produto.distancia || Math.random() * 3 + 2,
      avaliacao: produto.avaliacao || Math.random() * 2 + 3
    }));
  },

  // Transformar dados da API do Extra
  transformExtraData: (rawData: any): Product[] => {
    if (!rawData.products) return [];
    
    return rawData.products.map((product: any) => ({
      id: `extra-${product.id}`,
      nome: product.description,
      preco: product.price,
      categoria: product.section || 'outros',
      loja: 'Extra',
      lojaId: 'extra',
      imagem: product.photo,
      disponivel: product.stock > 0,
      promocao: product.offer ? {
        ativo: true,
        desconto: product.discount,
        precoOriginal: product.regularPrice,
        validoAte: product.offerEndDate
      } : false,
      marca: product.manufacturer,
      distancia: Math.random() * 3 + 2, // 2-5km simulado
      avaliacao: product.customerRating || Math.random() * 2 + 3
    }));
  },

  // Transformar CSV do Atacadão
  transformAtacadaoCSV: (rawData: string): Product[] => {
    const lines = rawData.split('\n');
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',');
    const products: Product[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      if (values.length >= headers.length) {
        products.push({
          id: `atacadao-${values[0]}`,
          nome: values[1] || 'Produto sem nome',
          preco: parseFloat(values[2] || '0'),
          categoria: values[3] || 'outros',
          loja: 'Atacadão',
          lojaId: 'atacadao',
          disponivel: values[4] !== 'false',
          marca: values[5],
          distancia: Math.random() * 4 + 1.5, // 1.5-5.5km simulado
          avaliacao: Math.random() * 2 + 3
        });
      }
    }
    
    return products;
  },

  // Transformar dados da API do Assaí
  transformAssaiData: (rawData: any): Product[] => {
    if (!rawData.data) return [];
    
    return rawData.data.map((item: any) => ({
      id: `assai-${item.codigo}`,
      nome: item.descricao,
      preco: item.valor,
      categoria: item.categoria || 'outros',
      loja: 'Assaí',
      lojaId: 'assai',
      imagem: item.foto,
      disponivel: item.disponivel,
      promocao: item.promocional ? {
        ativo: true,
        desconto: item.percentualDesconto,
        precoOriginal: item.valorOriginal,
        validoAte: item.validadePromocao
      } : false,
      marca: item.fabricante,
      distancia: Math.random() * 3 + 2, // 2-5km simulado
      avaliacao: item.nota || Math.random() * 2 + 3
    }));
  },

  // Transformar fonte unificada JSON
  transformUnifiedJSON: (rawData: any): Product[] => {
    if (!rawData.produtos) return [];
    
    return rawData.produtos.map((produto: any) => ({
      id: produto.id,
      nome: produto.nome,
      preco: produto.preco,
      categoria: produto.categoria || 'outros',
      loja: produto.loja,
      lojaId: produto.lojaId || produto.loja.toLowerCase(),
      imagem: produto.imagem,
      disponivel: produto.disponivel !== false,
      promocao: produto.promocao || false,
      marca: produto.marca,
      distancia: produto.distancia || Math.random() * 5 + 1,
      avaliacao: produto.avaliacao || Math.random() * 2 + 3
    }));
  },

  transformPrecivoxAPI: (rawData: any): Product[] => {
    if (!rawData.produtos) return [];
    
    return rawData.produtos.map((produto: any) => ({
      id: produto.id,
      nome: produto.nome,
      preco: produto.preco,
      categoria: produto.categoria || 'outros',
      loja: produto.loja,
      lojaId: produto.lojaId || produto.loja.toLowerCase(),
      imagem: produto.imagem,
      disponivel: produto.disponivel !== false,
      promocao: produto.promocao || false,
      marca: produto.marca,
      distancia: produto.distancia || Math.random() * 5 + 1,
      avaliacao: produto.avaliacao || Math.random() * 2 + 3,
      estoque: produto.estoque,
      endereco: produto.endereco,
      telefone: produto.telefone
    }));
  }
};

// ✅ CLASSE PRINCIPAL DO MULTI-SOURCE API
export class MultiSourceAPI {
  private requestCount = 0;
  private lastQueryTime = 0;

  // Consultar uma fonte específica
  private async querySource(
    source: MarketDataSource,
    query?: string
  ): Promise<{ products: Product[]; fromCache: boolean; errors: string[] }> {
    const cacheKey = `${source.id}-${query || 'all'}`;
    const errors: string[] = [];

    try {
      // Verificar cache primeiro
      const cached = globalCache.get(cacheKey);
      if (cached) {
        console.log(`💾 Cache hit para ${source.name}: ${cached.length} produtos`);
        return { products: cached, fromCache: true, errors: [] };
      }

      console.log(`🔄 Consultando ${source.name} (${source.type})...`);

      let rawData: any;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), source.timeout);

      try {
        // Fazer requisição baseada no tipo
        const response = await fetch(source.apiUrl, {
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            ...source.headers
          }
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        // Processar resposta baseada no tipo
        if (source.type === 'json' || source.type === 'api') {
          rawData = await response.json();
        } else if (source.type === 'csv') {
          rawData = await response.text();
        } else if (source.type === 'xml') {
          // TODO: Implementar parser XML se necessário
          rawData = await response.text();
        }

        // Aplicar função de transformação
        const transformFn = transformFunctions[source.transformFunction as keyof typeof transformFunctions];
        if (!transformFn) {
          throw new Error(`Função de transformação '${source.transformFunction}' não encontrada`);
        }

        const products = transformFn(rawData);

        // Filtrar por query se fornecida
        let filteredProducts = products;
        if (query && query.trim()) {
          const queryLower = query.toLowerCase();
          filteredProducts = products.filter(product =>
            product.nome.toLowerCase().includes(queryLower) ||
            product.categoria.toLowerCase().includes(queryLower) ||
            product.marca?.toLowerCase().includes(queryLower)
          );
        }

        // Armazenar no cache
        globalCache.set(cacheKey, filteredProducts, source.cacheTTL);

        console.log(`✅ ${source.name}: ${filteredProducts.length} produtos obtidos`);
        return { products: filteredProducts, fromCache: false, errors: [] };

      } catch (fetchError) {
        clearTimeout(timeoutId);
        const errorMsg = `Erro ao consultar ${source.name}: ${fetchError}`;
        console.error(`❌ ${errorMsg}`);
        errors.push(errorMsg);
        return { products: [], fromCache: false, errors };
      }

    } catch (error) {
      const errorMsg = `Erro geral em ${source.name}: ${error}`;
      console.error(`❌ ${errorMsg}`);
      errors.push(errorMsg);
      return { products: [], fromCache: false, errors };
    }
  }

  // Consultar mercado específico
  async queryMarket(marketId: string, query?: string): Promise<QueryResult | null> {
    const sources = MARKET_DATA_SOURCES[marketId];
    if (!sources || sources.length === 0) {
      console.warn(`⚠️ Nenhuma fonte configurada para mercado: ${marketId}`);
      return null;
    }

    // Ordenar por prioridade (1 = maior prioridade)
    const sortedSources = sources
      .filter(s => s.enabled)
      .sort((a, b) => a.priority - b.priority);

    // Tentar cada fonte até conseguir dados
    for (const source of sortedSources) {
      const result = await this.querySource(source, query);
      
      if (result.products.length > 0) {
        return {
          products: result.products,
          source,
          timestamp: Date.now(),
          fromCache: result.fromCache,
          errors: result.errors
        };
      }
    }

    console.warn(`⚠️ Nenhuma fonte retornou dados para mercado: ${marketId}`);
    return null;
  }

  // Consultar todos os mercados em paralelo
  async queryAllMarkets(query?: string, specificMarkets?: string[]): Promise<MultiSourceResult> {
    const startTime = Date.now();
    this.requestCount++;

    console.log(`🚀 Iniciando consulta multi-source #${this.requestCount}${query ? ` para "${query}"` : ''}`);

    // Se specificMarkets contém apenas 'default', usar só ele
    if (specificMarkets && specificMarkets.length === 1 && specificMarkets[0] === 'default') {
      console.log('🎯 Usando apenas fonte unificada (default)');
      const defaultResult = await this.queryMarket('default', query);
      
      if (defaultResult) {
        return {
          allProducts: defaultResult.products,
          resultsByMarket: { 'default': defaultResult },
          totalSources: 1,
          successfulSources: 1,
          errors: defaultResult.errors || [],
          queryTime: Date.now() - startTime
        };
      }
    }

    // Primeira tentativa: tentar fonte unificada primeiro
    console.log('🔄 Tentando fonte unificada primeiro...');
    const primaryResult = await this.queryMarket('default', query);
    
    const allProducts: Product[] = [];
    const resultsByMarket: Record<string, QueryResult> = {};
    const errors: string[] = [];
    let successfulSources = 0;

    if (primaryResult && primaryResult.products.length > 0) {
      resultsByMarket['default'] = primaryResult;
      allProducts.push(...primaryResult.products);
      successfulSources++;
      
      console.log(`✅ Fonte unificada retornou ${primaryResult.products.length} produtos`);
      
      // Se a fonte unificada funcionou, retorna apenas ela por enquanto
      return {
        allProducts,
        resultsByMarket,
        totalSources: 1,
        successfulSources,
        errors: primaryResult.errors || [],
        queryTime: Date.now() - startTime
      };
    }

    // Se a fonte unificada falhou, tentar outras fontes
    console.log('⚠️ Fonte unificada falhou, tentando outras fontes...');
    const marketsToQuery = specificMarkets || Object.keys(MARKET_DATA_SOURCES).filter(m => m !== 'default');
    const promises = marketsToQuery.map(marketId => 
      this.queryMarket(marketId, query).then(result => ({ marketId, result }))
    );

    const results = await Promise.allSettled(promises);

    // Processar resultados de outras fontes
    for (const promiseResult of results) {
      if (promiseResult.status === 'fulfilled') {
        const { marketId, result } = promiseResult.value;
        
        if (result) {
          resultsByMarket[marketId] = result;
          allProducts.push(...result.products);
          successfulSources++;
          
          if (result.errors) {
            errors.push(...result.errors);
          }
        }
      } else {
        errors.push(`Erro geral ao consultar mercado: ${promiseResult.reason}`);
      }
    }

    const queryTime = Date.now() - startTime;
    this.lastQueryTime = queryTime;

    const result: MultiSourceResult = {
      allProducts,
      resultsByMarket,
      totalSources: marketsToQuery.length,
      successfulSources,
      errors,
      queryTime
    };

    console.log(`✅ Consulta multi-source #${this.requestCount} concluída:`, {
      produtos: allProducts.length,
      mercados: successfulSources,
      tempo: `${queryTime}ms`,
      erros: errors.length
    });

    return result;
  }

  // Obter estatísticas do sistema
  getStats(): {
    totalRequests: number;
    lastQueryTime: number;
    cacheStats: { totalEntries: number; cacheSize: string };
    availableMarkets: string[];
    enabledSources: number;
  } {
    const availableMarkets = Object.keys(MARKET_DATA_SOURCES);
    const enabledSources = Object.values(MARKET_DATA_SOURCES)
      .flat()
      .filter(source => source.enabled).length;

    return {
      totalRequests: this.requestCount,
      lastQueryTime: this.lastQueryTime,
      cacheStats: globalCache.getStats(),
      availableMarkets,
      enabledSources
    };
  }

  // Limpar cache
  clearCache(marketId?: string): void {
    globalCache.clear(marketId);
    console.log(`🗑️ Cache limpo${marketId ? ` para ${marketId}` : ' (todos os mercados)'}`);
  }

  // Configurar fonte de mercado
  configureMarketSource(marketId: string, sourceConfig: Partial<MarketDataSource>): void {
    if (!MARKET_DATA_SOURCES[marketId]) {
      MARKET_DATA_SOURCES[marketId] = [];
    }

    const existingIndex = MARKET_DATA_SOURCES[marketId].findIndex(s => s.id === sourceConfig.id);
    
    if (existingIndex >= 0) {
      // Atualizar fonte existente
      MARKET_DATA_SOURCES[marketId][existingIndex] = {
        ...MARKET_DATA_SOURCES[marketId][existingIndex],
        ...sourceConfig
      };
    } else if (sourceConfig.id) {
      // Adicionar nova fonte
      MARKET_DATA_SOURCES[marketId].push(sourceConfig as MarketDataSource);
    }

    console.log(`⚙️ Fonte configurada para ${marketId}:`, sourceConfig.id);
  }
}

// ✅ INSTÂNCIA SINGLETON
export const multiSourceAPI = new MultiSourceAPI();

// ✅ EXPORT DAS FUNÇÕES PRINCIPAIS
export const searchProductsMultiSource = (query?: string, markets?: string[]) => 
  multiSourceAPI.queryAllMarkets(query, markets);

export const searchMarketProducts = (marketId: string, query?: string) => 
  multiSourceAPI.queryMarket(marketId, query);

export const getMultiSourceStats = () => multiSourceAPI.getStats();

export const clearMultiSourceCache = (marketId?: string) => 
  multiSourceAPI.clearCache(marketId);

export default multiSourceAPI;