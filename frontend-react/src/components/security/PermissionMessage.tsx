import React from 'react';
import { useAuth } from '../../hooks/useAuth';

// Reutilizando CSS existentes
import '../../styles/SearchPage.styles.css';
import '../../styles/animations.css';

interface PermissionMessageProps {
  userRole?: 'visitante' | 'cliente' | 'admin';
  feature?: string;
  message?: string;
  type?: 'info' | 'warning' | 'error' | 'success';
  variant?: 'banner' | 'card' | 'inline' | 'toast';
  showActions?: boolean;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

export const PermissionMessage: React.FC<PermissionMessageProps> = ({
  userRole,
  feature = 'listas',
  message,
  type = 'info',
  variant = 'banner',
  showActions = true,
  dismissible = false,
  onDismiss,
  className = ''
}) => {
  const { user } = useAuth();
  const currentRole = userRole || user?.role || 'visitante';

  // Mensagens educativas por role e feature
  const getEducationalMessage = () => {
    if (message) return message;

    const messages = {
      visitante: {
        listas: 'As listas de produtos são uma funcionalidade exclusiva para clientes logados. Cadastre-se gratuitamente para organizar seus produtos favoritos!',
        alerts: 'Os alertas de preço são exclusivos para clientes. Receba notificações quando o preço dos seus produtos favoritos baixar!',
        history: 'O histórico de buscas é salvo apenas para clientes logados. Faça login para ter acesso ao seu histórico personalizado.',
        analytics: 'Estatísticas detalhadas estão disponíveis apenas para clientes. Cadastre-se para ver insights sobre suas buscas!'
      },
      cliente: {
        admin: 'Esta funcionalidade é exclusiva para administradores do sistema.',
        reports: 'Relatórios avançados estão disponíveis apenas para contas empresariais.',
        bulk: 'Operações em lote são um recurso premium. Entre em contato para upgrade.'
      },
      admin: {
        listas: 'As listas são uma funcionalidade privada dos clientes. Como admin, você pode visualizar mas não criar listas.',
        privacy: 'Funcionalidade de privacidade - dados sensíveis dos usuários são protegidos.',
        client_data: 'Dados privados dos clientes são protegidos por nossa política de privacidade.'
      }
    };

    return messages[currentRole]?.[feature] || 
           'Esta funcionalidade possui restrições de acesso baseadas no seu tipo de conta.';
  };

  // Ícones por tipo
  const getIcon = () => {
    switch (type) {
      case 'info': return '💡';
      case 'warning': return '⚠️';
      case 'error': return '🚫';
      case 'success': return '✅';
      default: return '💡';
    }
  };

  // Ações por role
  const getActions = () => {
    if (!showActions) return null;

    switch (currentRole) {
      case 'visitante':
        return (
          <div className="permission-actions">
            <button className="action-btn primary">
              Criar Conta Grátis
            </button>
            <button className="action-btn secondary">
              Fazer Login
            </button>
          </div>
        );

      case 'cliente':
        return (
          <div className="permission-actions">
            <button className="action-btn primary">
              Saber Mais
            </button>
            <button className="action-btn secondary">
              Contatar Suporte
            </button>
          </div>
        );

      case 'admin':
        return (
          <div className="permission-actions">
            <button className="action-btn secondary">
              Ver Documentação
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  // Classes CSS baseadas no variant
  const getClasses = () => {
    const baseClass = 'permission-message';
    return `${baseClass} ${variant} ${type} ${className}`;
  };

  return (
    <div className={`${getClasses()} fade-in`}>
      {variant === 'banner' && (
        <div className="permission-banner">
          <div className="banner-content">
            <div className="banner-icon">{getIcon()}</div>
            <div className="banner-text">
              <h4 className="banner-title">
                {type === 'info' ? 'Informação' :
                 type === 'warning' ? 'Atenção' :
                 type === 'error' ? 'Acesso Negado' : 'Sucesso'}
              </h4>
              <p className="banner-message">{getEducationalMessage()}</p>
            </div>
            {dismissible && (
              <button className="banner-dismiss" onClick={onDismiss}>×</button>
            )}
          </div>
          {getActions()}
        </div>
      )}

      {variant === 'card' && (
        <div className="permission-card">
          <div className="card-header">
            <span className="card-icon">{getIcon()}</span>
            <h5 className="card-title">Permissão Necessária</h5>
            {dismissible && (
              <button className="card-dismiss" onClick={onDismiss}>×</button>
            )}
          </div>
          <div className="card-body">
            <p className="card-message">{getEducationalMessage()}</p>
            {getActions()}
          </div>
        </div>
      )}

      {variant === 'inline' && (
        <div className="permission-inline">
          <span className="inline-icon">{getIcon()}</span>
          <span className="inline-message">{getEducationalMessage()}</span>
          {dismissible && (
            <button className="inline-dismiss" onClick={onDismiss}>×</button>
          )}
        </div>
      )}

      {variant === 'toast' && (
        <div className="permission-toast">
          <div className="toast-content">
            <span className="toast-icon">{getIcon()}</span>
            <span className="toast-message">{getEducationalMessage()}</span>
          </div>
          {dismissible && (
            <button className="toast-dismiss" onClick={onDismiss}>×</button>
          )}
        </div>
      )}
    </div>
  );
};

export default PermissionMessage;