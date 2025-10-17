'use client';

import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

interface RouteGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export default function RouteGuard({ children, allowedRoles }: RouteGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // Se ainda está carregando, não fazer nada
    if (status === 'loading') {
      return;
    }

    // Se não está autenticado, redirecionar para login
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    // Se está autenticado
    if (status === 'authenticated' && session?.user) {
      const userRole = (session.user as any).role;

      // Se não há roles específicos permitidos, autorizar
      if (!allowedRoles || allowedRoles.length === 0) {
        setIsAuthorized(true);
        return;
      }

      // Verificar se o role do usuário está permitido
      if (allowedRoles.includes(userRole)) {
        setIsAuthorized(true);
      } else {
        // Redirecionar para o dashboard apropriado
        const redirectUrls: Record<string, string> = {
          ADMIN: '/admin/dashboard',
          GESTOR: '/gestor/home',
          CLIENTE: '/cliente/home',
        };
        
        const redirectUrl = redirectUrls[userRole] || '/login';
        router.push(redirectUrl);
      }
    }
  }, [status, session, router, pathname, allowedRoles]);

  // Mostrar loading enquanto verifica
  if (status === 'loading' || !isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

