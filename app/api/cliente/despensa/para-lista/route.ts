/**
 * POST /api/cliente/despensa/para-lista
 * Resolve produto(s) da despensa → ItemLista (melhor preço no mercado).
 * Domínio: reutiliza resolverItensListaCestaSemana.
 */

import { NextRequest, NextResponse } from 'next/server';
import { TokenManager } from '@/lib/token-manager';
import { resolverItensListaCestaSemana } from '@/lib/cesta-semana';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const user = await TokenManager.validateSession({
      headers: req.headers,
      cookies: req.cookies,
    });
    if (!user?.id || user.id === 'anonymous') {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }

    const body = await req.json();
    const mercadoId = body.mercadoId as string | undefined;
    const produtoIds = Array.isArray(body.produtoIds)
      ? (body.produtoIds as unknown[]).map(String).filter(Boolean).slice(0, 20)
      : [];

    if (!mercadoId || produtoIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'mercadoId e produtoIds obrigatórios' },
        { status: 400 }
      );
    }

    // Só catálogo real — manuais (manual-*) ficam no client
    const catalogoIds = produtoIds.filter((id) => !id.startsWith('manual-'));
    const itens = await resolverItensListaCestaSemana(catalogoIds, mercadoId);

    return NextResponse.json({
      success: true,
      data: {
        itens,
        resolvidos: itens.length,
        solicitados: catalogoIds.length,
      },
    });
  } catch (e) {
    console.error('[despensa/para-lista]', e);
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}
