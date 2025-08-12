// src/hooks/useAuth.ts - Sistema Principal de Autenticação PRECIVOX (CORRIGIDO)
import { useState, useEffect, useCallback } from 'react';
import { saveToStorage, getFromStorage, removeFromStorage } from './useLocalStorage';

// ✅ TIPOS CENTRALIZADOS - Baseados no LoginPage existente
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'cliente' | 'gestor' | 'admin';
  phone?: string;
  avatar?: string;
  preferences?: {
    categoriasFavoritas: string[];
    marcasPreferidas: string[];
    raioMaximoBusca: number;
    notificacoes: boolean;
    modoEscuro: boolean;
  };
  store?: {
    id: string;
    name: string;
    address: string;
    phone?: string;
    cnpj?: string;
    logo?: string;
  };
  stats?: {
    listas_criadas: number;
    produtos_favoritados: number;
    economia_total: number;
    compras_realizadas: number;
    membro_desde: string;
  };
  plan?: 'free' | 'pro' | 'enterprise';
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  loginAttempts: number;
  lastLoginAttempt: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
  userType: 'cliente' | 'gestor';
  rememberMe?: boolean;
}

export interface RegisterData extends LoginCredentials {
  name: string;
  phone?: string;
  storeName?: string;
  storeAddress?: string;
  cnpj?: string;
}

// ✅ HOOK PRINCIPAL DE AUTENTICAÇÃO
export const useAuth = () => {
  // Estados principais
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
    loginAttempts: 0,
    lastLoginAttempt: 0
  });

  // ✅ INICIALIZAÇÃO - Verificar usuário salvo
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('🔐 useAuth - Inicializando sistema de autenticação...');
        
        const savedUser = getFromStorage<User>('precivox_user');
        const savedToken = getFromStorage<string>('precivox_token');
        const loginAttempts = getFromStorage<number>('login_attempts') || 0;
        const lastLoginAttempt = getFromStorage<number>('last_login_attempt') || 0;
        
        if (savedUser && savedToken) {
          console.log('✅ Usuário encontrado no storage:', savedUser.email, '-', savedUser.role);
          
          // Verificar se o token não expirou (simples check por agora)
          const tokenAge = Date.now() - (savedUser.stats?.membro_desde ? new Date(savedUser.stats.membro_desde).getTime() : 0);
          const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 dias
          
          if (tokenAge < maxAge) {
            setAuthState(prev => ({
              ...prev,
              user: savedUser,
              isAuthenticated: true,
              isLoading: false,
              loginAttempts,
              lastLoginAttempt
            }));
            console.log('✅ Autenticação automática realizada');
          } else {
            console.log('⚠️ Token expirado, removendo credenciais');
            await logout();
          }
        } else {
          console.log('ℹ️ Nenhum usuário salvo encontrado');
          setAuthState(prev => ({
            ...prev,
            isLoading: false,
            loginAttempts,
            lastLoginAttempt
          }));
        }
      } catch (error) {
        console.error('❌ Erro na inicialização da autenticação:', error);
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Erro ao carregar dados de autenticação'
        }));
      }
    };

    initializeAuth();
  }, []);

  // ✅ FUNÇÃO DE LOGIN - RATE LIMITING CORRIGIDO
  const login = useCallback(async (credentials: LoginCredentials): Promise<{ success: boolean; message: string }> => {
    try {
      console.log('🔐 Tentativa de login:', credentials.email, '-', credentials.userType);
      
      setAuthState(prev => ({
        ...prev,
        isLoading: true,
        error: null
      }));

      // ✅ RATE LIMITING CORRIGIDO - máximo 5 tentativas por hora
      const now = Date.now();
      const oneHour = 60 * 60 * 1000;
      
      // ✅ VERIFICAR SE PASSOU MAIS DE 1 HORA DESDE A ÚLTIMA TENTATIVA
      const timeSinceLastAttempt = now - authState.lastLoginAttempt;
      
      // ✅ RESETAR TENTATIVAS SE PASSOU MAIS DE 1 HORA
      if (timeSinceLastAttempt >= oneHour && authState.loginAttempts > 0) {
        console.log('⏰ Resetando tentativas de login (1 hora passou)');
        setAuthState(prev => ({
          ...prev,
          loginAttempts: 0,
          lastLoginAttempt: 0
        }));
        removeFromStorage('login_attempts');
        removeFromStorage('last_login_attempt');
      }

      // ✅ VERIFICAÇÃO CORRIGIDA DO RATE LIMITING
      const currentAttempts = timeSinceLastAttempt >= oneHour ? 0 : authState.loginAttempts;
      const shouldBlock = currentAttempts >= 5 && timeSinceLastAttempt < oneHour;

      console.log('🔒 Rate Limiting Check:', {
        attempts: currentAttempts,
        maxAttempts: 5,
        timeSinceLastAttempt: Math.round(timeSinceLastAttempt / 60000) + 'min',
        shouldBlock,
        development: process.env.NODE_ENV === 'development'
      });

      // ✅ EM DESENVOLVIMENTO, PERMITIR BYPASS DO RATE LIMITING
      if (shouldBlock && process.env.NODE_ENV !== 'development') {
        const timeLeft = Math.ceil((oneHour - timeSinceLastAttempt) / 60000);
        throw new Error(`Muitas tentativas de login. Tente novamente em ${timeLeft} minutos.`);
      }

      // ✅ SE EM DESENVOLVIMENTO E MUITAS TENTATIVAS, APENAS AVISAR
      if (shouldBlock && process.env.NODE_ENV === 'development') {
        console.warn('⚠️ Rate limiting ativo, mas ignorado em desenvolvimento');
      }

      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 1000));

      // ✅ CONTAS DEMO - Baseadas no LoginPage existente
      const demoAccounts: { [key: string]: User } = {
        'cliente@demo.com': {
          id: 'user-1',
          email: 'cliente@demo.com',
          name: 'Maria Santos',
          role: 'cliente',
          phone: '(11) 99999-9999',
          preferences: {
            categoriasFavoritas: ['Alimentação', 'Limpeza'],
            marcasPreferidas: ['Nestlé', 'Unilever'],
            raioMaximoBusca: 5,
            notificacoes: true,
            modoEscuro: false
          },
          stats: {
            listas_criadas: 24,
            produtos_favoritados: 156,
            economia_total: 1240.50,
            compras_realizadas: 89,
            membro_desde: '2024-01-15'
          },
          plan: 'pro'
        },
        'gestor@demo.com': {
          id: 'user-2',
          email: 'gestor@demo.com',
          name: 'João Silva',
          role: 'gestor',
          phone: '(11) 88888-8888',
          store: {
            id: 'store-1',
            name: 'Supermercado Central',
            address: 'Rua das Flores, 123, Franco da Rocha, SP',
            phone: '(11) 3333-3333',
            cnpj: '12.345.678/0001-90'
          },
          stats: {
            listas_criadas: 0,
            produtos_favoritados: 0,
            economia_total: 0,
            compras_realizadas: 0,
            membro_desde: '2024-02-01'
          },
          plan: 'enterprise'
        },
        'admin@demo.com': {
          id: 'user-3',
          email: 'admin@demo.com',
          name: 'Admin Sistema',
          role: 'admin',
          phone: '(11) 77777-7777',
          stats: {
            listas_criadas: 0,
            produtos_favoritados: 0,
            economia_total: 0,
            compras_realizadas: 0,
            membro_desde: '2024-01-01'
          },
          plan: 'enterprise'
        }
      };

      const userData = demoAccounts[credentials.email];

      // Validar credenciais
      if (!userData || credentials.password !== '123456') {
        // ✅ INCREMENTAR TENTATIVAS APENAS EM CASO DE ERRO
        const newAttempts = currentAttempts + 1;
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          loginAttempts: newAttempts,
          lastLoginAttempt: now
        }));
        
        saveToStorage('login_attempts', newAttempts);
        saveToStorage('last_login_attempt', now);
        
        throw new Error('Email ou senha incorretos');
      }

      // Verificar se o tipo de usuário corresponde
      if ((credentials.userType === 'cliente' && userData.role !== 'cliente') ||
          (credentials.userType === 'gestor' && !['gestor', 'admin'].includes(userData.role))) {
        throw new Error('Tipo de usuário não corresponde ao perfil');
      }

      // ✅ LOGIN REALIZADO COM SUCESSO
      const token = `precivox_token_${userData.id}_${Date.now()}`;
      
      // Salvar dados
      saveToStorage('precivox_user', userData);
      saveToStorage('precivox_token', token);
      
      if (credentials.rememberMe) {
        saveToStorage('remember_login', true);
      }

      // ✅ RESET COMPLETO DAS TENTATIVAS DE LOGIN
      removeFromStorage('login_attempts');
      removeFromStorage('last_login_attempt');

      setAuthState(prev => ({
        ...prev,
        user: userData,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        loginAttempts: 0,
        lastLoginAttempt: 0
      }));

      console.log('✅ Login realizado com sucesso:', userData.name, '-', userData.role);
      
      return {
        success: true,
        message: `Bem-vindo(a), ${userData.name}!`
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido no login';
      
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));

      console.error('❌ Erro no login:', errorMessage);
      
      return {
        success: false,
        message: errorMessage
      };
    }
  }, [authState.loginAttempts, authState.lastLoginAttempt]);

  // ✅ FUNÇÃO DE REGISTRO
  const register = useCallback(async (data: RegisterData): Promise<{ success: boolean; message: string }> => {
    try {
      console.log('📝 Tentativa de registro:', data.email, '-', data.userType);
      
      setAuthState(prev => ({
        ...prev,
        isLoading: true,
        error: null
      }));

      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Verificar se email já existe (simples check)
      const existingUser = getFromStorage<User>('precivox_user');
      if (existingUser && existingUser.email === data.email) {
        throw new Error('Este email já está cadastrado');
      }

      // Criar novo usuário
      const newUser: User = {
        id: `user_${Date.now()}`,
        email: data.email,
        name: data.name,
        role: data.userType === 'gestor' ? 'gestor' : 'cliente',
        phone: data.phone,
        store: data.userType === 'gestor' ? {
          id: `store_${Date.now()}`,
          name: data.storeName || '',
          address: data.storeAddress || '',
          cnpj: data.cnpj
        } : undefined,
        preferences: {
          categoriasFavoritas: [],
          marcasPreferidas: [],
          raioMaximoBusca: 5,
          notificacoes: true,
          modoEscuro: false
        },
        stats: {
          listas_criadas: 0,
          produtos_favoritados: 0,
          economia_total: 0,
          compras_realizadas: 0,
          membro_desde: new Date().toISOString()
        },
        plan: 'free'
      };

      const token = `precivox_token_${newUser.id}_${Date.now()}`;
      
      // Salvar dados
      saveToStorage('precivox_user', newUser);
      saveToStorage('precivox_token', token);

      setAuthState(prev => ({
        ...prev,
        user: newUser,
        isAuthenticated: true,
        isLoading: false,
        error: null
      }));

      console.log('✅ Registro realizado com sucesso:', newUser.name, '-', newUser.role);
      
      return {
        success: true,
        message: `Conta criada com sucesso! Bem-vindo(a), ${newUser.name}!`
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido no registro';
      
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));

      console.error('❌ Erro no registro:', errorMessage);
      
      return {
        success: false,
        message: errorMessage
      };
    }
  }, []);

  // ✅ FUNÇÃO DE LOGOUT
  const logout = useCallback(async (showMessage: boolean = true): Promise<void> => {
    try {
      console.log('🔓 Realizando logout...');
      
      setAuthState(prev => ({
        ...prev,
        isLoading: true
      }));

      // Remover dados salvos
      removeFromStorage('precivox_user');
      removeFromStorage('precivox_token');
      removeFromStorage('remember_login');

      // Delay para UX
      await new Promise(resolve => setTimeout(resolve, 500));

      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        loginAttempts: 0,
        lastLoginAttempt: 0
      });

      if (showMessage) {
        console.log('✅ Logout realizado com sucesso');
      }

    } catch (error) {
      console.error('❌ Erro no logout:', error);
      
      // Forçar logout mesmo com erro
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        loginAttempts: 0,
        lastLoginAttempt: 0
      });
    }
  }, []);

  // ✅ FUNÇÃO PARA ATUALIZAR PERFIL
  const updateProfile = useCallback(async (updates: Partial<User>): Promise<{ success: boolean; message: string }> => {
    try {
      if (!authState.user) {
        throw new Error('Usuário não autenticado');
      }

      console.log('👤 Atualizando perfil do usuário...');
      
      setAuthState(prev => ({
        ...prev,
        isLoading: true,
        error: null
      }));

      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 800));

      const updatedUser: User = {
        ...authState.user,
        ...updates,
        // Preservar campos importantes
        id: authState.user.id,
        email: authState.user.email,
        role: authState.user.role
      };

      // Salvar dados atualizados
      saveToStorage('precivox_user', updatedUser);

      setAuthState(prev => ({
        ...prev,
        user: updatedUser,
        isLoading: false
      }));

      console.log('✅ Perfil atualizado com sucesso');
      
      return {
        success: true,
        message: 'Perfil atualizado com sucesso!'
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar perfil';
      
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));

      console.error('❌ Erro ao atualizar perfil:', errorMessage);
      
      return {
        success: false,
        message: errorMessage
      };
    }
  }, [authState.user]);

  // ✅ NOVA FUNÇÃO PARA LIMPAR TENTATIVAS DE LOGIN (DESENVOLVIMENTO)
  const clearLoginAttempts = useCallback(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🧹 Limpando tentativas de login (desenvolvimento)');
      setAuthState(prev => ({
        ...prev,
        loginAttempts: 0,
        lastLoginAttempt: 0
      }));
      removeFromStorage('login_attempts');
      removeFromStorage('last_login_attempt');
    }
  }, []);

  // ✅ FUNÇÃO PARA VERIFICAR SESSÃO
  const checkSession = useCallback((): boolean => {
    const token = getFromStorage<string>('precivox_token');
    const user = getFromStorage<User>('precivox_user');
    
    return !!(token && user && authState.isAuthenticated);
  }, [authState.isAuthenticated]);

  // ✅ FUNÇÃO PARA REFRESH DO TOKEN (futuro)
  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      if (!authState.user) return false;
      
      console.log('🔄 Renovando token...');
      
      // Simular renovação de token
      const newToken = `precivox_token_${authState.user.id}_${Date.now()}`;
      saveToStorage('precivox_token', newToken);
      
      console.log('✅ Token renovado');
      return true;
      
    } catch (error) {
      console.error('❌ Erro ao renovar token:', error);
      return false;
    }
  }, [authState.user]);

  // ✅ FUNÇÃO PARA LIMPAR ERROS
  const clearError = useCallback(() => {
    setAuthState(prev => ({
      ...prev,
      error: null
    }));
  }, []);

  // ✅ FUNÇÕES UTILITÁRIAS
  const isRole = useCallback((role: User['role']): boolean => {
    return authState.user?.role === role;
  }, [authState.user?.role]);

  const hasPermission = useCallback((permission: string): boolean => {
    if (!authState.user) return false;
    
    // Lógica básica de permissões (será expandida no usePermissions)
    switch (permission) {
      case 'dashboard':
        return ['gestor', 'admin'].includes(authState.user.role);
      case 'create_lists':
        return authState.user.role === 'cliente';
      case 'manage_store':
        return authState.user.role === 'gestor';
      case 'admin_panel':
        return authState.user.role === 'admin';
      default:
        return false;
    }
  }, [authState.user]);

  // ✅ RETURN COMPLETO DO HOOK
  return {
    // Estados
    user: authState.user,
    isAuthenticated: authState.isAuthenticated,
    isLoading: authState.isLoading,
    error: authState.error,
    loginAttempts: authState.loginAttempts,
    
    // Funções principais
    login,
    register,
    logout,
    updateProfile,
    
    // Funções de utilidade
    checkSession,
    refreshToken,
    clearError,
    clearLoginAttempts, // ✅ NOVA FUNÇÃO
    isRole,
    hasPermission,
    
    // Getters úteis
    isCliente: isRole('cliente'),
    isGestor: isRole('gestor'),
    isAdmin: isRole('admin'),
    
    // Estados computados
    canAccessDashboard: hasPermission('dashboard'),
    canCreateLists: hasPermission('create_lists'),
    canManageStore: hasPermission('manage_store'),
    
    // Dados do usuário
    userName: authState.user?.name || '',
    userEmail: authState.user?.email || '',
    userRole: authState.user?.role || null,
    userPlan: authState.user?.plan || 'free',
    userStore: authState.user?.store || null
  };
};

export default useAuth;