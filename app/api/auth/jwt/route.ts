import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateToken } from '@/lib/jwt';
import { getJwtSecret } from '@/lib/jwt-secret';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !(session.user as { id?: string }).id) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }

    try {
      getJwtSecret();
    } catch (configError) {
      console.error('[api/auth/jwt] Segredo JWT ausente:', configError);
      return NextResponse.json(
        { success: false, error: 'JWT não configurado no servidor' },
        { status: 503 },
      );
    }

    const user = session.user as { id: string; email: string; role?: string; name?: string | null };
    const token = await generateToken(
      {
        id: user.id,
        email: user.email,
        role: (user.role as 'ADMIN' | 'GESTOR' | 'CLIENTE') || 'CLIENTE',
        nome: user.name || '',
      },
      '1h',
    );

    return NextResponse.json({ success: true, token });
  } catch (error) {
    console.error('Erro ao gerar JWT backend:', error);
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}
