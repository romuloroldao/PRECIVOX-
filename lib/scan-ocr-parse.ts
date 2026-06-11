/**
 * Parsers OCR puros — seguros para importar em componentes client ('use client').
 * Não importar Prisma nem módulos server-only aqui.
 */

export function extrairCodigosBarras(texto: string): string[] {
  const digits = texto.replace(/\D/g, ' ');
  const found = new Set<string>();
  for (const m of digits.match(/\d{8,14}/g) ?? []) {
    if (m.length === 8 || m.length === 12 || m.length === 13 || m.length === 14) {
      found.add(m.length === 14 && m.startsWith('0') ? m.slice(1) : m);
    }
  }
  for (const m of texto.match(/\b\d{13}\b/g) ?? []) found.add(m);
  for (const m of texto.match(/\b\d{8}\b/g) ?? []) found.add(m);
  return [...found];
}

/** Extrai o preço mais provável da etiqueta (R$). */
export function extrairPrecoEtiqueta(texto: string): number | null {
  const patterns = [
    /R\$\s*(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})/gi,
    /(\d{1,3}[.,]\d{2})\s*(?:reais|rs)/gi,
    /\b(\d+[.,]\d{2})\b/g,
  ];
  const valores: number[] = [];
  for (const re of patterns) {
    let m: RegExpExecArray | null;
    const r = new RegExp(re.source, re.flags);
    while ((m = r.exec(texto)) !== null) {
      const raw = m[1]!.replace(/\./g, '').replace(',', '.');
      const n = parseFloat(raw);
      if (Number.isFinite(n) && n > 0 && n < 50000) valores.push(n);
    }
  }
  if (valores.length === 0) return null;
  return valores.sort((a, b) => b - a)[0] ?? null;
}
