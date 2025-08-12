// ===============================================
// 📦 PRECIVOX SDK - JavaScript/Node.js v1.0.1
// ===============================================
// Biblioteca oficial para integração com a API PRECIVOX
// Documentação: https://api.precivox.com.br/docs

const axios = require('axios');
const crypto = require('crypto');

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
  
  static isValidSKU(sku) {
    return typeof sku === 'string' && sku.trim().length > 0;
  }
  
  static formatPrice(price) {
    const parsed = parseFloat(price);
    return isNaN(parsed) ? 0 : Math.max(0, parsed);
  }
  
  static calculatePercentageDiff(oldValue, newValue) {
    if (oldValue === 0) return newValue > 0 ? 100 : 0;
    return ((newValue - oldValue) / oldValue) * 100;
  }
  
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
// 📦 MÓDULO DE PRODUTOS
// ===============================================

class ProductsModule {
  constructor(sdk) {
    this.sdk = sdk;
  }
  
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
      
      this.validateProductsStructure(payload.products);
      
      const response = await this.sdk.client.post('/products/sync', payload);
      return response.data.data;
      
    } catch (error) {
      throw new PrecivoxError('Erro na sincronização de produtos', error.response?.status || 0, error.message);
    }
  }
  
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
      
      const response = await this.sdk.client.get('/products/search', { params });
      return response.data.data;
      
    } catch (error) {
      throw new PrecivoxError('Erro na busca de produtos', error.response?.status || 0, error.message);
    }
  }
  
  async get(sku) {
    try {
      const response = await this.sdk.client.get(`/products/${encodeURIComponent(sku)}`);
      return response.data.data;
    } catch (error) {
      throw new PrecivoxError(`Erro ao buscar produto ${sku}`, error.response?.status || 0, error.message);
    }
  }
  
  validateProductsStructure(products) {
    if (!Array.isArray(products)) {
      throw new PrecivoxError('Products deve ser um array', 422);
    }
    
    products.forEach((product, index) => {
      if (!product.sku) {
        throw new PrecivoxError(`Produto ${index}: SKU obrigatório`, 422);
      }
      if (!product.name) {
        throw new PrecivoxError(`Produto ${index}: Nome obrigatório`, 422);
      }
      if (typeof product.price !== 'number' || product.price < 0) {
        throw new PrecivoxError(`Produto ${index}: Preço deve ser um número positivo`, 422);
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
      throw new PrecivoxError('Erro na consulta de inteligência', error.response?.status || 0, error.message);
    }
  }
  
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
      throw new PrecivoxError(`Erro ao buscar histórico de ${sku}`, error.response?.status || 0, error.message);
    }
  }
  
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
      throw new PrecivoxError(`Erro na comparação de preços para ${sku}`, error.response?.status || 0, error.message);
    }
  }
  
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
      throw new PrecivoxError('Erro na simulação de impacto', error.response?.status || 0, error.message);
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
  
  async configure(config = {}) {
    try {
      const payload = {
        rules: config.rules || [],
        notification_channels: config.notification_channels || ['email'],
        storeId: config.storeId || this.sdk.storeId,
        webhook_url: config.webhook_url,
        enabled: config.enabled !== false
      };
      
      this.validateAlertRules(payload.rules);
      
      const response = await this.sdk.client.post('/alerts/configure', payload);
      return response.data.data;
      
    } catch (error) {
      throw new PrecivoxError('Erro na configuração de alertas', error.response?.status || 0, error.message);
    }
  }
  
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
      throw new PrecivoxError('Erro ao listar alertas', error.response?.status || 0, error.message);
    }
  }
  
  async getPending() {
    try {
      const response = await this.sdk.client.get('/alerts/pending');
      return response.data.data;
    } catch (error) {
      throw new PrecivoxError('Erro ao buscar alertas pendentes', error.response?.status || 0, error.message);
    }
  }
  
  async markAsRead(alertId) {
    try {
      const response = await this.sdk.client.patch(`/alerts/${alertId}/read`);
      return response.data.success;
    } catch (error) {
      throw new PrecivoxError('Erro ao marcar alerta como lido', error.response?.status || 0, error.message);
    }
  }
  
  validateAlertRules(rules) {
    const validTypes = ['PRICE_DROP', 'COMPETITOR_CHANGE', 'MARGIN_ALERT', 'STOCK_OPPORTUNITY'];
    
    rules.forEach((rule, index) => {
      if (!validTypes.includes(rule.type)) {
        throw new PrecivoxError(`Regra ${index}: Tipo '${rule.type}' inválido`, 422);
      }
      if (typeof rule.threshold !== 'number') {
        throw new PrecivoxError(`Regra ${index}: Threshold deve ser numérico`, 422);
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
      
      if (params.format === 'pdf' || params.format === 'excel') {
        return response.data;
      }
      
      return response.data.data;
      
    } catch (error) {
      throw new PrecivoxError('Erro na geração de relatório', error.response?.status || 0, error.message);
    }
  }
  
  async getKPIs(period = '7d') {
    try {
      const params = { period };
      const response = await this.sdk.client.get('/analytics/kpis', { params });
      return response.data.data;
    } catch (error) {
      throw new PrecivoxError('Erro ao buscar KPIs', error.response?.status || 0, error.message);
    }
  }
  
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
      throw new PrecivoxError('Erro ao buscar tendências', error.response?.status || 0, error.message);
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
      throw new PrecivoxError('Erro ao registrar webhook', error.response?.status || 0, error.message);
    }
  }
  
  async list() {
    try {
      const response = await this.sdk.client.get('/webhooks');
      return response.data.data;
    } catch (error) {
      throw new PrecivoxError('Erro ao listar webhooks', error.response?.status || 0, error.message);
    }
  }
  
  async test(webhookId) {
    try {
      const response = await this.sdk.client.post(`/webhooks/${webhookId}/test`);
      return response.data.success;
    } catch (error) {
      throw new PrecivoxError('Erro ao testar webhook', error.response?.status || 0, error.message);
    }
  }
  
  verifySignature(payload, signature, secret) {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    
    return signature === `sha256=${expectedSignature}`;
  }
  
  generateWebhookSecret() {
    return crypto.randomBytes(32).toString('hex');
  }
}

// ===============================================
// 🚀 CLASSE PRINCIPAL SDK
// ===============================================

class PrecivoxSDK {
  constructor(options = {}) {
    if (!options.apiToken) {
      throw new PrecivoxError(
        '❌ Token de API obrigatório. Obtenha em: https://app.precivox.com.br/api-tokens',
        401
      );
    }
    
    this.apiToken = options.apiToken;
    this.environment = options.environment || 'production';
    this.storeId = options.storeId;
    this.timeout = options.timeout || 30000;
    
    this.baseURL = this.environment === 'production' 
      ? 'https://api.precivox.com.br/api/v1'
      : 'https://api-sandbox.precivox.com.br/api/v1';
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
        'User-Agent': 'PRECIVOX-SDK-JS/1.0.1',
        'X-Store-ID': this.storeId || ''
      }
    });
    
    this.client.interceptors.response.use(
      response => response,
      error => this.handleAPIError(error)
    );
    
    this.products = new ProductsModule(this);
    this.prices = new PricesModule(this);
    this.alerts = new AlertsModule(this);
    this.analytics = new AnalyticsModule(this);
    this.webhooks = new WebhooksModule(this);
  }
  
  handleAPIError(error) {
    if (error.response) {
      const { status, data } = error.response;
      
      const errorMessages = {
        400: '⚠️ Requisição inválida',
        401: '🔐 Token inválido ou expirado',
        403: '🚫 Recurso não disponível no seu plano',
        404: '🔍 Recurso não encontrado',
        422: '📝 Dados enviados são inválidos',
        429: '⏰ Rate limit excedido - tente novamente em alguns minutos',
        500: '🛠️ Erro interno do servidor',
        503: '🚧 Serviço temporariamente indisponível'
      };
      
      const message = errorMessages[status] || `Erro ${status}`;
      const details = data?.error || data?.message || 'Erro desconhecido';
      
      throw new PrecivoxError(message, status, details, data);
    } else if (error.request) {
      throw new PrecivoxError('❌ Sem resposta da API', 0, error.message);
    }
    
    throw new PrecivoxError('❌ Erro de conexão com a API', 0, error.message);
  }
  
  async testConnection() {
    try {
      const response = await this.client.get('/health');
      return {
        success: true,
        status: 'connected',
        timestamp: new Date().toISOString(),
        version: response.data.version,
        environment: this.environment
      };
    } catch (error) {
      return {
        success: false,
        status: 'error',
        error: error.message,
        statusCode: error.response?.status || 0
      };
    }
  }
  
  async analyzeProductPerformance(skus, options = {}) {
    try {
      const payload = {
        skus: Array.isArray(skus) ? skus : [skus],
        period: options.period || '30d',
        metrics: options.metrics || ['revenue', 'margin', 'turnover'],
        includeCompetitorData: options.includeCompetitorData || false
      };
      
      const response = await this.client.post('/analytics/product-performance', payload);
      return response.data.data;
    } catch (error) {
      throw new PrecivoxError(
        'Erro na análise de performance', 
        error.response?.status || 0,
        error.response?.data?.error || error.message
      );
    }
  }
}

// ===============================================
// 🎯 EXEMPLOS DE USO RÁPIDO
// ===============================================

class PrecivoxExamples {
  static async quickStart() {
    const precivox = new PrecivoxSDK({
      apiToken: 'seu_token_aqui',
      storeId: 'sua_loja_id'
    });
    
    const health = await precivox.testConnection();
    console.log('✅ Conexão:', health.status);
    
    const syncResult = await precivox.products.sync({
      products: [{
        sku: '7891000001',
        name: 'Coca-Cola 2L',
        price: 8.99,
        category: 'Bebidas',
        stock: 50
      }]
    });
    
    console.log(`📦 ${syncResult.synchronized} produtos sincronizados`);
    
    const intelligence = await precivox.prices.getIntelligence({
      sku: '7891000001',
      include_trends: true
    });
    
    console.log(`💡 Preço sugerido: R$ ${intelligence.suggestedPrice}`);
    
    return { health, syncResult, intelligence };
  }
  
  static async configureBasicAlerts() {
    const precivox = new PrecivoxSDK({ apiToken: 'seu_token_aqui' });
    
    const alertConfig = await precivox.alerts.configure({
      rules: [{
        type: 'PRICE_DROP',
        threshold: 0.05,
        products: ['categoria:bebidas'],
        action: 'EMAIL'
      }, {
        type: 'COMPETITOR_CHANGE',
        threshold: 0.03,
        products: ['7891000001'],
        action: 'WEBHOOK'
      }],
      notification_channels: ['email', 'webhook'],
      webhook_url: 'https://seu-sistema.com/webhook/precivox'
    });
    
    console.log('🔔 Alertas configurados:', alertConfig.configId);
    return alertConfig;
  }
  
  static async generateWeeklyReport() {
    const precivox = new PrecivoxSDK({ apiToken: 'seu_token_aqui' });
    
    const report = await precivox.analytics.getReport({
      type: 'price_performance',
      period: '7d',
      include_recommendations: true
    });
    
    console.log('📊 Relatório gerado:');
    console.log(`💰 ROI: ${report.roi}%`);
    console.log(`📈 Crescimento: ${report.growth}%`);
    console.log(`🎯 Precisão: ${report.accuracy}%`);
    
    return report;
  }
}

// ===============================================
// 📋 EXPORTAÇÕES E INFORMAÇÕES
// ===============================================

module.exports = {
  PrecivoxSDK,
  PrecivoxError,
  PrecivoxUtils,
  PrecivoxExamples,
  ProductsModule,
  PricesModule,
  AlertsModule,
  AnalyticsModule,
  WebhooksModule
};

module.exports.default = PrecivoxSDK;
module.exports.version = '1.0.1';
module.exports.author = 'PRECIVOX Team';
module.exports.license = 'MIT';
module.exports.repository = 'https://github.com/precivox/sdk-javascript';
module.exports.documentation = 'https://api.precivox.com.br/docs';
module.exports.support = 'api-support@precivox.com.br';