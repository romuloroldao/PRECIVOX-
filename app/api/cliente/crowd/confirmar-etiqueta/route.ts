import { NextRequest, NextResponse } from 'next/server';
import { TokenManager } from '@/lib/token-manager';
import { confirmarPrecoPorEtiqueta } from '@/lib/crowd-v2/ocr-crowd';
import { getReputacaoCrowd } from '@/lib/crowd-reputacao';

export const dynamic = 'force-dynamic';

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
    const { estoqueId, textoOcr, precoEtiqueta } = body as {
      estoqueId?: string;
      textoOcr?: string;
      precoEtiqueta?: number;
    };

    if (!estoqueId || !textoOcr?.trim()) {
      return NextResponse.json(
        { success: false, error: 'estoqueId e textoOcr obrigatórios' },
        { status: 400 }
      );
    }

    const resultado = await confirmarPrecoPorEtiqueta({
      userId: user.id,
      estoqueId,
      textoOcr: textoOcr.trim(),
      precoEtiqueta: typeof precoEtiqueta === 'number' ? precoEtiqueta : undefined,
    });

    const reputacao = await getReputacaoCrowd(user.id);

    return NextResponse.json({
      success: true,
      data: { ...resultado, reputacao },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro';
    console.error('[crowd/confirmar-etiqueta]', e);
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }
}
