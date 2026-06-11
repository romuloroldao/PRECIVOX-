/**
 * Confirmação crowd via OCR de etiqueta (Épico 14).
 */

import { extrairPrecoEtiqueta } from '@/lib/scan-ocr-parse';
import { processarFeedbackPreco } from '@/lib/preco-crowd-feedback';
import { prisma } from '@/lib/prisma';

const TOLERANCIA_PCT = 0.08;

export type ConfirmarEtiquetaInput = {
  userId: string;
  estoqueId: string;
  textoOcr: string;
  precoEtiqueta?: number;
};

export type ConfirmarEtiquetaResult = {
  confianca: number;
  precoEtiqueta: number;
  precoCatalogo: number;
  match: boolean;
  mensagem: string;
};

export async function confirmarPrecoPorEtiqueta(
  input: ConfirmarEtiquetaInput
): Promise<ConfirmarEtiquetaResult> {
  const estoque = await prisma.estoques.findUnique({
    where: { id: input.estoqueId },
    select: {
      preco: true,
      precoPromocional: true,
      emPromocao: true,
    },
  });
  if (!estoque) throw new Error('Estoque não encontrado');

  const precoCatalogo =
    estoque.emPromocao && estoque.precoPromocional
      ? estoque.precoPromocional.toNumber()
      : estoque.preco.toNumber();

  const precoEtiqueta =
    input.precoEtiqueta ?? extrairPrecoEtiqueta(input.textoOcr) ?? null;
  if (precoEtiqueta == null || precoEtiqueta <= 0) {
    throw new Error('Não foi possível ler o preço na etiqueta.');
  }

  const diff = Math.abs(precoEtiqueta - precoCatalogo) / Math.max(precoCatalogo, 0.01);
  const match = diff <= TOLERANCIA_PCT;

  if (!match) {
    const tipo = precoEtiqueta > precoCatalogo ? 'mais_caro' : 'mais_barato';
    await processarFeedbackPreco({
      userId: input.userId,
      estoqueId: input.estoqueId,
      tipo,
      precoVisto: precoEtiqueta,
    });
    return {
      confianca: 45,
      precoEtiqueta,
      precoCatalogo,
      match: false,
      mensagem: `Etiqueta R$ ${precoEtiqueta.toFixed(2)} difere do catálogo (R$ ${precoCatalogo.toFixed(2)}). Reporte registrado.`,
    };
  }

  const resultado = await processarFeedbackPreco({
    userId: input.userId,
    estoqueId: input.estoqueId,
    tipo: 'confirmado',
    precoVisto: precoEtiqueta,
  });

  return {
    confianca: resultado.confianca,
    precoEtiqueta,
    precoCatalogo,
    match: true,
    mensagem: 'Etiqueta confere com o catálogo — obrigado por validar o preço!',
  };
}
