// src/hooks/useAuth.ts - Versão Produção Limpa
import React, { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { saveToStorage, getFromStorage, removeFromStorage } from './useLocalStorage';

// ===================================
// 🎭 TIPOS SIMPLIFICADOS
// ===================================

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'cliente' | 'gestor' | 'admin';
  avatar?: string;
  plan?: 'free' | 'premium' | 'enterprise';
  preferences?: Record<string, any>;
  permissions?: string[];
  // ✅ NOVOS CAMPOS PARA SISTEMA DE MERCADOS
  marketId?: string; // ID do mercado (obrigatório para gestores)
  market?: {
    id: string;
    name: string;
    address: string;
    city: string;
    state: string;
    status: 'active' | 'inactive' | 'suspended';
    plan: 'basic' | 'premium' | 'enterprise';
    phone?: string;
    cnpj?: string;
  };
  // Stats específicas por role
  stats?: {
    // Para Cliente
    listas_criadas?: number;
    produtos_favoritados?: number;
    economia_total?: number;
    compras_realizadas?: number;
    membro_desde?: string;
    // Para Gestor
    produtos_cadastrados?: number;
    vendas_hoje?: number;
    vendas_mes?: number;
    total_clientes?: number;
    // Para Admin
    total_mercados?: number;
    mercados_ativos?: number;
    usuarios_sistema?: number;
    revenue_total?: number;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: 'cliente' | 'gestor';
  phone?: string;
  companyName?: string;
  acceptNewsletter?: boolean;
}

export interface PersonaContext {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  loginAsCliente: (credentials: LoginCredentials) => Promise<boolean>;
  loginAsGestor: (credentials: LoginCredentials) => Promise<boolean>;
  loginAsAdmin: (credentials: LoginCredentials) => Promise<boolean>;
  loginWithRole: (credentials: LoginCredentials, role: 'cliente' | 'gestor' | 'admin') => Promise<boolean>;
  registerUser: (data: RegisterData) => Promise<boolean>;
  checkEmailAvailability: (email: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (updates: Partial<UserProfile>) => Promise<boolean>;
}

// ===================================
// 🗂️ USUÁRIOS DEMO
// ===================================

const demoUsers: Record<string, UserProfile> = {
  'cliente@precivox.com': {
    id: 'cliente-001',
    name: 'Maria Silva',
    email: 'cliente@precivox.com',
    role: 'cliente',
    plan: 'free',
    avatar: '/avatars/cliente.jpg',
    permissions: ['view_products', 'create_lists', 'view_prices'],
    stats: {
      listas_criadas: 12,
      produtos_favoritados: 28,
      economia_total: 245.50,
      compras_realizadas: 8,
      membro_desde: '2024-01-15'
    }
  },
  'demo@precivox.com.br': {
    id: 'e4168c62-bc60-4fcb-9070-96eed94ba9eb',
    name: 'Demo Gestor',
    email: 'demo@precivox.com.br',
    role: 'gestor',
    plan: 'premium',
    avatar: '/avatars/gestor.jpg',
    permissions: ['view_products', 'view_analytics', 'manage_store', 'export_data'],
    marketId: 'market-001',
    market: {
      id: 'market-001',
      name: 'Supermercado Vila Nova',
      address: 'Rua das Flores, 123 - Centro',
      city: 'Franco da Rocha',
      state: 'SP',
      status: 'active',
      plan: 'premium',
      phone: '(11) 4444-5555',
      cnpj: '12.345.678/0001-90'
    },
    stats: {
      produtos_cadastrados: 1247,
      vendas_hoje: 3850.75,
      vendas_mes: 89240.50,
      total_clientes: 156,
      membro_desde: '2023-08-10'
    }
  },
  'admin@precivox.com': {
    id: 'admin-001',
    name: 'Ana Costa',
    email: 'admin@precivox.com',
    role: 'admin',
    plan: 'enterprise',
    avatar: '/avatars/admin.jpg',
    permissions: ['*'],
    stats: {
      total_mercados: 47,
      mercados_ativos: 42,
      usuarios_sistema: 1340,
      revenue_total: 125650.80,
      membro_desde: '2023-01-01'
    }
  }
};

// ===================================
// 🎯 CONTEXTO
// ===================================

const AuthContext = createContext<PersonaContext>({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  loginAsCliente: async () => { return false; },
  loginAsGestor: async () => { return false; },
  loginAsAdmin: async () => { return false; },
  loginWithRole: async () => { return false; },
  registerUser: async () => { return false; },
  checkEmailAvailability: async () => { return true; },
  logout: () => { },
  updateProfile: async () => { return false; }
});

// ===================================
// 🚀 AUTH PROVIDER
// ===================================

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = user !== null;

  // ✅ FUNÇÃO PRINCIPAL DE LOGIN
  const loginWithRole = useCallback(async (
    credentials: LoginCredentials,
    role: 'cliente' | 'gestor' | 'admin'
  ): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      // Validação básica
      if (!credentials.email || !credentials.password) {
        setError('Por favor, preencha email e senha');
        return false;
      }

      // Validar formato do email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(credentials.email)) {
        setError('Por favor, insira um email válido');
        return false;
      }

      // Chamada para API real de login
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${API_URL}/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials)
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Erro no login');
        return false;
      }

      // Login bem-sucedido
      const { user, token, refreshToken } = result.data;
      
      // Verificar se o usuário tem a role correta
      if (user.role !== role) {
        setError(`Este login é para usuários com papel de ${role}. Use o login correto.`);
        return false;
      }

      // Salvar no storage
      try {
        saveToStorage('user', user);
        saveToStorage('tokens', { accessToken: token, refreshToken });
        saveToStorage('lastLogin', new Date().toISOString());
        // Salvar token para uso na API
        localStorage.setItem('token', token);
      } catch (storageError) {
        console.error('Erro ao salvar dados:', storageError);
      }

      // Atualizar estado
      setUser(user);
      setError(null);
      
      return true;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido no login';
      setError(errorMessage);
      console.error('Erro no login:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ✅ LOGINS ESPECÍFICOS POR ROLE
  const loginAsCliente = useCallback(async (credentials: LoginCredentials): Promise<boolean> => {
    return await loginWithRole(credentials, 'cliente');
  }, [loginWithRole]);

  const loginAsGestor = useCallback(async (credentials: LoginCredentials): Promise<boolean> => {
    return await loginWithRole(credentials, 'gestor');
  }, [loginWithRole]);

  const loginAsAdmin = useCallback(async (credentials: LoginCredentials): Promise<boolean> => {
    return await loginWithRole(credentials, 'admin');
  }, [loginWithRole]);

  // ✅ LOGOUT
  const logout = useCallback(() => {
    try {
      removeFromStorage('user');
      removeFromStorage('tokens');
      removeFromStorage('lastLogin');
      
      setUser(null);
      setError(null);
    } catch (error) {
      console.error('Erro no logout:', error);
    }
  }, []);

  // ✅ ATUALIZAR PERFIL
  const updateProfile = useCallback(async (updates: Partial<UserProfile>): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      saveToStorage('user', updatedUser);
      return true;
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      return false;
    }
  }, [user]);

  // ✅ FUNÇÃO DE REGISTRO
  const registerUser = useCallback(async (data: RegisterData): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      // Chamada para API de registro
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.message || result.error || 'Erro ao criar conta');
        return false;
      }

      // Registro bem-sucedido
      console.log('✅ Usuário registrado:', result.data.user);
      
      // Optionally login automatically after registration
      // setUser(result.data.user);
      // saveToStorage('user', result.data.user);

      return true;

    } catch (error) {
      console.error('❌ Erro no registro:', error);
      setError('Erro de conexão. Tente novamente.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ✅ VERIFICAR DISPONIBILIDADE DE EMAIL
  const checkEmailAvailability = useCallback(async (email: string): Promise<boolean> => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${API_URL}/auth/check-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      });

      if (!response.ok) {
        return true; // Se der erro, assumir que está disponível
      }

      const result = await response.json();
      return result.data?.available || false;

    } catch (error) {
      console.error('❌ Erro ao verificar email:', error);
      return true; // Em caso de erro, assumir que está disponível
    }
  }, []);

  // ✅ INICIALIZAÇÃO
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedUser = getFromStorage('user');
        if (storedUser) {
          setUser(storedUser);
        }
      } catch (error) {
        console.error('Erro ao inicializar autenticação:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // ✅ CONTEXT VALUE
  const contextValue: PersonaContext = {
    user,
    isAuthenticated,
    isLoading,
    error,
    loginAsCliente,
    loginAsGestor,
    loginAsAdmin,
    loginWithRole,
    registerUser,
    checkEmailAvailability,
    logout,
    updateProfile
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// ===================================
// 🪝 HOOK
// ===================================

export const useAuth = (): PersonaContext => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }

  return context;
};

// ===================================
// 🛡️ HELPER FUNCTIONS - PERMISSÕES
// ===================================

export const usePermissions = () => {
  const { user } = useAuth();

  const hasPermission = useCallback((permission: string): boolean => {
    if (!user) return false;
    if (user.permissions?.includes('*')) return true; // Admin tem tudo
    return user.permissions?.includes(permission) || false;
  }, [user]);

  const isCliente = useCallback((): boolean => {
    return user?.role === 'cliente';
  }, [user]);

  const isGestor = useCallback((): boolean => {
    return user?.role === 'gestor';
  }, [user]);

  const isAdmin = useCallback((): boolean => {
    return user?.role === 'admin';
  }, [user]);

  const canAccessDashboard = useCallback((): boolean => {
    return isGestor() || isAdmin();
  }, [isGestor, isAdmin]);

  const canAccessAdminPanel = useCallback((): boolean => {
    return isAdmin();
  }, [isAdmin]);

  const canManageUsers = useCallback((): boolean => {
    return hasPermission('manage_users') || isAdmin();
  }, [hasPermission, isAdmin]);

  const canViewAnalytics = useCallback((): boolean => {
    return hasPermission('view_analytics') || isGestor() || isAdmin();
  }, [hasPermission, isGestor, isAdmin]);

  const getMarketId = useCallback((): string | null => {
    if (isGestor() && user?.marketId) {
      return user.marketId;
    }
    return null; // Clientes e admins não têm marketId fixo
  }, [user, isGestor]);

  const canAccessMarket = useCallback((marketId: string): boolean => {
    if (isAdmin()) return true; // Admin acessa qualquer mercado
    if (isGestor()) return user?.marketId === marketId; // Gestor só seu mercado
    return false; // Cliente não acessa dados de mercado
  }, [user, isAdmin, isGestor]);

  return {
    hasPermission,
    isCliente,
    isGestor,
    isAdmin,
    canAccessDashboard,
    canAccessAdminPanel,
    canManageUsers,
    canViewAnalytics,
    getMarketId,
    canAccessMarket,
    user
  };
};

export default useAuth;