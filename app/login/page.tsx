'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import LoginForm from '@/components/LoginForm';
import RegisterModal from '@/components/RegisterModal';

export default function LoginPage() {
  const router = useRouter();
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const { data: session, status } = useSession();

  // Se já está autenticado, mostrar mensagem estável com opção de ir para o dashboard
  if (status === 'authenticated' && session?.user) {
    const user = session.user as any;
    const role = user.role as string | undefined;

    const dashboardUrls: Record<string, string> = {
      ADMIN: '/admin/dashboard',
      GESTOR: '/gestor/home',
      CLIENTE: '/',
    };

    const targetUrl = role && dashboardUrls[role] ? dashboardUrls[role] : '/';

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white shadow-md rounded-xl p-8 max-w-md text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Você já está autenticado
          </h2>
          <p className="text-gray-600 mb-4">
            Clique abaixo para ir para o seu painel.
          </p>
          <button
            onClick={() => router.replace(targetUrl)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Ir para o painel
          </button>
        </div>
      </div>
    );
  }

  // Enquanto carrega a sessão, mostrar um loading simples
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // Não autenticado: mostrar formulário de login normalmente
  return (
    <>
      <LoginForm onShowRegister={() => setShowRegisterModal(true)} />
      <RegisterModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
      />
    </>
  );
}

