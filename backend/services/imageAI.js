// services/imageAI.js - Sistema de IA para geração inteligente de imagens de produtos
import crypto from 'crypto';

// ===================================
// 🤖 SISTEMA DE IA PARA IMAGENS
// ===================================

class ProductImageAI {
  constructor() {
    this.cache = new Map(); // Cache em memória
    this.unsplashAccessKey = process.env.UNSPLASH_ACCESS_KEY || 'demo';
    this.fallbackEnabled = true;
  }

  // ✅ ANALISAR PRODUTO E GERAR PROMPT INTELIGENTE
  analyzeProductAndGeneratePrompt(nome, categoria, marca, subcategoria) {
    const product = {
      nome: nome.toLowerCase(),
      categoria: categoria.toLowerCase(),
      marca: marca ? marca.toLowerCase() : '',
      subcategoria: subcategoria ? subcategoria.toLowerCase() : ''
    };

    // Mapear categorias para termos de busca otimizados
    const categoryMappings = {
      'bebidas': this.analyzeBeverage(product),
      'carnes': this.analyzeMeat(product),
      'frutas': this.analyzeFruit(product),
      'verduras': this.analyzeVegetable(product),
      'legumes': this.analyzeVegetable(product),
      'padaria': this.analyzeBakery(product),
      'laticínios': this.analyzeDairy(product),
      'cereais': this.analyzeCereal(product),
      'grãos': this.analyzeCereal(product),
      'limpeza': this.analyzeCleaning(product),
      'higiene': this.analyzeHygiene(product),
      'congelados': this.analyzeFrozen(product),
      'doces': this.analyzeSweets(product),
      'temperos': this.analyzeSpices(product)
    };

    const analyzer = categoryMappings[product.categoria] || this.analyzeGeneric;
    return analyzer(product);
  }

  // ✅ ANALISADORES ESPECÍFICOS POR CATEGORIA
  analyzeBeverage(product) {
    const { nome, marca } = product;
    
    if (nome.includes('coca') || nome.includes('cola')) {
      return { 
        primary: 'coca cola bottle red', 
        fallback: 'cola soda bottle',
        icon: '🥤'
      };
    }
    
    if (nome.includes('água') || nome.includes('water')) {
      return { 
        primary: 'water bottle transparent', 
        fallback: 'mineral water bottle',
        icon: '💧'
      };
    }
    
    if (nome.includes('suco') || nome.includes('juice')) {
      return { 
        primary: 'fruit juice bottle colorful', 
        fallback: 'juice bottle',
        icon: '🧃'
      };
    }
    
    if (nome.includes('cerveja') || nome.includes('beer')) {
      return { 
        primary: 'beer bottle amber glass', 
        fallback: 'beer bottle',
        icon: '🍺'
      };
    }
    
    return { 
      primary: `${marca} ${nome} beverage bottle`, 
      fallback: 'beverage bottle',
      icon: '🥤'
    };
  }

  analyzeMeat(product) {
    const { nome } = product;
    
    if (nome.includes('frango') || nome.includes('chicken')) {
      return { 
        primary: 'fresh chicken meat white background', 
        fallback: 'chicken meat',
        icon: '🍗'
      };
    }
    
    if (nome.includes('carne') || nome.includes('beef')) {
      return { 
        primary: 'fresh red meat beef steak', 
        fallback: 'beef meat',
        icon: '🥩'
      };
    }
    
    if (nome.includes('peixe') || nome.includes('fish')) {
      return { 
        primary: 'fresh fish fillet white background', 
        fallback: 'fish fillet',
        icon: '🐟'
      };
    }
    
    return { 
      primary: `fresh ${nome} meat white background`, 
      fallback: 'fresh meat',
      icon: '🥩'
    };
  }

  analyzeFruit(product) {
    const { nome } = product;
    
    // Mapear frutas específicas
    const fruitMap = {
      'maçã': { primary: 'red apple fresh fruit', icon: '🍎' },
      'banana': { primary: 'yellow banana fresh fruit', icon: '🍌' },
      'laranja': { primary: 'orange citrus fresh fruit', icon: '🍊' },
      'limão': { primary: 'lemon citrus fresh fruit', icon: '🍋' },
      'uva': { primary: 'grapes purple fresh fruit', icon: '🍇' },
      'morango': { primary: 'strawberry red fresh fruit', icon: '🍓' },
      'abacaxi': { primary: 'pineapple tropical fresh fruit', icon: '🍍' },
      'manga': { primary: 'mango tropical fresh fruit', icon: '🥭' }
    };
    
    for (const [fruta, config] of Object.entries(fruitMap)) {
      if (nome.includes(fruta)) {
        return {
          primary: config.primary,
          fallback: `${fruta} fruit`,
          icon: config.icon
        };
      }
    }
    
    return { 
      primary: `${nome} fresh fruit white background`, 
      fallback: 'fresh fruit',
      icon: '🍎'
    };
  }

  analyzeVegetable(product) {
    const { nome } = product;
    
    const vegetableMap = {
      'tomate': { primary: 'red tomato fresh vegetable', icon: '🍅' },
      'alface': { primary: 'lettuce green fresh vegetable', icon: '🥬' },
      'cenoura': { primary: 'orange carrot fresh vegetable', icon: '🥕' },
      'batata': { primary: 'potato brown fresh vegetable', icon: '🥔' },
      'cebola': { primary: 'onion white fresh vegetable', icon: '🧅' },
      'brócolis': { primary: 'broccoli green fresh vegetable', icon: '🥦' }
    };
    
    for (const [vegetal, config] of Object.entries(vegetableMap)) {
      if (nome.includes(vegetal)) {
        return {
          primary: config.primary,
          fallback: `${vegetal} vegetable`,
          icon: config.icon
        };
      }
    }
    
    return { 
      primary: `${nome} fresh vegetable white background`, 
      fallback: 'fresh vegetable',
      icon: '🥬'
    };
  }

  analyzeBakery(product) {
    const { nome } = product;
    
    if (nome.includes('pão') || nome.includes('bread')) {
      return { 
        primary: 'fresh bread loaf bakery', 
        fallback: 'bread loaf',
        icon: '🍞'
      };
    }
    
    if (nome.includes('bolo') || nome.includes('cake')) {
      return { 
        primary: 'chocolate cake bakery dessert', 
        fallback: 'cake dessert',
        icon: '🎂'
      };
    }
    
    return { 
      primary: `${nome} bakery product fresh`, 
      fallback: 'bakery product',
      icon: '🍞'
    };
  }

  analyzeDairy(product) {
    const { nome } = product;
    
    if (nome.includes('leite') || nome.includes('milk')) {
      return { 
        primary: 'milk carton white dairy', 
        fallback: 'milk carton',
        icon: '🥛'
      };
    }
    
    if (nome.includes('queijo') || nome.includes('cheese')) {
      return { 
        primary: 'cheese wheel yellow dairy', 
        fallback: 'cheese dairy',
        icon: '🧀'
      };
    }
    
    if (nome.includes('iogurte') || nome.includes('yogurt')) {
      return { 
        primary: 'yogurt cup fresh dairy', 
        fallback: 'yogurt cup',
        icon: '🥛'
      };
    }
    
    return { 
      primary: `${nome} dairy product fresh`, 
      fallback: 'dairy product',
      icon: '🥛'
    };
  }

  analyzeCereal(product) {
    return { 
      primary: `${product.nome} cereal grains package`, 
      fallback: 'cereal grains',
      icon: '🌾'
    };
  }

  analyzeCleaning(product) {
    return { 
      primary: `${product.nome} cleaning product bottle`, 
      fallback: 'cleaning product',
      icon: '🧽'
    };
  }

  analyzeHygiene(product) {
    return { 
      primary: `${product.nome} hygiene personal care`, 
      fallback: 'hygiene product',
      icon: '🧴'
    };
  }

  analyzeFrozen(product) {
    return { 
      primary: `${product.nome} frozen food package`, 
      fallback: 'frozen food',
      icon: '🧊'
    };
  }

  analyzeSweets(product) {
    return { 
      primary: `${product.nome} candy sweet colorful`, 
      fallback: 'candy sweet',
      icon: '🍬'
    };
  }

  analyzeSpices(product) {
    return { 
      primary: `${product.nome} spice seasoning jar`, 
      fallback: 'spice jar',
      icon: '🧂'
    };
  }

  analyzeGeneric(product) {
    return { 
      primary: `${product.nome} product package`, 
      fallback: 'product package',
      icon: '📦'
    };
  }

  // ✅ BUSCAR IMAGEM VIA UNSPLASH API
  async searchUnsplashImage(query) {
    try {
      if (this.unsplashAccessKey === 'demo') {
        // Retornar URL de placeholder se não tem API key
        return this.generatePlaceholderImage(query);
      }

      const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=squarish`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Client-ID ${this.unsplashAccessKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`Unsplash API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const image = data.results[0];
        return {
          url: image.urls.regular,
          thumbnail: image.urls.thumb,
          alt: image.alt_description || query,
          source: 'unsplash',
          attribution: `Photo by ${image.user.name} on Unsplash`
        };
      }

      return null;
    } catch (error) {
      console.error('❌ Erro ao buscar imagem no Unsplash:', error);
      return null;
    }
  }

  // ✅ GERAR IMAGEM PLACEHOLDER INTELIGENTE
  generatePlaceholderImage(query, icon = '📦') {
    const encodedQuery = encodeURIComponent(query);
    const color = this.generateColorFromText(query);
    
    // Usar serviço de placeholder com texto personalizado
    return {
      url: `https://via.placeholder.com/400x400/${color}/FFFFFF?text=${icon}`,
      thumbnail: `https://via.placeholder.com/150x150/${color}/FFFFFF?text=${icon}`,
      alt: query,
      source: 'placeholder',
      attribution: 'Generated placeholder'
    };
  }

  // ✅ GERAR COR BASEADA NO TEXTO
  generateColorFromText(text) {
    const hash = crypto.createHash('md5').update(text).digest('hex');
    return hash.substring(0, 6);
  }

  // ✅ FUNÇÃO PRINCIPAL - GERAR IMAGEM PARA PRODUTO
  async generateProductImage(nome, categoria, marca, subcategoria) {
    try {
      // Criar chave de cache
      const cacheKey = `${nome}-${categoria}-${marca}`.toLowerCase();
      
      // Verificar cache
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey);
      }

      // Analisar produto e gerar prompts
      const analysis = this.analyzeProductAndGeneratePrompt(nome, categoria, marca, subcategoria);
      
      let imageResult = null;

      // Tentar buscar imagem primária
      imageResult = await this.searchUnsplashImage(analysis.primary);
      
      // Se não encontrar, tentar busca de fallback
      if (!imageResult && analysis.fallback) {
        imageResult = await this.searchUnsplashImage(analysis.fallback);
      }
      
      // Se ainda não encontrar, usar placeholder inteligente
      if (!imageResult) {
        imageResult = this.generatePlaceholderImage(analysis.primary, analysis.icon);
      }

      // Adicionar metadados
      const finalResult = {
        ...imageResult,
        productName: nome,
        category: categoria,
        generatedAt: new Date().toISOString(),
        analysis: analysis
      };

      // Cachear resultado
      this.cache.set(cacheKey, finalResult);
      
      // Limpar cache se ficar muito grande (máximo 1000 itens)
      if (this.cache.size > 1000) {
        const firstKey = this.cache.keys().next().value;
        this.cache.delete(firstKey);
      }

      return finalResult;
    } catch (error) {
      console.error('❌ Erro ao gerar imagem do produto:', error);
      
      // Retornar placeholder de emergência
      return this.generatePlaceholderImage(`${nome} ${categoria}`, '📦');
    }
  }

  // ✅ LIMPAR CACHE
  clearCache() {
    this.cache.clear();
    console.log('✅ Cache de imagens limpo');
  }

  // ✅ ESTATÍSTICAS DO CACHE
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()).slice(0, 10) // Primeiras 10 chaves
    };
  }
}

// ✅ INSTÂNCIA SINGLETON
const productImageAI = new ProductImageAI();

export default productImageAI;
export { ProductImageAI };