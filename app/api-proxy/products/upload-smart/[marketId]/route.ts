import { NextRequest, NextResponse } from 'next/server';
import { requireApiSession, isAuthResponse } from '@/lib/api-auth';
import { generateToken } from '@/lib/jwt';
import { internalFetch } from '@/lib/internal-backend';
import { prisma } from '@/lib/prisma';

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

    const auth = await requireApiSession(request);
    if (isAuthResponse(auth)) return auth;

    const allowedRoles = ['ADMIN', 'GESTOR'];
    if (!allowedRoles.includes(auth.role)) {
      return NextResponse.json(
        { success: false, error: 'Permissão insuficiente' },
        { status: 403 }
      );
    }

    const mercado = await prisma.mercados.findUnique({
      where: { id: marketId },
      select: { id: true, gestorId: true },
    });

    if (!mercado) {
      return NextResponse.json(
        { success: false, error: 'Mercado não encontrado' },
        { status: 404 }
      );
    }

    if (auth.role === 'GESTOR' && mercado.gestorId !== auth.id) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado a este mercado' },
        { status: 403 }
      );
    }

    const formData = await request.formData();

    const tokenPayload = {
      id: auth.id,
      email: auth.email,
      role: auth.role,
      nome: auth.nome ?? '',
      tokenVersion: auth.tokenVersion ?? 0,
    };
    const signedToken = await generateToken(tokenPayload, '30m');

    const backendResponse = await internalFetch(
      `/api/v1/products/upload-smart/${marketId}`,
      { method: 'POST', body: formData, jwtToken: signedToken, skipContentType: true }
    );

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
    console.error('❌ Erro no upload-smart (api-proxy BFF):', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor', message: error?.message },
      { status: 500 }
    );
  }
}
