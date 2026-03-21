'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Logo from '@/components/Logo';

function ConfirmarEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!tokenFromUrl) {
      setStatus('error');
      setMessage('Link inválido. Use o link que enviamos no seu e-mail.');
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch('/api/auth/confirm-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: tokenFromUrl }),
        });
        const data = await res.json();

        if (cancelled) return;

        if (data.success) {
          setStatus('success');
          setMessage(data.message || 'E-mail confirmado com sucesso.');
          setTimeout(() => router.push('/login?confirmed=1'), 3000);
        } else {
          setStatus('error');
          setMessage(data.error || 'Link inválido ou expirado.');
        }
      } catch {
        if (!cancelled) {
          setStatus('error');
          setMessage('Erro de conexão. Tente novamente.');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tokenFromUrl, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="flex justify-center mb-6">
          <Logo height={48} href="/login" />
        </div>

        {status === 'loading' && (
          <>
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">Confirmando seu e-mail...</h1>
            <p className="text-gray-600">Aguarde um momento.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">E-mail confirmado!</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <p className="text-sm text-gray-500 mb-4">Redirecionando para o login...</p>
            <Link
              href="/login"
              className="inline-block w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
            >
              Ir para o login
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Não foi possível confirmar</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <Link
              href="/login"
              className="inline-block w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
            >
              Voltar ao login
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function ConfirmarEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600" />
        </div>
      }
    >
      <ConfirmarEmailContent />
    </Suspense>
  );
}
