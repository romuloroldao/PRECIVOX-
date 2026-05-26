import { NextRequest, NextResponse } from 'next/server';
import { TokenManager } from '@/lib/token-manager';
import { getEconomiaStreak, registrarEconomiaSemana } from '@/lib/economia-streak';

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
    const data = await getEconomiaStreak(user.id);
    return NextResponse.json({ success: true, data });
  } catch (e) {
    console.error('[economia-streak GET]', e);
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}

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
    const valor = Number(body.valorEstimado) || 0;
    const data = await registrarEconomiaSemana(user.id, valor);
    return NextResponse.json({ success: true, data });
  } catch (e) {
    console.error('[economia-streak POST]', e);
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}
