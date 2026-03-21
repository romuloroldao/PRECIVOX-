'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import RegisterModal from '@/components/RegisterModal';

/**
 * Página de cadastro (inscrição).
 * URLs de indicação: /signup?ref=CODIGO
 */
function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const refCode = searchParams.get('ref');
  const { data: session, status } = useSession();
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  // Se já está autenticado, redireciona para o painel do cliente
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const user = session.user as { role?: string };
      const dashboardUrls: Record<string, string> = {
        ADMIN: '/admin/dashboard',
        GESTOR: '/gestor/home',
        CLIENTE: '/cliente/home',
      };
      const target = user.role && dashboardUrls[user.role] ? dashboardUrls[user.role] : '/cliente/home';
      router.replace(target);
      return;
    }
  }, [status, session, router]);

  // Abrir modal de cadastro ao entrar na página de signup (com ou sem ref)
  useEffect(() => {
    if (status === 'unauthenticated') {
      setShowRegisterModal(true);
    }
  }, [status]);

  const handleCloseModal = () => {
    setShowRegisterModal(false);
    router.push(refCode ? `/login?ref=${refCode}` : '/login');
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-4" />
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (status === 'authenticated') {
    return null; // redirect in progress
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <p className="text-center text-gray-600 mb-4">
          Não tem conta? O formulário de cadastro está logo abaixo.
        </p>
        <div className="text-center">
          <a href={refCode ? `/login?ref=${refCode}` : '/login'} className="text-blue-600 hover:underline">
            Já tenho conta — Fazer login
          </a>
        </div>
      </div>
      <RegisterModal
        isOpen={showRegisterModal}
        onClose={handleCloseModal}
        initialReferralCode={refCode}
      />
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600" />
        </div>
      }
    >
      <SignupContent />
    </Suspense>
  );
}
