import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiSession, isAuthResponse } from '@/lib/api-auth';
import { sendListaResumoEmail, getBaseUrl, type ListaResumoItem } from '@/lib/email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/lists/[id]/send-summary
 * Envia ao dono da lista um e-mail com o resumo e a economia estimada.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await requireApiSession(request);
  if (isAuthResponse(session)) return session;

  try {
    const lista = await prisma.listas_compras.findUnique({
      where: { id: params.id },
      include: {
        itens_lista: {
          include: {
            produtos: {
              select: {
                nome: true,
                estoques: { select: { preco: true } },
              },
            },
          },
        },
      },
    });

    if (!lista) {
      return NextResponse.json({ success: false, error: 'Lista não encontrada' }, { status: 404 });
    }
    if (lista.usuarioId !== session.id) {
      return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 });
    }

    let totalEstimado = 0;
    let economia = 0;
    const itens: ListaResumoItem[] = lista.itens_lista.map((item) => {
      const prices = item.produtos.estoques.map((e) => Number(e.preco)).filter((n) => n > 0);
      const avg = prices.length ? prices.reduce((s, p) => s + p, 0) / prices.length : 0;
      const best = Math.floor(avg * 0.85);
      totalEstimado += best * item.quantidade;
      economia += (avg - best) * item.quantidade;
      return { nome: item.produtos.nome, preco: best > 0 ? best : null };
    });

    const result = await sendListaResumoEmail({
      nome: session.nome || '',
      email: session.email,
      listaNome: lista.nome,
      totalItens: lista.itens_lista.length,
      totalEstimado,
      economia,
      itens,
      listaLink: `${getBaseUrl()}/cliente/listas`,
    });

    if (!result.ok) {
      console.error('[lists/send-summary] falha ao enviar:', result);
      return NextResponse.json(
        { success: false, error: 'Não foi possível enviar o resumo agora. Tente novamente.' },
        { status: 503 },
      );
    }

    return NextResponse.json({ success: true, message: 'Resumo enviado para o seu e-mail.' });
  } catch (error) {
    console.error('[lists/send-summary] erro:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao enviar resumo. Tente novamente.' },
      { status: 500 },
    );
  }
}
