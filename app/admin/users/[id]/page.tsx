'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/DashboardLayout';
import { useToast } from '@/components/ToastContainer';

interface User {
  id: string;
  nome: string | null;
  email: string;
  role: string;
  data_criacao: string;
  data_atualizacao: string;
  ultimo_login: string | null;
  imagem: string | null;
  email_verified: string | null;
}

const updateUserSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  role: z.enum(['CLIENTE', 'GESTOR', 'ADMIN']),
});

type UpdateUserInput = z.infer<typeof updateUserSchema>;

export default function UserDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const toast = useToast();
  const userId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [originalData, setOriginalData] = useState<User | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UpdateUserInput>({
    resolver: zodResolver(updateUserSchema),
  });

  const fetchUser = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/users/${userId}`);

      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Usuário não encontrado');
          router.push('/admin/users');
          return;
        }
        if (response.status === 403) {
          toast.error('Acesso não autorizado');
          router.push('/dashboard');
          return;
        }
        throw new Error('Erro ao carregar usuário');
      }

      const data = await response.json();
      setUser(data);
      setOriginalData(data);
      reset({
        nome: data.nome || '',
        email: data.email,
        role: data.role,
      });
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      toast.error('Erro ao carregar dados do usuário');
    } finally {
      setLoading(false);
    }
  };

  // Verificar permissões e carregar dados
  useEffect(() => {
    if (!session) return; // Aguardar sessão carregar

    // Verificar se é admin
    if ((session.user as any)?.role !== 'ADMIN') {
      toast.error('Acesso não autorizado');
      router.push('/dashboard');
      return;
    }

    // Se for admin e tiver userId, carregar dados
    if (userId) {
      fetchUser();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, session]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (originalData) {
      reset({
        nome: originalData.nome || '',
        email: originalData.email,
        role: originalData.role,
      });
    }
    setIsEditing(false);
  };

  const onSubmit = async (data: UpdateUserInput) => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Usuário atualizado com sucesso!');
        setUser(result.user);
        setOriginalData(result.user);
        setIsEditing(false);
        // Recarregar dados para garantir sincronização
        await fetchUser();
      } else {
        toast.error(result.error || 'Erro ao atualizar usuário');
      }
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      toast.error('Erro de conexão. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="ADMIN">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-4">Carregando dados do usuário...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return (
      <DashboardLayout role="ADMIN">
        <div className="text-center py-8">
          <p className="text-gray-500">Usuário não encontrado</p>
          <button
            onClick={() => router.push('/admin/users')}
            className="mt-4 text-blue-600 hover:text-blue-800"
          >
            Voltar para listagem
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="ADMIN">
      <div className="space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600">
          <button
            onClick={() => router.push('/admin/users')}
            className="hover:text-blue-600"
          >
            Usuários
          </button>
          <span>/</span>
          <span className="text-gray-900">Detalhes do Usuário</span>
        </nav>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Detalhes do Usuário</h1>
            <p className="text-gray-600 mt-1">Visualize e edite as informações do usuário</p>
          </div>
          <button
            onClick={() => router.push('/admin/users')}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Voltar
          </button>
        </div>

        {/* User Details Card */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Avatar e Info básica */}
            <div className="flex items-start space-x-6 pb-6 border-b border-gray-200">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                {user.imagem ? (
                  <img
                    src={user.imagem}
                    alt={user.nome || 'Usuário'}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-blue-600 font-bold text-2xl">
                    {user.nome?.charAt(0)?.toUpperCase() || user.email.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900">
                  {user.nome || 'Sem nome'}
                </h2>
                <p className="text-gray-600">{user.email}</p>
                <div className="mt-2">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      user.role === 'ADMIN'
                        ? 'bg-purple-100 text-purple-800'
                        : user.role === 'GESTOR'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {user.role}
                  </span>
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nome */}
              <div>
                <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-2">
                  Nome completo
                </label>
                {isEditing ? (
                  <>
                    <input
                      {...register('nome')}
                      type="text"
                      id="nome"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Nome completo"
                    />
                    {errors.nome && (
                      <p className="text-red-500 text-sm mt-1">{errors.nome.message}</p>
                    )}
                  </>
                ) : (
                  <p className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">
                    {user.nome || 'Não informado'}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  E-mail
                </label>
                {isEditing ? (
                  <>
                    <input
                      {...register('email')}
                      type="email"
                      id="email"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="email@exemplo.com"
                    />
                    {errors.email && (
                      <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                    )}
                  </>
                ) : (
                  <p className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">{user.email}</p>
                )}
              </div>

              {/* Role */}
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                  Papel (Role)
                </label>
                {isEditing ? (
                  <>
                    <select
                      {...register('role')}
                      id="role"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="CLIENTE">CLIENTE</option>
                      <option value="GESTOR">GESTOR</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                    {errors.role && (
                      <p className="text-red-500 text-sm mt-1">{errors.role.message}</p>
                    )}
                  </>
                ) : (
                  <p className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">{user.role}</p>
                )}
              </div>

              {/* Data de Criação */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data de criação
                </label>
                <p className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">
                  {new Date(user.data_criacao).toLocaleString('pt-BR', {
                    dateStyle: 'long',
                    timeStyle: 'short',
                  })}
                </p>
              </div>

              {/* Último Login */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Último login
                </label>
                <p className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">
                  {user.ultimo_login
                    ? new Date(user.ultimo_login).toLocaleString('pt-BR', {
                        dateStyle: 'long',
                        timeStyle: 'short',
                      })
                    : 'Nunca'}
                </p>
              </div>

              {/* Email Verificado */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email verificado
                </label>
                <p className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">
                  {user.email_verified ? (
                    <span className="text-green-600 font-medium">✓ Verificado</span>
                  ) : (
                    <span className="text-gray-500">Não verificado</span>
                  )}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
              {!isEditing ? (
                <button
                  type="button"
                  onClick={handleEdit}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                  Editar Dados
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50"
                  >
                    {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                </>
              )}
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}

