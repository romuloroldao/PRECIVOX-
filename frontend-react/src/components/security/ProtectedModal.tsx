import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';

// Reutilizando CSS existentes
import '../../styles/SearchPage.styles.css';
import '../../styles/animations.css';

interface ProtectedModalProps {
  isOpen: boolean;
  onClose: () => void;
  requiredRole?: 'visitante' | 'cliente' | 'admin';
  requiredFeature?: string;
  children: React.ReactNode;
  title?: string;
  fallbackTitle?: string;
  fallbackMessage?: string;
  showUpgrade?: boolean;
  className?: string;
}

export const ProtectedModal: React.FC<ProtectedModalProps> = ({
  isOpen,
  onClose,
  requiredRole = 'cliente',
  requiredFeature,
  children,
  title = 'Modal Protegido',
  fallbackTitle = '🔒 Acesso Restrito',
  fallbackMessage,
  showUpgrade = true,
  className = ''
}) => {
  const { user } = useAuth();
  const { canUseListFeatures, canUseFeature, getBlockedMessage } = usePermissions();

  if (!isOpen) return null;

  // Verificar permissões
  const hasAccess = requiredFeature 
    ? canUseFeature(requiredFeature)
    : requiredRole === 'cliente' 
      ? canUseListFeatures 
      : user?.role === requiredRole;

  // Definir mensagem de fallback
  const getDefaultMessage = () => {
    if (requiredFeature) {
      return getBlockedMessage(requiredFeature);
    }
    
    switch (requiredRole) {
      case 'cliente':
        return 'Esta funcionalidade é exclusiva para clientes. Faça login ou cadastre-se para continuar.';
      case 'admin':
        return 'Esta funcionalidade é exclusiva para administradores.';
      default:
        return 'Você não tem permissão para acessar esta funcionalidade.';
    }
  };

  const displayMessage = fallbackMessage || getDefaultMessage();

  return (
    <div className="modal-overlay fade-in" onClick={onClose}>
      <div 
        className={`modal-container ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3 className="modal-title">
            {hasAccess ? title : fallbackTitle}
          </h3>
          <button 
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Fechar modal"
          >
            ×
          </button>
        </div>

        <div className="modal-content">
          {hasAccess ? (
            children
          ) : (
            <div className="access-denied-content">
              <div className="denied-icon">🚫</div>
              <p className="denied-message">{displayMessage}</p>
              
              {showUpgrade && requiredRole === 'cliente' && (
                <div className="upgrade-section">
                  <p className="upgrade-text">
                    Desbloquei recursos exclusivos:
                  </p>
                  <ul className="features-list">
                    <li>📝 Criar e gerenciar listas</li>
                    <li>🔔 Alertas de preço</li>
                    <li>📊 Estatísticas detalhadas</li>
                    <li>💾 Histórico de buscas</li>
                  </ul>
                  
                  <div className="upgrade-actions">
                    <button className="btn-primary">
                      Fazer Login
                    </button>
                    <button className="btn-secondary">
                      Criar Conta
                    </button>
                  </div>
                </div>
              )}
              
              {user?.role === 'admin' && requiredRole === 'cliente' && (
                <div className="admin-note">
                  <p className="admin-message">
                    💡 <strong>Modo Admin:</strong> Esta funcionalidade é privada dos clientes.
                    Você pode visualizar mas não interagir.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          {hasAccess ? (
            <button className="btn-secondary" onClick={onClose}>
              Fechar
            </button>
          ) : (
            <button className="btn-primary" onClick={onClose}>
              Entendi
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProtectedModal;