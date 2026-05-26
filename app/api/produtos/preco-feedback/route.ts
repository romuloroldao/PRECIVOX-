import { NextRequest, NextResponse } from 'next/server';
import { TokenManager } from '@/lib/token-manager';
import { processarFeedbackPreco, type FeedbackPrecoTipo } from '@/lib/preco-crowd-feedback';
import { getReputacaoCrowd } from '@/lib/crowd-reputacao';

const TIPOS: FeedbackPrecoTipo[] = ['confirmado', 'mais_caro', 'mais_barato'];

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
    const { estoqueId, tipo, precoVisto } = body as {
      estoqueId?: string;
      tipo?: string;
      precoVisto?: number;
    };

    if (!estoqueId || !tipo || !TIPOS.includes(tipo as FeedbackPrecoTipo)) {
      return NextResponse.json(
        { success: false, error: 'estoqueId e tipo (confirmado|mais_caro|mais_barato) obrigatórios' },
        { status: 400 }
      );
    }

    const resultado = await processarFeedbackPreco({
      userId: user.id,
      estoqueId,
      tipo: tipo as FeedbackPrecoTipo,
      precoVisto: typeof precoVisto === 'number' ? precoVisto : undefined,
    });

    const reputacao = await getReputacaoCrowd(user.id);

    return NextResponse.json({
      success: true,
      data: {
        ...resultado,
        reputacao,
        mensagem:
          tipo === 'confirmado'
            ? 'Obrigado! Você ajudou famílias do bairro a confiar neste preço.'
            : 'Registrado. O mercado pode ser alertado se houver muitos reportes.',
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro';
    console.error('[preco-feedback]', e);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
