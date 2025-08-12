// src/hooks/useSecurityGuard.ts - Hook de Segurança Simples
import { useMemo } from 'react';
import { useAuth } from './useAuth';

export const useSecurityGuard = () => {
  const { user, isAuthenticated } = useAuth();

  return useMemo(() => ({
    // ✅ Verificações rápidas
    canUseFeature: (feature: 'lists' | 'analytics' | 'markets' | 'admin'): boolean => {
      if (!isAuthenticated || !user) return false;
      
      switch (feature) {
        case 'lists': return user.role === 'cliente';
        case 'analytics': return ['gestor', 'admin'].includes(user.role);
        case 'markets': return user.role === 'admin';
        case 'admin': return user.role === 'admin';
        default: return false;
      }
    },

    // ✅ Mensagens de bloqueio educativas
    getBlockMessage: (feature: 'lists' | 'analytics' | 'markets' | 'admin'): string => {
      const messages = {
        lists: user?.role === 'admin' ? '🔒 Listas são privadas dos clientes' : 
               user?.role === 'gestor' ? '📊 Use Analytics para insights' : 
               'Faça login como cliente',
        analytics: 'Analytics disponível para gestores e administradores',
        markets: 'Gestão de mercados apenas para administradores',
        admin: 'Área administrativa restrita'
      };
      return messages[feature];
    },

    // ✅ Estados do usuário
    userRole: user?.role || null,
    isClient: user?.role === 'cliente',
    isManager: user?.role === 'gestor',
    isAdmin: user?.role === 'admin',
    isAuthenticated
  }), [user, isAuthenticated]);
};