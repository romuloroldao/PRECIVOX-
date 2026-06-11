import { NextRequest, NextResponse } from 'next/server';
import {
  getAlertasRupturaPreditiva,
  sincronizarAlertasRupturaPreditiva,
} from '@/lib/ruptura-preditiva';
import { requireGestorApiAccess } from '@/lib/gestor-api-mercado';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireGestorApiAccess(req, req.nextUrl.searchParams.get('mercadoId'));
    if (!auth.ok) return auth.response;
    const { mercadoId } = auth;

    const dias = parseInt(req.nextUrl.searchParams.get('dias') || '7', 10);
    const limite = parseInt(req.nextUrl.searchParams.get('limite') || '12', 10);
    const sync = req.nextUrl.searchParams.get('sync') === '1';

    const data = await getAlertasRupturaPreditiva(mercadoId, dias, limite);

    if (sync && data.alertas.length > 0) {
      void sincronizarAlertasRupturaPreditiva(mercadoId, data.alertas);
    }

    return NextResponse.json({ success: true, data });
  } catch (e) {
    console.error('[ruptura-preditiva GET]', e);
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}
