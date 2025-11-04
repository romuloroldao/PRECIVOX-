import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import jwt from 'jsonwebtoken';

// Backend Express URL
// O backend Express roda na porta 3001
const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:3001';

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

    // Obter sessão atual do NextAuth (usuário logado)
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }

    // Obter FormData do request
    const formData = await request.formData();

    // Forward para o backend Express
    // O backend tem aliases: /api/produtos (português) e /api/products (inglês)
    const backendUrl = `${BACKEND_URL}/api/products/upload-smart/${marketId}`;
    
    // Assinar um JWT no servidor com o mesmo segredo do backend
    const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'seu-secret-super-seguro';
    const tokenPayload = {
      id: (session.user as any).id,
      email: session.user.email,
      role: (session.user as any).role || 'CLIENTE',
      nome: session.user.name || '',
    };
    const signedToken = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '30m' });

    // Não definir Content-Type - o fetch define para FormData automaticamente
    const headers: HeadersInit = {
      Authorization: `Bearer ${signedToken}`,
    };

    // Forward FormData para o backend
    const backendResponse = await fetch(backendUrl, {
      method: 'POST',
      headers,
      body: formData, // FormData será serializado automaticamente
    });

    // Obter resposta do backend
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
          message: text || 'Erro desconhecido'
        };
      }
    } catch (parseError: any) {
      // Se falhar ao fazer parse do JSON, retornar erro genérico
      console.error('Erro ao parsear resposta do backend:', parseError);
      return NextResponse.json(
        {
          success: false,
          error: 'Erro ao processar resposta do backend',
          message: parseError.message || 'Resposta do backend não é um JSON válido'
        },
        { status: backendResponse.status || 500 }
      );
    }

    if (!backendResponse.ok) {
      return NextResponse.json(
        { 
          success: false, 
          error: data.error || 'Erro no backend', 
          message: data.message || 'Erro desconhecido'
        },
        { status: backendResponse.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error('❌ Erro no upload-smart (Next.js proxy):', error);
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

