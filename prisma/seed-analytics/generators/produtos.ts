import { randomFloat, randomInt, pick, gerarCodigoBarras, normalizarChave, seedId } from '../lib/utils';

export interface ProdutoGerado {
  id: string;
  nome: string;
  descricao: string;
  categoria: string;
  subcategoria: string;
  codigoBarras: string;
  marca: string;
  fornecedor: string;
  unidadeMedida: string;
  precoCusto: number;
  precoVenda: number;
  margem: number;
  estoqueMinimo: number;
  estoqueAtual: number;
  giroMedio: number;
  sazonalidade: number;
  validadeDias: number | null;
  curvaABC: 'A' | 'B' | 'C';
  elasticidade: number;
  nomeChave: string;
  chaveInsight: string;
}

interface CategoriaDef {
  nome: string;
  subcategorias: string[];
  marcas: string[];
  fornecedores: string[];
  unidades: string[];
  precoBase: { min: number; max: number };
  margem: { min: number; max: number };
  perecivel: boolean;
  sazonalidade: number;
}

const CATEGORIAS: CategoriaDef[] = [
  {
    nome: 'Hortifruti',
    subcategorias: ['Frutas', 'Verduras', 'Legumes', 'Orgânicos'],
    marcas: ['NatuFruit', 'Campo Verde', 'HortiFresh', 'Terra Fértil'],
    fornecedores: ['Cooperativa Agrícola SP', 'Distribuidora Fresh', 'CEASA Central'],
    unidades: ['KG', 'UN', 'MAÇO'],
    precoBase: { min: 2.5, max: 35 },
    margem: { min: 0.25, max: 0.55 },
    perecivel: true,
    sazonalidade: 0.8,
  },
  {
    nome: 'Bebidas',
    subcategorias: ['Refrigerantes', 'Sucos', 'Águas', 'Cervejas', 'Vinhos', 'Energéticos'],
    marcas: ['Coca-Cola', 'Ambev', 'Nestlé', 'São Lourenço', 'Red Bull', 'Sadia'],
    fornecedores: ['Ambev Distribuidora', 'Coca-Cola FEMSA', 'Heineken Brasil'],
    unidades: ['UN', 'LT', 'CX'],
    precoBase: { min: 2, max: 89 },
    margem: { min: 0.18, max: 0.42 },
    perecivel: false,
    sazonalidade: 0.6,
  },
  {
    nome: 'Limpeza',
    subcategorias: ['Detergentes', 'Desinfetantes', 'Limpadores', 'Sabão em Pó'],
    marcas: ['Ypê', 'Veja', 'Ajax', 'OMO', 'Pinho Sol', 'Uau'],
    fornecedores: ['Unilever Brasil', 'Química Amparo', 'Henkel'],
    unidades: ['UN', 'LT', 'KG'],
    precoBase: { min: 3, max: 45 },
    margem: { min: 0.22, max: 0.48 },
    perecivel: false,
    sazonalidade: 0.2,
  },
  {
    nome: 'Higiene',
    subcategorias: ['Sabonetes', 'Shampoo', 'Papel Higiênico', 'Fraldas', 'Desodorantes'],
    marcas: ['Dove', 'Pampers', 'Personal', 'Colgate', 'Rexona', 'Johnson'],
    fornecedores: ['P&G Brasil', 'Johnson & Johnson', 'Hypermarcas'],
    unidades: ['UN', 'CX', 'PCT'],
    precoBase: { min: 4, max: 120 },
    margem: { min: 0.25, max: 0.52 },
    perecivel: false,
    sazonalidade: 0.15,
  },
  {
    nome: 'Mercearia',
    subcategorias: ['Arroz', 'Feijão', 'Massas', 'Óleos', 'Enlatados', 'Temperos'],
    marcas: ['Tio João', 'Camil', 'Barilla', 'Liza', 'Quero', 'Kitano'],
    fornecedores: ['Camil Alimentos', 'General Mills', 'BRF Mercearia'],
    unidades: ['KG', 'UN', 'PCT'],
    precoBase: { min: 2, max: 38 },
    margem: { min: 0.12, max: 0.35 },
    perecivel: false,
    sazonalidade: 0.3,
  },
  {
    nome: 'Congelados',
    subcategorias: ['Sorvetes', 'Pizzas', 'Vegetais', 'Carnes', 'Pratos Prontos'],
    marcas: ['Kibon', 'Sadia', 'Perdigão', 'McCain', 'Seara'],
    fornecedores: ['Unilever Foods', 'BRF', 'JBS'],
    unidades: ['UN', 'PCT', 'KG'],
    precoBase: { min: 8, max: 65 },
    margem: { min: 0.2, max: 0.45 },
    perecivel: true,
    sazonalidade: 0.5,
  },
  {
    nome: 'Padaria',
    subcategorias: ['Pães', 'Bolos', 'Salgados', 'Doces'],
    marcas: ['Pullman', 'Wickbold', 'Seven Boys', 'Padaria Artesanal'],
    fornecedores: ['Bimbo Brasil', 'Panificadora Central'],
    unidades: ['UN', 'PCT', 'KG'],
    precoBase: { min: 3, max: 28 },
    margem: { min: 0.35, max: 0.65 },
    perecivel: true,
    sazonalidade: 0.25,
  },
  {
    nome: 'Açougue',
    subcategorias: ['Bovino', 'Suíno', 'Frango', 'Peixes', 'Embutidos'],
    marcas: ['Friboi', 'Seara', 'Perdigão', 'Costela Premium'],
    fornecedores: ['JBS', 'Marfrig', 'BRF'],
    unidades: ['KG', 'UN'],
    precoBase: { min: 12, max: 89 },
    margem: { min: 0.18, max: 0.4 },
    perecivel: true,
    sazonalidade: 0.45,
  },
  {
    nome: 'Laticínios',
    subcategorias: ['Leites', 'Iogurtes', 'Queijos', 'Manteigas'],
    marcas: ['Nestlé', 'Italac', 'Piracanjuba', 'Danone', 'Polenghi'],
    fornecedores: ['Nestlé Brasil', 'Laticínios Piracanjuba', 'Danone'],
    unidades: ['UN', 'LT', 'KG'],
    precoBase: { min: 3, max: 55 },
    margem: { min: 0.2, max: 0.42 },
    perecivel: true,
    sazonalidade: 0.35,
  },
  {
    nome: 'Snacks',
    subcategorias: ['Salgadinhos', 'Biscoitos', 'Chocolates', 'Barras de Cereal'],
    marcas: ['Elma Chips', 'Nestlé', 'Garoto', 'Marilan', 'Arcor'],
    fornecedores: ['PepsiCo', 'Mondelez', 'Nestlé'],
    unidades: ['UN', 'PCT'],
    precoBase: { min: 2, max: 25 },
    margem: { min: 0.28, max: 0.55 },
    perecivel: false,
    sazonalidade: 0.4,
  },
  {
    nome: 'Utilidades',
    subcategorias: ['Utensílios', 'Papelaria', 'Eletroportáteis', 'Organização'],
    marcas: ['Tramontina', 'Sanremo', 'Brinox', 'Nadir'],
    fornecedores: ['Tramontina', 'Utilidades Brasil'],
    unidades: ['UN', 'CX'],
    precoBase: { min: 5, max: 150 },
    margem: { min: 0.3, max: 0.6 },
    perecivel: false,
    sazonalidade: 0.1,
  },
  {
    nome: 'Pet Shop',
    subcategorias: ['Ração Cães', 'Ração Gatos', 'Petiscos', 'Higiene Pet'],
    marcas: ['Pedigree', 'Whiskas', 'Golden', 'Premier', 'GranPlus'],
    fornecedores: ['Mars Petcare', 'Premier Pet', 'Total Alimentos'],
    unidades: ['KG', 'UN', 'PCT'],
    precoBase: { min: 8, max: 180 },
    margem: { min: 0.25, max: 0.5 },
    perecivel: false,
    sazonalidade: 0.2,
  },
];

const ADJETIVOS = ['Integral', 'Light', 'Zero', 'Tradicional', 'Premium', 'Econômico', 'Orgânico', 'Diet'];
const TAMANHOS = ['200g', '500g', '1kg', '1L', '2L', '350ml', '500ml', '1,5L', '4 un', '6 un', '12 un'];

function gerarNomeProduto(cat: CategoriaDef, sub: string, marca: string): string {
  const adj = pick(ADJETIVOS);
  const tam = pick(TAMANHOS);
  const templates = [
    `${sub} ${marca} ${tam}`,
    `${marca} ${sub} ${adj} ${tam}`,
    `${sub} ${adj} ${marca}`,
    `${marca} ${sub} ${tam}`,
  ];
  return pick(templates);
}

function curvaABC(index: number, total: number): 'A' | 'B' | 'C' {
  const pct = index / total;
  if (pct < 0.2) return 'A';
  if (pct < 0.5) return 'B';
  return 'C';
}

export function gerarCatalogoProdutos(quantidade: number, startIndex = 0): ProdutoGerado[] {
  const produtos: ProdutoGerado[] = [];

  for (let i = 0; i < quantidade; i++) {
    const idx = startIndex + i;
    const cat = CATEGORIAS[i % CATEGORIAS.length];
    const sub = pick(cat.subcategorias);
    const marca = pick(cat.marcas);
    const fornecedor = pick(cat.fornecedores);
    const nome = gerarNomeProduto(cat, sub, marca);
    const precoCusto = randomFloat(cat.precoBase.min, cat.precoBase.max);
    const margemPct = randomFloat(cat.margem.min, cat.margem.max);
    const precoVenda = parseFloat((precoCusto / (1 - margemPct)).toFixed(2));
    const abc = curvaABC(i, quantidade);
    const giroBase = abc === 'A' ? randomFloat(5, 15) : abc === 'B' ? randomFloat(2, 6) : randomFloat(0.3, 2);
    const estoqueMin = abc === 'A' ? randomInt(30, 80) : abc === 'B' ? randomInt(15, 40) : randomInt(5, 20);
    const estoqueAtual = randomInt(estoqueMin, estoqueMin * randomInt(3, 12));

    produtos.push({
      id: seedId(`prod-${idx}`),
      nome,
      descricao: JSON.stringify({ subcategoria: sub, fornecedor, validadeDias: cat.perecivel ? randomInt(3, 90) : null }),
      categoria: cat.nome,
      subcategoria: sub,
      codigoBarras: gerarCodigoBarras(100000 + idx),
      marca,
      fornecedor,
      unidadeMedida: pick(cat.unidades),
      precoCusto,
      precoVenda,
      margem: margemPct,
      estoqueMinimo: estoqueMin,
      estoqueAtual: estoqueAtual,
      giroMedio: giroBase,
      sazonalidade: cat.sazonalidade * randomFloat(0.7, 1.3),
      validadeDias: cat.perecivel ? randomInt(3, 120) : null,
      curvaABC: abc,
      elasticidade: abc === 'A' ? randomFloat(-2.5, -1.2) : randomFloat(-1.8, -0.5),
      nomeChave: normalizarChave(nome),
      chaveInsight: gerarCodigoBarras(100000 + idx),
    });
  }

  return produtos;
}

export { CATEGORIAS };
