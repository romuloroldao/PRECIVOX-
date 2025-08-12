// src/types/security.ts
// 🔒 TIPOS DE SEGURANÇA E PERMISSÕES - PRECIVOX v4.0

// ===================================
// 👤 USER & AUTH TYPES
// ===================================

export type UserRole = 'guest' | 'cliente' | 'cliente_premium' | 'gestor' | 'admin' | 'super_admin';

export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending' | 'verified' | 'banned';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  permissions: Permission[];
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    lastLogin: Date;
    loginCount: number;
    emailVerified: boolean;
    phoneVerified: boolean;
    twoFactorEnabled: boolean;
  };
  profile: {
    avatar?: string;
    bio?: string;
    location?: string;
    preferences: UserPreferences;
    settings: UserSettings;
  };
  subscription?: {
    plan: 'free' | 'premium' | 'business' | 'enterprise';
    status: 'active' | 'cancelled' | 'expired' | 'trial';
    startDate: Date;
    endDate: Date;
    features: string[];
  };
}

export interface UserPreferences {
  language: string;
  currency: string;
  timezone: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    marketing: boolean;
  };
  privacy: {
    profilePublic: boolean;
    trackingOptOut: boolean;
    dataProcessingConsent: boolean;
  };
  ui: {
    theme: 'light' | 'dark' | 'auto';
    density: 'compact' | 'normal' | 'comfortable';
    animations: boolean;
  };
}

export interface UserSettings {
  defaultViewMode: string;
  maxResults: number;
  autoSave: boolean;
  favoriteStores: string[];
  blockedStores: string[];
  priceAlerts: boolean;
  locationSharing: boolean;
}

// ===================================
// 🔐 AUTHENTICATION TYPES
// ===================================

export interface AuthCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
  captcha?: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  refreshToken?: string;
  expiresIn?: number;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;
  lastActivity: Date | null;
  sessionId: string | null;
}

export interface AuthConfig {
  tokenStorage: 'localStorage' | 'sessionStorage' | 'cookie' | 'memory';
  autoRefresh: boolean;
  refreshBeforeExpiry: number; // minutes
  maxSessionDuration: number; // minutes
  requireEmailVerification: boolean;
  requireTwoFactor: boolean;
  passwordPolicy: PasswordPolicy;
  sessionManagement: SessionConfig;
}

export interface PasswordPolicy {
  minLength: number;
  maxLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  forbiddenPasswords: string[];
  maxAge: number; // days
  preventReuse: number; // count
}

export interface SessionConfig {
  maxConcurrentSessions: number;
  idleTimeout: number; // minutes
  absoluteTimeout: number; // minutes
  renewOnActivity: boolean;
  trackLocation: boolean;
  trackDevice: boolean;
}

// ===================================
// 🛡️ PERMISSIONS SYSTEM
// ===================================

export type PermissionScope = 
  | 'global'
  | 'search'
  | 'lists'
  | 'products'
  | 'dashboard'
  | 'admin'
  | 'analytics'
  | 'reports'
  | 'settings'
  | 'billing';

export type PermissionAction = 
  | 'read'
  | 'write'
  | 'create'
  | 'update'
  | 'delete'
  | 'admin'
  | 'execute'
  | 'share'
  | 'export'
  | 'import';

export interface Permission {
  id: string;
  name: string;
  description: string;
  scope: PermissionScope;
  action: PermissionAction;
  resource?: string;
  conditions?: PermissionCondition[];
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    deprecated: boolean;
    version: string;
  };
}

export interface PermissionCondition {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'contains' | 'regex';
  value: any;
  context?: 'user' | 'resource' | 'request' | 'time';
}

export interface PermissionCheck {
  scope: PermissionScope;
  action: PermissionAction;
  resource?: string;
  context?: Record<string, any>;
}

export interface PermissionResult {
  allowed: boolean;
  reason?: string;
  requiredPermissions?: Permission[];
  suggestion?: string;
  alternative?: {
    action: string;
    description: string;
  };
}

// ===================================
// 🔒 ROLE-BASED ACCESS CONTROL
// ===================================

export interface Role {
  id: string;
  name: UserRole;
  displayName: string;
  description: string;
  level: number; // hierarchy level
  permissions: Permission[];
  inherits: string[]; // parent roles
  restrictions: RoleRestriction[];
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    active: boolean;
    default: boolean;
  };
}

export interface RoleRestriction {
  type: 'time' | 'location' | 'ip' | 'device' | 'feature' | 'quota';
  constraint: any;
  message: string;
  enforced: boolean;
}

export interface RoleHierarchy {
  roles: Map<UserRole, Role>;
  hierarchy: Map<UserRole, UserRole[]>; // role -> parent roles
  permissions: Map<UserRole, Permission[]>; // computed permissions
}

// ===================================
// 🚨 SECURITY POLICIES
// ===================================

export interface SecurityPolicy {
  id: string;
  name: string;
  description: string;
  type: 'authentication' | 'authorization' | 'data' | 'network' | 'audit' | 'compliance';
  rules: SecurityRule[];
  enforcement: 'strict' | 'warn' | 'log' | 'disabled';
  scope: string[]; // which parts of the app
  metadata: {
    version: string;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    active: boolean;
  };
}

export interface SecurityRule {
  id: string;
  condition: string; // expression
  action: 'allow' | 'deny' | 'warn' | 'log' | 'challenge';
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  metadata?: Record<string, any>;
}

export interface SecurityContext {
  user: User | null;
  session: SessionInfo;
  request: RequestContext;
  environment: EnvironmentContext;
  timestamp: Date;
}

export interface SessionInfo {
  id: string;
  startTime: Date;
  lastActivity: Date;
  ipAddress: string;
  userAgent: string;
  location?: GeoLocation;
  device: DeviceInfo;
  flags: string[];
}

export interface RequestContext {
  method: string;
  path: string;
  query: Record<string, any>;
  headers: Record<string, string>;
  body?: any;
  source: 'web' | 'mobile' | 'api' | 'webhook';
  requestId: string;
}

export interface EnvironmentContext {
  environment: 'development' | 'staging' | 'production';
  region: string;
  version: string;
  features: string[];
  maintenance: boolean;
}

export interface GeoLocation {
  country: string;
  region: string;
  city: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

export interface DeviceInfo {
  type: 'desktop' | 'mobile' | 'tablet' | 'bot';
  os: string;
  browser: string;
  version: string;
  screen: {
    width: number;
    height: number;
  };
  fingerprint: string;
}

// ===================================
// 📊 AUDIT & LOGGING
// ===================================

export type AuditEventType = 
  | 'auth.login'
  | 'auth.logout'
  | 'auth.failed'
  | 'permission.granted'
  | 'permission.denied'
  | 'data.created'
  | 'data.updated'
  | 'data.deleted'
  | 'data.accessed'
  | 'security.violation'
  | 'system.error'
  | 'admin.action';

export interface AuditEvent {
  id: string;
  type: AuditEventType;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  resource: string;
  action: string;
  result: 'success' | 'failure' | 'partial';
  details: {
    before?: any;
    after?: any;
    changes?: Record<string, any>;
    reason?: string;
    metadata?: Record<string, any>;
  };
  context: {
    ipAddress: string;
    userAgent: string;
    location?: GeoLocation;
    requestId: string;
  };
  severity: 'info' | 'warn' | 'error' | 'critical';
  tags: string[];
}

export interface AuditLog {
  events: AuditEvent[];
  filters: AuditFilters;
  pagination: {
    page: number;
    size: number;
    total: number;
  };
  metadata: {
    generatedAt: Date;
    generatedBy: string;
    exportFormat?: 'json' | 'csv' | 'pdf';
  };
}

export interface AuditFilters {
  dateRange: {
    start: Date;
    end: Date;
  };
  eventTypes: AuditEventType[];
  userIds: string[];
  resources: string[];
  severities: string[];
  results: string[];
  search?: string;
}

// ===================================
// ⚠️ RISK ASSESSMENT
// ===================================

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface RiskFactor {
  id: string;
  name: string;
  description: string;
  weight: number; // 0-1
  calculator: (context: SecurityContext) => number; // 0-1
  threshold: {
    low: number;
    medium: number;
    high: number;
  };
}

export interface RiskAssessment {
  overallRisk: RiskLevel;
  score: number; // 0-1
  factors: Array<{
    factor: RiskFactor;
    score: number;
    weight: number;
    contribution: number;
  }>;
  recommendations: RiskRecommendation[];
  timestamp: Date;
  context: SecurityContext;
}

export interface RiskRecommendation {
  type: 'immediate' | 'short_term' | 'long_term';
  priority: 'low' | 'medium' | 'high' | 'critical';
  action: string;
  description: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
}

// ===================================
// 🔧 SECURITY UTILITIES
// ===================================

export interface SecurityUtils {
  // Authentication
  hashPassword: (password: string) => Promise<string>;
  verifyPassword: (password: string, hash: string) => Promise<boolean>;
  generateToken: (payload: any, expiresIn?: string) => string;
  verifyToken: (token: string) => Promise<any>;
  
  // Authorization
  checkPermission: (user: User, check: PermissionCheck) => PermissionResult;
  hasRole: (user: User, role: UserRole) => boolean;
  canAccess: (user: User, resource: string, action: string) => boolean;
  
  // Security
  sanitizeInput: (input: any) => any;
  validateInput: (input: any, schema: any) => { valid: boolean; errors: string[] };
  encryptData: (data: any, key?: string) => string;
  decryptData: (encrypted: string, key?: string) => any;
  
  // Risk assessment
  assessRisk: (context: SecurityContext) => Promise<RiskAssessment>;
  calculateTrustScore: (user: User, context: SecurityContext) => number;
  
  // Audit
  logEvent: (event: AuditEvent) => Promise<void>;
  generateAuditReport: (filters: AuditFilters) => Promise<AuditLog>;
}

// ===================================
// 🛡️ COMPONENT SECURITY PROPS
// ===================================

export interface SecurityGuardProps {
  requiredPermission?: PermissionCheck;
  requiredRole?: UserRole | UserRole[];
  fallback?: React.ComponentType | React.ReactNode;
  onUnauthorized?: (user: User | null, required: PermissionCheck) => void;
  children: React.ReactNode;
}

export interface ProtectedRouteProps {
  component: React.ComponentType<any>;
  requiredPermission?: PermissionCheck;
  requiredRole?: UserRole | UserRole[];
  redirectTo?: string;
  exact?: boolean;
  path: string;
}

export interface SecureComponentProps {
  level: 'public' | 'authenticated' | 'authorized' | 'admin';
  permissions?: PermissionCheck[];
  onSecurityViolation?: (violation: SecurityViolation) => void;
  auditActions?: boolean;
  encryptData?: boolean;
}

export interface SecurityViolation {
  type: 'unauthorized_access' | 'insufficient_permissions' | 'suspicious_activity' | 'data_breach';
  severity: 'low' | 'medium' | 'high' | 'critical';
  user?: User;
  context: SecurityContext;
  timestamp: Date;
  details: Record<string, any>;
}

// ===================================
// 📋 COMPLIANCE & STANDARDS
// ===================================

export interface ComplianceStandard {
  id: string;
  name: string;
  version: string;
  requirements: ComplianceRequirement[];
  audits: ComplianceAudit[];
  status: 'compliant' | 'partial' | 'non_compliant' | 'unknown';
}

export interface ComplianceRequirement {
  id: string;
  section: string;
  description: string;
  controls: SecurityControl[];
  status: 'implemented' | 'partial' | 'not_implemented' | 'not_applicable';
  evidence: string[];
  lastReview: Date;
}

export interface SecurityControl {
  id: string;
  type: 'technical' | 'administrative' | 'physical';
  description: string;
  implementation: string;
  testing: {
    method: string;
    frequency: string;
    lastTest: Date;
    result: 'pass' | 'fail' | 'warning';
  };
}

export interface ComplianceAudit {
  id: string;
  auditor: string;
  date: Date;
  scope: string[];
  findings: ComplianceFinding[];
  overall: 'compliant' | 'minor_issues' | 'major_issues' | 'non_compliant';
}

export interface ComplianceFinding {
  severity: 'low' | 'medium' | 'high' | 'critical';
  requirement: string;
  description: string;
  evidence: string;
  recommendation: string;
  status: 'open' | 'in_progress' | 'resolved' | 'accepted_risk';
}

// ===================================
// 🔄 EXPORT ALL SECURITY TYPES
// ===================================

export type {
  // User & Auth
  User,
  UserRole,
  UserStatus,
  UserPreferences,
  UserSettings,
  AuthCredentials,
  AuthResponse,
  AuthState,
  AuthConfig,
  PasswordPolicy,
  SessionConfig,
  
  // Permissions
  Permission,
  PermissionScope,
  PermissionAction,
  PermissionCondition,
  PermissionCheck,
  PermissionResult,
  
  // Roles
  Role,
  RoleRestriction,
  RoleHierarchy,
  
  // Security Policies
  SecurityPolicy,
  SecurityRule,
  SecurityContext,
  SessionInfo,
  RequestContext,
  EnvironmentContext,
  GeoLocation,
  DeviceInfo,
  
  // Audit & Logging
  AuditEvent,
  AuditEventType,
  AuditLog,
  AuditFilters,
  
  // Risk Assessment
  RiskLevel,
  RiskFactor,
  RiskAssessment,
  RiskRecommendation,
  
  // Security Utils
  SecurityUtils,
  
  // Component Props
  SecurityGuardProps,
  ProtectedRouteProps,
  SecureComponentProps,
  SecurityViolation,
  
  // Compliance
  ComplianceStandard,
  ComplianceRequirement,
  SecurityControl,
  ComplianceAudit,
  ComplianceFinding
};