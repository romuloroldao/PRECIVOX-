// ===============================================
// 📦 PRECIVOX SDK - JavaScript/Node.js v1.0.0 - CORRIGIDO
// ===============================================
// Biblioteca oficial para integração com a API PRECIVOX
// Documentação: https://api.precivox.com.br/docs

const axios = require('axios');
const crypto = require('crypto');

class PrecivoxSDK {
  constructor(options = {}) {
    this.apiToken = options.apiToken;
    this.environment = options.environment || 'development'; // Mudança: development por padrão
    this.storeId = options.storeId;
    this.timeout = options.timeout || 30000;
    
    // URLs por ambiente - CORRIGIDO para desenvolvimento local
    this.baseURL = this.environment === 'production' 
      ? 'https://api.precivox.com.br/api/v1'
      : 'http://localhost:3001/api'; // Para desenvolvimento local
    
    // Remover validação de token para desenvolvimento
    if (this.environment === 'production' && !this.apiToken) {
      throw new Error('❌ Token de API obrigatório para produção');
    }
    
    // Configurar cliente HTTP
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'PRECIVOX-SDK-JS/1.0.0',
        ...(this.apiToken && { 'Authorization': `Bearer ${this.apiToken}` })
      }
    });
    
    // Interceptar respostas para melhor tratamento de erros
    this.client.interceptors.response.use(
      response => response,
      error => this.handleAPIError(error)
    );
    
    // Inicializar módulos
    this.products = new ProductsModule(this);
    this.prices = new PricesModule(this);
    this.alerts = new AlertsModule(this);
    this.analytics = new AnalyticsModule(this);
    this.webhooks = new WebhooksModule(this);
  }
  
  // Tratamento de erros padronizado
  handleAPIError(error) {
    if (error.response) {
      const { status, data } = error.response;
      
      const errorMessages = {
        401: '🔐 Token inválido ou expirado',
        403: '🚫 Recurso não disponível no seu plano',
        429: '⏰ Rate limit excedido - tente novamente em alguns minutos',
        422: '📝 Dados enviados são inválidos',
        500: '🛠️ Erro interno do servidor'
      };
      
      const message = errorMessages[status] || `Erro ${status}`;
      const details = data?.error || data?.message || 'Erro desconhecido';
      
      throw new PrecivoxError(message, status, details, data);
    }
    
    throw new PrecivoxError('❌ Erro de conexão com a API', 0, error.message);
  }
  
  // Método para testar conectividade - CORRIGIDO
  async testConnection() {
    try {
      const response = await this.client.get('/health');
      return {
        success: true,
        status: 'connected',
        timestamp: new Date().toISOString(),
        version: response.data.version || '1.0.0',
        environment: this.environment
      };
    } catch (error) {
      return {
        success: false,
        status: 'error',
        error: error.message,
        environment: this.environment
      };
    }
  }
}

// ===============================================
// 📦 MÓDULO DE PRODUTOS
// ===============================================

class ProductsModule {
  constructor(sdk) {
    this.sdk = sdk;
  }
  
  // Sincronizar produtos com a plataforma
  async sync(data) {
    try {
      const payload = {
        products: data.products,
        storeId: data.storeId || this.sdk.storeId,
        options: {
          updateMode: data.updateMode || 'merge',
          validateProducts: data.validateProducts !== false,
          enableMLProcessing: data.enableMLProcessing !== false
        }
      };
      
      // Validar estrutura dos produtos
      this.validateProductsStructure(payload.products);
      
      const response = await this.sdk.client.post('/products/sync', payload);
      return response.data.data;
      
    } catch (error) {
      throw new PrecivoxError('Erro na sincronização de produtos', 0, error.message);
    }
  }
  
  // Buscar produtos sincronizados
  async search(query = {}) {
    try {
      const params = {
        q: query.search,
        category: query.category,
        sku: query.sku,
        page: query.page || 1,
        limit: query.limit || 50,
        sortBy: query.sortBy || 'updated_at',
        sortOrder: query.sortOrder || 'desc'
      };
      
      const response = await this.sdk.client.get('/search', { params });
      return response.data;
      
    } catch (error) {
      throw new PrecivoxError('Erro na busca de produtos', 0, error.message);
    }
  }
  
  // Obter detalhes de um produto específico
  async get(sku) {
    try {
      const response = await this.sdk.client.get(`/products/${encodeURIComponent(sku)}`);
      return response.data.data;
    } catch (error) {
      throw new PrecivoxError(`Erro ao buscar produto ${sku}`, 0, error.message);
    }
  }
  
  // Validar estrutura dos produtos
  validateProductsStructure(products) {
    if (!Array.isArray(products)) {
      throw new Error('Products deve ser um array');
    }
    
    products.forEach((product, index) => {
      if (!product.sku) {
        throw new Error(`Produto ${index}: SKU obrigatório`);
      }
      if (!product.name) {
        throw new Error(`Produto ${index}: Nome obrigatório`);
      }
      if (typeof product.price !== 'number' || product.price < 0) {
        throw new Error(`Produto ${index}: Preço deve ser um número positivo`);
      }
    });
  }
}

// ===============================================
// 💰 MÓDULO DE INTELIGÊNCIA DE PREÇOS
// ===============================================

class PricesModule {
  constructor(sdk) {
    this.sdk = sdk;
  }
  
  // Obter inteligência de preços
  async getIntelligence(params = {}) {
    try {
      const query = {
        sku: params.sku,
        category: params.category,
        radius: params.radius || 5,
        confidence_min: params.confidence_min || 0.7,
        include_trends: params.include_trends || false,
        include_competitors: params.include_competitors || true,
        timeframe: params.timeframe || '7d'
      };
      
      const response = await this.sdk.client.get('/prices/intelligence', { params: query });
      return response.data.data;
      
    } catch (error) {
      throw new PrecivoxError('Erro na consulta de inteligência', 0, error.message);
    }
  }
  
  // Obter histórico de preços
  async getHistory(sku, options = {}) {
    try {
      const params = {
        period: options.period || '30d',
        granularity: options.granularity || 'daily',
        include_competitors: options.include_competitors || false
      };
      
      const response = await this.sdk.client.get(`/prices/${encodeURIComponent(sku)}/history`, { params });
      return response.data.data;
      
    } catch (error) {
      throw new PrecivoxError(`Erro ao buscar histórico de ${sku}`, 0, error.message);
    }
  }
  
  // Comparar preços com concorrentes
  async compareCompetitors(sku, options = {}) {
    try {
      const params = {
        radius: options.radius || 10,
        limit: options.limit || 10,
        include_locations: options.include_locations || false
      };
      
      const response = await this.sdk.client.get(`/prices/${encodeURIComponent(sku)}/compare`, { params });
      return response.data.data;
      
    } catch (error) {
      throw new PrecivoxError(`Erro na comparação de preços para ${sku}`, 0, error.message);
    }
  }
  
  // Simular impacto de mudança de preço
  async simulateImpact(sku, newPrice, options = {}) {
    try {
      const payload = {
        sku,
        newPrice,
        duration: options.duration || '30d',
        includeElasticity: options.includeElasticity || true,
        includeCompetitorResponse: options.includeCompetitorResponse || false
      };
      
      const response = await this.sdk.client.post('/prices/simulate', payload);
      return response.data.data;
      
    } catch (error) {
      throw new PrecivoxError('Erro na simulação de impacto', 0, error.message);
    }
  }
}

// ===============================================
// 🔔 MÓDULO DE ALERTAS
// ===============================================

class AlertsModule {
  constructor(sdk) {
    this.sdk = sdk;
  }
  
  // Configurar alertas automáticos
  async configure(config = {}) {
    try {
      const payload = {
        rules: config.rules || [],
        notification_channels: config.notification_channels || ['email'],
        storeId: config.storeId || this.sdk.storeId,
        webhook_url: config.webhook_url,
        enabled: config.enabled !== false
      };
      
      // Validar regras
      this.validateAlertRules(payload.rules);
      
      const response = await this.sdk.client.post('/alerts/configure', payload);
      return response.data.data;
      
    } catch (error) {
      throw new PrecivoxError('Erro na configuração de alertas', 0, error.message);
    }
  }
  
  // Listar alertas ativos
  async list(options = {}) {
    try {
      const params = {
        status: options.status || 'active',
        page: options.page || 1,
        limit: options.limit || 20
      };
      
      const response = await this.sdk.client.get('/alerts', { params });
      return response.data.data;
      
    } catch (error) {
      throw new PrecivoxError('Erro ao listar alertas', 0, error.message);
    }
  }
  
  // Obter alertas pendentes
  async getPending() {
    try {
      const response = await this.sdk.client.get('/alerts/pending');
      return response.data.data;
    } catch (error) {
      throw new PrecivoxError('Erro ao buscar alertas pendentes', 0, error.message);
    }
  }
  
  // Marcar alerta como lido
  async markAsRead(alertId) {
    try {
      const response = await this.sdk.client.patch(`/alerts/${alertId}/read`);
      return response.data.success;
    } catch (error) {
      throw new PrecivoxError('Erro ao marcar alerta como lido', 0, error.message);
    }
  }
  
  // Validar estrutura das regras de alerta
  validateAlertRules(rules) {
    const validTypes = ['PRICE_DROP', 'COMPETITOR_CHANGE', 'MARGIN_ALERT', 'STOCK_OPPORTUNITY'];
    
    rules.forEach((rule, index) => {
      if (!validTypes.includes(rule.type)) {
        throw new Error(`Regra ${index}: Tipo '${rule.type}' inválido`);
      }
      if (typeof rule.threshold !== 'number') {
        throw new Error(`Regra ${index}: Threshold deve ser numérico`);
      }
    });
  }
}

// ===============================================
// 📊 MÓDULO DE ANALYTICS
// ===============================================

class AnalyticsModule {
  constructor(sdk) {
    this.sdk = sdk;
  }
  
  // Gerar relatório analítico
  async getReport(options = {}) {
    try {
      const params = {
        type: options.type || 'price_performance',
        period: options.period || '30d',
        format: options.format || 'json',
        storeId: options.storeId || this.sdk.storeId,
        include_recommendations: options.include_recommendations || false
      };
      
      const response = await this.sdk.client.get('/analytics/reports', { params });
      
      // Se é PDF ou Excel, retornar buffer
      if (params.format === 'pdf' || params.format === 'excel') {
        return response.data;
      }
      
      return response.data.data;
      
    } catch (error) {
      throw new PrecivoxError('Erro na geração de relatório', 0, error.message);
    }
  }
  
  // Obter KPIs em tempo real
  async getKPIs(period = '7d') {
    try {
      const params = { period };
      const response = await this.sdk.client.get('/analytics/kpis', { params });
      return response.data.data;
    } catch (error) {
      throw new PrecivoxError('Erro ao buscar KPIs', 0, error.message);
    }
  }
  
  // Obter tendências de mercado
  async getMarketTrends(options = {}) {
    try {
      const params = {
        category: options.category,
        region: options.region,
        period: options.period || '30d'
      };
      
      const response = await this.sdk.client.get('/analytics/trends', { params });
      return response.data.data;
    } catch (error) {
      throw new PrecivoxError('Erro ao buscar tendências', 0, error.message);
    }
  }
  
  // Analisar performance de produtos
  async analyzeProductPerformance(skus, options = {}) {
    try {
      const payload = {
        skus: Array.isArray(skus) ? skus : [skus],
        period: options.period || '30d',
        metrics: options.metrics || ['revenue', 'margin', 'turnover'],
        includeCompetitorData: options.includeCompetitorData || false
      };
      
      const response = await this.sdk.client.post('/analytics/product-performance', payload);
      return response.data.data;
      
    } catch (error) {
      throw new PrecivoxError('Erro na análise de performance', 0, error.message);
    }
  }
}

// ===============================================
// 🔗 MÓDULO DE WEBHOOKS
// ===============================================

class WebhooksModule {
  constructor(sdk) {
    this.sdk = sdk;
  }
  
  // Registrar endpoint de webhook
  async register(config) {
    try {
      const payload = {
        url: config.url,
        events: config.events || ['*'],
        secret: config.secret || this.generateWebhookSecret(),
        enabled: config.enabled !== false
      };
      
      const response = await this.sdk.client.post('/webhooks/register', payload);
      return response.data.data;
      
    } catch (error) {
      throw new PrecivoxError('Erro ao registrar webhook', 0, error.message);
    }
  }
  
  // Listar webhooks registrados
  async list() {
    try {
      const response = await this.sdk.client.get('/webhooks');
      return response.data.data;
    } catch (error) {
      throw new PrecivoxError('Erro ao listar webhooks', 0, error.message);
    }
  }
  
  // Testar webhook
  async test(webhookId) {
    try {
      const response = await this.sdk.client.post(`/webhooks/${webhookId}/test`);
      return response.data.success;
    } catch (error) {
      throw new PrecivoxError('Erro ao testar webhook', 0, error.message);
    }
  }
  
  // Verificar assinatura de webhook
  verifySignature(payload, signature, secret) {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    
    return signature === `sha256=${expectedSignature}`;
  }
  
  // Gerar secret para webhook
  generateWebhookSecret() {
    return crypto.randomBytes(32).toString('hex');
  }
}

// ===============================================
// 🚨 CLASSE DE ERRO PERSONALIZADA
// ===============================================

class PrecivoxError extends Error {
  constructor(message, status = 0, details = null, data = null) {
    super(message);
    this.name = 'PrecivoxError';
    this.status = status;
    this.details = details;
    this.data = data;
    this.timestamp = new Date().toISOString();
  }
  
  toString() {
    return `${this.name}: ${this.message} (Status: ${this.status})`;
  }
  
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      status: this.status,
      details: this.details,
      data: this.data,
      timestamp: this.timestamp
    };
  }
}

// ===============================================
// 🛠️ UTILITÁRIOS AUXILIARES
// ===============================================

class PrecivoxUtils {
  // Formatar produto para a API
  static formatProduct(product) {
    return {
      sku: String(product.sku).trim(),
      name: String(product.name).trim(),
      price: parseFloat(product.price),
      category: product.category ? String(product.category).trim() : null,
      stock: product.stock ? parseInt(product.stock) : null,
      barcode: product.barcode ? String(product.barcode).trim() : null,
      brand: product.brand ? String(product.brand).trim() : null,
      description: product.description ? String(product.description).trim() : null,
      images: Array.isArray(product.images) ? product.images : [],
      metadata: product.metadata || {}
    };
  }
  
  // Validar SKU
  static isValidSKU(sku) {
    return typeof sku === 'string' && sku.trim().length > 0;
  }
  
  // Formatar preço
  static formatPrice(price) {
    const parsed = parseFloat(price);
    return isNaN(parsed) ? 0 : Math.max(0, parsed);
  }
  
  // Calcular diferença percentual
  static calculatePercentageDiff(oldValue, newValue) {
    if (oldValue === 0) return newValue > 0 ? 100 : 0;
    return ((newValue - oldValue) / oldValue) * 100;
  }
  
  // Debounce para múltiplas chamadas
  static debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
}

// ===============================================
// 🎯 EXEMPLOS DE USO RÁPIDO
// ===============================================

class PrecivoxExamples {
  static async quickStart() {
    // Inicializar SDK para desenvolvimento
    const precivox = new PrecivoxSDK({
      environment: 'development' // Sem token para desenvolvimento
    });
    
    // Testar conexão
    const health = await precivox.testConnection();
    console.log('✅ Conexão:', health.status);
    
    return health;
  }
  
  static async testSearch(query = 'coca') {
    const precivox = new PrecivoxSDK({
      environment: 'development'
    });
    
    try {
      const results = await precivox.products.search({ search: query });
      console.log(`🔍 Encontrados ${results.count} produtos para "${query}"`);
      return results;
    } catch (error) {
      console.error('❌ Erro na busca:', error.message);
      throw error;
    }
  }
}

// ===============================================
// 🚀 EXPORTAÇÕES
// ===============================================

module.exports = {
  PrecivoxSDK,
  PrecivoxError,
  PrecivoxUtils,
  PrecivoxExamples
};

// Export para ES6 modules
module.exports.default = PrecivoxSDK;

// ===============================================
// 📋 INFORMAÇÕES DO PACOTE
// ===============================================

module.exports.version = '1.0.0';
module.exports.author = 'PRECIVOX Team';
module.exports.license = 'MIT';