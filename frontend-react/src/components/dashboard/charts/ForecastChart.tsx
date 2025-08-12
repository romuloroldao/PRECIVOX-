import React, { useState } from 'react';

interface ForecastData {
  day: number;
  eletrônicos: number;
  supermercados: number;
  farmácias: number;
  restaurantes: number;
}

interface LocationData {
  city: string;
  lat: number;
  lng: number;
}

interface ForecastChartProps {
  data: ForecastData[];
  location: LocationData | null;
  userPreferences: any;
  className?: string;
}

export const ForecastChart: React.FC<ForecastChartProps> = ({
  data,
  location,
  userPreferences,
  className = ''
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [timeRange, setTimeRange] = useState<string>('30d');

  // Configurações das categorias
  const categories = {
    eletrônicos: { color: '#007bff', icon: '📱', label: 'Eletrônicos' },
    supermercados: { color: '#28a745', icon: '🛒', label: 'Supermercados' },
    farmácias: { color: '#dc3545', icon: '💊', label: 'Farmácias' },
    restaurantes: { color: '#ffc107', icon: '🍔', label: 'Restaurantes' }
  };

  // Filtrar dados baseado no time range
  const getFilteredData = () => {
    const ranges = {
      '7d': 7,
      '15d': 15,
      '30d': 30
    };
    const limit = ranges[timeRange as keyof typeof ranges] || 30;
    return data.slice(0, limit);
  };

  const filteredData = getFilteredData();

  // Calcular dimensões do gráfico
  const chartWidth = 600;
  const chartHeight = 300;
  const padding = 40;
  const innerWidth = chartWidth - (padding * 2);
  const innerHeight = chartHeight - (padding * 2);

  // Calcular escalas
  const maxValue = Math.max(...filteredData.flatMap(d => 
    Object.values(d).filter(v => typeof v === 'number' && v !== d.day)
  ));
  const minValue = Math.min(...filteredData.flatMap(d => 
    Object.values(d).filter(v => typeof v === 'number' && v !== d.day)
  ));

  const xScale = (day: number) => padding + (day - 1) * (innerWidth / (filteredData.length - 1));
  const yScale = (value: number) => padding + innerHeight - ((value - minValue) / (maxValue - minValue)) * innerHeight;

  // Gerar path SVG para uma categoria
  const generatePath = (categoryKey: string) => {
    const points = filteredData.map((d, i) => 
      `${xScale(i + 1)},${yScale(d[categoryKey as keyof ForecastData] as number)}`
    );
    return `M ${points.join(' L ')}`;
  };

  // Gerar área preenchida
  const generateArea = (categoryKey: string) => {
    const points = filteredData.map((d, i) => 
      `${xScale(i + 1)},${yScale(d[categoryKey as keyof ForecastData] as number)}`
    );
    const baseline = yScale(minValue);
    return `M ${padding},${baseline} L ${points.join(' L ')} L ${padding + innerWidth},${baseline} Z`;
  };

  return (
    <div 
      className={`forecast-chart ${className}`}
      style={{
        background: '#fff',
        borderRadius: '12px',
        padding: '20px',
        border: '1px solid #e9ecef'
      }}
    >
      {/* Header do Chart */}
      <div 
        className="chart-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}
      >
        <h4 style={{ margin: '0', color: '#2c3e50', fontSize: '16px' }}>
          📈 Previsão de Preços - {location?.city || 'Franco da Rocha'}
        </h4>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          {/* Seletor de período */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            style={{
              padding: '6px 12px',
              border: '1px solid #dee2e6',
              borderRadius: '6px',
              fontSize: '12px'
            }}
          >
            <option value="7d">7 dias</option>
            <option value="15d">15 dias</option>
            <option value="30d">30 dias</option>
          </select>

          {/* Seletor de categoria */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              padding: '6px 12px',
              border: '1px solid #dee2e6',
              borderRadius: '6px',
              fontSize: '12px'
            }}
          >
            <option value="todos">Todas as categorias</option>
            {Object.entries(categories).map(([key, cat]) => (
              <option key={key} value={key}>
                {cat.icon} {cat.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* SVG Chart */}
      <div style={{ width: '100%', overflowX: 'auto' }}>
        <svg width={chartWidth} height={chartHeight} style={{ minWidth: '600px' }}>
          {/* Grid lines */}
          <defs>
            <pattern id="grid" width="40" height="20" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 20" fill="none" stroke="#f1f3f4" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width={chartWidth} height={chartHeight} fill="url(#grid)" />

          {/* Eixos */}
          <line 
            x1={padding} 
            y1={padding} 
            x2={padding} 
            y2={padding + innerHeight} 
            stroke="#dee2e6" 
            strokeWidth="2"
          />
          <line 
            x1={padding} 
            y1={padding + innerHeight} 
            x2={padding + innerWidth} 
            y2={padding + innerHeight} 
            stroke="#dee2e6" 
            strokeWidth="2"
          />

          {/* Labels do eixo Y */}
          {[0, 25, 50, 75, 100].map(percent => {
            const value = minValue + (maxValue - minValue) * (percent / 100);
            const y = yScale(value);
            return (
              <g key={percent}>
                <text
                  x={padding - 8}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="10"
                  fill="#6c757d"
                >
                  {value.toFixed(0)}
                </text>
                <line
                  x1={padding}
                  y1={y}
                  x2={padding + innerWidth}
                  y2={y}
                  stroke="#f1f3f4"
                  strokeWidth="1"
                />
              </g>
            );
          })}

          {/* Labels do eixo X */}
          {filteredData.filter((_, i) => i % 5 === 0).map((d, i) => {
            const x = xScale(d.day);
            return (
              <text
                key={d.day}
                x={x}
                y={padding + innerHeight + 20}
                textAnchor="middle"
                fontSize="10"
                fill="#6c757d"
              >
                Dia {d.day}
              </text>
            );
          })}

          {/* Linhas de previsão */}
          {Object.entries(categories).map(([categoryKey, category]) => {
            if (selectedCategory !== 'todos' && selectedCategory !== categoryKey) return null;

            return (
              <g key={categoryKey}>
                {/* Área preenchida */}
                <path
                  d={generateArea(categoryKey)}
                  fill={category.color}
                  fillOpacity="0.1"
                />
                
                {/* Linha principal */}
                <path
                  d={generatePath(categoryKey)}
                  fill="none"
                  stroke={category.color}
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                
                {/* Pontos de dados */}
                {filteredData.map((d, i) => (
                  <circle
                    key={i}
                    cx={xScale(i + 1)}
                    cy={yScale(d[categoryKey as keyof ForecastData] as number)}
                    r="3"
                    fill={category.color}
                    stroke="#fff"
                    strokeWidth="2"
                  />
                ))}
              </g>
            );
          })}

          {/* Linha de tendência atual */}
          <line
            x1={padding}
            y1={yScale(100)}
            x2={padding + innerWidth}
            y2={yScale(100)}
            stroke="#dc3545"
            strokeWidth="1"
            strokeDasharray="5,5"
          />
          <text
            x={padding + innerWidth - 60}
            y={yScale(100) - 5}
            fontSize="10"
            fill="#dc3545"
          >
            Preço atual
          </text>
        </svg>
      </div>

      {/* Legenda */}
      <div 
        className="chart-legend"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px',
          marginTop: '20px',
          padding: '12px',
          background: '#f8f9fa',
          borderRadius: '8px'
        }}
      >
        {Object.entries(categories).map(([key, category]) => (
          <div 
            key={key}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              opacity: selectedCategory === 'todos' || selectedCategory === key ? 1 : 0.5
            }}
            onClick={() => setSelectedCategory(selectedCategory === key ? 'todos' : key)}
          >
            <div 
              style={{
                width: '12px',
                height: '12px',
                background: category.color,
                borderRadius: '2px'
              }}
            ></div>
            <span style={{ fontSize: '12px', color: '#495057' }}>
              {category.icon} {category.label}
            </span>
          </div>
        ))}
      </div>

      {/* Estatísticas resumidas */}
      <div 
        className="forecast-stats"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '12px',
          marginTop: '16px'
        }}
      >
        {Object.entries(categories).map(([key, category]) => {
          const currentValue = filteredData[0]?.[key as keyof ForecastData] as number || 100;
          const futureValue = filteredData[filteredData.length - 1]?.[key as keyof ForecastData] as number || 100;
          const change = ((futureValue - currentValue) / currentValue) * 100;
          
          return (
            <div 
              key={key}
              style={{
                padding: '12px',
                background: '#fff',
                border: '1px solid #dee2e6',
                borderRadius: '6px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <span>{category.icon}</span>
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#495057' }}>
                  {category.label}
                </span>
              </div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: change >= 0 ? '#28a745' : '#dc3545' }}>
                {change >= 0 ? '+' : ''}{change.toFixed(1)}%
              </div>
              <div style={{ fontSize: '10px', color: '#6c757d' }}>
                {timeRange} previsão
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ForecastChart;