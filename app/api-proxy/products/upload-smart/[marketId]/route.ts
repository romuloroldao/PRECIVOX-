import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateToken } from '@/lib/jwt';
import { internalFetch } from '@/lib/internal-backend';

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

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }

    const formData = await request.formData();

    const tokenPayload = {
      id: (session.user as { id: string }).id,
      email: session.user.email,
      role: ((session.user as { role?: string }).role as 'ADMIN' | 'GESTOR' | 'CLIENTE') || 'CLIENTE',
      nome: session.user.name || '',
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
