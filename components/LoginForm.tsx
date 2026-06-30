'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginInput } from '@/lib/validations';
import { useRouter, useSearchParams } from 'next/navigation';
import Logo from '@/components/Logo';
import { safeCallbackUrl } from '@/lib/safe-callback-url';
import { getDashboardUrl } from '@/lib/redirect';
import SocialLoginButtons from '@/components/auth/SocialLoginButtons';
import PhoneOtpLogin from '@/components/auth/PhoneOtpLogin';
import { authClient } from '@/lib/auth-client';

export default function LoginForm({ onShowRegister }: { onShowRegister: () => void }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = safeCallbackUrl(searchParams.get('callbackUrl'));
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [usePhone, setUsePhone] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: data.email, senha: data.senha }),
      });

      const json = await res.json().catch(() => ({}));

      if (res.status === 403 && json.code === 'EMAIL_NOT_VERIFIED') {
        setErrorMessage(
          'E-mail ainda não confirmado. Redirecionando para você poder reenviar o link de confirmação...'
        );
        const emailParam = encodeURIComponent(json.email || data.email);
        router.push(`/login?error=EmailNotVerified&email=${emailParam}`);
        setIsLoading(false);
        return;
      }

      if (!res.ok || !json.success) {
        setErrorMessage(
          json.error || 'Não foi possível entrar. Tente novamente ou use "Esqueci minha senha".'
        );
        setIsLoading(false);
        return;
      }

      if (json.accessToken && json.refreshToken) {
        authClient.persistLoginTokens({
          accessToken: json.accessToken,
          refreshToken: json.refreshToken,
          expiresAt: json.expiresAt,
        });
      }

      const role = json.user?.role as string | undefined;
      const destination =
        role === 'GESTOR' || role === 'ADMIN'
          ? getDashboardUrl(role)
          : callbackUrl;

      window.location.href = destination;
      return;
    } catch (error) {
      console.error('Erro no login:', error);
      setErrorMessage('Não foi possível concluir o login agora. Tente novamente em instantes.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Painel Esquerdo - Formulário */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-8 bg-white">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Logo height={48} href="" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Acesse sua Conta</h1>
            <p className="text-gray-600">Entre na plataforma PRECIVOX</p>
          </div>

          {/* Mensagem de Erro - sempre visível para o usuário */}
          {errorMessage && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-300 text-red-800 rounded-lg text-sm shadow-sm" role="alert">
              <p className="font-semibold mb-1">Não foi possível entrar</p>
              <p className="mb-0">{errorMessage}</p>
            </div>
          )}

          {/* Botões de Login Social */}
          <div className="mb-6">
            <SocialLoginButtons callbackUrl={callbackUrl} disabled={isLoading} />
          </div>

          {/* Divisor */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-white text-gray-500">ou</span>
            </div>
          </div>

          {/* Alternância e-mail / telefone */}
          <div className="flex gap-2 mb-4 text-sm">
            <button
              type="button"
              onClick={() => setUsePhone(false)}
              className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                !usePhone ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              E-mail e senha
            </button>
            <button
              type="button"
              onClick={() => setUsePhone(true)}
              className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                usePhone ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              Telefone (SMS)
            </button>
          </div>

          {usePhone && <PhoneOtpLogin callbackUrl={callbackUrl} />}

          {/* Formulário de Login */}
          <form onSubmit={handleSubmit(onSubmit)} className={`space-y-4 ${usePhone ? 'hidden' : ''}`}>
            {/* Campo Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                {...register('email')}
                type="email"
                id="email"
                name="email"
                autoComplete="email"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="seu@email.com"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Campo Senha */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="senha" className="block text-sm font-medium text-gray-700">
                  Senha
                </label>
                <a
                  href="/resetar-senha"
                  className="text-sm text-blue-600 hover:underline"
                >
                  Esqueci minha senha
                </a>
              </div>
              <div className="relative">
                <input
                  {...register('senha')}
                  type="password"
                  id="senha"
                  name="senha"
                  autoComplete="current-password"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all pr-12"
                  placeholder="Sua senha"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                </button>
              </div>
              {errors.senha && (
                <p className="text-red-500 text-sm mt-1">{errors.senha.message}</p>
              )}
            </div>

            {/* Botão Login */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all font-semibold disabled:opacity-50"
            >
              {isLoading ? 'Entrando...' : 'Login'}
            </button>
          </form>

          {/* Link de Cadastro */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Ainda não tem uma conta?{' '}
              <button
                onClick={onShowRegister}
                className="text-blue-600 font-medium hover:underline"
              >
                Cadastre-se gratuitamente
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Painel Direito - Branding: sem h-full/min-h-screen; gradiente inline */}
      <div
        className="relative hidden lg:flex lg:w-1/2 flex-1 overflow-hidden"
        style={{ background: 'linear-gradient(to bottom right, #0d9488, #2563eb)' }}
      >
        {/* SVG de onda: altura fixa 200px, não depende do pai */}
        <svg
          className="absolute bottom-0 left-0 w-full"
          style={{ height: '200px' }}
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M0,96 C360,256 1080,0 1440,96 L1440,320 L0,320 Z"
            fill="rgba(255,255,255,0.15)"
          />
          <path
            d="M0,160 C360,32 1080,288 1440,160 L1440,320 L0,320 Z"
            fill="rgba(255,255,255,0.1)"
          />
        </svg>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center text-white p-8 w-full">
          {/* Logo */}
          <div className="absolute top-8 left-8">
            <Logo height={44} href="" variant="white" />
          </div>

          {/* Main Content */}
          <div className="text-center">
            <h2 className="text-4xl font-bold mb-4">Bem-vindo de volta!</h2>
            <p className="text-lg opacity-90 mb-8">
              Acesse insights inteligentes e comparações de preços em tempo real
            </p>
            
            {/* Features List */}
            <ul className="text-left space-y-3 text-lg">
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Análise de mercado automatizada
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Relatórios personalizados
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Alertas de preços em tempo real
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
