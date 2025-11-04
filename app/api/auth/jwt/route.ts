import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !(session.user as any).id) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }

    const JWT_SECRET = process.env.JWT_SECRET || 'seu-secret-super-seguro';

    const token = jwt.sign(
      {
        id: (session.user as any).id,
        email: session.user.email,
        role: (session.user as any).role || 'CLIENTE',
        nome: session.user.name || '',
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    return NextResponse.json({ success: true, token });
  } catch (error: any) {
    console.error('Erro ao gerar JWT backend:', error);
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}


