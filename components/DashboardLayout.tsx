"use client";

import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { getRoleLabel } from '@/lib/redirect';
import Logo from '@/components/Logo';

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: 'ADMIN' | 'GESTOR' | 'CLIENTE';
}

export default function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  // ✅ Usar a sessão do NextAuth em vez de fazer requisição separada
  const user = session?.user;
  const isLoading = status === 'loading';

  const handleLogout = async () => {
    // Limpar tokens do authClient
    try {
      const { authClient } = await import('@/lib/auth-client');
      authClient.clearTokens();
    } catch (error) {
      console.warn('[DashboardLayout] Erro ao limpar tokens:', error);
    }
    try {
      // Limpar todos os dados locais primeiro
      localStorage.clear();
      sessionStorage.clear();
      
      // Limpar cookies
      document.cookie = 'token=; path=/; max-age=0';
      document.cookie = 'next-auth.session-token=; path=/; max-age=0';
      document.cookie = '__Secure-next-auth.session-token=; path=/; max-age=0';
      
      // Fazer logout do NextAuth
      await signOut({ 
        callbackUrl: '/login',
        redirect: true 
      });
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      // Forçar redirecionamento mesmo com erro
      localStorage.clear();
      sessionStorage.clear();
      document.cookie = 'token=; path=/; max-age=0';
      document.cookie = 'next-auth.session-token=; path=/; max-age=0';
      window.location.href = '/login';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-precivox-blue mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // Estado não autenticado: não redireciona automaticamente para evitar loops.
  // A página pode decidir o que fazer; aqui mostramos uma mensagem amigável.
  if (status === 'unauthenticated' || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-precivox-light">
        <div className="bg-white shadow-md rounded-xl p-8 max-w-md text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Sessão não encontrada
          </h2>
          <p className="text-gray-600 mb-4">
            Sua sessão pode ter expirado ou você ainda não fez login.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="px-4 py-2 bg-precivox-blue text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Ir para a tela de login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-precivox-light">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Logo height={34} href="" />
              <span className="ml-4 px-3 py-1 bg-precivox-blue text-white text-sm rounded-full">
                {getRoleLabel(role)}
              </span>
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{(user as any)?.nome || user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              {((user as any)?.imagem || user?.image) && (
                <img
                  src={(user as any)?.imagem || user?.image || ''}
                  alt={(user as any)?.nome || user?.name || 'User'}
                  className="w-10 h-10 rounded-full"
                />
              )}
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all duration-300 ease-in-out"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-all duration-300 ease-in-out">
        {children}
      </main>
    </div>
  );
}

