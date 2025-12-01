import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';

interface ScoreGaugeProps {
  score: number;
  label?: string;
  size?: number;
  showValue?: boolean;
  className?: string;
}

export function ScoreGauge({
  score,
  label,
  size = 120,
  showValue = true,
  className,
}: ScoreGaugeProps) {
  // Garantir que o score esteja entre 0 e 100
  const normalizedScore = Math.min(Math.max(score, 0), 100);
  
  const data = [
    { name: 'Score', value: normalizedScore },
    { name: 'Remaining', value: 100 - normalizedScore },
  ];

  // Determinar cor baseada no score
  const getColor = (value: number) => {
    if (value >= 80) return '#22c55e'; // green-500
    if (value >= 50) return '#eab308'; // yellow-500
    return '#ef4444'; // red-500
  };

  const color = getColor(normalizedScore);

  return (
    <div className={cn('flex flex-col items-center justify-center', className)}>
      <div style={{ width: size, height: size / 2 + 20 }} className="relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="100%"
              startAngle={180}
              endAngle={0}
              innerRadius="60%"
              outerRadius="100%"
              paddingAngle={0}
              dataKey="value"
              stroke="none"
            >
              <Cell key="score" fill={color} />
              <Cell key="remaining" fill="#e5e7eb" /> {/* gray-200 */}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        
        {showValue && (
          <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center justify-center -mb-2">
            <span className="text-2xl font-bold text-gray-900">{normalizedScore}</span>
          </div>
        )}
      </div>
      
      {label && (
        <span className="text-sm font-medium text-gray-500 mt-1">{label}</span>
      )}
    </div>
  );
}
