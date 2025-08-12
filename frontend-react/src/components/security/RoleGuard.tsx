import React from 'react';
import { useAuth, usePermissions } from '../../hooks/useAuth';
import { Shield, AlertTriangle } from 'lucide-react';

interface RoleGuardProps {
  children: React.ReactNode;
  requiredRole?: 'cliente' | 'gestor' | 'admin';
  requiredPermission?: string;
  fallback?: React.ReactNode;
  showMessage?: boolean;
  allowAdmin?: boolean;
  className?: string;
  onAccessDenied?: () => void;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  requiredRole,
  requiredPermission,
  fallback,
  showMessage = true,
  allowAdmin = true,
  className = '',
  onAccessDenied
}) => {
  const { user, isAuthenticated } = useAuth();
  const { hasPermission, isCliente, isGestor, isAdmin } = usePermissions();

  // ✅ VERIFICAR ACESSO
  const hasAccess = () => {
    if (!isAuthenticated || !user) {
      return false;
    }

    // Admin sempre pode acessar (se permitido)
    if (allowAdmin && isAdmin()) {
      return true;
    }

    // Verificar role específica
    if (requiredRole) {
      switch (requiredRole) {
        case 'cliente':
          return isCliente();
        case 'gestor':
          return isGestor();
        case 'admin':
          return isAdmin();
      }
    }

    // Verificar permissão específica
    if (requiredPermission) {
      return hasPermission(requiredPermission);
    }

    // Se nenhuma condição específica, permitir acesso
    return true;
  };

  const access = hasAccess();

  // ✅ EXECUTAR CALLBACK SE ACESSO NEGADO
  if (!access && onAccessDenied) {
    onAccessDenied();
  }

  // ✅ SE TEM ACESSO, RENDERIZAR CHILDREN
  if (access) {
    return <div className={className}>{children}</div>;
  }

  // ✅ SE TEM FALLBACK PERSONALIZADO
  if (fallback) {
    return <div className={className}>{fallback}</div>;
  }

  // ✅ SE NÃO DEVE MOSTRAR MENSAGEM, NÃO RENDERIZAR NADA
  if (!showMessage) {
    return null;
  }

  // ✅ MENSAGEM PADRÃO DE ACESSO NEGADO
  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center">
        <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
        <div>
          <h3 className="text-sm font-medium text-red-800">
            Acesso Restrito
          </h3>
          <p className="text-sm text-red-600 mt-1">
            {requiredRole 
              ? `Esta funcionalidade é exclusiva para ${requiredRole === 'gestor' ? 'gestores' : requiredRole === 'admin' ? 'administradores' : 'clientes'}.`
              : 'Você não tem permissão para acessar esta funcionalidade.'
            }
          </p>
        </div>
      </div>
    </div>
  );
};

// ✅ COMPONENTE PARA BOTÕES PROTEGIDOS
interface ProtectedButtonProps {
  children: React.ReactNode;
  requiredRole?: 'cliente' | 'gestor' | 'admin';
  requiredPermission?: string;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  allowAdmin?: boolean;
}

export const ProtectedButton: React.FC<ProtectedButtonProps> = ({
  children,
  requiredRole,
  requiredPermission,
  onClick,
  className = '',
  disabled = false,
  allowAdmin = true
}) => {
  const { user, isAuthenticated } = useAuth();
  const { hasPermission, isCliente, isGestor, isAdmin } = usePermissions();

  const hasAccess = () => {
    if (!isAuthenticated || !user) return false;
    if (allowAdmin && isAdmin()) return true;
    
    if (requiredRole) {
      switch (requiredRole) {
        case 'cliente': return isCliente();
        case 'gestor': return isGestor();
        case 'admin': return isAdmin();
      }
    }
    
    if (requiredPermission) {
      return hasPermission(requiredPermission);
    }
    
    return true;
  };

  const handleClick = () => {
    if (!hasAccess()) {
      console.warn('Acesso negado para esta ação');
      return;
    }
    
    if (onClick) {
      onClick();
    }
  };

  if (!hasAccess()) {
    return null; // Não renderizar botões sem permissão
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={className}
    >
      {children}
    </button>
  );
};

export default RoleGuard;