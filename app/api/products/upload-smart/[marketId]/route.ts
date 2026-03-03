import { NextRequest, NextResponse } from 'next/server';
import { TokenManager } from '@/lib/token-manager';
import jwt from 'jsonwebtoken';
import { internalFetch } from '@/lib/internal-backend';

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

    // ✅ Validar sessão com TokenManager
    console.log('[Upload] Validando sessão com TokenManager...');
    const user = await TokenManager.validateRoles(['ADMIN', 'GESTOR']);

    if (!user) {
      console.log('[Upload] ❌ Usuário não autenticado ou sem permissão');
      return NextResponse.json(
        { success: false, error: 'Não autenticado ou sem permissão' },
        { status: 401 }
      );
    }

    console.log('[Upload] ✅ Usuário autenticado:', {
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Obter FormData do request
    const formData = await request.formData();

    const JWT_SECRET =
      process.env.JWT_SECRET ||
      process.env.NEXTAUTH_SECRET ||
      'seu-secret-super-seguro';

    const signedToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role, nome: user.nome || '' },
      JWT_SECRET,
      { expiresIn: '30m' }
    );

    const backendResponse = await internalFetch(
      `/api/v1/products/upload-smart/${marketId}`,
      { method: 'POST', body: formData, jwtToken: signedToken, skipContentType: true }
    );

    // Parse da resposta do backend
    let data;
    const contentType = backendResponse.headers.get('content-type');

    try {
      if (contentType && contentType.includes('application/json')) {
        data = await backendResponse.json();
      } else {
        const text = await backendResponse.text();
        data = {
          success: false,
          error: 'Resposta inválida do backend',
          message: text || 'Erro desconhecido',
        };
      }
    } catch (parseError: any) {
      console.error('Erro ao parsear resposta do backend:', parseError);
      return NextResponse.json(
        {
          success: false,
          error: 'Erro ao processar resposta do backend',
          message: parseError.message || 'Resposta do backend não é um JSON válido',
        },
        { status: backendResponse.status || 500 }
      );
    }

    if (!backendResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          error: data.error || 'Erro no backend',
          message: data.message || 'Erro desconhecido',
        },
        { status: backendResponse.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error('❌ Erro no upload-smart (Next.js BFF):', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno no servidor',
        message: error.message || 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}

// Forçar renderização dinâmica
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
