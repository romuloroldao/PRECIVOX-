// utils/jsonTransformer.ts

import { JSONProduct, Product } from '../types/index';

/**
 * Transforma produtos do formato JSON para o formato da interface Product
 */
export function transformJSONToProduct(jsonProduct: JSONProduct): Product {
  return {
    // ✅ Converter id de number para string
    id: String(jsonProduct.id),
    
    // ✅ Campos diretos (já compatíveis)
    nome: jsonProduct.nome,
    preco: typeof jsonProduct.preco === 'string' ? parseFloat(jsonProduct.preco) : jsonProduct.preco,
    categoria: jsonProduct.categoria,
    subcategoria: jsonProduct.subcategoria,
    imagem: jsonProduct.imagem,
    
    // ✅ Campo loja (JSON tem "loja" que é o que queremos)
    loja: jsonProduct.mercado || '', // Usar 'mercado' do JSON como 'loja'
    lojaId: String(jsonProduct.id), // Usar ID como lojaId temporário
    
    // ✅ Campos opcionais
    descricao: jsonProduct.descricao,
    distancia: undefined, // Será calculado depois se necessário
    
    // ✅ Transformar estrutura da promoção
    promocao: jsonProduct.promocao ? {
      ativo: Boolean(jsonProduct.promocao),
      desconto: jsonProduct.desconto || 0,
      precoOriginal: typeof jsonProduct.preco === 'string' ? parseFloat(jsonProduct.preco) : jsonProduct.preco,
      validoAte: undefined
    } : undefined,
    
    // ✅ Renomear rating para avaliacao
    avaliacao: jsonProduct.rating,
    numeroAvaliacoes: undefined,
    
    // ✅ Campo disponivel (assumir true se não especificado)
    disponivel: jsonProduct.disponivel !== undefined ? jsonProduct.disponivel : true,
    
    // ✅ Campos opcionais restantes
    tempoEntrega: undefined,
    isNovo: false, // Assumir false se não especificado
    isMelhorPreco: false, // Será calculado depois
    marca: jsonProduct.marca,
    codigo: jsonProduct.codigo_barras,
    peso: jsonProduct.peso,
    origem: jsonProduct.origem,
    visualizacoes: jsonProduct.visualizacoes,
    conversoes: jsonProduct.conversoes,
    estoque: jsonProduct.estoque,
    endereco: jsonProduct.endereco,
    telefone: jsonProduct.telefone,
    tags: jsonProduct.tags || []
  };
}

/**
 * Transforma array de produtos JSON para array de Products
 */
export function transformJSONProductsArray(jsonProducts: JSONProduct[]): Product[] {
  return jsonProducts.map(transformJSONToProduct);
}

/**
 * Calcula quais produtos têm o melhor preço por categoria
 */
export function markBestPriceProducts(products: Product[]): Product[] {
  const productsByCategory = products.reduce((acc, product) => {
    if (!acc[product.categoria]) {
      acc[product.categoria] = [];
    }
    acc[product.categoria].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  // Para cada categoria, marcar o produto com menor preço
  Object.keys(productsByCategory).forEach(categoria => {
    const categoryProducts = productsByCategory[categoria];
    const minPrice = Math.min(...categoryProducts.map(p => p.preco));
    
    categoryProducts.forEach(product => {
      product.isMelhorPreco = product.preco === minPrice;
    });
  });

  return products;
}

/**
 * Processa dados JSON completos
 */
export function processJSONData(jsonData: any): {
  products: Product[];
  categories: any[];
  markets: string[];
  brands: string[];
} {
  // Transformar produtos
  let products = transformJSONProductsArray(jsonData.produtos || []);
  
  // Marcar melhores preços
  products = markBestPriceProducts(products);
  
  // Extrair categorias únicas
  const categories = Array.from(new Set(products.map(p => p.categoria)))
    .map(cat => ({
      id: cat,
      label: cat.charAt(0).toUpperCase() + cat.slice(1),
      count: products.filter(p => p.categoria === cat).length
    }));

  // Extrair mercados únicos
  const markets = Array.from(new Set(products.map(p => p.loja).filter(Boolean)));

  // Extrair marcas únicas
  const brands = Array.from(new Set(products.map(p => p.marca).filter(Boolean)));

  return {
    products,
    categories,
    markets,
    brands
  };
}

/**
 * Função para debug - mostra diferenças entre JSON e Product
 */
export function debugJSONTransformation(jsonProduct: JSONProduct) {
  console.log('🔍 Debug JSON → Product:');
  console.log('JSON:', {
    id: jsonProduct.id, // number
    mercado: jsonProduct.mercado, // string
    rating: jsonProduct.rating, // number
    promocao: jsonProduct.promocao, // boolean
    desconto: jsonProduct.desconto // number
  });
  
  const transformed = transformJSONToProduct(jsonProduct);
  console.log('Product:', {
    id: transformed.id, // string
    loja: transformed.loja, // string
    avaliacao: transformed.avaliacao, // number
    promocao: transformed.promocao // object
  });
}
