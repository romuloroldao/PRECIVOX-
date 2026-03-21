'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface RouteGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export default function RouteGuard({ children, allowedRoles }: RouteGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (status === 'loading') {
      return;
    }

    // Não autenticado: não forçar redirect em loop; mostrar tela amigável
    if (status === 'unauthenticated' || !session?.user) {
      setIsAuthorized(false);
      setChecked(true);
      return;
    }

    const userRole = (session.user as any).role;

    // Se ainda não há role definido, considerar não autorizado (evita redirect precoce)
    if (!userRole) {
      setIsAuthorized(false);
      setChecked(true);
      return;
    }

    // Se não há roles específicos permitidos, autorizar
    if (!allowedRoles || allowedRoles.length === 0) {
      setIsAuthorized(true);
      setChecked(true);
      return;
    }

    // Verificar se o role do usuário está permitido
    if (allowedRoles.includes(userRole)) {
      setIsAuthorized(true);
      setChecked(true);
    } else {
      // Redirecionar para o dashboard apropriado apenas uma vez
      const redirectUrls: Record<string, string> = {
        ADMIN: '/admin/dashboard',
        GESTOR: '/gestor/home',
        CLIENTE: '/cliente/home',
      };

      const redirectUrl = redirectUrls[userRole] || '/login';
      setIsAuthorized(false);
      setChecked(true);
      router.replace(redirectUrl);
    }
  }, [status, session, allowedRoles, router]);

  // Enquanto não checamos ou ainda carregando, mostrar loading
  if (status === 'loading' || !checked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // Usuário não autenticado ou sem permissão: mostrar mensagem amigável
  if (!isAuthorized) {
    const isUnauthenticated = status === 'unauthenticated' || !session?.user;
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white shadow-lg rounded-xl p-8 max-w-md text-center border border-gray-200">
          <div className="mx-auto w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mb-4">
            <svg className="w-7 h-7 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {isUnauthenticated ? 'Faça login para continuar' : 'Acesso não permitido'}
          </h2>
          <p className="text-gray-600 mb-6">
            {isUnauthenticated
              ? 'Esta área é restrita. Entre com sua conta para acessar.'
              : 'Sua conta não tem permissão para acessar esta área.'}
          </p>
          <button
            onClick={() => router.replace('/login')}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Ir para o login
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

