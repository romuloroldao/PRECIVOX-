// src/components/SecurityWrapper.tsx - PROTEÇÃO DE COMPONENTES E DADOS
import React from 'react';
import { Shield, AlertTriangle, Lock, Eye } from 'lucide-react';
import { usePermissions, SecurityLevel, DataType } from '../hooks/usePermissions';

interface SecurityWrapperProps {
  children: React.ReactNode;
  requiredRole?: string[];
  securityLevel?: SecurityLevel;
  dataType?: DataType;
  ownerId?: string;
  pageId?: string;
  fallback?: React.ReactNode;
  showReason?: boolean;
}

export const SecurityWrapper: React.FC<SecurityWrapperProps> = ({
  children,
  requiredRole = [],
  securityLevel = 'public',
  dataType = 'general',
  ownerId,
  pageId,
  fallback,
  showReason = false
}) => {
  const { canAccessPage, canAccessData, canViewUserList, permissions, user, logSecurityEvent } = usePermissions();

  // ✅ VERIFICAR ACESSO À PÁGINA
  if (pageId) {
    const pageCheck = canAccessPage(pageId);
    if (!pageCheck.canAccess) {
      if (pageCheck.logSecurity) {
        logSecurityEvent('PAGE_ACCESS_DENIED', {
          pageId,
          reason: pageCheck.reason,
          userRole: user?.role
        });
      }
      
      return fallback || <AccessDenied reason={pageCheck.reason} showReason={showReason} />;
    }
  }

  // ✅ VERIFICAR ACESSO A DADOS
  if (dataType !== 'general') {
    const dataCheck = canAccessData(dataType, ownerId);
    if (!dataCheck.canAccess) {
      if (dataCheck.logSecurity) {
        logSecurityEvent('DATA_ACCESS_DENIED', {
          dataType,
          ownerId,
          reason: dataCheck.reason,
          userRole: user?.role
        });
      }
      
      return fallback || <AccessDenied reason={dataCheck.reason} showReason={showReason} />;
    }
  }

  // ✅ VERIFICAR ACESSO A LISTAS DE USUÁRIOS
  if (ownerId && dataType === 'personal') {
    const listCheck = canViewUserList(ownerId);
    if (!listCheck.canAccess) {
      if (listCheck.logSecurity) {
        logSecurityEvent('USER_LIST_ACCESS_DENIED', {
          ownerId,
          reason: listCheck.reason,
          userRole: user?.role
        });
      }
      
      return fallback || <PrivacyViolationBlock reason={listCheck.reason} showReason={showReason} />;
    }
  }

  // ✅ VERIFICAR ROLES ESPECÍFICAS
  if (requiredRole.length > 0 && user) {
    if (!requiredRole.includes(user.role)) {
      logSecurityEvent('ROLE_ACCESS_DENIED', {
        requiredRole,
        userRole: user.role,
        securityLevel
      });
      
      return fallback || <AccessDenied reason={`Role '${user.role}' não autorizada`} showReason={showReason} />;
    }
  }

  // ✅ ACESSO AUTORIZADO
  return <>{children}</>;
};

// ✅ COMPONENTE DE ACESSO NEGADO
const AccessDenied: React.FC<{ reason?: string; showReason?: boolean }> = ({ reason, showReason }) => (
  <div className="flex flex-col items-center justify-center p-8 bg-red-50 border border-red-200 rounded-lg">
    <Shield className="h-12 w-12 text-red-500 mb-4" />
    <h3 className="text-lg font-semibold text-red-800 mb-2">Acesso Negado</h3>
    <p className="text-red-600 text-center mb-4">
      Você não tem permissão para acessar este conteúdo.
    </p>
    {showReason && reason && (
      <div className="bg-red-100 p-3 rounded border border-red-300 text-sm text-red-700">
        <strong>Motivo:</strong> {reason}
      </div>
    )}
  </div>
);

// ✅ COMPONENTE ESPECÍFICO PARA VIOLAÇÃO DE PRIVACIDADE
const PrivacyViolationBlock: React.FC<{ reason?: string; showReason?: boolean }> = ({ reason, showReason }) => (
  <div className="flex flex-col items-center justify-center p-8 bg-orange-50 border border-orange-200 rounded-lg">
    <div className="flex items-center mb-4">
      <Lock className="h-8 w-8 text-orange-500 mr-2" />
      <Eye className="h-6 w-6 text-orange-400" />
    </div>
    <h3 className="text-lg font-semibold text-orange-800 mb-2">Dados Privados Protegidos</h3>
    <p className="text-orange-600 text-center mb-4">
      Este conteúdo contém dados pessoais protegidos que não podem ser acessados.
    </p>
    <div className="bg-orange-100 p-3 rounded border border-orange-300 text-sm text-orange-700 max-w-md text-center">
      <AlertTriangle className="h-4 w-4 inline mr-2" />
      <strong>Proteção de Privacidade:</strong> Apenas o proprietário dos dados pode visualizar estas informações.
    </div>
    {showReason && reason && (
      <div className="mt-3 bg-orange-100 p-3 rounded border border-orange-300 text-sm text-orange-700">
        <strong>Detalhes:</strong> {reason}
      </div>
    )}
  </div>
);

// ✅ HOOK PARA PROTEGER BOTÕES E AÇÕES
export const useSecureAction = () => {
  const { canAccessPage, canAccessData, logSecurityEvent, user } = usePermissions();

  const executeSecureAction = (
    action: () => void,
    security: {
      pageId?: string;
      dataType?: DataType;
      ownerId?: string;
      requiredRole?: string[];
    }
  ) => {
    // Verificar permissões antes de executar
    if (security.pageId) {
      const check = canAccessPage(security.pageId);
      if (!check.canAccess) {
        logSecurityEvent('ACTION_BLOCKED', {
          action: 'executeSecureAction',
          pageId: security.pageId,
          reason: check.reason
        });
        return false;
      }
    }

    if (security.dataType && security.dataType !== 'general') {
      const check = canAccessData(security.dataType, security.ownerId);
      if (!check.canAccess) {
        logSecurityEvent('ACTION_BLOCKED', {
          action: 'executeSecureAction',
          dataType: security.dataType,
          ownerId: security.ownerId,
          reason: check.reason
        });
        return false;
      }
    }

    if (security.requiredRole && user) {
      if (!security.requiredRole.includes(user.role)) {
        logSecurityEvent('ACTION_BLOCKED', {
          action: 'executeSecureAction',
          requiredRole: security.requiredRole,
          userRole: user.role
        });
        return false;
      }
    }

    // Executar ação se passou em todas as verificações
    action();
    return true;
  };

  return { executeSecureAction };
};

export default SecurityWrapper;