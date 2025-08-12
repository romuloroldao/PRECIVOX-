import React, { useState } from 'react';
import { Brain, ArrowRight, CheckCircle, AlertCircle, HelpCircle } from 'lucide-react';

interface InsightCardProps {
  title: string;
  description: string;
  confidence: number;
  impact: string;
  action: string;
  type: string;
  className?: string;
  onClick?: () => void;
  onActionClick?: (insight: any) => void;
  insight?: any; // Dados completos do insight para IA
}

export const InsightCard: React.FC<InsightCardProps> = ({
  title,
  description,
  confidence,
  impact,
  action,
  type,
  className = '',
  onClick,
  onActionClick,
  insight
}) => {
  const [isLoadingAction, setIsLoadingAction] = useState(false);
  
  const handleActionClick = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Evitar conflito com onClick do card
    
    if (onActionClick && insight) {
      setIsLoadingAction(true);
      try {
        await onActionClick({
          ...insight,
          title,
          description,
          type,
          impact
        });
      } catch (error) {
        console.error('Erro ao executar ação do insight:', error);
      } finally {
        setIsLoadingAction(false);
      }
    }
  };
  const getTypeIcon = (type: string) => {
    const icons = {
      trend: '📈',
      opportunity: '💡',
      forecast: '🔮',
      alert: '⚠️',
      recommendation: '🎯'
    };
    return icons[type as keyof typeof icons] || '📊';
  };

  const getImpactColor = (impact: string) => {
    const colors = {
      'Alto': '#ff4757',
      'Médio': '#ffa502',
      'Baixo': '#2ed573'
    };
    return colors[impact as keyof typeof colors] || '#747d8c';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return '#2ed573';
    if (confidence >= 0.6) return '#ffa502';
    return '#ff4757';
  };

  return (
    <div 
      className={`insight-card ${className} ${onClick ? 'clickable' : ''}`}
      onClick={onClick}
      style={{
        background: '#fff',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        border: '1px solid #e9ecef',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s ease',
        position: 'relative'
      }}
    >
      <div 
        className="insight-header"
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px' }}>{getTypeIcon(type)}</span>
          <h4 
            style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#2c3e50',
              margin: '0'
            }}
          >
            {title}
          </h4>
        </div>

        <span 
          className="impact-badge"
          style={{
            padding: '4px 8px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: '600',
            color: '#fff',
            background: getImpactColor(impact)
          }}
        >
          {impact}
        </span>
      </div>

      <p 
        style={{
          fontSize: '14px',
          color: '#6c757d',
          lineHeight: '1.5',
          margin: '0 0 16px 0'
        }}
      >
        {description}
      </p>

      <div 
        className="confidence-section"
        style={{
          marginBottom: '16px'
        }}
      >
        <div 
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '6px'
          }}
        >
          <span style={{ fontSize: '12px', color: '#6c757d' }}>
            Confiança IA
          </span>
          <span 
            style={{ 
              fontSize: '12px', 
              fontWeight: '600',
              color: getConfidenceColor(confidence)
            }}
          >
            {(confidence * 100).toFixed(0)}%
          </span>
        </div>
        
        <div 
          className="confidence-bar"
          style={{
            width: '100%',
            height: '4px',
            background: '#e9ecef',
            borderRadius: '2px',
            overflow: 'hidden'
          }}
        >
          <div 
            className="confidence-fill"
            style={{
              width: `${confidence * 100}%`,
              height: '100%',
              background: getConfidenceColor(confidence),
              transition: 'width 0.3s ease'
            }}
          ></div>
        </div>
      </div>

      <button 
        className="action-button"
        onClick={handleActionClick}
        disabled={isLoadingAction}
        style={{
          width: '100%',
          padding: '12px 16px',
          background: isLoadingAction ? '#6c757d' : '#007bff',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '500',
          cursor: isLoadingAction ? 'not-allowed' : 'pointer',
          transition: 'all 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}
        onMouseEnter={(e) => {
          if (!isLoadingAction) {
            e.currentTarget.style.background = '#0056b3';
          }
        }}
        onMouseLeave={(e) => {
          if (!isLoadingAction) {
            e.currentTarget.style.background = '#007bff';
          }
        }}
      >
        {isLoadingAction ? (
          <>
            <div 
              style={{
                width: '16px',
                height: '16px',
                border: '2px solid #ffffff40',
                borderTop: '2px solid #ffffff',
                borderRadius: '50%',
                animation: 'spin 1s infinite linear'
              }}
            />
            <span>Gerando passo-a-passo...</span>
          </>
        ) : (
          <>
            <Brain size={16} />
            <span>{action}</span>
            <ArrowRight size={14} />
          </>
        )}
      </button>

      <style jsx>{`
        .insight-card.clickable:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0,0,0,0.15);
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      <style jsx>{`
        .insight-card.clickable:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0,0,0,0.15);
        }
      `}</style>
    </div>
  );
};

export default InsightCard;