import { NextRequest, NextResponse } from 'next/server';
import { internalFetch } from '@/lib/internal-backend';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email e senha são obrigatórios' },
        { status: 400 }
      );
    }

    const backendRes = await internalFetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await backendRes.json().catch(() => ({}));

    if (!backendRes.ok) {
      return NextResponse.json(
        {
          success: false,
          error: data.error || data.message || 'Erro ao fazer login',
        },
        { status: backendRes.status }
      );
    }

    if (!data.success || !data.data?.user || !data.data.accessToken || !data.data.refreshToken) {
      return NextResponse.json(
        { success: false, error: 'Resposta inválida do backend' },
        { status: 502 }
      );
    }

    const backendUser = data.data.user as { id?: string; email?: string; nome?: string; role?: string };

    const response = NextResponse.json({
      success: true,
      user: {
        id: backendUser.id,
        email: backendUser.email,
        nome: backendUser.nome ?? '',
        role: backendUser.role,
      },
      accessToken: data.data.accessToken,
      refreshToken: data.data.refreshToken,
    });

    const cookiePrefix = process.env.NODE_ENV === 'production' ? '__Secure-' : '';

    response.cookies.set(`${cookiePrefix}precivox-access-token`, data.data.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60,
    });

    response.cookies.set(`${cookiePrefix}precivox-refresh-token`, data.data.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error('[API /auth/login] Erro:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao processar login' },
      { status: 500 }
    );
  }
}
