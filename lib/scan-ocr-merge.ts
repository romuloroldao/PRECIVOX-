/**
 * Mescla OCR de item, embalagem e etiqueta de prateleira.
 */

import { extrairCodigosBarras, extrairPrecoEtiqueta } from '@/lib/scan-ocr-parse';

export type ScanOcrFonte = 'item' | 'embalagem' | 'etiqueta';

export type ScanOcrCaptura = {
  fonte: ScanOcrFonte;
  texto: string;
  eans?: string[];
};

export type ScanOcrMesclado = {
  textoCombinado: string;
  eans: string[];
  precoEtiqueta: number | null;
  porFonte: Partial<Record<ScanOcrFonte, string>>;
};

const ROTULO_FONTE: Record<ScanOcrFonte, string> = {
  item: 'Produto',
  embalagem: 'Embalagem',
  etiqueta: 'Etiqueta prateleira',
};

export function rotuloFonteOcr(fonte: ScanOcrFonte): string {
  return ROTULO_FONTE[fonte];
}

/** Converte "12,99" ou "12.99" em número. */
export function parsePrecoManual(raw: string | null | undefined): number | null {
  if (!raw?.trim()) return null;
  const n = parseFloat(raw.trim().replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function mesclarCapturasOcr(capturas: ScanOcrCaptura[]): ScanOcrMesclado {
  const porFonte: Partial<Record<ScanOcrFonte, string>> = {};
  const eans = new Set<string>();

  for (const c of capturas) {
    const t = c.texto.trim();
    if (t) porFonte[c.fonte] = t;
    for (const e of c.eans ?? []) eans.add(e);
    for (const e of extrairCodigosBarras(t)) eans.add(e);
  }

  const textoItem = porFonte.item ?? '';
  const textoEmbalagem = porFonte.embalagem ?? '';
  const textoEtiqueta = porFonte.etiqueta ?? '';

  const blocos: string[] = [];
  if (eans.size > 0) blocos.push([...eans].join(' '));
  if (textoItem) blocos.push(textoItem);
  if (textoEmbalagem && textoEmbalagem !== textoItem) blocos.push(textoEmbalagem);
  if (textoEtiqueta) blocos.push(textoEtiqueta);

  const textoCombinado = blocos.join('\n').trim();

  const precoEtiqueta =
    extrairPrecoEtiqueta(textoEtiqueta) ??
    extrairPrecoEtiqueta(textoCombinado);

  return {
    textoCombinado,
    eans: [...eans],
    precoEtiqueta,
    porFonte,
  };
}

/** Texto preferencial para validação crowd (prioriza etiqueta de prateleira). */
export function textoOcrParaCrowd(
  mesclado: ScanOcrMesclado,
  precoManual?: number | null
): { texto: string; preco: number | null } {
  const texto =
    mesclado.porFonte.etiqueta?.trim() ||
    [mesclado.porFonte.item, mesclado.porFonte.embalagem].filter(Boolean).join('\n') ||
    mesclado.textoCombinado;

  const preco =
    precoManual ??
    (mesclado.porFonte.etiqueta
      ? extrairPrecoEtiqueta(mesclado.porFonte.etiqueta)
      : null) ??
    mesclado.precoEtiqueta;

  return { texto, preco };
}
