import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import jwt from 'jsonwebtoken';
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

    const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'seu-secret-super-seguro';
    const tokenPayload = {
      id: (session.user as any).id,
      email: session.user.email,
      role: (session.user as any).role || 'CLIENTE',
      nome: session.user.name || '',
    };
    const signedToken = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '30m' });

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
