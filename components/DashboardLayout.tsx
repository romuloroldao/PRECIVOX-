'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthenticatedUser, logout } from '@/lib/auth-client';
import { getRoleLabel } from '@/lib/redirect';

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: 'ADMIN' | 'GESTOR' | 'CLIENTE';
}

export default function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const userData = await getAuthenticatedUser();
      if (!userData) {
        router.push('/login');
        return;
      }
      setUser(userData);
      setIsLoading(false);
    };
    loadUser();
  }, [router]);

  const handleLogout = async () => {
    await logout();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-precivox-blue mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-precivox-light">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-precivox-blue">PRECIVOX</h1>
              <span className="ml-4 px-3 py-1 bg-precivox-blue text-white text-sm rounded-full">
                {getRoleLabel(role)}
              </span>
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.nome}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              {user?.imagem && (
                <img
                  src={user.imagem}
                  alt={user.nome}
                  className="w-10 h-10 rounded-full"
                />
              )}
              <button
                onClick={handleLogout}
                className="ml-2 px-4 py-2 text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

