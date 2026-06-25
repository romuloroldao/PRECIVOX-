import { NextRequest, NextResponse } from 'next/server';
import { requireApiSession, isAuthResponse } from '@/lib/api-auth';
import { generateToken } from '@/lib/jwt';
import { getJwtSecret } from '@/lib/jwt-secret';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

/** GET /api/auth/jwt — JWT curto para chamadas ao backend (legado upload-smart etc.). */
export async function GET(req: NextRequest) {
  try {
    const auth = await requireApiSession(req);
    if (isAuthResponse(auth)) return auth;

    try {
      getJwtSecret();
    } catch (configError) {
      console.error('[api/auth/jwt] Segredo JWT ausente:', configError);
      return NextResponse.json(
        { success: false, error: 'JWT não configurado no servidor' },
        { status: 503 },
      );
    }

    const token = await generateToken(
      {
        id: auth.id,
        email: auth.email,
        role: auth.role,
        nome: auth.nome ?? '',
        tokenVersion: auth.tokenVersion ?? 0,
      },
      '1h',
    );

    return NextResponse.json({ success: true, token });
  } catch (error) {
    console.error('Erro ao gerar JWT backend:', error);
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}
