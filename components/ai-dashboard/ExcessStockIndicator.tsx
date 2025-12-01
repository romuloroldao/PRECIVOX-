import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { AlertBadge } from './AlertBadge';

interface ExcessItem {
  name: string;
  currentStock: number;
  avgSales: number;
  daysOfStock: number;
}

interface ExcessStockIndicatorProps {
  data: ExcessItem[];
  title?: string;
  className?: string;
}

export function ExcessStockIndicator({ data, title = 'Excesso de Estoque', className }: ExcessStockIndicatorProps) {
  // Filter items with more than 30 days of stock
  const excessData = data
    .filter(item => item.daysOfStock > 30)
    .sort((a, b) => b.daysOfStock - a.daysOfStock)
    .slice(0, 5);

  const getColor = (days: number) => {
    if (days > 60) return '#ef4444'; // red
    if (days > 45) return '#f59e0b'; // orange
    return '#eab308'; // yellow
  };

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <AlertBadge type="warning" message={`${excessData.length} itens`} />
      </CardHeader>
      <CardContent>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={excessData} layout="vertical" margin={{ left: 20 }}>
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
                        <p className="text-gray-600">Venda média: {data.avgSales}/dia</p>
                        <p className="text-orange-600 font-medium">{data.daysOfStock} dias de estoque</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="daysOfStock" radius={[0, 4, 4, 0]} barSize={20}>
                {excessData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getColor(entry.daysOfStock)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
