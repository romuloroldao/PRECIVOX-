export function seedId(suffix: string): string {
  return `seed-v3-${suffix}`;
}

export function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomFloat(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** EAN-13 único por mercado (prefixo 789 + índice mercado + sequência). */
export function codigoBarrasIsolado(mercadoIdx: number, seq: number): string {
  const base = `789${String(mercadoIdx).padStart(2, '0')}${String(seq).padStart(8, '0')}`;
  return base.slice(0, 13);
}

const CATEGORIAS = ['Bebidas', 'Limpeza', 'Higiene', 'Mercearia', 'Laticínios', 'Hortifruti', 'Carnes', 'Padaria'];
const MARCAS = ['MarcaA', 'MarcaB', 'MarcaC', 'Ypê', 'Nestlé', 'Sadia', 'Qualy', 'Barilla'];

export function gerarProdutoIsolado(mercadoId: string, mercadoIdx: number, seq: number) {
  const cat = pick(CATEGORIAS);
  const marca = pick(MARCAS);
  const nome = `${cat} ${marca} SKU ${mercadoIdx}-${seq}`;
  return {
    id: seedId(`prod-m${mercadoIdx}-${seq}`),
    mercadoId,
    nome,
    descricao: `Produto isolado mercado ${mercadoIdx} #${seq}`,
    categoria: cat,
    codigoBarras: codigoBarrasIsolado(mercadoIdx, seq),
    marca,
    unidadeMedida: 'UN',
    preco: parseFloat(randomFloat(2, 89).toFixed(2)),
  };
}
