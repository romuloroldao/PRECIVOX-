// src/utils/categoryIcons.ts - ÍCONES POR CATEGORIA v5.0
// ====================================
// CATEGORY ICONS - SEM DUPLICATAS
// ====================================

export interface CategoryIconMap {
  [key: string]: string;
}

// ✅ MAPA DE ÍCONES SEM CHAVES DUPLICADAS
export const CATEGORY_ICONS: CategoryIconMap = {
  // Alimentação Básica
  'alimentacao': '🍽️',
  'alimentos': '🍽️',
  'comida': '🍽️',
  'mercado': '🛒',
  'supermercado': '🛒',
  
  // Grãos e Cereais
  'graos': '🌾',
  'cereais': '🌾',
  'arroz': '🌾',
  'feijao': '🫘',
  'feijão': '🫘',
  'lentilha': '🫘',
  'quinoa': '🌾',
  'aveia': '🌾',
  'granola': '🌾',
  'farinha': '🌾',
  'farela': '🌾',
  'trigo': '🌾',
  'milho': '🌽',
  'pipoca': '🍿',
  
  // Proteínas e Carnes
  'carnes': '🥩',
  'carne': '🥩',
  'bovina': '🥩',
  'suina': '🥓',
  'suína': '🥓',
  'porco': '🥓',
  'frango': '🐔',
  'galinha': '🐔',
  'peixe': '🐟',
  'peixes': '🐟',
  'salmao': '🐟',
  'salmão': '🐟',
  'sardinha': '🐟',
  'atum': '🐟',
  'bacalhau': '🐟',
  'linguica': '🌭',
  'linguiça': '🌭',
  'salsicha': '🌭',
  'presunto': '🥓',
  'mortadela': '🥓',
  'salame': '🥓',
  'ovo': '🥚',
  'ovos': '🥚',
  
  // Laticínios
  'laticinios': '🥛',
  'laticínios': '🥛',
  'leite': '🥛',
  'iogurte': '🥛',
  'yogurt': '🥛',
  'queijo': '🧀',
  'queijos': '🧀',
  'mussarela': '🧀',
  'mozzarella': '🧀',
  'parmesao': '🧀',
  'parmesão': '🧀',
  'cheddar': '🧀',
  'gouda': '🧀',
  'ricota': '🧀',
  'cottage': '🧀',
  'manteiga': '🧈',
  'margarina': '🧈',
  'requeijao': '🧀',
  'requeijão': '🧀',
  'creme': '🧀',
  'nata': '🧀',
  
  // Frutas
  'frutas': '🍎',
  'fruta': '🍎',
  'maca': '🍎',
  'maçã': '🍎',
  'banana': '🍌',
  'laranja': '🍊',
  'limao': '🍋',
  'limão': '🍋',
  'uva': '🍇',
  'uvas': '🍇',
  'morango': '🍓',
  'morangos': '🍓',
  'pera': '🍐',
  'peras': '🍐',
  'pessego': '🍑',
  'pêssego': '🍑',
  'manga': '🥭',
  'mangas': '🥭',
  'abacaxi': '🍍',
  'kiwi': '🥝',
  'melancia': '🍉',
  'melao': '🍈',
  'melão': '🍈',
  'mamao': '🧡',
  'mamão': '🧡',
  'coco': '🥥',
  'abacate': '🥑',
  'tomate': '🍅',
  'tomates': '🍅',
  
  // Verduras e Legumes
  'verduras': '🥬',
  'legumes': '🥕',
  'vegetais': '🥬',
  'alface': '🥬',
  'rúcula': '🥬',
  'rucula': '🥬',
  'espinafre': '🥬',
  'couve': '🥬',
  'brocolis': '🥦',
  'brócolis': '🥦',
  'cenoura': '🥕',
  'cenouras': '🥕',
  'batata': '🥔',
  'batatas': '🥔',
  'cebola': '🧅',
  'cebolas': '🧅',
  'alho': '🧄',
  'pimentao': '🫑',
  'pimentão': '🫑',
  'pepino': '🥒',
  'pepinos': '🥒',
  'abobrinha': '🥒',
  'berinjela': '🍆',
  'berinjelas': '🍆',
  'pimenta': '🌶️',
  'pimentas': '🌶️',
  'salsa': '🌿',
  'salsinha': '🌿',
  'coentro': '🌿',
  'cebolinha': '🌿',
  'manjericao': '🌿',
  'manjericão': '🌿',
  'oregano': '🌿',
  'orégano': '🌿',
  
  // Bebidas
  'bebidas': '🥤',
  'bebida': '🥤',
  'agua': '💧',
  'água': '💧',
  'refrigerante': '🥤',
  'refrigerantes': '🥤',
  'coca': '🥤',
  'pepsi': '🥤',
  'guarana': '🥤',
  'guaraná': '🥤',
  'suco': '🧃',
  'sucos': '🧃',
  'cha': '🍵',
  'chá': '🍵',
  'cafe': '☕',
  'café': '☕',
  'cerveja': '🍺',
  'cervejas': '🍺',
  'vinho': '🍷',
  'vinhos': '🍷',
  'cachaca': '🥃',
  'cachaça': '🥃',
  'vodka': '🥃',
  'whisky': '🥃',
  'energetico': '⚡',
  'energético': '⚡',
  'isotonica': '🥤',
  'isotônica': '🥤',
  
  // Pães e Panificação
  'paes': '🍞',
  'pães': '🍞',
  'pao': '🍞',
  'pão': '🍞',
  'baguete': '🥖',
  'frances': '🥖',
  'francês': '🥖',
  'bisnaguinha': '🍞',
  'brioche': '🍞',
  'croissant': '🥐',
  'torrada': '🍞',
  'torradas': '🍞',
  'biscoito': '🍪',
  'biscoitos': '🍪',
  'bolacha': '🍪',
  'bolachas': '🍪',
  'bolo': '🎂',
  'bolos': '🎂',
  'massa': '🍝',
  'massas': '🍝',
  'macarrao': '🍝',
  'macarrão': '🍝',
  'espaguete': '🍝',
  'penne': '🍝',
  'lasanha': '🍝',
  'nhoque': '🍝',
  
  // Doces e Confeitaria
  'doces': '🍭',
  'doce': '🍭',
  'chocolate': '🍫',
  'chocolates': '🍫',
  'bala': '🍬',
  'balas': '🍬',
  'pirulito': '🍭',
  'pirulitos': '🍭',
  'chiclete': '🍬',
  'bombom': '🍫',
  'bombons': '🍫',
  'trufa': '🍫',
  'trufas': '🍫',
  'pudim': '🍮',
  'sorvete': '🍦',
  'sorvetes': '🍦',
  'picole': '🍧',
  'picolé': '🍧',
  'gelato': '🍦',
  'açucar': '🍯',
  'açúcar': '🍯',
  'mel': '🍯',
  'geleia': '🍯',
  'geleias': '🍯',
  'compota': '🍯',
  'compotas': '🍯',
  
  // Higiene e Limpeza
  'higiene': '🧼',
  'limpeza': '🧽',
  'sabao': '🧼',
  'sabão': '🧼',
  'detergente': '🧴',
  'detergentes': '🧴',
  'amaciante': '🧴',
  'amaciantes': '🧴',
  'alvejante': '🧴',
  'desinfetante': '🧴',
  'desinfetantes': '🧴',
  'agua_sanitaria': '🧴',
  'sanitaria': '🧴',
  'papel': '🧻',
  'higienico': '🧻',
  'higiênico': '🧻',
  'toalha': '🧻',
  'guardanapo': '🧻',
  'guardanapos': '🧻',
  'lenco': '🧻',
  'lenço': '🧻',
  'lenços': '🧻',
  'fralda': '👶',
  'fraldas': '👶',
  
  // Cuidados Pessoais
  'cosmeticos': '💄',
  'cosméticos': '💄',
  'beleza': '💄',
  'shampoo': '🧴',
  'condicionador': '🧴',
  'sabonete': '🧼',
  'sabonetes': '🧼',
  'pasta': '🦷',
  'dente': '🦷',
  'dentes': '🦷',
  'escova': '🪥',
  'escovas': '🪥',
  'fio': '🦷',
  'dental': '🦷',
  'enxaguante': '🧴',
  'bucal': '🧴',
  'desodorante': '🧴',
  'perfume': '🧴',
  'locao': '🧴',
  'loção': '🧴',
  'hidratante': '🧴',
  'protetor': '☀️',
  'solar': '☀️',
  'bronzeador': '☀️',
  'maquiagem': '💄',
  'batom': '💄',
  'base': '💄',
  'rimel': '💄',
  'rímel': '💄',
  'mascara': '💄',
  'máscara': '💄',
  'esmalte': '💅',
  'esmaltes': '💅',
  
  // Casa e Utilidades
  'casa': '🏠',
  'utilidades': '🔧',
  'domesticas': '🔧',
  'domésticas': '🔧',
  'pilha': '🔋',
  'pilhas': '🔋',
  'bateria': '🔋',
  'baterias': '🔋',
  'lampada': '💡',
  'lâmpada': '💡',
  'lampadas': '💡',
  'lâmpadas': '💡',
  'vela': '🕯️',
  'velas': '🕯️',
  'isqueiro': '🔥',
  'fosforo': '🔥',
  'fósforo': '🔥',
  'aluminio': '📦',
  'alumínio': '📦',
  'plastico': '📦',
  'plástico': '📦',
  'saco': '🛍️',
  'sacos': '🛍️',
  'sacola': '🛍️',
  'sacolas': '🛍️',
  
  // Pets e Animais
  'pets': '🐕',
  'animais': '🐕',
  'pet': '🐕',
  'cao': '🐕',
  'cão': '🐕',
  'cachorro': '🐕',
  'cachorros': '🐕',
  'gato': '🐱',
  'gatos': '🐱',
  'racao': '🍖',
  'ração': '🍖',
  'petisco': '🦴',
  'brinquedo': '🎾',
  'brinquedos': '🎾',
  'coleira': '🦮',
  'coleiras': '🦮',
  'cama': '🛏️',
  'camas': '🛏️',
  'casinha': '🏠',
  'casinhas': '🏠',
  'areia': '🏖️',
  'areias': '🏖️',
  'higienica': '🏖️',
  
  // Farmácia e Saúde
  'farmacia': '💊',
  'farmácia': '💊',
  'medicamento': '💊',
  'medicamentos': '💊',
  'remedio': '💊',
  'remédio': '💊',
  'remedios': '💊',
  'remédios': '💊',
  'vitamina': '💊',
  'vitaminas': '💊',
  'suplemento': '💊',
  'suplementos': '💊',
  'proteina': '💪',
  'proteína': '💪',
  'whey': '💪',
  'creatina': '💪',
  'termogenico': '🔥',
  'termogênico': '🔥',
  'analgesico': '💊',
  'analgésico': '💊',
  'antibiotico': '💊',
  'antibiótico': '💊',
  'antialergico': '💊',
  'antialérgico': '💊',
  'antigripal': '💊',
  'dipirona': '💊',
  'paracetamol': '💊',
  'ibuprofeno': '💊',
  'aspirina': '💊',
  'band': '🩹',
  'curativo': '🩹',
  'curativos': '🩹',
  'gaze': '🩹',
  'algodao': '🩹',
  'algodão': '🩹',
  'alcool': '🧴',
  'álcool': '🧴',
  'iodo': '🧴',
  'agua_oxigenada': '🧴',
  'oxigenada': '🧴',
  'termometro': '🌡️',
  'termômetro': '🌡️',
  
  // Bebês e Infantil
  'bebe': '👶',
  'bebê': '👶',
  'bebes': '👶',
  'bebês': '👶',
  'infantil': '👶',
  'crianca': '👶',
  'criança': '👶',
  'criancas': '👶',
  'crianças': '👶',
  'mamadeira': '🍼',
  'mamadeiras': '🍼',
  'chupeta': '🍼',
  'chupetas': '🍼',
  'babador': '👶',
  'babadores': '👶',
  'brinquedos_bebe': '🧸',
  'brinquedo_infantil': '🧸',
  'boneca': '🪆',
  'bonecas': '🪆',
  'carrinho': '🚗',
  'carrinhos': '🚗',
  'quebra': '🧩',
  'cabeca': '🧩',
  'cabeça': '🧩',
  'lego': '🧱',
  'blocos': '🧱',
  'massinha': '🎨',
  'tinta': '🎨',
  'tintas': '🎨',
  'giz': '✏️',
  'lapis': '✏️',
  'lápis': '✏️',
  'caneta': '✒️',
  'canetas': '✒️',
  'papel_escolar': '📄',
  'caderno': '📓',
  'cadernos': '📓',
  
  // Eletrônicos
  'eletronicos': '📱',
  'eletrônicos': '📱',
  'celular': '📱',
  'celulares': '📱',
  'smartphone': '📱',
  'smartphones': '📱',
  'tablet': '📱',
  'tablets': '📱',
  'fone': '🎧',
  'fones': '🎧',
  'ouvido': '🎧',
  'headphone': '🎧',
  'headphones': '🎧',
  'carregador': '🔌',
  'carregadores': '🔌',
  'cabo': '🔌',
  'cabos': '🔌',
  'adaptador': '🔌',
  'adaptadores': '🔌',
  'powerbank': '🔋',
  'caixa': '🔊',
  'som': '🔊',
  'alto': '🔊',
  'falante': '🔊',
  'speaker': '🔊',
  'bluetooth': '📶',
  'wifi': '📶',
  'roteador': '📶',
  'modem': '📶',
  
  // Categorias Gerais (fallback)
  'outros': '📦',
  'geral': '📦',
  'diversos': '📦',
  'variados': '📦',
  'promocao': '🏷️',
  'promoção': '🏷️',
  'oferta': '🏷️',
  'ofertas': '🏷️',
  'desconto': '💰',
  'descontos': '💰',
  'liquidacao': '💸',
  'liquidação': '💸',
  'queima': '🔥',
  'estoque': '📦',
  'novo': '✨',
  'novos': '✨',
  'nova': '✨',
  'novas': '✨',
  'importado': '🌍',
  'importados': '🌍',
  'nacional': '🇧🇷',
  'nacionais': '🇧🇷',
  'organico': '🌱',
  'orgânico': '🌱',
  'organicos': '🌱',
  'orgânicos': '🌱',
  'natural': '🌿',
  'naturais': '🌿',
  'diet': '🥗',
  'light': '🥗',
  'zero': '🥗',
  'sem': '🥗',
  'lactose': '🥗',
  'gluten': '🥗',
  'glutén': '🥗',
  'sem_acucar': '🥗',
  'acucar': '🥗',
  'integral': '🌾',
  'integrais': '🌾',
  'fitness': '💪',
  'proteico': '💪',
  'proteicos': '💪'
};

// ✅ FUNÇÃO PARA OBTER ÍCONE POR CATEGORIA
export const getCategoryIcon = (category: string): string => {
  if (!category) return '📦';
  
  const normalizedCategory = category
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Remove acentos
  
  // Busca exata primeiro
  if (CATEGORY_ICONS[normalizedCategory]) {
    return CATEGORY_ICONS[normalizedCategory];
  }
  
  // Busca por palavras-chave
  for (const [key, icon] of Object.entries(CATEGORY_ICONS)) {
    if (normalizedCategory.includes(key) || key.includes(normalizedCategory)) {
      return icon;
    }
  }
  
  // Fallback para ícone genérico
  return '📦';
};

// ✅ FUNÇÃO PARA OBTER COR POR CATEGORIA
export const getCategoryColor = (category: string): string => {
  const colors: { [key: string]: string } = {
    'alimentacao': '#10B981', // Verde
    'bebidas': '#3B82F6', // Azul
    'limpeza': '#8B5CF6', // Roxo
    'higiene': '#EC4899', // Rosa
    'cosmeticos': '#F59E0B', // Amarelo
    'casa': '#6B7280', // Cinza
    'pets': '#F97316', // Laranja
    'farmacia': '#EF4444', // Vermelho
    'eletronicos': '#06B6D4', // Ciano
    'bebe': '#84CC16', // Verde Lima
    'default': '#6B7280' // Cinza padrão
  };
  
  const normalizedCategory = category.toLowerCase();
  
  for (const [key, color] of Object.entries(colors)) {
    if (normalizedCategory.includes(key)) {
      return color;
    }
  }
  
  return colors.default;
};

// ✅ FUNÇÃO PARA VALIDAR CATEGORIAS
export const validateCategory = (category: string): boolean => {
  return Object.keys(CATEGORY_ICONS).includes(category.toLowerCase());
};

// ✅ FUNÇÃO PARA SUGERIR CATEGORIAS
export const suggestCategories = (input: string, limit: number = 5): string[] => {
  const normalizedInput = input.toLowerCase().trim();
  
  return Object.keys(CATEGORY_ICONS)
    .filter(key => key.includes(normalizedInput))
    .slice(0, limit);
};

export default CATEGORY_ICONS;