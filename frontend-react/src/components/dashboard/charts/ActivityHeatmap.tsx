import React from 'react';

interface Activity {
  id: number;
  type: string;
  location: string;
  timestamp: Date;
  user: string;
}

interface LocationData {
  city: string;
  lat: number;
  lng: number;
}

interface ActivityHeatmapProps {
  activities: Activity[];
  location: LocationData | null;
  isLive: boolean;
  className?: string;
}

export const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({
  activities,
  location,
  isLive,
  className = ''
}) => {
  // Calcular intensidade por região
  const getRegionIntensity = (regionName: string) => {
    const regionActivities = activities.filter(a => a.location === regionName);
    const maxPossible = 20; // máximo de atividades possíveis
    return Math.min((regionActivities.length / maxPossible) * 100, 100);
  };

  // Regiões da Grande São Paulo próximas a Franco da Rocha
  const regions = [
    { name: 'Franco da Rocha', x: 50, y: 40, size: 'large' },
    { name: 'Caieiras', x: 45, y: 35, size: 'medium' },
    { name: 'Cajamar', x: 40, y: 45, size: 'medium' },
    { name: 'Jundiaí', x: 30, y: 30, size: 'small' },
    { name: 'Campo Limpo Paulista', x: 35, y: 40, size: 'small' },
    { name: 'Várzea Paulista', x: 32, y: 35, size: 'small' }
  ];

  const getHeatColor = (intensity: number) => {
    if (intensity >= 80) return '#ff4757'; // Vermelho intenso
    if (intensity >= 60) return '#ff6b7a'; // Vermelho médio
    if (intensity >= 40) return '#ffa502'; // Laranja
    if (intensity >= 20) return '#ffda79'; // Amarelo
    if (intensity > 0) return '#2ed573'; // Verde
    return '#e9ecef'; // Cinza (sem atividade)
  };

  const getRegionSize = (size: string) => {
    const sizes = {
      large: 20,
      medium: 15,
      small: 10
    };
    return sizes[size as keyof typeof sizes] || 15;
  };

  return (
    <div 
      className={`activity-heatmap ${className}`}
      style={{
        background: '#fff',
        borderRadius: '12px',
        padding: '20px',
        border: '1px solid #e9ecef',
        position: 'relative',
        height: '300px'
      }}
    >
      {/* Mapa SVG */}
      <svg 
        width="100%" 
        height="260"
        viewBox="0 0 100 100"
        style={{
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          background: '#f8f9fa'
        }}
      >
        {/* Grid de fundo */}
        <defs>
          <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#e9ecef" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="100" height="100" fill="url(#grid)" />

        {/* Regiões no mapa */}
        {regions.map((region, index) => {
          const intensity = getRegionIntensity(region.name);
          const size = getRegionSize(region.size);
          
          return (
            <g key={region.name}>
              {/* Círculo da região */}
              <circle
                cx={region.x}
                cy={region.y}
                r={size}
                fill={getHeatColor(intensity)}
                stroke="#fff"
                strokeWidth="2"
                opacity={0.8}
                style={{
                  filter: intensity > 0 ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' : 'none',
                  animation: isLive && intensity > 60 ? 'pulse 2s infinite' : 'none'
                }}
              />
              
              {/* Anel de atividade (se tiver atividade alta) */}
              {intensity > 50 && (
                <circle
                  cx={region.x}
                  cy={region.y}
                  r={size + 5}
                  fill="none"
                  stroke={getHeatColor(intensity)}
                  strokeWidth="2"
                  opacity={0.5}
                  style={{
                    animation: isLive ? 'ping 3s infinite' : 'none'
                  }}
                />
              )}
              
              {/* Label da região */}
              <text
                x={region.x}
                y={region.y + size + 8}
                textAnchor="middle"
                fontSize="3"
                fill="#495057"
                fontWeight="500"
              >
                {region.name}
              </text>
              
              {/* Intensidade em porcentagem */}
              {intensity > 0 && (
                <text
                  x={region.x}
                  y={region.y + 1}
                  textAnchor="middle"
                  fontSize="2.5"
                  fill="#fff"
                  fontWeight="600"
                >
                  {intensity.toFixed(0)}%
                </text>
              )}
            </g>
          );
        })}

        {/* Indicador de localização atual */}
        {location && (
          <g>
            <circle
              cx="50"
              cy="40"
              r="3"
              fill="#007bff"
              stroke="#fff"
              strokeWidth="1"
            />
            <text
              x="50"
              y="35"
              textAnchor="middle"
              fontSize="2"
              fill="#007bff"
              fontWeight="600"
            >
              Você está aqui
            </text>
          </g>
        )}
      </svg>

      {/* Legenda */}
      <div 
        className="heatmap-legend"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: '12px',
          padding: '8px 12px',
          background: '#f8f9fa',
          borderRadius: '6px',
          fontSize: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#6c757d' }}>Atividade:</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '12px', height: '12px', background: '#e9ecef', borderRadius: '2px' }}></div>
            <span style={{ color: '#6c757d', fontSize: '10px' }}>Baixa</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '12px', height: '12px', background: '#ffa502', borderRadius: '2px' }}></div>
            <span style={{ color: '#6c757d', fontSize: '10px' }}>Média</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '12px', height: '12px', background: '#ff4757', borderRadius: '2px' }}></div>
            <span style={{ color: '#6c757d', fontSize: '10px' }}>Alta</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div 
            className={`live-indicator ${isLive ? 'active' : 'inactive'}`}
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: isLive ? '#2ed573' : '#6c757d'
            }}
          ></div>
          <span style={{ color: '#6c757d' }}>
            {isLive ? 'Tempo Real' : 'Pausado'}
          </span>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 0.8;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.6;
          }
          100% {
            transform: scale(1);
            opacity: 0.8;
          }
        }
        
        @keyframes ping {
          0% {
            transform: scale(1);
            opacity: 0.5;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.3;
          }
          100% {
            transform: scale(1);
            opacity: 0.5;
          }
        }
        
        .live-indicator.active {
          animation: pulse 2s infinite;
        }
      `}</style>
    </div>
  );
};

export default ActivityHeatmap;