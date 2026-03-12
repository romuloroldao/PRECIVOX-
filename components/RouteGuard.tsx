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

  // Usuário não autenticado ou sem permissão: mostrar mensagem em vez de redirect em loop
  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white shadow-md rounded-xl p-8 max-w-md text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Acesso restrito
          </h2>
          <p className="text-gray-600 mb-4">
            Você não tem permissão para acessar esta área ou sua sessão expirou.
          </p>
          <button
            onClick={() => router.replace('/login')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Ir para a tela de login
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

