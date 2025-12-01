import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface PriceElasticityCurveProps {
  data: {
    price: number;
    demand: number;
  }[];
  currentPrice?: number;
  optimalPrice?: number;
  title?: string;
  className?: string;
}

export function PriceElasticityCurve({ 
  data, 
  currentPrice, 
  optimalPrice,
  title = 'Curva de Elasticidade de Preço', 
  className 
}: PriceElasticityCurveProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="price" 
                label={{ value: 'Preço (R$)', position: 'insideBottom', offset: -5 }}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                label={{ value: 'Demanda', angle: -90, position: 'insideLeft' }}
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-2 border border-gray-200 shadow-sm rounded text-sm">
                        <p className="font-medium">R$ {data.price.toFixed(2)}</p>
                        <p className="text-blue-600">Demanda: {data.demand}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              {currentPrice && (
                <ReferenceLine 
                  x={currentPrice} 
                  stroke="#0066cc" 
                  strokeDasharray="3 3"
                  label={{ value: 'Atual', position: 'top', fill: '#0066cc', fontSize: 12 }}
                />
              )}
              {optimalPrice && (
                <ReferenceLine 
                  x={optimalPrice} 
                  stroke="#00cc66" 
                  strokeDasharray="3 3"
                  label={{ value: 'Ótimo', position: 'top', fill: '#00cc66', fontSize: 12 }}
                />
              )}
              <Line 
                type="monotone" 
                dataKey="demand" 
                stroke="#0066cc" 
                strokeWidth={2}
                dot={{ fill: '#0066cc', r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
