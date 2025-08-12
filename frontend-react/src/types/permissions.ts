// src/types/permissions.ts
// 🔐 TIPOS DE PERMISSÕES ESPECÍFICAS - PRECIVOX v4.0

import { UserRole, Permission, PermissionScope, PermissionAction } from './security';

// ===================================
// 📋 PRECIVOX PERMISSIONS REGISTRY
// ===================================

export type PrecivoxPermission = 
  // 🔍 Search permissions
  | 'search.basic'
  | 'search.advanced'
  | 'search.ai_suggestions'
  | 'search.voice'
  | 'search.image'
  | 'search.filters.advanced'
  | 'search.export'
  | 'search.analytics'
  
  // 📝 Lists permissions
  | 'lists.create'
  | 'lists.read'
  | 'lists.update'
  | 'lists.delete'
  | 'lists.share'
  | 'lists.collaborate'
  | 'lists.import'
  | 'lists.export'
  | 'lists.templates'
  | 'lists.bulk_operations'
  
  // 🛒 Products permissions
  | 'products.view'
  | 'products.details'
  | 'products.compare'
  | 'products.favorite'
  | 'products.rate'
  | 'products.review'
  | 'products.share'
  | 'products.track_price'
  | 'products.bulk_add'
  
  // 📊 Dashboard permissions
  | 'dashboard.view'
  | 'dashboard.personal'
  | 'dashboard.business'
  | 'dashboard.analytics'
  | 'dashboard.reports'
  | 'dashboard.export'
  | 'dashboard.insights'
  | 'dashboard.forecasting'
  | 'dashboard.realtime'
  
  // 💰 Pricing & Alerts permissions
  | 'pricing.alerts.create'
  | 'pricing.alerts.manage'
  | 'pricing.history.view'
  | 'pricing.trends.access'
  | 'pricing.forecasting'
  | 'pricing.bulk_alerts'
  
  // 🏪 Store management permissions
  | 'store.profile.view'
  | 'store.profile.edit'
  | 'store.products.manage'
  | 'store.inventory.view'
  | 'store.inventory.edit'
  | 'store.analytics.view'
  | 'store.reports.generate'
  | 'store.competitors.analyze'
  | 'store.pricing.manage'
  
  // 👥 User management permissions
  | 'users.view'
  | 'users.create'
  | 'users.edit'
  | 'users.delete'
  | 'users.roles.assign'
  | 'users.permissions.manage'
  | 'users.suspend'
  | 'users.export'
  
  // ⚙️ System permissions
  | 'system.settings.view'
  | 'system.settings.edit'
  | 'system.logs.view'
  | 'system.audit.access'
  | 'system.backup.create'
  | 'system.maintenance.perform'
  | 'system.api.access'
  
  // 📈 Analytics permissions
  | 'analytics.basic'
  | 'analytics.advanced'
  | 'analytics.custom_reports'
  | 'analytics.data_export'
  | 'analytics.real_time'
  | 'analytics.ai_insights'
  
  // 🔧 API permissions
  | 'api.read'
  | 'api.write'
  | 'api.admin'
  | 'api.rate_limit.extended'
  | 'api.webhooks.manage'
  
  // 💳 Billing permissions
  | 'billing.view'
  | 'billing.manage'
  | 'billing.invoices.access'
  | 'billing.payment_methods.manage'
  | 'billing.subscriptions.manage';

// ===================================
// 🎯 ROLE-SPECIFIC PERMISSION SETS
// ===================================

export interface RolePermissionSet {
  role: UserRole;
  permissions: PrecivoxPermission[];
  description: string;
  features: string[];
  limitations: string[];
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissionSet> = {
  guest: {
    role: 'guest',
    permissions: [
      'search.basic',
      'products.view'
    ],
    description: 'Usuário não autenticado com acesso básico',
    features: [
      'Busca básica de produtos',
      'Visualização de produtos'
    ],
    limitations: [
      'Não pode criar listas',
      'Não pode favoritar produtos',
      'Não pode usar filtros avançados'
    ]
  },
  
  cliente: {
    role: 'cliente',
    permissions: [
      'search.basic',
      'search.advanced',
      'search.ai_suggestions',
      'search.filters.advanced',
      'products.view',
      'products.details',
      'products.compare',
      'products.favorite',
      'products.rate',
      'products.share',
      'lists.create',
      'lists.read',
      'lists.update',
      'lists.delete',
      'lists.share',
      'pricing.alerts.create',
      'pricing.alerts.manage',
      'pricing.history.view',
      'dashboard.view',
      'dashboard.personal',
      'analytics.basic'
    ],
    description: 'Cliente padrão com funcionalidades completas',
    features: [
      'Busca avançada com IA',
      'Criação e gerenciamento de listas',
      'Alertas de preço',
      'Comparação de produtos',
      'Dashboard pessoal'
    ],
    limitations: [
      'Máximo 10 listas',
      'Máximo 50 alertas de preço',
      'Analytics básicos apenas'
    ]
  },
  
  cliente_premium: {
    role: 'cliente_premium',
    permissions: [
      'search.basic',
      'search.advanced',
      'search.ai_suggestions',
      'search.voice',
      'search.image',
      'search.filters.advanced',
      'search.export',
      'search.analytics',
      'products.view',
      'products.details',
      'products.compare',
      'products.favorite',
      'products.rate',
      'products.review',
      'products.share',
      'products.track_price',
      'products.bulk_add',
      'lists.create',
      'lists.read',
      'lists.update',
      'lists.delete',
      'lists.share',
      'lists.collaborate',
      'lists.import',
      'lists.export',
      'lists.templates',
      'lists.bulk_operations',
      'pricing.alerts.create',
      'pricing.alerts.manage',
      'pricing.history.view',
      'pricing.trends.access',
      'pricing.forecasting',
      'pricing.bulk_alerts',
      'dashboard.view',
      'dashboard.personal',
      'dashboard.analytics',
      'dashboard.insights',
      'analytics.basic',
      'analytics.advanced',
      'api.read'
    ],
    description: 'Cliente premium com recursos avançados',
    features: [
      'Todos os recursos do cliente padrão',
      'Busca por voz e imagem',
      'Listas ilimitadas',
      'Alertas ilimitados',
      'Analytics avançados',
      'Exportação de dados',
      'Colaboração em listas',
      'Previsão de preços'
    ],
    limitations: [
      'Não pode gerenciar loja',
      'Não tem acesso ao dashboard business'
    ]
  },
  
  gestor: {
    role: 'gestor',
    permissions: [
      // Todas as permissões do cliente premium
      'search.basic',
      'search.advanced',
      'search.ai_suggestions',
      'search.voice',
      'search.image',
      'search.filters.advanced',
      'search.export',
      'search.analytics',
      'products.view',
      'products.details',
      'products.compare',
      'products.favorite',
      'products.rate',
      'products.review',
      'products.share',
      'products.track_price',
      'products.bulk_add',
      'lists.create',
      'lists.read',
      'lists.update',
      'lists.delete',
      'lists.share',
      'lists.collaborate',
      'lists.import',
      'lists.export',
      'lists.templates',
      'lists.bulk_operations',
      'pricing.alerts.create',
      'pricing.alerts.manage',
      'pricing.history.view',
      'pricing.trends.access',
      'pricing.forecasting',
      'pricing.bulk_alerts',
      'dashboard.view',
      'dashboard.personal',
      'dashboard.analytics',
      'dashboard.insights',
      'analytics.basic',
      'analytics.advanced',
      'api.read',
      
      // Permissões específicas de gestor
      'store.profile.view',
      'store.profile.edit',
      'store.products.manage',
      'store.inventory.view',
      'store.inventory.edit',
      'store.analytics.view',
      'store.reports.generate',
      'store.competitors.analyze',
      'store.pricing.manage',
      'dashboard.business',
      'dashboard.reports',
      'dashboard.forecasting',
      'dashboard.realtime',
      'analytics.custom_reports',
      'analytics.data_export',
      'analytics.real_time',
      'analytics.ai_insights',
      'api.write'
    ],
    description: 'Gestor de supermercado com acesso completo ao business',
    features: [
      'Todos os recursos premium',
      'Gestão completa da loja',
      'Analytics de negócio',
      'Relatórios personalizados',
      'Análise de concorrência',
      'Dashboard em tempo real',
      'Gestão de inventário',
      'Previsões com IA'
    ],
    limitations: [
      'Não pode gerenciar outros usuários',
      'Não tem acesso a configurações do sistema'
    ]
  },
  
  admin: {
    role: 'admin',
    permissions: [
      // Todas as permissões anteriores
      'search.basic',
      'search.advanced',
      'search.ai_suggestions',
      'search.voice',
      'search.image',
      'search.filters.advanced',
      'search.export',
      'search.analytics',
      'products.view',
      'products.details',
      'products.compare',
      'products.favorite',
      'products.rate',
      'products.review',
      'products.share',
      'products.track_price',
      'products.bulk_add',
      'lists.create',
      'lists.read',
      'lists.update',
      'lists.delete',
      'lists.share',
      'lists.collaborate',
      'lists.import',
      'lists.export',
      'lists.templates',
      'lists.bulk_operations',
      'pricing.alerts.create',
      'pricing.alerts.manage',
      'pricing.history.view',
      'pricing.trends.access',
      'pricing.forecasting',
      'pricing.bulk_alerts',
      'store.profile.view',
      'store.profile.edit',
      'store.products.manage',
      'store.inventory.view',
      'store.inventory.edit',
      'store.analytics.view',
      'store.reports.generate',
      'store.competitors.analyze',
      'store.pricing.manage',
      'dashboard.view',
      'dashboard.personal',
      'dashboard.business',
      'dashboard.analytics',
      'dashboard.reports',
      'dashboard.export',
      'dashboard.insights',
      'dashboard.forecasting',
      'dashboard.realtime',
      'analytics.basic',
      'analytics.advanced',
      'analytics.custom_reports',
      'analytics.data_export',
      'analytics.real_time',
      'analytics.ai_insights',
      'api.read',
      'api.write',
      
      // Permissões específicas de admin
      'users.view',
      'users.create',
      'users.edit',
      'users.delete',
      'users.roles.assign',
      'users.suspend',
      'users.export',
      'system.settings.view',
      'system.settings.edit',
      'system.logs.view',
      'system.audit.access',
      'billing.view',
      'billing.manage',
      'billing.invoices.access',
      'api.admin',
      'api.webhooks.manage'
    ],
    description: 'Administrador com controle total do sistema',
    features: [
      'Todos os recursos do gestor',
      'Gestão completa de usuários',
      'Configurações do sistema',
      'Logs e auditoria',
      'Gestão de billing',
      'Acesso completo à API'
    ],
    limitations: [
      'Não pode realizar manutenção crítica do sistema'
    ]
  },
  
  super_admin: {
    role: 'super_admin',
    permissions: [
      // Todas as permissões possíveis
      'search.basic',
      'search.advanced',
      'search.ai_suggestions',
      'search.voice',
      'search.image',
      'search.filters.advanced',
      'search.export',
      'search.analytics',
      'products.view',
      'products.details',
      'products.compare',
      'products.favorite',
      'products.rate',
      'products.review',
      'products.share',
      'products.track_price',
      'products.bulk_add',
      'lists.create',
      'lists.read',
      'lists.update',
      'lists.delete',
      'lists.share',
      'lists.collaborate',
      'lists.import',
      'lists.export',
      'lists.templates',
      'lists.bulk_operations',
      'pricing.alerts.create',
      'pricing.alerts.manage',
      'pricing.history.view',
      'pricing.trends.access',
      'pricing.forecasting',
      'pricing.bulk_alerts',
      'store.profile.view',
      'store.profile.edit',
      'store.products.manage',
      'store.inventory.view',
      'store.inventory.edit',
      'store.analytics.view',
      'store.reports.generate',
      'store.competitors.analyze',
      'store.pricing.manage',
      'dashboard.view',
      'dashboard.personal',
      'dashboard.business',
      'dashboard.analytics',
      'dashboard.reports',
      'dashboard.export',
      'dashboard.insights',
      'dashboard.forecasting',
      'dashboard.realtime',
      'users.view',
      'users.create',
      'users.edit',
      'users.delete',
      'users.roles.assign',
      'users.permissions.manage',
      'users.suspend',
      'users.export',
      'system.settings.view',
      'system.settings.edit',
      'system.logs.view',
      'system.audit.access',
      'system.backup.create',
      'system.maintenance.perform',
      'system.api.access',
      'analytics.basic',
      'analytics.advanced',
      'analytics.custom_reports',
      'analytics.data_export',
      'analytics.real_time',
      'analytics.ai_insights',
      'api.read',
      'api.write',
      'api.admin',
      'api.rate_limit.extended',
      'api.webhooks.manage',
      'billing.view',
      'billing.manage',
      'billing.invoices.access',
      'billing.payment_methods.manage',
      'billing.subscriptions.manage'
    ],
    description: 'Super administrador com acesso irrestrito',
    features: [
      'Acesso total ao sistema',
      'Todas as permissões',
      'Manutenção crítica',
      'Backup e restore',
      'Gestão de permissões',
      'Controle total da API'
    ],
    limitations: []
  }
};

// ===================================
// 🎛️ FEATURE FLAGS & PERMISSIONS
// ===================================

export interface FeaturePermission {
  feature: string;
  requiredPermissions: PrecivoxPermission[];
  requiredRole?: UserRole;
  beta?: boolean;
  premium?: boolean;
  enterprise?: boolean;
}

export const FEATURE_PERMISSIONS: FeaturePermission[] = [
  {
    feature: 'ai_search_suggestions',
    requiredPermissions: ['search.ai_suggestions'],
    premium: true
  },
  {
    feature: 'voice_search',
    requiredPermissions: ['search.voice'],
    premium: true
  },
  {
    feature: 'image_search',
    requiredPermissions: ['search.image'],
    premium: true,
    beta: true
  },
  {
    feature: 'advanced_analytics',
    requiredPermissions: ['analytics.advanced'],
    premium: true
  },
  {
    feature: 'custom_reports',
    requiredPermissions: ['analytics.custom_reports'],
    requiredRole: 'gestor'
  },
  {
    feature: 'store_management',
    requiredPermissions: ['store.profile.edit', 'store.products.manage'],
    requiredRole: 'gestor'
  },
  {
    feature: 'user_management',
    requiredPermissions: ['users.view', 'users.create', 'users.edit'],
    requiredRole: 'admin'
  },
  {
    feature: 'system_settings',
    requiredPermissions: ['system.settings.view', 'system.settings.edit'],
    requiredRole: 'admin'
  },
  {
    feature: 'api_access',
    requiredPermissions: ['api.read'],
    premium: true
  },
  {
    feature: 'api_write_access',
    requiredPermissions: ['api.write'],
    requiredRole: 'gestor'
  },
  {
    feature: 'bulk_operations',
    requiredPermissions: ['lists.bulk_operations', 'products.bulk_add'],
    premium: true
  },
  {
    feature: 'collaboration',
    requiredPermissions: ['lists.collaborate'],
    premium: true
  },
  {
    feature: 'price_forecasting',
    requiredPermissions: ['pricing.forecasting'],
    premium: true
  },
  {
    feature: 'competitor_analysis',
    requiredPermissions: ['store.competitors.analyze'],
    requiredRole: 'gestor',
    enterprise: true
  },
  {
    feature: 'real_time_dashboard',
    requiredPermissions: ['dashboard.realtime'],
    requiredRole: 'gestor'
  }
];

// ===================================
// 🔒 PERMISSION VALIDATION
// ===================================

export interface PermissionValidator {
  hasPermission: (userPermissions: PrecivoxPermission[], required: PrecivoxPermission) => boolean;
  hasAnyPermission: (userPermissions: PrecivoxPermission[], required: PrecivoxPermission[]) => boolean;
  hasAllPermissions: (userPermissions: PrecivoxPermission[], required: PrecivoxPermission[]) => boolean;
  canAccessFeature: (userRole: UserRole, userPermissions: PrecivoxPermission[], feature: string) => boolean;
  getPermissionsForRole: (role: UserRole) => PrecivoxPermission[];
  getRoleHierarchy: (role: UserRole) => UserRole[];
  validatePermissionHierarchy: (permission: PrecivoxPermission, userRole: UserRole) => boolean;
}

// ===================================
// 📊 PERMISSION ANALYTICS
// ===================================

export interface PermissionUsageStats {
  permission: PrecivoxPermission;
  usageCount: number;
  uniqueUsers: number;
  lastUsed: Date;
  avgUsagePerDay: number;
  popularityRank: number;
}

export interface RoleDistribution {
  role: UserRole;
  userCount: number;
  percentage: number;
  activeUsers: number;
  newUsers: number;
}

export interface PermissionAudit {
  userId: string;
  permission: PrecivoxPermission;
  action: 'granted' | 'denied' | 'used' | 'revoked';
  timestamp: Date;
  context: {
    feature?: string;
    resource?: string;
    ipAddress: string;
    userAgent: string;
  };
  result: 'success' | 'failure';
  reason?: string;
}

// ===================================
// 🎯 PERMISSION GROUPS
// ===================================

export interface PermissionGroup {
  id: string;
  name: string;
  description: string;
  permissions: PrecivoxPermission[];
  category: 'basic' | 'advanced' | 'premium' | 'business' | 'admin';
  icon?: string;
}

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    id: 'search_basic',
    name: 'Busca Básica',
    description: 'Funcionalidades básicas de busca',
    permissions: ['search.basic', 'products.view', 'products.details'],
    category: 'basic',
    icon: '🔍'
  },
  {
    id: 'search_advanced',
    name: 'Busca Avançada',
    description: 'Recursos avançados de busca com IA',
    permissions: ['search.advanced', 'search.ai_suggestions', 'search.filters.advanced'],
    category: 'advanced',
    icon: '🧠'
  },
  {
    id: 'lists_management',
    name: 'Gerenciamento de Listas',
    description: 'Criação e gestão de listas de compras',
    permissions: ['lists.create', 'lists.read', 'lists.update', 'lists.delete', 'lists.share'],
    category: 'basic',
    icon: '📝'
  },
  {
    id: 'lists_premium',
    name: 'Listas Premium',
    description: 'Recursos premium para listas',
    permissions: ['lists.collaborate', 'lists.import', 'lists.export', 'lists.templates', 'lists.bulk_operations'],
    category: 'premium',
    icon: '⭐'
  },
  {
    id: 'pricing_alerts',
    name: 'Alertas de Preço',
    description: 'Sistema de monitoramento de preços',
    permissions: ['pricing.alerts.create', 'pricing.alerts.manage', 'pricing.history.view'],
    category: 'basic',
    icon: '💰'
  },
  {
    id: 'analytics_basic',
    name: 'Analytics Básico',
    description: 'Visualizações e métricas básicas',
    permissions: ['analytics.basic', 'dashboard.view', 'dashboard.personal'],
    category: 'basic',
    icon: '📊'
  },
  {
    id: 'analytics_advanced',
    name: 'Analytics Avançado',
    description: 'Analytics e relatórios avançados',
    permissions: ['analytics.advanced', 'analytics.custom_reports', 'analytics.data_export'],
    category: 'premium',
    icon: '📈'
  },
  {
    id: 'store_management',
    name: 'Gestão de Loja',
    description: 'Ferramentas para gestores de supermercado',
    permissions: ['store.profile.edit', 'store.products.manage', 'store.inventory.edit', 'store.analytics.view'],
    category: 'business',
    icon: '🏪'
  },
  {
    id: 'user_administration',
    name: 'Administração de Usuários',
    description: 'Gestão de usuários e permissões',
    permissions: ['users.view', 'users.create', 'users.edit', 'users.roles.assign'],
    category: 'admin',
    icon: '👥'
  },
  {
    id: 'system_administration',
    name: 'Administração do Sistema',
    description: 'Configurações e manutenção do sistema',
    permissions: ['system.settings.edit', 'system.logs.view', 'system.audit.access'],
    category: 'admin',
    icon: '⚙️'
  }
];

// ===================================
// 🔄 EXPORT ALL PERMISSION TYPES
// ===================================

export type {
  PrecivoxPermission,
  RolePermissionSet,
  FeaturePermission,
  PermissionValidator,
  PermissionUsageStats,
  RoleDistribution,
  PermissionAudit,
  PermissionGroup
};

export {
  ROLE_PERMISSIONS,
  FEATURE_PERMISSIONS,
  PERMISSION_GROUPS
};