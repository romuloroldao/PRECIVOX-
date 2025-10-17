// 🧹 Funções de normalização e limpeza de dados

/**
 * Normaliza valores numéricos, removendo símbolos e convertendo vírgulas em pontos
 */
export const normalizeNumber = (value) => {
  if (value === null || value === undefined || value === '') return null;
  
  // Remove símbolos monetários e outros caracteres especiais
  let cleaned = String(value)
    .replace(/[R$\s]/g, '')
    .replace(/[^\d.,-]/g, '')
    .replace(',', '.');
  
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
};

/**
 * Normaliza texto, removendo espaços extras
 */
export const normalizeText = (value) => {
  if (!value) return '';
  return String(value)
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\sÀ-ÿ0-9.,\-()%]/g, '');
};

/**
 * Normaliza booleanos de diferentes formatos
 */
export const normalizeBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  const str = String(value).toLowerCase().trim();
  return ['true', '1', 'sim', 'yes', 's', 'y'].includes(str);
};

/**
 * Detecta unidade de medida no texto do produto
 */
export const detectUnit = (text) => {
  if (!text) return 'UN';
  
  const lower = text.toLowerCase();
  
  if (lower.match(/\d+\s*kg/)) return 'KG';
  if (lower.match(/\d+\s*g(?!\w)/)) return 'G';
  if (lower.match(/\d+\s*ml/)) return 'ML';
  if (lower.match(/\d+\s*l(?!\w)/)) return 'L';
  if (lower.match(/\d+\s*un/)) return 'UN';
  if (lower.match(/\d+\s*pç/)) return 'UN';
  if (lower.match(/\d+\s*und/)) return 'UN';
  if (lower.match(/pacote|caixa|fardo/)) return 'UN';
  
  return 'UN';
};

/**
 * Infere categoria baseado no nome do produto
 */
export const inferCategory = (text) => {
  if (!text) return 'Outros';
  
  const lower = text.toLowerCase();
  
  // Alimentos
  if (lower.match(/arroz|feijão|feijao|açúcar|acucar|óleo|oleo|leite|macarrão|macarrao|sal|farinha|café|cafe|pão|pao|massa|molho|tempero|grão|grao|cereais/)) {
    return 'Alimentos';
  }
  
  // Bebidas
  if (lower.match(/refrigerante|suco|água|agua|cerveja|vinho|energético|energetico|isotônico|isotonico/)) {
    return 'Bebidas';
  }
  
  // Limpeza
  if (lower.match(/detergente|sabão|sabao|limpeza|desinfetante|água sanitária|agua sanitaria|alvejante|limpa|amaciante|lava/)) {
    return 'Limpeza';
  }
  
  // Higiene
  if (lower.match(/shampoo|sabonete|pasta de dente|creme dental|desodorante|papel higiênico|papel higienico|fralda|absorvente/)) {
    return 'Higiene';
  }
  
  // Carnes e Frios
  if (lower.match(/carne|frango|peixe|linguiça|linguica|salsicha|presunto|mortadela|bacon/)) {
    return 'Carnes e Frios';
  }
  
  // Hortifruti
  if (lower.match(/tomate|alface|cebola|batata|cenoura|fruta|verdura|legume/)) {
    return 'Hortifruti';
  }
  
  // Padaria
  if (lower.match(/pão|pao|bolo|torta|biscoito|cookie|croissant/)) {
    return 'Padaria';
  }
  
  // Laticínios
  if (lower.match(/queijo|iogurte|manteiga|margarina|requeijão|requeijao|nata/)) {
    return 'Laticínios';
  }
  
  return 'Outros';
};

/**
 * Infere marca do nome do produto
 */
export const inferBrand = (text) => {
  if (!text) return 'Genérico';
  
  const knownBrands = [
    'Camil', 'União', 'Tio João', 'Primor', 'Sadia', 'Perdigão', 'Seara',
    'Nestlé', 'Coca-Cola', 'Pepsi', 'Omo', 'Ariel', 'Comfort', 'Dove',
    'Colgate', 'Palmolive', 'Johnson', 'Parmalat', 'Danone', 'Yoki',
    'Quaker', 'Maggi', 'Knorr', 'Hellmanns', 'Heinz', 'Pif Paf',
    'Aurora', 'Friboi', 'Swift', 'Marfrig', 'Itambé', 'Piracanjuba',
    'Ypê', 'Bombril', 'Bom Bril', 'Seda', 'Clear', 'Rexona'
  ];
  
  for (const brand of knownBrands) {
    if (text.toLowerCase().includes(brand.toLowerCase())) {
      return brand;
    }
  }
  
  const words = text.split(' ');
  const capitalizedWords = words.filter(w => 
    w.length > 2 && /^[A-ZÀ-Ÿ][a-zà-ÿ]+/.test(w)
  );
  
  if (capitalizedWords.length > 0) {
    return capitalizedWords[0];
  }
  
  return 'Genérico';
};

/**
 * Normaliza código de barras (EAN-13)
 */
export const normalizeBarcode = (value) => {
  if (!value) return '';
  
  const cleaned = String(value).replace(/\D/g, '');
  
  if (cleaned.length === 13 || cleaned.length === 8) {
    return cleaned;
  }
  
  if (cleaned.length > 0 && cleaned.length < 13) {
    return cleaned.padStart(13, '0');
  }
  
  return cleaned;
};

