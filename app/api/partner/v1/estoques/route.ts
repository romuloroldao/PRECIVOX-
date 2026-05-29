import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  extrairBearerToken,
  validarChaveParceiro,
  validarElegibilidadeParceiro,
} from '@/lib/partner-api-auth';
import { processarUpload } from '@/lib/upload-handler';

export const dynamic = 'force-dynamic';

type BatchBody = {
  mercadoId?: string;
  unidadeId?: string;
  itens?: unknown[];
  produtos?: unknown[];
  items?: unknown[];
};

function extrairItens(body: BatchBody): unknown[] {
  const arr = body.itens ?? body.produtos ?? body.items;
  return Array.isArray(arr) ? arr : [];
}

/**
 * POST /api/partner/v1/estoques
 * Body JSON: { mercadoId, unidadeId, itens: [ { nome, preco, ... } ] }
 * Auth: Authorization: Bearer <chave do mercado em PARTNER_API_KEYS>
 */
export async function POST(req: NextRequest) {
  const keysConfigured = Boolean(process.env.PARTNER_API_KEYS?.trim());
  if (!keysConfigured) {
    return NextResponse.json(
      { success: false, error: 'PARTNER_API_KEYS não configurado no servidor' },
      { status: 503 }
    );
  }

  let body: BatchBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'JSON inválido' }, { status: 400 });
  }

  const mercadoId = String(body.mercadoId ?? '').trim();
  const unidadeId = String(body.unidadeId ?? '').trim();
  const itens = extrairItens(body);

  if (!mercadoId || !unidadeId) {
    return NextResponse.json(
      { success: false, error: 'mercadoId e unidadeId são obrigatórios' },
      { status: 400 }
    );
  }

  const token = extrairBearerToken(req.headers.get('authorization'));
  if (!validarChaveParceiro(mercadoId, token)) {
    return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
  }

  const elegivel = await validarElegibilidadeParceiro(mercadoId);
  if (elegivel.ok === false) {
    return NextResponse.json({ success: false, error: elegivel.error }, { status: elegivel.status });
  }

  const unidade = await prisma.unidades.findFirst({
    where: { id: unidadeId, mercadoId, ativa: true },
    select: { id: true },
  });
  if (!unidade) {
    return NextResponse.json(
      { success: false, error: 'Unidade inválida para este mercado' },
      { status: 400 }
    );
  }

  if (itens.length === 0) {
    return NextResponse.json(
      { success: false, error: 'Envie ao menos um item em itens[], produtos[] ou items[]' },
      { status: 400 }
    );
  }

  if (itens.length > 10_000) {
    return NextResponse.json(
      { success: false, error: 'Máximo de 10.000 itens por requisição' },
      { status: 400 }
    );
  }

  const payload = JSON.stringify({ produtos: itens });
  const buffer = Buffer.from(payload, 'utf-8');
  const fileName = `partner-api-${new Date().toISOString().slice(0, 10)}.json`;

  try {
    const resultado = await processarUpload(
      buffer,
      fileName,
      buffer.length,
      mercadoId,
      unidadeId,
      { origem: 'partner_api' }
    );

    return NextResponse.json({
      success: true,
      message: `Batch processado: ${resultado.sucesso} OK, ${resultado.erros} erros`,
      data: {
        resultado: {
          totalLinhas: resultado.totalLinhas,
          sucesso: resultado.sucesso,
          erros: resultado.erros,
          duplicados: resultado.duplicados,
        },
        detalhesErros:
          resultado.detalhesErros.length > 0 ? resultado.detalhesErros.slice(0, 20) : undefined,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Erro ao processar batch';
    console.error('[partner/v1/estoques]', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
