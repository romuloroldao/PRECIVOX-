import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/api/auth/requireRole';
import {
  obterMetadadosImagem,
  processarImagemManual,
  removerImagem,
} from '@/lib/imagens/produto-imagem-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function authorize(req: NextRequest) {
  const auth = await requireRole(req, ['ADMIN', 'GESTOR']);
  if (auth.status === 'unauthenticated') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (auth.status === 'forbidden') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return null;
}

/** Metadados da imagem de um produto. */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const denied = await authorize(req);
  if (denied) return denied;

  const meta = await obterMetadadosImagem(params.id);
  if (!meta) {
    return NextResponse.json({ success: false, error: 'Produto sem registro de imagem' }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: meta });
}

/** Upload manual de imagem (substitui a automática). */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const denied = await authorize(req);
  if (denied) return denied;

  const formData = await req.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json({ success: false, error: 'Arquivo não fornecido' }, { status: 400 });
  }

  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowed.includes(file.type)) {
    return NextResponse.json(
      { success: false, error: 'Formato inválido. Use JPEG, PNG, WebP ou GIF.' },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const meta = await processarImagemManual(params.id, buffer, 'upload_admin');

  return NextResponse.json({ success: true, data: meta });
}

/** Remove imagem e reenfileira como PENDENTE. */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const denied = await authorize(req);
  if (denied) return denied;

  await removerImagem(params.id);
  return NextResponse.json({ success: true });
}
