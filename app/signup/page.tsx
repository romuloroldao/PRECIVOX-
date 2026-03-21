'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import RegisterModal from '@/components/RegisterModal';
import { safeCallbackUrl } from '@/lib/safe-callback-url';

function buildLoginHref(ref: string | null, callbackUrl: string | null): string {
  const p = new URLSearchParams();
  if (ref) p.set('ref', ref);
  if (callbackUrl) p.set('callbackUrl', callbackUrl);
  const q = p.toString();
  return q ? `/login?${q}` : '/login';
}

/**
 * Página de cadastro (inscrição).
 * URLs: /signup?ref=CODIGO&callbackUrl=/cliente/listas/nova
 */
function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const refCode = searchParams.get('ref');
  const callbackRaw = searchParams.get('callbackUrl');
  const callbackUrl = safeCallbackUrl(callbackRaw);
  const { data: session, status } = useSession();
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  // Se já está autenticado, respeita callback (ex.: criar lista) para CLIENTE
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const user = session.user as { role?: string };
      const role = user.role;
      const target =
        role === 'ADMIN'
          ? '/admin/dashboard'
          : role === 'GESTOR'
            ? '/gestor/home'
            : callbackUrl;
      router.replace(target);
      return;
    }
  }, [status, session, router, callbackUrl]);

  // Abrir modal de cadastro ao entrar na página de signup (com ou sem ref)
  useEffect(() => {
    if (status === 'unauthenticated') {
      setShowRegisterModal(true);
    }
  }, [status]);

  const handleCloseModal = () => {
    setShowRegisterModal(false);
    router.push(buildLoginHref(refCode, callbackRaw));
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
          <a href={buildLoginHref(refCode, callbackRaw)} className="text-blue-600 hover:underline">
            Já tenho conta — Fazer login
          </a>
        </div>
      </div>
      <RegisterModal
        isOpen={showRegisterModal}
        onClose={handleCloseModal}
        initialReferralCode={refCode}
        redirectAfterLogin={callbackRaw ?? undefined}
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
