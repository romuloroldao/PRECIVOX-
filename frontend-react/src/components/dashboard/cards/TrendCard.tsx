import React from 'react';

interface TrendCardProps {
  category: string;
  trend: 'up' | 'down' | 'stable';
  percentage: number;
  description: string;
  forecast: string;
  icon: string;
  className?: string;
  onClick?: () => void;
}

export const TrendCard: React.FC<TrendCardProps> = ({
  category,
  trend,
  percentage,
  description,
  forecast,
  icon,
  className = '',
  onClick
}) => {
  const getTrendConfig = (trend: string) => {
    const configs = {
      up: {
        color: '#2ed573',
        bgColor: '#d4edda',
        textColor: '#155724',
        arrow: '📈',
        label: 'Em Alta'
      },
      down: {
        color: '#ff4757',
        bgColor: '#f8d7da',
        textColor: '#721c24',
        arrow: '📉',
        label: 'Em Queda'
      },
      stable: {
        color: '#6c757d',
        bgColor: '#e2e3e5',
        textColor: '#383d41',
        arrow: '➡️',
        label: 'Estável'
      }
    };
    return configs[trend as keyof typeof configs] || configs['stable'];
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      'Eletrônicos': '📱',
      'Supermercados': '🛒',
      'Farmácias': '💊',
      'Restaurantes': '🍔',
      'Combustível': '⛽',
      'Roupas': '👕'
    };
    return icons[category as keyof typeof icons] || icon;
  };

  const config = getTrendConfig(trend);

  return (
    <div 
      className={`trend-card trend-${trend} ${className} ${onClick ? 'clickable' : ''}`}
      onClick={onClick}
      style={{
        background: '#fff',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        border: '1px solid #e9ecef',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s ease',
        position: 'relative',
        borderLeft: `4px solid ${config.color}`
      }}
    >
      {/* Header da Trend */}
      <div 
        className="trend-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px' }}>{getCategoryIcon(category)}</span>
          <h4 
            style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#2c3e50',
              margin: '0'
            }}
          >
            {category}
          </h4>
        </div>

        <div 
          className="trend-indicator"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 8px',
            borderRadius: '12px',
            background: config.bgColor,
            color: config.textColor
          }}
        >
          <span style={{ fontSize: '14px' }}>{config.arrow}</span>
          <span style={{ fontSize: '12px', fontWeight: '600' }}>
            {config.label}
          </span>
        </div>
      </div>

      {/* Percentual da Tendência */}
      <div 
        className="percentage-section"
        style={{
          marginBottom: '12px'
        }}
      >
        <div 
          style={{
            fontSize: '24px',
            fontWeight: '700',
            color: config.color,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          {percentage > 0 ? '+' : ''}{percentage}%
          <span style={{ fontSize: '16px' }}>{config.arrow}</span>
        </div>
        
        <p 
          style={{
            fontSize: '12px',
            color: '#6c757d',
            margin: '4px 0 0 0'
          }}
        >
          Variação nos últimos 7 dias
        </p>
      </div>

      {/* Descrição */}
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

      {/* Barra Visual da Tendência */}
      <div 
        className="trend-bar"
        style={{
          width: '100%',
          height: '8px',
          background: '#e9ecef',
          borderRadius: '4px',
          overflow: 'hidden',
          marginBottom: '16px'
        }}
      >
        <div 
          className="trend-fill"
          style={{
            width: `${Math.min(Math.abs(percentage) * 2, 100)}%`,
            height: '100%',
            background: `linear-gradient(90deg, ${config.color}80, ${config.color})`,
            transition: 'width 0.5s ease',
            borderRadius: '4px'
          }}
        ></div>
      </div>

      {/* Previsão */}
      <div 
        className="forecast-section"
        style={{
          padding: '12px',
          background: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #dee2e6'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
          <span style={{ fontSize: '14px' }}>🔮</span>
          <span style={{ fontSize: '12px', fontWeight: '600', color: '#495057' }}>
            Previsão IA
          </span>
        </div>
        
        <p 
          style={{
            fontSize: '13px',
            color: '#6c757d',
            margin: '0',
            lineHeight: '1.4'
          }}
        >
          {forecast}
        </p>
      </div>

      {/* Indicador de Intensidade */}
      <div 
        className="intensity-dots"
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          display: 'flex',
          gap: '2px'
        }}
      >
        {[1, 2, 3].map(dot => (
          <div
            key={dot}
            style={{
              width: '4px',
              height: '4px',
              borderRadius: '50%',
              background: Math.abs(percentage) >= dot * 5 ? config.color : '#dee2e6',
              transition: 'background 0.3s ease'
            }}
          ></div>
        ))}
      </div>

      <style jsx>{`
        .trend-card.clickable:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0,0,0,0.15);
        }
        
        .trend-card.trend-up {
          border-left-color: #2ed573;
        }
        
        .trend-card.trend-down {
          border-left-color: #ff4757;
        }
        
        .trend-card.trend-stable {
          border-left-color: #6c757d;
        }
      `}</style>
    </div>
  );
};

export default TrendCard;