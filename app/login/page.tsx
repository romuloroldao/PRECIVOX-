'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import LoginForm from '@/components/LoginForm';
import RegisterModal from '@/components/RegisterModal';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const refCode = searchParams.get('ref');
  const confirmed = searchParams.get('confirmed') === '1';
  const emailNotVerified = searchParams.get('error') === 'EmailNotVerified';
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [resendEmail, setResendEmail] = useState('');
  const [resendStatus, setResendStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [resendMessage, setResendMessage] = useState('');
  const { data: session, status } = useSession();

  const handleResendVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail.trim()) return;
    setResendStatus('loading');
    setResendMessage('');
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resendEmail.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setResendStatus('success');
        setResendMessage(data.message || 'E-mail reenviado. Verifique sua caixa de entrada.');
      } else {
        setResendStatus('error');
        setResendMessage(data.error || 'Erro ao reenviar.');
      }
    } catch {
      setResendStatus('error');
      setResendMessage('Erro de conexão. Tente novamente.');
    }
  };

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
    <div className={confirmed || emailNotVerified ? 'pt-12' : ''}>
      {confirmed && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-green-600 text-white text-center py-2 px-4 text-sm font-medium">
          E-mail confirmado com sucesso! Faça login para continuar.
        </div>
      )}
      {emailNotVerified && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-600 text-white px-4 py-3 shadow-md">
          <p className="text-sm font-medium text-center mb-2">
            Confirme seu e-mail antes de fazer login. Verifique sua caixa de entrada e o spam.
          </p>
          <form onSubmit={handleResendVerification} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
            <input
              type="email"
              value={resendEmail}
              onChange={(e) => setResendEmail(e.target.value)}
              placeholder="Seu e-mail"
              className="flex-1 px-3 py-2 rounded text-gray-900 text-sm border-0"
              required
            />
            <button
              type="submit"
              disabled={resendStatus === 'loading'}
              className="px-4 py-2 bg-white text-amber-700 rounded font-semibold text-sm hover:bg-amber-50 disabled:opacity-50"
            >
              {resendStatus === 'loading' ? 'Enviando...' : 'Reenviar e-mail'}
            </button>
          </form>
          {resendMessage && (
            <p className={`text-center text-sm mt-2 ${resendStatus === 'success' ? 'text-green-100' : 'text-red-100'}`}>
              {resendMessage}
            </p>
          )}
        </div>
      )}
      <LoginForm onShowRegister={() => setShowRegisterModal(true)} />
      <RegisterModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        initialReferralCode={refCode}
      />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-4" />
            <p className="text-gray-600">Carregando...</p>
          </div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}

