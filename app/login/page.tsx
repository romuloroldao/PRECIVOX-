'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import LoginForm from '@/components/LoginForm';
import RegisterModal from '@/components/RegisterModal';

export default function LoginPage() {
  const router = useRouter();
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const { data: session, status } = useSession();

  useEffect(() => {
    // Evitar múltiplos redirecionamentos
    if (isRedirecting) {
      return;
    }

    // Só redirecionar se estiver completamente autenticado
    if (status === 'authenticated' && session?.user) {
      const user = session.user as any;
      
      // Verificar se o usuário tem um role válido
      if (user.role && ['ADMIN', 'GESTOR', 'CLIENTE'].includes(user.role)) {
        setIsRedirecting(true);
        
        const dashboardUrls: Record<string, string> = {
          ADMIN: '/admin/dashboard',
          GESTOR: '/gestor/home',
          CLIENTE: '/cliente/home',
        };
        
        const targetUrl = dashboardUrls[user.role];
        
        // Usar replace em vez de push para evitar loop
        router.replace(targetUrl);
      }
    }
  }, [session, status, router, isRedirecting]);

  // Mostrar loading se estiver redirecionando
  if (isRedirecting || (status === 'authenticated' && session?.user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Redirecionando...</p>
        </div>
      </div>
    );
  }

  // Só mostrar o formulário se não estiver autenticado
  if (status === 'unauthenticated' || status === 'loading') {
    return (
      <>
        {/* Formulário de Login com novo layout */}
        <LoginForm onShowRegister={() => setShowRegisterModal(true)} />

        {/* Modal de Cadastro */}
        <RegisterModal
          isOpen={showRegisterModal}
          onClose={() => setShowRegisterModal(false)}
        />
      </>
    );
  }

  return null;
}

