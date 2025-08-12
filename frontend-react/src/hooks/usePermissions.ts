// src/hooks/usePermissions.ts - Sistema de Permissões PRECIVOX CORRIGIDO
import { useMemo } from 'react';
import { useAuth } from './useAuth'; // ✅ IMPORTAR useAuth
import { User } from './useAuth';

// ✅ TIPOS DE PERMISSÕES
export interface Permissions {
  // Navegação e Páginas
  canAccessDashboard: boolean;
  canAccessAnalytics: boolean;
  canAccessReports: boolean;
  canAccessSettings: boolean;
  canAccessAdminPanel: boolean;
  
  // Funcionalidades do Cliente
  canCreateLists: boolean;
  canEditLists: boolean;
  canDeleteLists: boolean;
  canShareLists: boolean;
  canAddToFavorites: boolean;
  canViewPrices: boolean;
  canCompareProducts: boolean;
  canSetPriceAlerts: boolean;
  
  // Funcionalidades do Gestor
  canManageStore: boolean;
  canManageProducts: boolean;
  canManageInventory: boolean;
  canViewStoreAnalytics: boolean;
  canManageStoreSettings: boolean;
  canExportReports: boolean;
  canViewCustomerData: boolean;
  canManagePricing: boolean;
  
  // Funcionalidades Administrativas
  canManageUsers: boolean;
  canManageStores: boolean;
  canViewSystemLogs: boolean;
  canManageSystemSettings: boolean;
  canAccessSupport: boolean;
  
  // Recursos Premium/Planos
  canUseAdvancedFilters: boolean;
  canUseAI: boolean;
  canExportData: boolean;
  canUseAPIAccess: boolean;
  canCustomizeDashboard: boolean;
  
  // Ações Específicas
  canInviteUsers: boolean;
  canModerateContent: boolean;
  canManageNotifications: boolean;
  canAccessBetaFeatures: boolean;
}

export interface PermissionContext {
  user: User | null;
  isAuthenticated: boolean;
  userRole: User['role'] | null;
  userPlan: User['plan'] | 'free';
  storeId?: string;
}

// ✅ CONFIGURAÇÃO DE PERMISSÕES POR ROLE
const ROLE_PERMISSIONS: Record<User['role'], Partial<Permissions>> = {
  // 👤 CLIENTE - Foco em listas e compras (SEM ANALYTICS)
  cliente: {
    // Navegação - ANALYTICS BLOQUEADO
    canAccessDashboard: false,
    canAccessAnalytics: false,     // ❌ BLOQUEADO para cliente
    canAccessReports: false,       // ❌ BLOQUEADO para cliente
    canAccessSettings: true,
    canAccessAdminPanel: false,
    
    // ✅ FUNCIONALIDADES DO CLIENTE - TODAS LIBERADAS (EXCETO ANALYTICS)
    canCreateLists: true,
    canEditLists: true,
    canDeleteLists: true,
    canShareLists: true,
    canAddToFavorites: true,
    canViewPrices: true,
    canCompareProducts: true,
    canSetPriceAlerts: true,
    
    // Funcionalidades do Gestor
    canManageStore: false,
    canManageProducts: false,
    canManageInventory: false,
    canViewStoreAnalytics: false,
    canManageStoreSettings: false,
    canExportReports: false,
    canViewCustomerData: false,
    canManagePricing: false,
    
    // Funcionalidades Administrativas
    canManageUsers: false,
    canManageStores: false,
    canViewSystemLogs: false,
    canManageSystemSettings: false,
    canAccessSupport: true,
    
    // ✅ RECURSOS PREMIUM - LIBERADOS PARA CLIENTE PRO
    canUseAdvancedFilters: true, // ✅ CORRIGIDO: era false
    canUseAI: true, // ✅ CORRIGIDO: era false  
    canExportData: true, // ✅ CORRIGIDO: era false
    canUseAPIAccess: false,
    canCustomizeDashboard: true, // ✅ CORRIGIDO: era false
    
    // Ações Específicas
    canInviteUsers: false,
    canModerateContent: false,
    canManageNotifications: true,
    canAccessBetaFeatures: true // ✅ CORRIGIDO: era false
  },
  
  // 🏪 GESTOR - Foco em analytics e gestão da loja
  gestor: {
    // Navegação
    canAccessDashboard: true,
    canAccessAnalytics: true,
    canAccessReports: true,
    canAccessSettings: true,
    canAccessAdminPanel: false,
    
    // Funcionalidades do Cliente (acesso limitado)
    canCreateLists: false,
    canEditLists: false,
    canDeleteLists: false,
    canShareLists: false,
    canAddToFavorites: false,
    canViewPrices: true,
    canCompareProducts: true,
    canSetPriceAlerts: false,
    
    // Funcionalidades do Gestor
    canManageStore: true,
    canManageProducts: true,
    canManageInventory: true,
    canViewStoreAnalytics: true,
    canManageStoreSettings: true,
    canExportReports: true,
    canViewCustomerData: true,
    canManagePricing: true,
    
    // Funcionalidades Administrativas
    canManageUsers: false,
    canManageStores: false,
    canViewSystemLogs: false,
    canManageSystemSettings: false,
    canAccessSupport: true,
    
    // Recursos Premium
    canUseAdvancedFilters: true,
    canUseAI: true,
    canExportData: true,
    canUseAPIAccess: false, // Será definido por plano
    canCustomizeDashboard: true,
    
    // Ações Específicas
    canInviteUsers: true, // Para equipe da loja
    canModerateContent: false,
    canManageNotifications: true,
    canAccessBetaFeatures: true
  },
  
  // 👨‍💼 ADMIN - Acesso completo
  admin: {
    // Navegação - Tudo liberado
    canAccessDashboard: true,
    canAccessAnalytics: true,
    canAccessReports: true,
    canAccessSettings: true,
    canAccessAdminPanel: true,
    
    // Funcionalidades do Cliente - Tudo liberado
    canCreateLists: true,
    canEditLists: true,
    canDeleteLists: true,
    canShareLists: true,
    canAddToFavorites: true,
    canViewPrices: true,
    canCompareProducts: true,
    canSetPriceAlerts: true,
    
    // Funcionalidades do Gestor - Tudo liberado
    canManageStore: true,
    canManageProducts: true,
    canManageInventory: true,
    canViewStoreAnalytics: true,
    canManageStoreSettings: true,
    canExportReports: true,
    canViewCustomerData: true,
    canManagePricing: true,
    
    // Funcionalidades Administrativas - Tudo liberado
    canManageUsers: true,
    canManageStores: true,
    canViewSystemLogs: true,
    canManageSystemSettings: true,
    canAccessSupport: true,
    
    // Recursos Premium - Tudo liberado
    canUseAdvancedFilters: true,
    canUseAI: true,
    canExportData: true,
    canUseAPIAccess: true,
    canCustomizeDashboard: true,
    
    // Ações Específicas - Tudo liberado
    canInviteUsers: true,
    canModerateContent: true,
    canManageNotifications: true,
    canAccessBetaFeatures: true
  },

  // ✅ OUTROS ROLES PARA COMPATIBILIDADE
  guest: {
    canAccessDashboard: false,
    canAccessAnalytics: false,
    canAccessReports: false,
    canAccessSettings: false,
    canAccessAdminPanel: false,
    canCreateLists: false,
    canEditLists: false,
    canDeleteLists: false,
    canShareLists: false,
    canAddToFavorites: false,
    canViewPrices: true,
    canCompareProducts: true,
    canSetPriceAlerts: false,
    canManageStore: false,
    canManageProducts: false,
    canManageInventory: false,
    canViewStoreAnalytics: false,
    canManageStoreSettings: false,
    canExportReports: false,
    canViewCustomerData: false,
    canManagePricing: false,
    canManageUsers: false,
    canManageStores: false,
    canViewSystemLogs: false,
    canManageSystemSettings: false,
    canAccessSupport: false,
    canUseAdvancedFilters: false,
    canUseAI: false,
    canExportData: false,
    canUseAPIAccess: false,
    canCustomizeDashboard: false,
    canInviteUsers: false,
    canModerateContent: false,
    canManageNotifications: false,
    canAccessBetaFeatures: false
  },

  cliente_premium: {
    // Mesmo que cliente, mas com recursos premium
    canAccessDashboard: false,
    canAccessAnalytics: false,
    canAccessReports: false,
    canAccessSettings: true,
    canAccessAdminPanel: false,
    canCreateLists: true,
    canEditLists: true,
    canDeleteLists: true,
    canShareLists: true,
    canAddToFavorites: true,
    canViewPrices: true,
    canCompareProducts: true,
    canSetPriceAlerts: true,
    canManageStore: false,
    canManageProducts: false,
    canManageInventory: false,
    canViewStoreAnalytics: false,
    canManageStoreSettings: false,
    canExportReports: false,
    canViewCustomerData: false,
    canManagePricing: false,
    canManageUsers: false,
    canManageStores: false,
    canViewSystemLogs: false,
    canManageSystemSettings: false,
    canAccessSupport: true,
    canUseAdvancedFilters: true,
    canUseAI: true,
    canExportData: true,
    canUseAPIAccess: false,
    canCustomizeDashboard: true,
    canInviteUsers: false,
    canModerateContent: false,
    canManageNotifications: true,
    canAccessBetaFeatures: true
  },

  super_admin: {
    // Mesmo que admin
    canAccessDashboard: true,
    canAccessAnalytics: true,
    canAccessReports: true,
    canAccessSettings: true,
    canAccessAdminPanel: true,
    canCreateLists: true,
    canEditLists: true,
    canDeleteLists: true,
    canShareLists: true,
    canAddToFavorites: true,
    canViewPrices: true,
    canCompareProducts: true,
    canSetPriceAlerts: true,
    canManageStore: true,
    canManageProducts: true,
    canManageInventory: true,
    canViewStoreAnalytics: true,
    canManageStoreSettings: true,
    canExportReports: true,
    canViewCustomerData: true,
    canManagePricing: true,
    canManageUsers: true,
    canManageStores: true,
    canViewSystemLogs: true,
    canManageSystemSettings: true,
    canAccessSupport: true,
    canUseAdvancedFilters: true,
    canUseAI: true,
    canExportData: true,
    canUseAPIAccess: true,
    canCustomizeDashboard: true,
    canInviteUsers: true,
    canModerateContent: true,
    canManageNotifications: true,
    canAccessBetaFeatures: true
  }
};

// ✅ CONFIGURAÇÃO DE PERMISSÕES POR PLANO - MAIS FLEXÍVEL
const PLAN_PERMISSIONS: Record<User['plan'], Partial<Permissions>> = {
  // 🆓 PLANO FREE - Funcionalidades básicas
  free: {
    canUseAdvancedFilters: true, // ✅ LIBERADO PARA TODOS
    canUseAI: true, // ✅ LIBERADO PARA TODOS
    canExportData: true, // ✅ LIBERADO PARA TODOS
    canUseAPIAccess: false,
    canCustomizeDashboard: true, // ✅ LIBERADO PARA TODOS
    canAccessBetaFeatures: true // ✅ LIBERADO PARA TODOS
  },
  
  // ⭐ PLANO PRO - Funcionalidades avançadas
  pro: {
    canUseAdvancedFilters: true,
    canUseAI: true,
    canExportData: true,
    canUseAPIAccess: false,
    canCustomizeDashboard: true,
    canAccessBetaFeatures: true
  },
  
  // 🏢 PLANO ENTERPRISE - Tudo liberado
  enterprise: {
    canUseAdvancedFilters: true,
    canUseAI: true,
    canExportData: true,
    canUseAPIAccess: true,
    canCustomizeDashboard: true,
    canAccessBetaFeatures: true
  }
};

// ✅ HOOK PRINCIPAL DE PERMISSÕES - CORRIGIDO
export const usePermissions = () => {
  // ✅ OBTER DADOS DO useAuth AUTOMATICAMENTE
  const { user, isAuthenticated, userRole } = useAuth();
  
  return useMemo(() => {
    console.log('🔐 [PERMISSIONS] Calculando permissões...');
    console.log('👤 [PERMISSIONS] User:', user?.name);
    console.log('🎭 [PERMISSIONS] Role:', userRole);
    console.log('💼 [PERMISSIONS] Plan:', user?.plan);
    console.log('✅ [PERMISSIONS] Authenticated:', isAuthenticated);
    
    // ✅ Se não estiver autenticado, permissões de guest
    if (!isAuthenticated || !user || !userRole) {
      console.log('🚫 [PERMISSIONS] Usuário não autenticado - permissões guest');
      const guestPermissions = ROLE_PERMISSIONS.guest || {};
      
      const guestWithHelpers = {
        ...guestPermissions,
        canUseListFeatures: false,
        can: (permission: keyof Permissions): boolean => Boolean(guestPermissions[permission]),
        canAccess: () => false,
        canManage: () => false,
        canUse: () => false
      };
      
      return guestWithHelpers;
    }
    
    // ✅ Obter permissões base do role
    const rolePermissions = ROLE_PERMISSIONS[userRole] || ROLE_PERMISSIONS.guest;
    
    // ✅ Obter permissões do plano
    const userPlan = user.plan || 'pro'; // ✅ PADRÃO PRO EM VEZ DE FREE
    const planPermissions = PLAN_PERMISSIONS[userPlan] || PLAN_PERMISSIONS.pro;
    
    // ✅ SIMPLIFICAR: Para clientes, sempre liberar funcionalidades de lista
    const isCliente = userRole === 'cliente' || userRole === 'cliente_premium';
    
    // ✅ Combinar permissões (role + plano) - LÓGICA CORRIGIDA
    const combinedPermissions: Permissions = {
      // Navegação e Páginas
      canAccessDashboard: rolePermissions.canAccessDashboard || false,
      canAccessAnalytics: rolePermissions.canAccessAnalytics || false,
      canAccessReports: rolePermissions.canAccessReports || false,
      canAccessSettings: rolePermissions.canAccessSettings || false,
      canAccessAdminPanel: rolePermissions.canAccessAdminPanel || false,
      
      // ✅ FUNCIONALIDADES DO CLIENTE - CORRIGIDAS
      canCreateLists: isCliente ? true : (rolePermissions.canCreateLists || false),
      canEditLists: isCliente ? true : (rolePermissions.canEditLists || false),
      canDeleteLists: isCliente ? true : (rolePermissions.canDeleteLists || false),
      canShareLists: isCliente ? true : (rolePermissions.canShareLists || false),
      canAddToFavorites: isCliente ? true : (rolePermissions.canAddToFavorites || false),
      canViewPrices: rolePermissions.canViewPrices || false,
      canCompareProducts: rolePermissions.canCompareProducts || false,
      canSetPriceAlerts: rolePermissions.canSetPriceAlerts || false,
      
      // Funcionalidades do Gestor
      canManageStore: rolePermissions.canManageStore || false,
      canManageProducts: rolePermissions.canManageProducts || false,
      canManageInventory: rolePermissions.canManageInventory || false,
      canViewStoreAnalytics: rolePermissions.canViewStoreAnalytics || false,
      canManageStoreSettings: rolePermissions.canManageStoreSettings || false,
      canExportReports: rolePermissions.canExportReports || false,
      canViewCustomerData: rolePermissions.canViewCustomerData || false,
      canManagePricing: rolePermissions.canManagePricing || false,
      
      // Funcionalidades Administrativas
      canManageUsers: rolePermissions.canManageUsers || false,
      canManageStores: rolePermissions.canManageStores || false,
      canViewSystemLogs: rolePermissions.canViewSystemLogs || false,
      canManageSystemSettings: rolePermissions.canManageSystemSettings || false,
      canAccessSupport: rolePermissions.canAccessSupport || false,
      
      // ✅ RECURSOS PREMIUM - LÓGICA MAIS SIMPLES
      canUseAdvancedFilters: rolePermissions.canUseAdvancedFilters !== false,
      canUseAI: rolePermissions.canUseAI !== false,
      canExportData: rolePermissions.canExportData !== false,
      canUseAPIAccess: rolePermissions.canUseAPIAccess || false,
      canCustomizeDashboard: rolePermissions.canCustomizeDashboard !== false,
      
      // Ações Específicas
      canInviteUsers: rolePermissions.canInviteUsers || false,
      canModerateContent: rolePermissions.canModerateContent || false,
      canManageNotifications: rolePermissions.canManageNotifications || false,
      canAccessBetaFeatures: rolePermissions.canAccessBetaFeatures !== false
    };
    
    console.log('✅ [PERMISSIONS] Permissões calculadas:', {
      role: userRole,
      plan: userPlan,
      isCliente: isCliente,
      dashboard: combinedPermissions.canAccessDashboard,
      lists: combinedPermissions.canCreateLists,
      editLists: combinedPermissions.canEditLists,
      deleteLists: combinedPermissions.canDeleteLists,
      analytics: combinedPermissions.canAccessAnalytics,
      ai: combinedPermissions.canUseAI
    });
    
    // ✅ ADICIONAR FUNÇÕES DE CONVENIÊNCIA
    const permissionsWithHelpers = {
      ...combinedPermissions,
      
      // ✅ FUNÇÃO CRÍTICA PARA MinhasListas
      canUseListFeatures: combinedPermissions.canCreateLists,
      
      // ✅ OUTRAS FUNÇÕES DE CONVENIÊNCIA
      can: (permission: keyof Permissions): boolean => combinedPermissions[permission],
      
      canAccess: (page: 'dashboard' | 'analytics' | 'reports' | 'settings' | 'admin'): boolean => {
        switch (page) {
          case 'dashboard': return combinedPermissions.canAccessDashboard;
          case 'analytics': return combinedPermissions.canAccessAnalytics;
          case 'reports': return combinedPermissions.canAccessReports;
          case 'settings': return combinedPermissions.canAccessSettings;
          case 'admin': return combinedPermissions.canAccessAdminPanel;
          default: return false;
        }
      },
      
      canManage: (resource: 'store' | 'products' | 'inventory' | 'users' | 'lists'): boolean => {
        switch (resource) {
          case 'store': return combinedPermissions.canManageStore;
          case 'products': return combinedPermissions.canManageProducts;
          case 'inventory': return combinedPermissions.canManageInventory;
          case 'users': return combinedPermissions.canManageUsers;
          case 'lists': return combinedPermissions.canCreateLists && combinedPermissions.canEditLists;
          default: return false;
        }
      },
      
      canUse: (feature: 'ai' | 'advanced_filters' | 'export' | 'api' | 'beta'): boolean => {
        switch (feature) {
          case 'ai': return combinedPermissions.canUseAI;
          case 'advanced_filters': return combinedPermissions.canUseAdvancedFilters;
          case 'export': return combinedPermissions.canExportData;
          case 'api': return combinedPermissions.canUseAPIAccess;
          case 'beta': return combinedPermissions.canAccessBetaFeatures;
          default: return false;
        }
      }
    };
    
    console.log('🚀 [PERMISSIONS] canUseListFeatures:', permissionsWithHelpers.canUseListFeatures);
    
    return permissionsWithHelpers;
    
  }, [user, isAuthenticated, userRole]);
};

export default usePermissions;