import { NextRequest, NextResponse } from 'next/server';
import { internalFetch } from '@/lib/internal-backend';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** POST /api/auth/otp/verify  { phone, code } */
export async function POST(req: NextRequest) {
  try {
    const { phone, code } = await req.json();
    if (!phone || !code) {
      return NextResponse.json({ success: false, error: 'Telefone e código são obrigatórios' }, { status: 400 });
    }

    const backendRes = await internalFetch('/api/v1/auth/otp/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, code }),
    });

    const data = await backendRes.json().catch(() => ({}));
    if (!backendRes.ok || !data?.success || !data?.data?.accessToken) {
      return NextResponse.json(
        { success: false, error: data?.error || 'Código inválido ou expirado' },
        { status: backendRes.status || 401 }
      );
    }

    const { user, accessToken, refreshToken, expiresAt } = data.data;

    const res = NextResponse.json({ success: true, user, accessToken, refreshToken, expiresAt });
    const prefix = process.env.NODE_ENV === 'production' ? '__Secure-' : '';
    const base = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
    };
    res.cookies.set(`${prefix}precivox-access-token`, accessToken, { ...base, maxAge: 15 * 60 });
    res.cookies.set(`${prefix}precivox-refresh-token`, refreshToken, { ...base, maxAge: 7 * 24 * 60 * 60 });
    return res;
  } catch (err) {
    console.error('[otp/verify]', err);
    return NextResponse.json({ success: false, error: 'Erro ao validar código' }, { status: 500 });
  }
}
