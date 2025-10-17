'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, RegisterInput } from '@/lib/validations';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RegisterModal({ isOpen, onClose }: RegisterModalProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterInput) => {
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // Registrar usuário
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        setSuccessMessage('Cadastro realizado! Fazendo login...');
        
        // Fazer login automático após registro
        const signInResult = await signIn('credentials', {
          email: data.email,
          senha: data.senha,
          redirect: false,
        });

        if (signInResult?.ok) {
          setTimeout(() => {
            router.push('/cliente/home');
          }, 1000);
        } else {
          setSuccessMessage('Cadastro realizado! Redirecionando para login...');
          setTimeout(() => {
            onClose();
            router.push('/login');
          }, 1500);
        }
      } else {
        setErrorMessage(result.error || 'Erro ao fazer cadastro');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Erro no cadastro:', error);
      setErrorMessage('Erro de conexão. Tente novamente.');
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
        {/* Botão Fechar */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-gray-900">Criar Conta</h2>
          <p className="text-gray-600 mt-2">Comece gratuitamente hoje</p>
        </div>

        {/* Mensagens */}
        {successMessage && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg text-sm">
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
            {errorMessage}
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Nome */}
          <div>
            <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-1">
              Nome completo
            </label>
            <input
              {...register('nome')}
              type="text"
              id="nome"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              placeholder="João Silva"
            />
            {errors.nome && (
              <p className="text-red-500 text-sm mt-1">{errors.nome.message}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="register-email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              {...register('email')}
              type="email"
              id="register-email"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              placeholder="joao@exemplo.com"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Senha */}
          <div>
            <label htmlFor="register-senha" className="block text-sm font-medium text-gray-700 mb-1">
              Senha
            </label>
            <input
              {...register('senha')}
              type="password"
              id="register-senha"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              placeholder="Mínimo 6 caracteres"
            />
            {errors.senha && (
              <p className="text-red-500 text-sm mt-1">{errors.senha.message}</p>
            )}
          </div>

          {/* Botão Cadastrar */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all font-semibold disabled:opacity-50 mt-6"
          >
            {isLoading ? 'Cadastrando...' : 'Cadastrar'}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-sm text-gray-600 mt-6">
          Ao cadastrar, você concorda com nossos{' '}
          <a href="/termos" className="text-blue-600 hover:underline">
            Termos de Uso
          </a>
        </p>
      </div>
    </div>
  );
}
