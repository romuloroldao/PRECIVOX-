/**
 * Métricas de observabilidade do AI Gateway (admin/gestor).
 */
import { NextRequest, NextResponse } from 'next/server';
import { isAuthResponse, mintInternalJwt, requireApiSession } from '@/lib/api-auth';
import { internalFetch } from '@/lib/internal-backend';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await requireApiSession(request, { roles: ['ADMIN', 'GESTOR'] });
  if (isAuthResponse(auth)) return auth;

  try {
    const jwtToken = await mintInternalJwt(auth);
    const backendRes = await internalFetch('/api/v1/ai/metrics', { jwtToken });
    const data = await backendRes.json().catch(() => ({}));
    return NextResponse.json(data, { status: backendRes.status });
  } catch (error) {
    console.error('[ai/gateway/metrics]', error);
    return NextResponse.json({ error: 'Falha ao obter métricas' }, { status: 500 });
  }
}
