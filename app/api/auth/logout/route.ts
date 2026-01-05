import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Obter sessão atual
    const session = await getServerSession(authOptions);
    
    // Criar resposta de sucesso
    const response = NextResponse.json({
      success: true,
      message: 'Logout realizado com sucesso'
    });
    
    // Limpar cookies do NextAuth
    // O NextAuth usa cookies específicos que precisam ser limpos
    const cookiePrefix = process.env.NODE_ENV === 'production' ? '__Secure-' : '';
    const cookieName = `${cookiePrefix}next-auth.session-token`;
    
    // Remover cookie de sessão
    response.cookies.delete(cookieName);
    response.cookies.delete('next-auth.csrf-token');
    response.cookies.delete('next-auth.callback-url');
    
    // Também limpar variantes possíveis
    response.cookies.delete('__Secure-next-auth.session-token');
    response.cookies.delete('next-auth.session-token');
    
    return response;
  } catch (error) {
    console.error('Erro no logout:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
