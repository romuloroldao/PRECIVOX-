import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/api/auth/requireRole';
import { restaurarAutomatica } from '@/lib/imagens/produto-imagem-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Restaura imagem automática (remove override manual). */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireRole(req, ['ADMIN', 'GESTOR']);
  if (auth.status === 'unauthenticated') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (auth.status === 'forbidden') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const meta = await restaurarAutomatica(params.id);
  return NextResponse.json({ success: true, data: meta });
}
