// Componente de Header com funcionalidade de logout
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  title?: string;
  showUserInfo?: boolean;
}

export default function Header({ title = 'PRECIVOX', showUserInfo = true }: HeaderProps) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Buscar informações do usuário do localStorage
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        setUser({
          id: decoded.id,
          nome: decoded.nome,
          email: decoded.email,
          role: decoded.role
        });
      } catch (error) {
        console.error('Erro ao decodificar token:', error);
      }
    }
    setIsLoading(false);
  }, []);

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        // Chamar API de logout (opcional)
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }).catch(() => {
          // Ignorar erros de API
        });
      }
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      // Limpar localStorage e redirecionar
      localStorage.removeItem('token');
      window.location.href = '/';
    }
  };

  const getRoleLabel = (role: string) => {
    const labels = {
      'ADMIN': 'Administrador',
      'GESTOR': 'Gestor',
      'CLIENTE': 'Cliente'
    };
    return labels[role as keyof typeof labels] || role;
  };

  const getRoleColor = (role: string) => {
    const colors = {
      'ADMIN': 'bg-red-100 text-red-800',
      'GESTOR': 'bg-blue-100 text-blue-800',
      'CLIENTE': 'bg-green-100 text-green-800'
    };
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            </div>
            <div className="animate-pulse">
              <div className="h-8 w-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            {user && (
              <span className={`ml-3 px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                {getRoleLabel(user.role)}
              </span>
            )}
          </div>
          
          {showUserInfo && user && (
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.nome}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
