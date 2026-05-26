import { NextRequest, NextResponse } from 'next/server';
import { TokenManager } from '@/lib/token-manager';
import { EventCollector } from '@/lib/ai/event-collector';
import { calcularIntentScore } from '@/lib/ai/intent-score-engine';

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
    const janelaHoras = parseInt(req.nextUrl.searchParams.get('janela') || '72', 10);
    const fim = new Date();
    const inicio = new Date();
    inicio.setHours(inicio.getHours() - janelaHoras * 2);

    let eventos = await EventCollector.getUserEventsGlobal(user.id, inicio, fim);
    if (mercadoId) {
      eventos = eventos.filter((e) => e.mercadoId === mercadoId);
    }

    const intent = calcularIntentScore(eventos, janelaHoras);

    let mensagem = 'Atividade normal';
    if (intent.score >= 70) mensagem = 'Alta chance de compra nas próximas 48–72h';
    else if (intent.score >= 45) mensagem = 'Você está montando sua próxima compra';
    else if (intent.score < 25) mensagem = 'Baixa atividade recente na lista';

    return NextResponse.json({
      success: true,
      data: {
        ...intent,
        mensagem,
        explicacao:
          'Score baseado em listas, buscas e check-ins recentes — quanto maior, mais provável uma compra em breve.',
      },
    });
  } catch (e) {
    console.error('[intent-score]', e);
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}
