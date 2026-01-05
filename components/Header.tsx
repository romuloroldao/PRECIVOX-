// Componente de Header com funcionalidade de logout usando NextAuth
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';

interface HeaderProps {
  title?: string;
  showUserInfo?: boolean;
}

export default function Header({ title = 'PRECIVOX', showUserInfo = true }: HeaderProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Aguardar carregamento da sessão
    if (status !== 'loading') {
      setIsLoading(false);
    }
  }, [status]);

  const handleLogout = async () => {
    try {
      // Limpar tokens do authClient
      try {
        const { authClient } = await import('@/lib/auth-client');
        authClient.clearTokens();
      } catch (error) {
        console.warn('[Header] Erro ao limpar tokens:', error);
      }
      
      // Usar signOut do NextAuth que limpa cookies automaticamente
      await signOut({ 
        callbackUrl: '/',
        redirect: true 
      });
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      // Fallback: redirecionar mesmo se houver erro
      window.location.href = '/';
    }
  };

  const getRoleLabel = (role: string) => {
    const labels = {
      'ADMIN': 'Administrador',
      'GESTOR': 'Gestor',
      'CLIENTE': 'Cliente'
    };
    return labels[role as keyof typeof labels] || role;
  };

  const getRoleColor = (role: string) => {
    const colors = {
      'ADMIN': 'bg-red-100 text-red-800',
      'GESTOR': 'bg-blue-100 text-blue-800',
      'CLIENTE': 'bg-green-100 text-green-800'
    };
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const user = session?.user;
  const userRole = (user as any)?.role;

  if (isLoading || status === 'loading') {
    return (
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
                {title}
              </Link>
            </div>
            <div className="animate-pulse">
              <div className="h-8 w-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
              {title}
            </Link>
            {user && userRole && (
              <span className={`ml-3 px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(userRole)}`}>
                {getRoleLabel(userRole)}
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            {showUserInfo && user ? (
              // Usuário autenticado: mostrar nome e botão de logout
              <>
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">{user.name || user.email}</p>
                  {user.email && user.name && (
                    <p className="text-xs text-gray-500">{user.email}</p>
                  )}
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                  aria-label="Sair"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="hidden sm:inline">Sair</span>
                </button>
              </>
            ) : (
              // Usuário não autenticado: mostrar botão de entrar
              <Link
                href="/login"
                className="flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Entrar
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
