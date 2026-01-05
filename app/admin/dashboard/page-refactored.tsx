/**
 * Dashboard Admin - Versão Refatorada
 * 
 * Arquitetura Resiliente:
 * - UI: Componentes React puros
 * - State/Data: Hooks customizados (useApiQuery)
 * - API Client: apiFetch com interceptors
 * - Error Handling: ErrorBoundary + ErrorDisplay
 * 
 * Nenhum componente acessa API diretamente.
 * Toda chamada tem tratamento de loading, error e empty state.
 */

'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useSession } from 'next-auth/react';
import { useApiQuery } from '@/lib/hooks';
import { SkeletonStats, SkeletonCardList } from '@/components/SkeletonLoader';
import { ErrorDisplay } from '@/components/ErrorBoundary';
import { EmptyState } from '@/components/EmptyState';

interface UserStats {
  total: number;
  clientes: number;
  gestores: number;
  admins: number;
  markets?: number;
  products?: number;
}

interface RecentUser {
  id: string;
  nome: string;
  email: string;
  role: string;
  dataCriacao: string;
}

export default function AdminDashboardPage() {
  const { data: session, status } = useSession();
  const user = session?.user;

  // ✅ Query para estatísticas - Hook gerencia loading, error, data
  const {
    data: stats,
    isLoading: statsLoading,
    isError: statsError,
    error: statsErrorMsg,
    refetch: refetchStats,
  } = useApiQuery<UserStats>('/api/admin/stats', {
    enabled: status === 'authenticated' && user?.role === 'ADMIN',
    retries: 2,
    timeout: 10000,
  });

  // ✅ Query para usuários recentes - Hook gerencia loading, error, data
  const {
    data: recentUsers,
    isLoading: usersLoading,
    isError: usersError,
    error: usersErrorMsg,
    refetch: refetchUsers,
  } = useApiQuery<RecentUser[]>('/api/admin/recent-users', {
    enabled: status === 'authenticated' && user?.role === 'ADMIN',
    retries: 2,
    timeout: 10000,
  });

  // Verificar se está carregando ou não autenticado
  if (status === 'loading') {
    return (
      <DashboardLayout role="ADMIN">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Carregando...</div>
        </div>
      </DashboardLayout>
    );
  }

  // Verificar se está autenticado e é admin
  if (!session || !user || user.role !== 'ADMIN') {
    return (
      <DashboardLayout role="ADMIN">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-red-600 mb-2">Acesso Negado</h2>
            <p className="text-gray-600">Você não tem permissão para acessar esta página.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="ADMIN">
      <div className="space-y-6">
        {/* Welcome */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Painel Administrativo</h1>
              <p className="text-lg opacity-90">
                Bem-vindo, {user?.name || 'Administrador'}! Controle total do sistema PRECIVOX
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-75">Última atualização</p>
              <p className="text-lg font-semibold">{new Date().toLocaleTimeString('pt-BR')}</p>
            </div>
          </div>
        </div>

        {/* System Stats - Com fallback completo */}
        {statsError ? (
          <ErrorDisplay
            title="Erro ao carregar estatísticas"
            message={statsErrorMsg || 'Não foi possível carregar as estatísticas do sistema'}
            onRetry={refetchStats}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {statsLoading ? (
              <SkeletonStats count={4} />
            ) : stats ? (
              <>
                <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Usuários</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total || 0}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Todos os usuários registrados</p>
                </div>

                <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Clientes</p>
                      <p className="text-3xl font-bold text-blue-600 mt-2">{stats.clientes || 0}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Usuários com acesso básico</p>
                </div>

                <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Gestores</p>
                      <p className="text-3xl font-bold text-green-600 mt-2">{stats.gestores || 0}</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Gestores de equipe</p>
                </div>

                <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Admins</p>
                      <p className="text-3xl font-bold text-purple-600 mt-2">{stats.admins || 0}</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Administradores do sistema</p>
                </div>
              </>
            ) : (
              <EmptyState
                title="Estatísticas não disponíveis"
                message="Não foi possível carregar as estatísticas do sistema."
                action={{
                  label: 'Tentar novamente',
                  onClick: refetchStats,
                }}
              />
            )}
          </div>
        )}

        {/* Management Sections */}
        <div className="grid grid-cols-1 gap-6">
          {/* User Management */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Gerenciar Usuários</h2>
              <button 
                onClick={() => window.location.href = '/admin/users'}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                + Novo Usuário
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button 
                onClick={() => window.location.href = '/admin/users'}
                className="text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-gray-900 block">Ver todos os usuários</span>
                    <span className="text-sm text-gray-500">Lista completa de usuários</span>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
              
              <button 
                onClick={() => window.location.href = '/admin/users/permissions'}
                className="text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-gray-900 block">Alterar permissões</span>
                    <span className="text-sm text-gray-500">Gerenciar roles e acesso</span>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            </div>
          </div>

          {/* Mercados Management */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Gerenciar Mercados</h2>
              <button 
                onClick={() => window.location.href = '/admin/mercados'}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              >
                + Novo Mercado
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button 
                onClick={() => window.location.href = '/admin/mercados'}
                className="text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-gray-900 block">Ver todos os mercados</span>
                    <span className="text-sm text-gray-500">Lista completa de mercados</span>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Recent Registrations - Com fallback completo */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Registros Recentes</h2>
            <button 
              onClick={() => {
                refetchStats();
                refetchUsers();
              }}
              disabled={usersLoading}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {usersLoading ? 'Atualizando...' : 'Atualizar'}
            </button>
          </div>
          
          {usersError ? (
            <ErrorDisplay
              title="Erro ao carregar usuários recentes"
              message={usersErrorMsg || 'Não foi possível carregar os usuários recentes'}
              onRetry={refetchUsers}
            />
          ) : usersLoading ? (
            <SkeletonCardList count={5} />
          ) : recentUsers && recentUsers.length > 0 ? (
            <div className="space-y-3">
              {recentUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-medium text-sm">
                        {user.nome?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{user.nome}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                      user.role === 'GESTOR' ? 'bg-green-100 text-green-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {user.role}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(user.dataCriacao).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Nenhum registro recente"
              message="Novos usuários aparecerão aqui quando se registrarem."
            />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

