// utils/searchUtils.ts - SISTEMA DE BUSCA INTELIGENTE PRECIVOX

interface Product {
    id: string;
    nome: string;
    categoria: string;
    subcategoria?: string;
    marca?: string;
    tags?: string[];
    preco: number;
    loja: string;
    descricao?: string;
    codigo?: string;
    peso?: string;
  }
  
  // ✅ MAPEAMENTO DE SINÔNIMOS E VARIAÇÕES
  const SYNONYMS_MAP: Record<string, string[]> = {
    // Carnes
    'carne': ['carnes', 'bovina', 'frango', 'picanha', 'alcatra', 'contrafile', 'beef'],
    'carnes': ['carne', 'bovina', 'frango', 'picanha', 'alcatra', 'contrafile'],
    'frango': ['ave', 'peito', 'carne branca', 'chicken'],
    'boi': ['bovina', 'carne vermelha', 'beef'],
    'porco': ['suina', 'linguiça', 'bacon'],
  
    // Bebidas
    'refrigerante': ['refri', 'soda', 'coca', 'pepsi', 'guarana'],
    'suco': ['juice', 'vitamina', 'bebida'],
    'cerveja': ['beer', 'chopp', 'long neck'],
    'agua': ['água', 'mineral', 'h2o'],
  
    // Limpeza
    'detergente': ['lava louça', 'sabao liquido'],
    'sabao': ['sabão', 'detergente', 'limpeza'],
    'desinfetante': ['limpa tudo', 'multiuso'],
  
    // Higiene
    'shampoo': ['xampu', 'cabelo'],
    'pasta': ['creme dental', 'escova dente'],
    'papel': ['higienico', 'tp', 'tissue'],
  
    // Grãos
    'arroz': ['rice', 'graos', 'cereal'],
    'feijao': ['feijão', 'beans', 'grãos'],
    'macarrao': ['macarrão', 'massa', 'pasta', 'espaguete'],
  
    // Laticínios
    'leite': ['milk', 'laticinios', 'integral', 'desnatado'],
    'queijo': ['cheese', 'mussarela', 'parmesao'],
    'iogurte': ['yogurt', 'fermentado'],
  
    // Frutas
    'banana': ['nanica', 'prata', 'fruit'],
    'maca': ['maçã', 'fruit', 'apple'],
    'laranja': ['citrus', 'fruit'],
  
    // Verduras
    'alface': ['verdura', 'folha', 'salada'],
    'tomate': ['legume', 'salada'],
    'cebola': ['tempero', 'legume'],
  
    // Categorias gerais
    'comida': ['alimento', 'food', 'alimentacao'],
    'bebida': ['drink', 'liquido'],
    'limpeza': ['cleaning', 'higienizacao'],
    'higiene': ['personal care', 'banho'],
  };
  
  // ✅ PALAVRAS CONECTORAS (IGNORAR NA BUSCA)
  const STOP_WORDS = new Set([
    'de', 'da', 'do', 'das', 'dos', 'em', 'na', 'no', 'nas', 'nos',
    'com', 'sem', 'para', 'por', 'um', 'uma', 'uns', 'umas',
    'o', 'a', 'os', 'as', 'e', 'ou', 'que', 'kg', 'ml', 'g', 'l'
  ]);
  
  // ✅ FUNÇÃO PARA NORMALIZAR TEXTO
  function normalizeText(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^\w\s]/g, ' ') // Remove pontuação
      .replace(/\s+/g, ' ') // Normaliza espaços
      .trim();
  }
  
  // ✅ FUNÇÃO PARA EXTRAIR PALAVRAS-CHAVE
  function extractKeywords(text: string): string[] {
    const normalized = normalizeText(text);
    const words = normalized.split(' ').filter(word => 
      word.length > 2 && !STOP_WORDS.has(word)
    );
    
    // Adicionar sinônimos
    const allWords = new Set(words);
    words.forEach(word => {
      if (SYNONYMS_MAP[word]) {
        SYNONYMS_MAP[word].forEach(synonym => allWords.add(synonym));
      }
    });
    
    return Array.from(allWords);
  }
  
  // ✅ FUNÇÃO PARA GERAR TERMOS DE BUSCA DE UM PRODUTO
  export function generateSearchTermsForProduct(product: Product): string[] {
    const terms = new Set<string>();
    
    // Termos principais
    terms.add(normalizeText(product.nome));
    terms.add(normalizeText(product.categoria));
    
    if (product.subcategoria) {
      terms.add(normalizeText(product.subcategoria));
    }
    
    if (product.marca) {
      terms.add(normalizeText(product.marca));
    }
    
    // Palavras individuais do nome
    const nomeWords = extractKeywords(product.nome);
    nomeWords.forEach(word => terms.add(word));
    
    // Categoria e subcategoria
    const categoriaWords = extractKeywords(product.categoria);
    categoriaWords.forEach(word => terms.add(word));
    
    if (product.subcategoria) {
      const subcategoriaWords = extractKeywords(product.subcategoria);
      subcategoriaWords.forEach(word => terms.add(word));
    }
    
    // Tags personalizadas
    if (product.tags) {
      product.tags.forEach(tag => {
        const tagWords = extractKeywords(tag);
        tagWords.forEach(word => terms.add(word));
      });
    }
    
    // Extrair informações do peso/tamanho
    if (product.peso) {
      const pesoWords = extractKeywords(product.peso);
      pesoWords.forEach(word => terms.add(word));
    }
    
    return Array.from(terms);
  }
  
  // ✅ FUNÇÃO PRINCIPAL DE BUSCA INTELIGENTE
  export function searchProducts(products: Product[], query: string): Product[] {
    if (!query.trim()) {
      return products;
    }
    
    const searchKeywords = extractKeywords(query);
    const results: Array<{ product: Product; score: number }> = [];
    
    products.forEach(product => {
      const productTerms = generateSearchTermsForProduct(product);
      let score = 0;
      
      searchKeywords.forEach(keyword => {
        productTerms.forEach(term => {
          // Pontuação por tipo de match
          if (term === keyword) {
            score += 10; // Match exato
          } else if (term.includes(keyword)) {
            score += 5; // Match parcial
          } else if (keyword.includes(term)) {
            score += 3; // Keyword contém termo
          }
          
          // Bonus por match no nome (mais relevante)
          if (normalizeText(product.nome).includes(keyword)) {
            score += 15;
          }
          
          // Bonus por match na categoria
          if (normalizeText(product.categoria).includes(keyword)) {
            score += 8;
          }
          
          // Bonus por match na marca
          if (product.marca && normalizeText(product.marca).includes(keyword)) {
            score += 12;
          }
        });
      });
      
      if (score > 0) {
        results.push({ product, score });
      }
    });
    
    // Ordenar por relevância
    return results
      .sort((a, b) => b.score - a.score)
      .map(item => item.product);
  }
  
  // ✅ FUNÇÃO PARA GERAR SUGESTÕES INTELIGENTES
  export function generateSmartSuggestions(products: Product[], query: string = ''): string[] {
    const suggestions = new Set<string>();
    
    // Se há uma query, gerar sugestões baseadas nela
    if (query.trim()) {
      const normalizedQuery = normalizeText(query);
      const queryKeywords = extractKeywords(query);
      
      products.forEach(product => {
        const productTerms = generateSearchTermsForProduct(product);
        
        // Adicionar termos que começam com a query
        productTerms.forEach(term => {
          if (term.startsWith(normalizedQuery)) {
            suggestions.add(term);
          }
          
          // Adicionar termos que contêm palavras da query
          queryKeywords.forEach(keyword => {
            if (term.includes(keyword) && term !== keyword) {
              suggestions.add(term);
            }
          });
        });
        
        // Adicionar nomes de produtos que fazem match parcial
        if (normalizeText(product.nome).includes(normalizedQuery)) {
          suggestions.add(normalizeText(product.nome));
        }
        
        // Adicionar sinônimos da query
        queryKeywords.forEach(keyword => {
          if (SYNONYMS_MAP[keyword]) {
            SYNONYMS_MAP[keyword].forEach(synonym => {
              suggestions.add(synonym);
            });
          }
        });
      });
    } else {
      // Sugestões populares quando não há query
      const popularTerms = [
        'arroz', 'feijao', 'carne', 'frango', 'leite', 'agua',
        'refrigerante', 'cerveja', 'detergente', 'sabao',
        'shampoo', 'pasta de dente', 'cafe', 'acucar',
        'macarrao', 'oleo', 'margarina', 'queijo'
      ];
      
      popularTerms.forEach(term => suggestions.add(term));
      
      // Adicionar categorias
      const categories = Array.from(new Set(products.map(p => p.categoria)));
      categories.forEach(cat => suggestions.add(normalizeText(cat)));
      
      // Adicionar marcas populares
      const brands = Array.from(new Set(products.map(p => p.marca).filter(Boolean)));
      brands.slice(0, 10).forEach(brand => suggestions.add(normalizeText(brand!)));
    }
    
    // Filtrar e limitar sugestões
    return Array.from(suggestions)
      .filter(suggestion => 
        suggestion.length > 2 && 
        !STOP_WORDS.has(suggestion) &&
        suggestion !== normalizeText(query)
      )
      .sort((a, b) => {
        // Priorizar termos que começam com a query
        if (query) {
          const normalizedQuery = normalizeText(query);
          const aStarts = a.startsWith(normalizedQuery);
          const bStarts = b.startsWith(normalizedQuery);
          
          if (aStarts && !bStarts) return -1;
          if (!aStarts && bStarts) return 1;
        }
        
        // Ordenar por comprimento (termos menores primeiro)
        return a.length - b.length;
      })
      .slice(0, 20); // Limitar a 20 sugestões
  }
  
  // ✅ FUNÇÃO PARA BUSCA POR CATEGORIA COM SINÔNIMOS
  export function searchByCategory(products: Product[], categoryQuery: string): Product[] {
    const normalizedQuery = normalizeText(categoryQuery);
    const keywords = extractKeywords(categoryQuery);
    
    return products.filter(product => {
      const categoryTerms = [
        normalizeText(product.categoria),
        normalizeText(product.subcategoria || ''),
        ...extractKeywords(product.categoria)
      ];
      
      return keywords.some(keyword => 
        categoryTerms.some(term => 
          term.includes(keyword) || keyword.includes(term)
        )
      );
    });
  }
  
  // ✅ FUNÇÃO PARA HIGHLIGHT DOS TERMOS ENCONTRADOS
  export function highlightSearchTerms(text: string, query: string): string {
    if (!query.trim()) return text;
    
    const keywords = extractKeywords(query);
    let highlightedText = text;
    
    keywords.forEach(keyword => {
      const regex = new RegExp(`(${keyword})`, 'gi');
      highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
    });
    
    return highlightedText;
  }
  
  // ✅ FUNÇÃO PARA ESTATÍSTICAS DE BUSCA
  export function getSearchStats(products: Product[], query: string) {
    const results = searchProducts(products, query);
    const categories = Array.from(new Set(results.map(p => p.categoria)));
    const brands = Array.from(new Set(results.map(p => p.marca).filter(Boolean)));
    
    return {
      totalResults: results.length,
      categories: categories.length,
      brands: brands.length,
      avgPrice: results.length > 0 
        ? results.reduce((sum, p) => sum + p.preco, 0) / results.length 
        : 0,
      priceRange: results.length > 0 
        ? {
            min: Math.min(...results.map(p => p.preco)),
            max: Math.max(...results.map(p => p.preco))
          }
        : { min: 0, max: 0 }
    };
  }
  
  export default {
    searchProducts,
    generateSmartSuggestions,
    searchByCategory,
    highlightSearchTerms,
    getSearchStats,
    generateSearchTermsForProduct
  };