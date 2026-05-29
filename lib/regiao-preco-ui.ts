import type { RegiaoPrecoRef } from '@/lib/ai/conversao-metrics';

/** Opções de agregação regional exibidas nos cards gestor. */
export const REGIAO_PRECO_UI: { id: RegiaoPrecoRef; label: string }[] = [
  { id: 'cep5', label: 'CEP5' },
  { id: 'poligono', label: 'Bairro' },
  { id: 'cidade', label: 'Cidade' },
  { id: 'ampla', label: 'UF' },
  { id: 'proximidade', label: 'Raio' },
];

export type RegiaoPrecoApi = {
  pedido: RegiaoPrecoRef;
  efetivo: RegiaoPrecoRef;
  fallbackDeCidadeParaAmpla: boolean;
  fallbackDePoligonoParaCep5?: boolean;
  fallbackDeCep5ParaCidade?: boolean;
  cep5?: string | null;
  bairro?: string | null;
  raioKm?: number;
};

/** Texto curto sobre qual região está sendo usada na referência de preço. */
export function detalheRegiaoPreco(r?: RegiaoPrecoApi): string {
  if (!r) return 'média agregada na sua região (por categoria)';
  if (r.fallbackDePoligonoParaCep5 && r.cep5) {
    return `CEP ${r.cep5} (polígono do bairro indisponível)`;
  }
  if (r.fallbackDeCep5ParaCidade) {
    return 'média por cidade/UF (cadastre CEP da unidade para agregação hiperlocal)';
  }
  if (r.fallbackDeCidadeParaAmpla) {
    return 'média com visão ampliada (cadastre a cidade da unidade para aproximar do entorno físico)';
  }
  if (r.efetivo === 'cep5' && r.cep5) {
    return `mesmo CEP5 (${r.cep5})${r.bairro ? ` · ${r.bairro}` : ''}`;
  }
  if (r.efetivo === 'poligono') {
    return `polígono do bairro${r.bairro ? ` (${r.bairro})` : ''}`;
  }
  if (r.efetivo === 'proximidade') {
    const km = r.raioKm ?? 25;
    return `média em raio de ~${km} km a partir do endereço geocodificado da unidade`;
  }
  if (r.efetivo === 'cidade') {
    return 'média no entorno imediato — mesma cidade do cadastro da unidade';
  }
  return 'média com visão ampliada na sua região (UF)';
}

export function regiaoPrecoFromCtx(
  ctx: {
    pedido: RegiaoPrecoRef;
    efetivo: RegiaoPrecoRef;
    fallbackDeCidadeParaAmpla: boolean;
    fallbackDePoligonoParaCep5?: boolean;
    fallbackDeCep5ParaCidade?: boolean;
    cep5?: string | null;
    bairro?: string | null;
  },
  raioKm: number
): RegiaoPrecoApi {
  return {
    pedido: ctx.pedido,
    efetivo: ctx.efetivo,
    fallbackDeCidadeParaAmpla: ctx.fallbackDeCidadeParaAmpla,
    fallbackDePoligonoParaCep5: ctx.fallbackDePoligonoParaCep5,
    fallbackDeCep5ParaCidade: ctx.fallbackDeCep5ParaCidade,
    cep5: ctx.cep5,
    bairro: ctx.bairro,
    raioKm,
  };
}
