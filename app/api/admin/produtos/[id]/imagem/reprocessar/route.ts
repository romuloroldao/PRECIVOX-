import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/api/auth/requireRole';
import { reprocessarImagem } from '@/lib/imagens/produto-imagem-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Reprocessa imagem automática via Open Food Facts. */
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

  const status = await reprocessarImagem(params.id);
  return NextResponse.json({ success: true, data: { status } });
}
