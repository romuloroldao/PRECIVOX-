/**
 * Fontes estruturadas para respostas GROOC (0.6 — IA explicável)
 */

export type GroocFonteTipo =
  | 'eventos'
  | 'metricas'
  | 'catalogo'
  | 'relatorio'
  | 'comportamento'
  | 'promocao';

export type GroocFonte = {
  tipo: GroocFonteTipo;
  descricao: string;
  periodoDias?: number;
  amostra?: string;
};

export function fonteGrooc(input: GroocFonte): GroocFonte {
  return input;
}

export function fontesGrooc(...fontes: GroocFonte[]): GroocFonte[] {
  return fontes;
}

/** Rótulo legível para UI */
export function formatarFonteGrooc(f: GroocFonte): string {
  const periodo = f.periodoDias ? ` (${f.periodoDias}d)` : '';
  const amostra = f.amostra ? ` · ${f.amostra}` : '';
  return `${f.descricao}${periodo}${amostra}`;
}

export function fontesGroocComoTexto(fontes: GroocFonte[]): string[] {
  return fontes.map(formatarFonteGrooc);
}
