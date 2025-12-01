import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ResponsiveContainer, Tooltip, XAxis, YAxis, ScatterChart, Scatter, Cell } from 'recharts';

interface DemandHeatmapProps {
  data: {
    day: string;
    hour: number;
    value: number; // 0-100 intensity
  }[];
  title?: string;
  className?: string;
}

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function DemandHeatmap({ data, title = 'Mapa de Calor de Demanda', className }: DemandHeatmapProps) {
  // Transform data for ScatterChart
  // We map days to Y-axis (0-6) and hours to X-axis (0-23)
  const chartData = data.map(d => ({
    ...d,
    dayIndex: DAYS.indexOf(d.day),
    z: d.value // for bubble size/color
  }));

  const getColor = (value: number) => {
    // Blue gradient based on intensity
    const opacity = Math.max(0.2, value / 100);
    return `rgba(0, 102, 204, ${opacity})`; // Precivox Blue
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart
              margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
            >
              <XAxis 
                type="number" 
                dataKey="hour" 
                name="Hora" 
                domain={[0, 23]} 
                tickCount={12}
                tickFormatter={(tick) => `${tick}h`}
              />
              <YAxis 
                type="number" 
                dataKey="dayIndex" 
                name="Dia" 
                domain={[0, 6]} 
                tickFormatter={(tick) => DAYS[tick] || ''}
                ticks={[0, 1, 2, 3, 4, 5, 6]}
              />
              <Tooltip 
                cursor={{ strokeDasharray: '3 3' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-2 border border-gray-200 shadow-sm rounded text-sm">
                        <p className="font-medium">{data.day} às {data.hour}h</p>
                        <p className="text-blue-600">Intensidade: {data.value}%</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Scatter data={chartData} shape="circle">
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getColor(entry.value)} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
