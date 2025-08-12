// src/components/list/ListInsights.tsx
// Componente simples para insights da lista

import React from 'react';
import { Brain } from 'lucide-react';

interface ListInsightsProps {
  insights: any;
  appliedSuggestions: any[];
}

const ListInsights: React.FC<ListInsightsProps> = ({ insights, appliedSuggestions }) => {
  if (!insights) return null;

  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 border-b border-gray-200">
      <div className="flex items-center space-x-2 mb-3">
        <Brain className="w-4 h-4 text-purple-600" />
        <span className="text-sm font-medium text-purple-800">
          Insights da sua lista:
          {appliedSuggestions.length > 0 && (
            <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
              {appliedSuggestions.length} IA aplicadas
            </span>
          )}
        </span>
      </div>
      
      {/* Status simples */}
      <div className="text-sm text-gray-600">
        {insights.totalLojas} {insights.totalLojas === 1 ? 'mercado' : 'mercados'} • Franco da Rocha, SP
      </div>
    </div>
  );
};

export default ListInsights;