'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginInput } from '@/lib/validations';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import SocialLoginButtons from './SocialLoginButtons';

export default function LoginForm({ onShowRegister }: { onShowRegister: () => void }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

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
      const result = await signIn('credentials', {
        email: data.email,
        senha: data.senha,
        redirect: false,
      });

      if (result?.error) {
        setErrorMessage('Email ou senha inválidos');
        setIsLoading(false);
      } else if (result?.ok) {
        // Aguardar um pouco para garantir que a sessão foi criada
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // IMPORTANTE: Emitir tokens após login bem-sucedido
        try {
          const { authClient } = await import('@/lib/auth-client');
          const tokens = await authClient.issueTokens();
          
          if (!tokens) {
            console.warn('[LoginForm] Não foi possível emitir tokens, mas login foi bem-sucedido');
          }
        } catch (error) {
          console.error('[LoginForm] Erro ao emitir tokens:', error);
          // Continuar mesmo se falhar (NextAuth session ainda funciona)
        }
        
        // Buscar dados do usuário para redirecionar corretamente
        const response = await fetch('/api/auth/session');
        const session = await response.json();
        
        if (session?.user?.role) {
          const dashboardUrls: Record<string, string> = {
            ADMIN: '/admin/dashboard',
            GESTOR: '/gestor/home',
            CLIENTE: '/cliente/home',
          };
          
          // Usar window.location.href para garantir redirecionamento completo
          // Isso evita problemas com o estado do React
          window.location.href = dashboardUrls[session.user.role] || '/cliente/home';
        } else {
          window.location.href = '/cliente/home';
        }
      }
    } catch (error) {
      console.error('Erro no onSubmit:', error);
      setErrorMessage('Erro de conexão. Tente novamente.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Painel Esquerdo - Formulário */}
      <div className="w-full lg:w-3/5 flex items-center justify-center px-8 bg-white">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Acesse sua Conta</h1>
            <p className="text-gray-600">Tenha acesso ao firewall PRECIVOX</p>
          </div>

          {/* Mensagem de Erro */}
          {errorMessage && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {errorMessage}
            </div>
          )}

          {/* Botões de Login Social */}
          <div className="space-y-3 mb-6">
            <button 
              type="button"
              onClick={() => signIn('google')}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Login com Google
            </button>
            <button 
              type="button"
              onClick={() => signIn('facebook')}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Login com Facebook
            </button>
          </div>

          {/* Formulário de Login */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                placeholder="admin@precivox.com"
                defaultValue="admin@precivox.com"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Campo Senha */}
            <div>
              <label htmlFor="senha" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  {...register('senha')}
                  type="password"
                  id="senha"
                  name="senha"
                  autoComplete="current-password"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all pr-12"
                  placeholder="senha123"
                  defaultValue="senha123"
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

      {/* Painel Direito - Branding */}
      <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-teal-500 to-blue-600 relative">
        {/* Background Waves Pattern */}
        <div className="absolute inset-0 opacity-20">
          <svg
            className="w-full h-full"
            fill="none"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <path
              d="M0,0 C30,40 70,0 100,40 L100,0 L0,0 Z"
              fill="rgba(255,255,255,0.1)"
            />
            <path
              d="M0,20 C30,60 70,20 100,60 L100,20 L0,20 Z"
              fill="rgba(255,255,255,0.05)"
            />
            <path
              d="M0,40 C30,80 70,40 100,80 L100,40 L0,40 Z"
              fill="rgba(255,255,255,0.02)"
            />
          </svg>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center text-white p-8 w-full">
          {/* Logo */}
          <div className="absolute top-8 left-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-teal-400 rounded"></div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">PRECIVOX</h3>
                <p className="text-sm text-blue-100">Inteligência em Preços</p>
              </div>
            </div>
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
