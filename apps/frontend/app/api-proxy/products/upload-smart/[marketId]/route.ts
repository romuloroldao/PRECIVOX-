import { NextRequest, NextResponse } from 'next/server';
import { requireGestorOrAdmin } from '@/lib/auth-helpers';
import { generateToken } from '@shared/jwt';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function POST(
  request: NextRequest,
  { params }: { params: { marketId: string } }
) {
  try {
    const { marketId } = params;
    if (!marketId) {
      return NextResponse.json(
        { success: false, error: 'Market ID ausente na rota.' },
        { status: 400 }
      );
    }

    const user = await requireGestorOrAdmin(request);

    const formData = await request.formData();

    const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:3001';
    const backendUrl = `${BACKEND_URL}/api/products/upload-smart/${marketId}`;

    const tokenPayload = {
      sub: user.id,
      id: user.id,
      email: user.email,
      role: user.role,
      nome: user.nome || '',
      tokenVersion: user.tokenVersion ?? 0,
    };
    const signedToken = await generateToken(tokenPayload as any, '30m');

    const backendResponse = await fetch(backendUrl, {
      method: 'POST',
      headers: { Authorization: `Bearer ${signedToken}` },
      body: formData,
    });

    let data;
    const contentType = backendResponse.headers.get('content-type');
    try {
      data = contentType && contentType.includes('application/json')
        ? await backendResponse.json()
        : await backendResponse.text();
    } catch {
      data = { success: false, error: 'Resposta inválida do backend' };
    }

    if (!backendResponse.ok) {
      return NextResponse.json(
        typeof data === 'string' ? { success: false, error: data } : data,
        { status: backendResponse.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error('❌ Erro no upload-smart (Next proxy):', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor', message: error?.message },
      { status: 500 }
    );
  }
}


