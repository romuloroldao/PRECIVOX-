// src/hooks/usePermissions.ts - Sistema de Permissões PRECIVOX CORRIGIDO
import { useMemo } from 'react';
import { useAuth } from './useAuth'; // ✅ IMPORTAR useAuth
import { UserProfile } from './useAuth'; // ✅ Corrigir para UserProfile

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
  canUploadProducts: boolean; // ✅ Nova permissão para upload de produtos
  
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
  user: UserProfile | null;
  isAuthenticated: boolean;
  userRole: UserProfile['role'] | null;
  userPlan: UserProfile['plan'] | 'free';
  storeId?: string;
}

// ✅ CONFIGURAÇÃO DE PERMISSÕES POR ROLE
const ROLE_PERMISSIONS: Record<UserProfile['role'], Partial<Permissions>> = {
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
    canUploadProducts: false, // ✅ Nova permissão para cliente
    
    // Funcionalidades Administrativas
    canManageUsers: false,
    canManageStores: false,
    canViewSystemLogs: false,
    canManageSystemSettings: false,
    canAccessSupport: true,
    
    // Recursos Premium/Planos
    canUseAdvancedFilters: false,
    canUseAI: false,
    canExportData: false,
    canUseAPIAccess: false,
    canCustomizeDashboard: false,
    
    // Ações Específicas
    canInviteUsers: false,
    canModerateContent: false,
    canManageNotifications: true,
    canAccessBetaFeatures: false
  },

  // 🏪 GESTOR - Foco em gerenciamento de mercado
  gestor: {
    // Navegação - ANALYTICS LIBERADO
    canAccessDashboard: true,
    canAccessAnalytics: true,      // ✅ LIBERADO para gestor
    canAccessReports: true,        // ✅ LIBERADO para gestor
    canAccessSettings: true,
    canAccessAdminPanel: false,
    
    // Funcionalidades do Cliente
    canCreateLists: true,
    canEditLists: true,
    canDeleteLists: true,
    canShareLists: true,
    canAddToFavorites: true,
    canViewPrices: true,
    canCompareProducts: true,
    canSetPriceAlerts: true,
    
    // ✅ FUNCIONALIDADES DO GESTOR - TODAS LIBERADAS
    canManageStore: true,
    canManageProducts: true,
    canManageInventory: true,
    canViewStoreAnalytics: true,
    canManageStoreSettings: true,
    canExportReports: true,
    canViewCustomerData: true,
    canManagePricing: true,
    canUploadProducts: true, // ✅ Nova permissão para gestor
    
    // Funcionalidades Administrativas
    canManageUsers: false,
    canManageStores: false,
    canViewSystemLogs: false,
    canManageSystemSettings: false,
    canAccessSupport: true,
    
    // Recursos Premium/Planos
    canUseAdvancedFilters: true,
    canUseAI: true,
    canExportData: true,
    canUseAPIAccess: false,
    canCustomizeDashboard: true,
    
    // Ações Específicas
    canInviteUsers: true,
    canModerateContent: true,
    canManageNotifications: true,
    canAccessBetaFeatures: true
  },

  // 👑 ADMIN - Acesso total ao sistema
  admin: {
    // Navegação - TUDO LIBERADO
    canAccessDashboard: true,
    canAccessAnalytics: true,
    canAccessReports: true,
    canAccessSettings: true,
    canAccessAdminPanel: true,
    
    // Funcionalidades do Cliente
    canCreateLists: true,
    canEditLists: true,
    canDeleteLists: true,
    canShareLists: true,
    canAddToFavorites: true,
    canViewPrices: true,
    canCompareProducts: true,
    canSetPriceAlerts: true,
    
    // Funcionalidades do Gestor
    canManageStore: true,
    canManageProducts: true,
    canManageInventory: true,
    canViewStoreAnalytics: true,
    canManageStoreSettings: true,
    canExportReports: true,
    canViewCustomerData: true,
    canManagePricing: true,
    canUploadProducts: true, // ✅ Nova permissão para admin
    
    // Funcionalidades Administrativas - Tudo liberado
    canManageUsers: true,
    canManageStores: true,
    canViewSystemLogs: true,
    canManageSystemSettings: true,
    canAccessSupport: true,
    
    // Recursos Premium/Planos
    canUseAdvancedFilters: true,
    canUseAI: true,
    canExportData: true,
    canUseAPIAccess: true,
    canCustomizeDashboard: true,
    
    // Ações Específicas
    canInviteUsers: true,
    canModerateContent: true,
    canManageNotifications: true,
    canAccessBetaFeatures: true
  }
};

// ✅ CONFIGURAÇÃO DE PERMISSÕES POR PLANO - MAIS FLEXÍVEL
const PLAN_PERMISSIONS: Record<UserProfile['plan'], Partial<Permissions>> = {
  // 🆓 PLANO FREE - Funcionalidades básicas
  free: {
    canUseAdvancedFilters: true, // ✅ LIBERADO PARA TODOS
    canUseAI: true, // ✅ LIBERADO PARA TODOS
    canExportData: true, // ✅ LIBERADO PARA TODOS
    canUseAPIAccess: false,
    canCustomizeDashboard: true, // ✅ LIBERADO PARA TODOS
    canAccessBetaFeatures: true // ✅ LIBERADO PARA TODOS
  },
  
  // ⭐ PLANO PREMIUM - Funcionalidades avançadas
  premium: {
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
  const { user, isAuthenticated } = useAuth();
  
  // ✅ Obter role do usuário
  const userRole = user?.role || null;
  
  // ✅ Obter plano do usuário
  const userPlan = user?.plan || 'free';
  
  // ✅ Obter storeId do usuário
  const storeId = user?.marketId || undefined;

  return useMemo(() => {
    // ✅ Verificar se usuário está autenticado
    if (!isAuthenticated || !user || !userRole) {
      console.log('🚫 [PERMISSIONS] Usuário não autenticado - permissões cliente');
      const guestPermissions = ROLE_PERMISSIONS.cliente || {};
      
      const guestWithHelpers = {
        ...guestPermissions,
        // ✅ HELPERS PARA USUÁRIOS NÃO AUTENTICADOS
        isGuest: () => true,
        isCliente: () => false,
        isGestor: () => false,
        isAdmin: () => false,
        hasPermission: () => false,
        canAccessAdminPanel: () => false,
        canViewAnalytics: () => false,
        canManageStore: () => false,
        canManageProducts: () => false,
        canUploadProducts: () => false, // ✅ Nova permissão
        canExportData: () => false,
        canUseAI: () => false,
        canUseAdvancedFilters: () => false,
        canCustomizeDashboard: () => false,
        canInviteUsers: () => false,
        canModerateContent: () => false,
        canAccessBetaFeatures: () => false,
        canUseAPIAccess: () => false,
        canViewSystemLogs: () => false,
        canManageSystemSettings: () => false,
        canManageUsers: () => false,
        canManageStores: () => false,
        canViewCustomerData: () => false,
        canManagePricing: () => false,
        canManageInventory: () => false,
        canViewStoreAnalytics: () => false,
        canManageStoreSettings: () => false,
        canExportReports: () => false,
        canCreateLists: () => false,
        canEditLists: () => false,
        canDeleteLists: () => false,
        canShareLists: () => false,
        canAddToFavorites: () => false,
        canViewPrices: () => true, // ✅ Visitantes podem ver preços
        canCompareProducts: () => true, // ✅ Visitantes podem comparar
        canSetPriceAlerts: () => false,
        canCompareStores: () => true, // ✅ Visitantes podem comparar lojas
        canAccessSupport: () => false,
        canManageNotifications: () => false,
        canAccessReports: () => false,
        canAccessSettings: () => false,
        canAccessDashboard: () => false,
        canAccessAnalytics: () => false,
        canAccessAdminPanel: () => false
      };

      return guestWithHelpers;
    }

    // ✅ Obter permissões base do role
    const rolePermissions = ROLE_PERMISSIONS[userRole] || ROLE_PERMISSIONS.cliente;
    
    // ✅ Obter permissões do plano
    const planPermissions = PLAN_PERMISSIONS[userPlan] || {};
    
    // ✅ Combinar permissões (role + plano)
    const combinedPermissions = {
      ...rolePermissions,
      ...planPermissions
    };
      
    console.log('✅ [PERMISSIONS] Permissões calculadas:', {
      role: userRole,
      plan: userPlan,
      isCliente: userRole === 'cliente',
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