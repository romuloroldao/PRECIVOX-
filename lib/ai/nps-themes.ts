/**
 * Classificação leve de comentários NPS (PT-BR) por palavras-chave.
 * Não substitui NLP — é determinístico, explicável e suficiente para vendinha.
 */

export type TemaNpsId =
  | 'preco'
  | 'fila_caixa'
  | 'atendimento'
  | 'variedade'
  | 'limpeza'
  | 'estacionamento'
  | 'horario'
  | 'localizacao'
  | 'outros';

export const TEMA_NPS_LABEL: Record<TemaNpsId, string> = {
  preco: 'Preços',
  fila_caixa: 'Fila / caixa',
  atendimento: 'Atendimento',
  variedade: 'Variedade de produtos',
  limpeza: 'Limpeza / organização',
  estacionamento: 'Estacionamento',
  horario: 'Horário de funcionamento',
  localizacao: 'Localização / acesso',
  outros: 'Outros',
};

type KeywordRule = { tema: TemaNpsId; patterns: RegExp[] };

const RULES: KeywordRule[] = [
  {
    tema: 'preco',
    patterns: [
      /\b(pre[cç]o|caro|caros|caras|barato|barata|promo[cç][aã]o|desconto|conta|pagamento)\b/i,
    ],
  },
  {
    tema: 'fila_caixa',
    patterns: [/\b(fila|caixa|espera|demora|demorou|fila no)\b/i],
  },
  {
    tema: 'atendimento',
    patterns: [/\b(atendimento|funcion[áa]rio|educa[cç][aã]o|simp[áa]tico|rude)\b/i],
  },
  {
    tema: 'variedade',
    patterns: [/\b(variedade|falta|n[aã]o tem|sem estoque|acabou|ruptura)\b/i],
  },
  {
    tema: 'limpeza',
    patterns: [/\b(limpeza|limpo|sujo|higiene|organiza[cç][aã]o)\b/i],
  },
  {
    tema: 'estacionamento',
    patterns: [/\b(estacionamento|estacionar|vaga|carro)\b/i],
  },
  {
    tema: 'horario',
    patterns: [/\b(hor[áa]rio|fechado|cedo|tarde|abre|fecha)\b/i],
  },
  {
    tema: 'localizacao',
    patterns: [/\b(localiza[cç][aã]o|longe|perto|rua|bairro|dif[íi]cil acesso)\b/i],
  },
];

/**
 * Extrai um ou mais temas de um texto. Comentários vazios → outros.
 */
export function extrairTemasDeComentario(texto: string): TemaNpsId[] {
  const t = texto.trim();
  if (!t) return ['outros'];

  const found = new Set<TemaNpsId>();
  for (const rule of RULES) {
    for (const re of rule.patterns) {
      if (re.test(t)) {
        found.add(rule.tema);
        break;
      }
    }
  }

  if (found.size === 0) return ['outros'];
  return [...found];
}

export type ContagemTema = { id: TemaNpsId; label: string; count: number };

export function agregarTemas(
  comentarios: Array<{ texto: string | null; score: number }>,
  tipo: 'elogio' | 'critica'
): ContagemTema[] {
  const minScore = tipo === 'elogio' ? 9 : 0;
  const maxScore = tipo === 'elogio' ? 10 : 6;

  const map = new Map<TemaNpsId, number>();

  for (const { texto, score } of comentarios) {
    if (score < minScore || score > maxScore) continue;
    if (!texto?.trim()) continue;

    const temas = extrairTemasDeComentario(texto);
    for (const tema of temas) {
      map.set(tema, (map.get(tema) || 0) + 1);
    }
  }

  const rows: ContagemTema[] = [...map.entries()]
    .map(([id, count]) => ({
      id,
      label: TEMA_NPS_LABEL[id],
      count,
    }))
    .filter((r) => r.count > 0)
    .sort((a, b) => b.count - a.count);

  return rows;
}
