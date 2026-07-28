/**
 * BFF unificado — ponto de entrada Next.js para tarefas LLM via AI Gateway (Express).
 * Mapeia task IDs do gateway para endpoints do backend interno.
 */
import { NextRequest, NextResponse } from 'next/server';
import { isAuthResponse, mintInternalJwt, requireApiSession } from '@/lib/api-auth';
import { internalFetch } from '@/lib/internal-backend';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

const TASK_ROUTES: Record<string, { path: string; roles: Array<'ADMIN' | 'GESTOR' | 'CLIENTE'> }> = {
  'shopping-list-analysis': { path: '/api/v1/ai/analyze-list', roles: ['CLIENTE', 'GESTOR', 'ADMIN'] },
  'product-alternatives': { path: '/api/v1/ai/product-alternatives', roles: ['CLIENTE', 'GESTOR', 'ADMIN'] },
  'route-optimization': { path: '/api/v1/ai/optimize-route', roles: ['CLIENTE', 'GESTOR', 'ADMIN'] },
  'price-analysis': { path: '/api/v1/ai/analyze-prices', roles: ['GESTOR', 'ADMIN'] },
};

export async function POST(
  request: NextRequest,
  { params }: { params: { task: string } }
) {
  const task = params.task;
  const routeDef = TASK_ROUTES[task];

  if (!routeDef) {
    return NextResponse.json(
      { error: 'Tarefa de IA desconhecida', task, available: Object.keys(TASK_ROUTES) },
      { status: 404 }
    );
  }

  const auth = await requireApiSession(request, { roles: routeDef.roles });
  if (isAuthResponse(auth)) return auth;

  try {
    const body = await request.json();
    const jwtToken = await mintInternalJwt(auth);
    const backendRes = await internalFetch(routeDef.path, {
      method: 'POST',
      body: JSON.stringify(body),
      jwtToken,
      timeoutMs: 45_000,
    });

    const data = await backendRes.json().catch(() => ({}));

    if (!backendRes.ok) {
      return NextResponse.json(data, { status: backendRes.status });
    }

    return NextResponse.json({ success: true, task, data });
  } catch (error) {
    console.error(`[ai/gateway/${task}]`, error);
    return NextResponse.json(
      { error: 'Falha ao processar tarefa de IA' },
      { status: 500 }
    );
  }
}
