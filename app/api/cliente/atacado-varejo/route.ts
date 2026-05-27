import { NextRequest, NextResponse } from 'next/server';
import { TokenManager } from '@/lib/token-manager';
import { prisma } from '@/lib/prisma';
import {
  listarAtacadoVarejoUsuario,
  analisarProdutoAtacadoVarejo,
} from '@/lib/atacado-varejo';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await TokenManager.validateSession({
      headers: req.headers,
      cookies: req.cookies,
    });
    if (!user?.id || user.id === 'anonymous') {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }

    const mercadoId = req.nextUrl.searchParams.get('mercadoId');
    if (!mercadoId) {
      return NextResponse.json({ success: false, error: 'mercadoId obrigatório' }, { status: 400 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { perfilPreci: true },
    });

    const produtoId = req.nextUrl.searchParams.get('produtoId');
    if (produtoId) {
      const analise = await analisarProdutoAtacadoVarejo(
        produtoId,
        mercadoId,
        dbUser?.perfilPreci,
        user.id
      );
      if (!analise) {
        return NextResponse.json(
          { success: false, error: 'Sem par atacado/varejo para este produto' },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, data: analise });
    }

    const lista = await listarAtacadoVarejoUsuario(user.id, mercadoId, dbUser?.perfilPreci);
    return NextResponse.json({ success: true, data: lista });
  } catch (e) {
    console.error('[atacado-varejo GET]', e);
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}
