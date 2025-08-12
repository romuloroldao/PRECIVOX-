// src/components/dashboard/cards/AlertCard.tsx - REDESENHADO PARA SUPERMERCADOS
import React from 'react';

interface AlertCardProps {
  title: string;
  description: string;
  priority: 'Alto' | 'Médio' | 'Baixo';
  action: string;
  category: 'Preços' | 'Estoque' | 'Concorrência' | 'Promoção' | 'Demanda';
  impact: number;
  timestamp: Date;
  roi?: number;
  className?: string;
  onClick?: () => void;
}

export const AlertCard: React.FC<AlertCardProps> = ({
  title,
  description,
  priority,
  action,
  category,
  impact,
  timestamp,
  roi,
  className = '',
  onClick
}) => {
  // ===== CONFIGURAÇÕES POR CATEGORIA =====
  const getCategoryConfig = (category: string) => {
    const configs = {
      'Preços': {
        icon: '💰',
        color: '#3b82f6',
        bgColor: '#eff6ff'
      },
      'Estoque': {
        icon: '📦',
        color: '#f59e0b',
        bgColor: '#fffbeb'
      },
      'Concorrência': {
        icon: '⚔️',
        color: '#ef4444',
        bgColor: '#fef2f2'
      },
      'Promoção': {
        icon: '🏷️',
        color: '#22c55e',
        bgColor: '#f0fdf4'
      },
      'Demanda': {
        icon: '📈',
        color: '#8b5cf6',
        bgColor: '#f3e8ff'
      }
    };
    return configs[category as keyof typeof configs] || configs['Preços'];
  };

  // ===== CONFIGURAÇÕES POR PRIORIDADE =====
  const getPriorityConfig = (priority: string) => {
    const configs = {
      'Alto': {
        color: '#ef4444',
        bgColor: '#fee2e2',
        borderColor: '#fecaca',
        urgencyIcon: '🚨'
      },
      'Médio': {
        color: '#f59e0b',
        bgColor: '#fef3c7',
        borderColor: '#fde68a',
        urgencyIcon: '⚠️'
      },
      'Baixo': {
        color: '#22c55e',
        bgColor: '#dcfce7',
        borderColor: '#bbf7d0',
        urgencyIcon: 'ℹ️'
      }
    };
    return configs[priority as keyof typeof configs] || configs['Médio'];
  };

  const categoryConfig = getCategoryConfig(category);
  const priorityConfig = getPriorityConfig(priority);

  // ===== FORMATAÇÃO DE TEMPO =====
  const getTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'agora mesmo';
    if (diffMins < 60) return `${diffMins} min atrás`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h atrás`;
    return `${Math.floor(diffMins / 1440)} dias atrás`;
  };

  // ===== FORMATAÇÃO DE ROI =====
  const formatROI = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };

  return (
    <div 
      className={`alert-card priority-${priority.toLowerCase()} ${className} ${onClick ? 'clickable' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : 'article'}
      tabIndex={onClick ? 0 : undefined}
      style={{
        background: 'white',
        borderRadius: '1rem',
        padding: '1.25rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        border: `1px solid ${priorityConfig.borderColor}`,
        borderLeft: `4px solid ${priorityConfig.color}`,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s ease',
        position: 'relative',
        background: `linear-gradient(135deg, #fff 0%, ${priorityConfig.bgColor} 100%)`
      }}
    >
      {/* Header com Ícones e Prioridade */}
      <div 
        className="alert-header"
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: '0.75rem',
          gap: '0.75rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.25rem' }}>{categoryConfig.icon}</span>
          <span style={{ fontSize: '1rem' }}>{priorityConfig.urgencyIcon}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span 
            className="priority-badge"
            style={{
              padding: '0.25rem 0.5rem',
              borderRadius: '0.375rem',
              fontSize: '0.625rem',
              fontWeight: '700',
              textTransform: 'uppercase',
              color: 'white',
              background: priorityConfig.color,
              letterSpacing: '0.025em'
            }}
          >
            {priority}
          </span>
        </div>
      </div>

      {/* Título e Categoria */}
      <div style={{ marginBottom: '0.75rem' }}>
        <h4 
          style={{
            fontSize: '1rem',
            fontWeight: '700',
            color: '#1f2937',
            margin: '0 0 0.25rem 0',
            lineHeight: '1.4'
          }}
        >
          {title}
        </h4>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span 
            style={{
              padding: '0.125rem 0.5rem',
              background: categoryConfig.bgColor,
              color: categoryConfig.color,
              fontSize: '0.625rem',
              fontWeight: '600',
              borderRadius: '0.25rem',
              textTransform: 'uppercase',
              letterSpacing: '0.025em'
            }}
          >
            {category}
          </span>
          
          <span 
            style={{
              fontSize: '0.625rem',
              color: '#9ca3af',
              fontWeight: '500'
            }}
          >
            {getTimeAgo(timestamp)}
          </span>
        </div>
      </div>

      {/* Descrição */}
      <p 
        style={{
          fontSize: '0.875rem',
          color: '#4b5563',
          lineHeight: '1.5',
          margin: '0 0 1rem 0'
        }}
      >
        {description}
      </p>

      {/* Métricas de Impacto */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem',
          padding: '0.75rem',
          background: 'rgba(255, 255, 255, 0.7)',
          borderRadius: '0.5rem',
          border: '1px solid rgba(0, 0, 0, 0.05)'
        }}
      >
        <div style={{ flex: 1 }}>
          <span 
            style={{
              fontSize: '0.625rem',
              color: '#6b7280',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.025em'
            }}
          >
            Impacto no Negócio
          </span>
          <div 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginTop: '0.25rem'
            }}
          >
            <div 
              style={{
                flex: 1,
                height: '4px',
                background: '#e5e7eb',
                borderRadius: '2px',
                overflow: 'hidden'
              }}
            >
              <div 
                style={{
                  width: `${impact}%`,
                  height: '100%',
                  background: priorityConfig.color,
                  transition: 'width 0.5s ease'
                }}
              />
            </div>
            <span 
              style={{
                fontSize: '0.75rem',
                fontWeight: '700',
                color: priorityConfig.color
              }}
            >
              {impact}%
            </span>
          </div>
        </div>

        {roi && (
          <div style={{ textAlign: 'right', marginLeft: '1rem' }}>
            <span 
              style={{
                fontSize: '0.625rem',
                color: '#6b7280',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.025em',
                display: 'block'
              }}
            >
              ROI Estimado
            </span>
            <span 
              style={{
                fontSize: '0.875rem',
                fontWeight: '700',
                color: '#059669'
              }}
            >
              {formatROI(roi)}
            </span>
          </div>
        )}
      </div>

      {/* Ação Recomendada */}
      <div 
        style={{
          padding: '0.75rem',
          background: priorityConfig.bgColor,
          borderRadius: '0.5rem',
          border: `1px solid ${priorityConfig.color}20`
        }}
      >
        <div 
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.5rem',
            marginBottom: '0.5rem'
          }}
        >
          <span style={{ fontSize: '0.875rem' }}>💡</span>
          <span 
            style={{
              fontSize: '0.625rem',
              fontWeight: '700',
              color: priorityConfig.color,
              textTransform: 'uppercase',
              letterSpacing: '0.025em'
            }}
          >
            Ação Recomendada
          </span>
        </div>
        
        <p 
          style={{
            fontSize: '0.75rem',
            color: '#374151',
            margin: '0 0 0.75rem 0',
            lineHeight: '1.4'
          }}
        >
          {action}
        </p>

        {/* Botões de Ação */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            style={{
              flex: 1,
              padding: '0.5rem 0.75rem',
              background: priorityConfig.color,
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              fontSize: '0.75rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.9';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Aplicar Agora
          </button>
          
          <button
            style={{
              padding: '0.5rem 0.75rem',
              background: 'transparent',
              color: priorityConfig.color,
              border: `1px solid ${priorityConfig.color}`,
              borderRadius: '0.375rem',
              fontSize: '0.75rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = priorityConfig.color;
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = priorityConfig.color;
            }}
          >
            Lembrar
          </button>
        </div>
      </div>

      {/* Indicador de Hover para Cards Clicáveis */}
      {onClick && (
        <div 
          style={{
            position: 'absolute',
            top: '0.75rem',
            right: '0.75rem',
            opacity: '0',
            transition: 'opacity 0.2s ease',
            fontSize: '0.75rem',
            color: '#9ca3af'
          }}
          className="click-indicator"
        >
          👆
        </div>
      )}

      <style jsx>{`
        .alert-card.clickable:hover .click-indicator {
          opacity: 1;
        }
        
        .alert-card.clickable:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        }
        
        .alert-card.priority-alto {
          animation: urgent-pulse 2s infinite;
        }
        
        @keyframes urgent-pulse {
          0%, 100% {
            border-left-color: #ef4444;
          }
          50% {
            border-left-color: #f87171;
          }
        }
      `}</style>
    </div>
  );
};

export default AlertCard;