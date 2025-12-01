import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { AlertBadge } from './AlertBadge';

interface StockItem {
  name: string;
  currentStock: number;
  minStock: number;
  riskLevel: 'critical' | 'warning' | 'safe';
}

interface StockRuptureIndicatorProps {
  data: StockItem[];
  title?: string;
  className?: string;
}

export function StockRuptureIndicator({ data, title = 'Risco de Ruptura', className }: StockRuptureIndicatorProps) {
  // Filter only critical and warning items
  const riskData = data
    .filter(item => item.riskLevel !== 'safe')
    .sort((a, b) => (a.currentStock / a.minStock) - (b.currentStock / b.minStock))
    .slice(0, 5); // Top 5 risky items

  const getColor = (risk: string) => {
    return risk === 'critical' ? '#ef4444' : '#eab308';
  };

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <AlertBadge type="critical" message={`${riskData.length} itens em risco`} />
      </CardHeader>
      <CardContent>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={riskData} layout="vertical" margin={{ left: 20 }}>
              <XAxis type="number" hide />
              <YAxis 
                type="category" 
                dataKey="name" 
                width={100} 
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-2 border border-gray-200 shadow-sm rounded text-sm">
                        <p className="font-medium">{data.name}</p>
                        <p className="text-gray-600">Estoque: {data.currentStock}</p>
                        <p className="text-gray-600">Mínimo: {data.minStock}</p>
                        <p className={data.riskLevel === 'critical' ? 'text-red-600' : 'text-yellow-600'}>
                          {data.riskLevel === 'critical' ? 'Crítico' : 'Atenção'}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="currentStock" radius={[0, 4, 4, 0]} barSize={20}>
                {riskData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getColor(entry.riskLevel)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
