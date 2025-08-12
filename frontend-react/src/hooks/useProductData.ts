// hooks/useProductData.ts - VERSÃO CORRIGIDA COM CARREGAMENTO JSON

import { useState, useEffect, useCallback, useRef } from 'react';

// ✅ TIPOS LOCAIS 
interface Product {
  id: string;
  nome: string;
  preco: number;
  categoria: string;
  subcategoria?: string;
  imagem?: string;
  loja: string;
  lojaId?: string;
  descricao?: string;
  distancia?: number;
  promocao?: {
    ativo?: boolean;
    desconto: number;
    precoOriginal: number;
    validoAte?: string;
  } | boolean;
  avaliacao?: number;
  numeroAvaliacoes?: number;
  disponivel: boolean;
  tempoEntrega?: string;
  isNovo?: boolean;
  isMelhorPreco?: boolean;
  marca?: string;
  codigo?: string;
  peso?: string;
  origem?: string;
  visualizacoes?: number;
  conversoes?: number;
  estoque?: number;
  endereco?: string;
  telefone?: string;
  tags?: string[];
}

interface Category {
  id: string;
  label: string;
  icon?: string;
  count?: number;
  color?: string;
  description?: string;
}

type DataSourceType = 'json' | 'api' | 'hybrid' | 'fallback' | 'none';

interface UseProductDataReturn {
  products: Product[];
  allProducts: Product[];
  categories: Category[];
  markets: string[];
  brands: string[];
  loading: boolean;
  dataSource: DataSourceType;
  apiConnected: boolean;
  jsonLoaded: boolean;
  error: string | null;
  loadProducts: () => Promise<void>;
  searchProducts: (query: string) => Promise<Product[]>;
  loadProductsByCategory: (categoryId: string) => Promise<Product[]>;
  reloadData: () => Promise<void>;
  clearCache: () => void;
  getSmartSuggestions: (query?: string) => string[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

// ✅ FUNÇÃO PARA TRANSFORMAR JSON → PRODUCT (CORRIGIDA)
function transformJSONToProduct(jsonProduct: any): Product {
  // ✅ CORREÇÃO: Calcular disponibilidade corretamente
  const estoque = jsonProduct.estoque || 0;
  const disponivel = jsonProduct.disponivel !== undefined 
    ? Boolean(jsonProduct.disponivel) 
    : estoque > 0;

  // ✅ CORREÇÃO: Calcular promoção corretamente
  const precoNumerico = typeof jsonProduct.preco === 'string' 
    ? parseFloat(jsonProduct.preco) 
    : (jsonProduct.preco || 0);
  
  const desconto = jsonProduct.desconto || 0;
  const temPromocao = jsonProduct.promocao === true || desconto > 0;
  
  // Calcular preço original baseado no desconto
  const precoOriginal = temPromocao && desconto > 0
    ? precoNumerico / (1 - desconto / 100)
    : precoNumerico;

  // ✅ GERAR TAGS INTELIGENTES
  const tags = [];
  
  // Tags do nome
  const nomeWords = (jsonProduct.nome || '').toLowerCase().split(' ');
  nomeWords.forEach((word: string) => {
    if (word.length > 3) tags.push(word);
  });
  
  // Tags da categoria
  if (jsonProduct.categoria) {
    tags.push(jsonProduct.categoria);
  }
  if (jsonProduct.subcategoria) {
    tags.push(jsonProduct.subcategoria);
  }
  
  // Tags da marca
  if (jsonProduct.marca) {
    tags.push(jsonProduct.marca.toLowerCase());
  }

  // ✅ DISTÂNCIA ALEATÓRIA PARA FRANCO DA ROCHA
  const distanciaAleatoria = Math.random() * 5 + 0.5; // Entre 0.5km e 5.5km

  return {
    id: String(jsonProduct.id),
    nome: jsonProduct.nome || 'Produto sem nome',
    preco: precoNumerico,
    categoria: jsonProduct.categoria || 'outros',
    subcategoria: jsonProduct.subcategoria,
    imagem: jsonProduct.imagem || `/api/placeholder/300/300?text=${encodeURIComponent(jsonProduct.nome || 'Produto')}`,
    loja: jsonProduct.loja || 'Loja não informada',
    lojaId: String(jsonProduct.id),
    descricao: jsonProduct.descricao,
    distancia: jsonProduct.distancia || distanciaAleatoria,
    
    // ✅ CORREÇÃO: Estrutura da promoção
    promocao: temPromocao ? {
      ativo: true,
      desconto: desconto,
      precoOriginal: precoOriginal,
      validoAte: jsonProduct.validoAte
    } : false,
    
    avaliacao: jsonProduct.avaliacao || (Math.random() * 2 + 3), // Entre 3 e 5
    numeroAvaliacoes: jsonProduct.numeroAvaliacoes || Math.floor(Math.random() * 100 + 10),
    disponivel: disponivel, // ✅ CORREÇÃO PRINCIPAL
    tempoEntrega: jsonProduct.tempoEntrega || '1-2 dias',
    isNovo: jsonProduct.isNovo || Math.random() > 0.8,
    isMelhorPreco: jsonProduct.isMelhorPreco || false,
    marca: jsonProduct.marca,
    codigo: jsonProduct.codigo || jsonProduct.codigo_barras,
    peso: jsonProduct.peso,
    origem: jsonProduct.origem || 'Nacional',
    visualizacoes: jsonProduct.visualizacoes || Math.floor(Math.random() * 3000 + 500),
    conversoes: jsonProduct.conversoes || Math.floor(Math.random() * 1000 + 100),
    estoque: estoque,
    endereco: jsonProduct.endereco,
    telefone: jsonProduct.telefone,
    tags: [...new Set(tags)]
  };
}

// ✅ BUSCA INTELIGENTE COM SINÔNIMOS
function searchProducts(products: Product[], query: string): Product[] {
  if (!query.trim()) return products;

  const searchTerm = query.toLowerCase().trim();
  console.log(`🔍 Buscando por: "${searchTerm}"`);

  // ✅ MAPA DE SINÔNIMOS EXPANDIDO
  const synonyms: Record<string, string[]> = {
    // Bebidas
    'refrigerante': ['coca', 'pepsi', 'guaraná', 'soda', 'refri'],
    'suco': ['juice', 'bebida', 'néctar'],
    'água': ['water', 'mineral', 'bonafont'],
    'cerveja': ['beer', 'heineken', 'brahma', 'stella'],
    
    // Carnes
    'carne': ['bovina', 'frango', 'suína', 'proteína', 'peito', 'contrafilé', 'picanha'],
    'frango': ['ave', 'peito', 'coxa', 'asas'],
    'peixe': ['pescado', 'atum', 'salmão'],
    
    // Limpeza
    'limpeza': ['detergente', 'sabão', 'desinfetante', 'cleaning'],
    'sabão': ['detergente', 'omo', 'ypê', 'limpeza'],
    
    // Higiene
    'higiene': ['shampoo', 'sabonete', 'creme dental', 'desodorante'],
    'shampoo': ['cabelo', 'pantene', 'seda'],
    
    // Laticínios
    'leite': ['dairy', 'parmalat', 'lácteo'],
    'queijo': ['mussarela', 'prato', 'dairy'],
    
    // Grãos
    'arroz': ['cereal', 'grão', 'tio joão', 'camil'],
    'feijão': ['grão', 'kicaldo', 'camil'],
    
    // Outros
    'pão': ['padaria', 'pullman', 'forma'],
    'café': ['pilão', 'orfeu', 'nescafé'],
    'óleo': ['soja', 'girassol', 'liza'],
    'açúcar': ['doce', 'união', 'cristal']
  };

  // Buscar sinônimos
  let expandedTerms = [searchTerm];
  
  // Adicionar sinônimos diretos
  if (synonyms[searchTerm]) {
    expandedTerms.push(...synonyms[searchTerm]);
  }
  
  // Buscar termos que tenham o searchTerm como sinônimo
  Object.entries(synonyms).forEach(([key, values]) => {
    if (values.some(synonym => synonym.includes(searchTerm) || searchTerm.includes(synonym))) {
      expandedTerms.push(key, ...values);
    }
  });

  // Remover duplicatas
  expandedTerms = [...new Set(expandedTerms)];

  console.log(`🎯 Termos expandidos:`, expandedTerms);

  // Filtrar produtos
  const results = products.filter(product => {
    const searchableText = [
      product.nome,
      product.categoria,
      product.subcategoria,
      product.marca,
      product.loja,
      product.descricao,
      ...(product.tags || [])
    ].join(' ').toLowerCase();

    // Verificar se algum termo expandido está presente
    return expandedTerms.some(term => 
      searchableText.includes(term) ||
      product.nome.toLowerCase().includes(term) ||
      product.categoria.toLowerCase().includes(term)
    );
  });

  console.log(`✅ Encontrados ${results.length} produtos para "${query}"`);
  return results;
}

// ✅ BUSCA POR CATEGORIA
function searchByCategory(products: Product[], categoryId: string): Product[] {
  if (categoryId === 'all') return products;
  
  return products.filter(product => 
    product.categoria === categoryId ||
    product.categoria.includes(categoryId) ||
    product.subcategoria === categoryId
  );
}

// ✅ GERAR SUGESTÕES INTELIGENTES
function generateSmartSuggestions(products: Product[], query: string = ''): string[] {
  if (!query.trim()) {
    // Sugestões populares quando não há busca
    return [
      'Coca Cola', 'Arroz', 'Feijão', 'Leite', 'Pão', 
      'Café', 'Óleo', 'Açúcar', 'Detergente', 'Shampoo'
    ];
  }

  const searchTerm = query.toLowerCase();
  const suggestions: string[] = [];

  // Buscar produtos que começam com o termo
  products.forEach(product => {
    if (product.nome.toLowerCase().startsWith(searchTerm)) {
      suggestions.push(product.nome);
    }
  });

  // Buscar categorias relacionadas
  const categories = [...new Set(products.map(p => p.categoria))];
  categories.forEach(cat => {
    if (cat.toLowerCase().includes(searchTerm)) {
      suggestions.push(cat.charAt(0).toUpperCase() + cat.slice(1));
    }
  });

  return [...new Set(suggestions)].slice(0, 8);
}

// ✅ PROCESSAR DADOS JSON
function processJSONData(jsonData: any): {
  products: Product[];
  categories: Category[];
  markets: string[];
  brands: string[];
} {
  let products: Product[] = [];
  
  if (jsonData.produtos && Array.isArray(jsonData.produtos)) {
    products = jsonData.produtos.map(transformJSONToProduct);
    console.log(`📦 ${products.length} produtos processados`);
  }
  
  // Marcar melhores preços por categoria
  const productsByCategory = products.reduce((acc, product) => {
    if (!acc[product.categoria]) {
      acc[product.categoria] = [];
    }
    acc[product.categoria].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  Object.keys(productsByCategory).forEach(categoria => {
    const categoryProducts = productsByCategory[categoria];
    const minPrice = Math.min(...categoryProducts.map(p => p.preco));
    categoryProducts.forEach(product => {
      if (product.preco === minPrice) {
        product.isMelhorPreco = true;
      }
    });
  });

  // Extrair categorias
  const categoriesFromProducts = Array.from(new Set(products.map(p => p.categoria)));
  
  const categories: Category[] = categoriesFromProducts.map(catId => {
    const productCount = products.filter(p => p.categoria === catId).length;
    
    return {
      id: catId,
      label: catId.charAt(0).toUpperCase() + catId.slice(1),
      icon: getCategoryIcon(catId),
      count: productCount
    };
  });

  // Adicionar categoria "all"
  categories.unshift({
    id: 'all',
    label: 'Todas as Categorias',
    icon: '🛒',
    count: products.length
  });

  // Extrair mercados e marcas
  const markets = Array.from(new Set(products.map(p => p.loja).filter(Boolean)));
  const brands = Array.from(new Set(products.map(p => p.marca).filter(Boolean)));

  return { products, categories, markets, brands };
}

// ✅ ÍCONES DAS CATEGORIAS
function getCategoryIcon(categoria: string): string {
  const icons: Record<string, string> = {
    'bebidas': '🥤', 'carnes': '🥩', 'laticinios': '🥛', 'graos': '🌾',
    'limpeza': '🧽', 'higiene': '🧴', 'frutas': '🍎', 'verduras': '🥬',
    'hortifruti': '🥕', 'massas': '🍝', 'cafe': '☕', 'acucar': '🍯',
    'oleos': '🫒', 'biscoitos': '🍪', 'paes': '🍞', 'panificacao': '🥖',
    'congelados': '🧊', 'doces': '🍬', 'temperos': '🌿', 'enlatados': '🥫',
    'cereais': '🥣', 'petiscos': '🍿', 'pereciveis': '🥚', 'frios': '🧀',
    'salgadinhos': '🍿', 'condimentos': '🌶️'
  };
  
  return icons[categoria] || '📦';
}

// ✅ HOOK PRINCIPAL
export function useProductData(): UseProductDataReturn {
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [markets, setMarkets] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataSource, setDataSource] = useState<DataSourceType>('none');
  const [apiConnected, setApiConnected] = useState(false);
  const [jsonLoaded, setJsonLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const cacheRef = useRef<{
    products: Product[];
    timestamp: number;
  } | null>(null);

  // ✅ CARREGAMENTO DO JSON (CAMINHO CORRIGIDO)
  const loadFromJSON = useCallback(async (): Promise<Product[]> => {
    try {
      console.log('🔄 useProductData - Carregando dados do JSON...');
      
      // ✅ CORREÇÃO: Caminhos corretos para o arquivo
      const possiblePaths = [
        '/produtos-mock.json',           // ✅ CAMINHO CORRETO
        './produtos-mock.json',          // ✅ ALTERNATIVO
        '/public/produtos-mock.json',    // ✅ FALLBACK
        'produtos-mock.json'             // ✅ ÚLTIMO RECURSO
      ];

      let jsonData = null;
      let loadedFrom = '';

      for (const path of possiblePaths) {
        try {
          console.log(`🔍 useProductData - Tentando carregar de: ${path}`);
          const response = await fetch(path);
          if (response.ok) {
            jsonData = await response.json();
            loadedFrom = path;
            console.log(`✅ useProductData - JSON carregado com sucesso de: ${path}`);
            break;
          } else {
            console.log(`❌ useProductData - Falha ao carregar de ${path}: ${response.status}`);
          }
        } catch (err) {
          console.log(`❌ useProductData - Erro ao tentar ${path}:`, err);
        }
      }

      if (!jsonData) {
        throw new Error('❌ Arquivo produtos-mock.json não encontrado. Verifique se está em /public/produtos-mock.json');
      }

      console.log('📊 useProductData - Dados JSON carregados:', {
        produtos: jsonData.produtos?.length || 0,
        mercados: jsonData.mercados?.length || 0,
        metadata: jsonData.metadata
      });

      const { products, categories: cats, markets: mkts, brands: brds } = processJSONData(jsonData);
      
      setAllProducts(products);
      setCategories(cats);
      setMarkets(mkts);
      setBrands(brds);
      setJsonLoaded(true);
      setError(null);

      console.log(`📊 useProductData - Dados processados:`, {
        produtos: products.length,
        categorias: cats.length,
        mercados: mkts.length,
        marcas: brds.length,
        disponíveis: products.filter(p => p.disponivel).length
      });
      
      return products;
    } catch (err) {
      console.error('❌ useProductData - Erro ao carregar JSON:', err);
      setJsonLoaded(false);
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados locais');
      return [];
    }
  }, []);

  // ✅ BUSCA INTELIGENTE
  const performSmartSearch = useCallback(async (query: string): Promise<Product[]> => {
    console.log(`🔍 useProductData - Busca inteligente iniciada para: "${query}"`);
    
    // ✅ VERIFICAR SE DADOS ESTÃO CARREGADOS
    if (!allProducts || allProducts.length === 0) {
      console.warn('⚠️ useProductData - allProducts vazio, tentando carregar...');
      await loadFromJSON();
    }

    if (!query.trim()) {
      console.log('📄 useProductData - Query vazia, retornando todos os produtos');
      setProducts(allProducts);
      return allProducts;
    }

    setLoading(true);
    try {
      console.log(`🔍 useProductData - Executando busca em ${allProducts.length} produtos`);
      
      const searchResults = searchProducts(allProducts, query);
      
      setProducts(searchResults);
      setDataSource('json');
      
      console.log(`✅ useProductData - Busca concluída: ${searchResults.length} resultados para "${query}"`);
      return searchResults;
      
    } catch (err) {
      console.error('❌ useProductData - Erro na busca:', err);
      setError('Erro ao buscar produtos');
      setProducts([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [allProducts, loadFromJSON]);

  // ✅ BUSCA POR CATEGORIA
  const loadProductsByCategory = useCallback(async (categoryId: string): Promise<Product[]> => {
    console.log(`📂 useProductData - Carregando categoria: ${categoryId}`);
    
    setLoading(true);

    try {
      let filteredProducts: Product[];

      if (categoryId === 'all') {
        filteredProducts = allProducts;
        console.log(`📂 useProductData - Categoria "all": ${filteredProducts.length} produtos`);
      } else {
        filteredProducts = searchByCategory(allProducts, categoryId);
        console.log(`📂 useProductData - Categoria "${categoryId}": ${filteredProducts.length} produtos`);
      }

      setProducts(filteredProducts);
      setDataSource('json');
      
      return filteredProducts;
      
    } catch (err) {
      console.error('❌ useProductData - Erro ao filtrar por categoria:', err);
      setError('Erro ao carregar categoria');
      return [];
    } finally {
      setLoading(false);
    }
  }, [allProducts]);

  // ✅ SUGESTÕES INTELIGENTES
  const getSmartSuggestions = useCallback((query: string = ''): string[] => {
    const suggestions = generateSmartSuggestions(allProducts, query);
    console.log(`💡 useProductData - Sugestões para "${query}":`, suggestions);
    return suggestions;
  }, [allProducts]);

  // ✅ CARREGAMENTO INICIAL
  const loadProducts = useCallback(async (): Promise<void> => {
    console.log('🚀 useProductData - Iniciando carregamento de produtos...');
    
    setLoading(true);
    setError(null);

    try {
      const jsonProducts = await loadFromJSON();
      
      if (jsonProducts.length > 0) {
        setProducts(jsonProducts);
        setDataSource('json');
        
        // Cache dos produtos
        cacheRef.current = {
          products: jsonProducts,
          timestamp: Date.now()
        };
        
        console.log('✅ useProductData - Sistema PRECIVOX carregado com sucesso!');
        console.log(`📊 useProductData - Total de produtos disponíveis: ${jsonProducts.length}`);
      } else {
        setDataSource('none');
        console.warn('⚠️ useProductData - Nenhum produto foi carregado');
      }

    } catch (err) {
      console.error('❌ useProductData - Erro no carregamento:', err);
      setError('Erro ao carregar dados do sistema');
      setDataSource('none');
    } finally {
      setLoading(false);
    }
  }, [loadFromJSON]);

  // ✅ RECARREGAR DADOS
  const reloadData = useCallback(async (): Promise<void> => {
    console.log('🔄 useProductData - Recarregando dados...');
    cacheRef.current = null;
    await loadProducts();
  }, [loadProducts]);

  // ✅ LIMPAR CACHE
  const clearCache = useCallback((): void => {
    cacheRef.current = null;
    console.log('🗑️ useProductData - Cache limpo');
  }, []);

  // ✅ EFEITO INICIAL - CARREGAMENTO AUTOMÁTICO
  useEffect(() => {
    console.log('🎬 useProductData - Montando hook...');
    loadProducts();
  }, []);

  // ✅ LOGS DE DEBUG
  useEffect(() => {
    console.log('📈 useProductData - Estado atualizado:', {
      allProducts: allProducts.length,
      products: products.length,
      categories: categories.length,
      markets: markets.length,
      brands: brands.length,
      loading,
      jsonLoaded,
      error,
      dataSource
    });
  }, [allProducts, products, categories, markets, brands, loading, jsonLoaded, error, dataSource]);

  return {
    products,
    allProducts,
    categories,
    markets,
    brands,
    loading,
    dataSource,
    apiConnected,
    jsonLoaded,
    error,
    loadProducts,
    searchProducts: performSmartSearch, // ✅ FUNÇÃO PRINCIPAL DE BUSCA
    loadProductsByCategory,
    reloadData,
    clearCache,
    getSmartSuggestions,
    searchTerm,
    setSearchTerm
  };
}

export default useProductData;