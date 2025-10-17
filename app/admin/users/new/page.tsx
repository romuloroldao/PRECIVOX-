'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import DashboardLayout from '@/components/DashboardLayout';
import { useRouter } from 'next/navigation';

const createUserSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  senha: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  role: z.enum(['CLIENTE', 'GESTOR', 'ADMIN']),
});

type CreateUserInput = z.infer<typeof createUserSchema>;

export default function NewUserPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
  });

  const onSubmit = async (data: CreateUserInput) => {
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        setSuccessMessage('Usuário criado com sucesso!');
        setTimeout(() => {
          router.push('/admin/users');
        }, 2000);
      } else {
        setErrorMessage(result.error || 'Erro ao criar usuário');
      }
    } catch (error) {
      setErrorMessage('Erro de conexão. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout role="ADMIN">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-800 mb-4 flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Voltar
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Criar Novo Usuário</h1>
          <p className="text-gray-600 mt-1">Adicione um novo usuário ao sistema</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Success Message */}
            {successMessage && (
              <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                {successMessage}
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                {errorMessage}
              </div>
            )}

            {/* Nome */}
            <div>
              <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-2">
                Nome completo
              </label>
              <input
                {...register('nome')}
                type="text"
                id="nome"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="João Silva"
              />
              {errors.nome && (
                <p className="text-red-500 text-sm mt-1">{errors.nome.message}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                {...register('email')}
                type="email"
                id="email"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="joao@exemplo.com"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Senha */}
            <div>
              <label htmlFor="senha" className="block text-sm font-medium text-gray-700 mb-2">
                Senha
              </label>
              <input
                {...register('senha')}
                type="password"
                id="senha"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="••••••••"
              />
              {errors.senha && (
                <p className="text-red-500 text-sm mt-1">{errors.senha.message}</p>
              )}
            </div>

            {/* Role */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de usuário
              </label>
              <select
                {...register('role')}
                id="role"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="CLIENTE">Cliente</option>
                <option value="GESTOR">Gestor</option>
                <option value="ADMIN">Administrador</option>
              </select>
              {errors.role && (
                <p className="text-red-500 text-sm mt-1">{errors.role.message}</p>
              )}
            </div>

            {/* Buttons */}
            <div className="flex space-x-4 pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all font-semibold disabled:opacity-50"
              >
                {isLoading ? 'Criando...' : 'Criar Usuário'}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
