import { NextRequest, NextResponse } from 'next/server';
import { TokenManager } from '@/lib/token-manager';
import {
  montarPropostaConsolidacaoRota,
  type LinhaRotaEntrada,
  type PropostaRotaOtimizacao,
} from '@/lib/lista-rota-proposta';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const user = await TokenManager.validateSession({
      headers: req.headers,
      cookies: req.cookies,
    });
    if (!user || user.role !== 'CLIENTE') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const body = (await req.json()) as { itens?: LinhaRotaEntrada[] };
    const linhas = Array.isArray(body.itens) ? body.itens : [];
    const proposal = await montarPropostaConsolidacaoRota(linhas);

    return NextResponse.json({ proposal: proposal as PropostaRotaOtimizacao | null });
  } catch (e) {
    console.error('[POST /api/cliente/rota-proposta]', e);
    return NextResponse.json({ error: 'Erro ao montar proposta' }, { status: 500 });
  }
}
