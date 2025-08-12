// components/dashboard/DashboardNavigation.tsx
import React from 'react';
import { BarChart3, Brain, Activity, Target } from 'lucide-react';

type ViewType = 'overview' | 'analytics' | 'realtime' | 'insights';

interface DashboardNavigationProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
  aiInsightsCount: number;
  realtimeEnabled: boolean;
}

export const DashboardNavigation: React.FC<DashboardNavigationProps> = ({
  activeView,
  onViewChange,
  aiInsightsCount,
  realtimeEnabled
}) => {
  const views = [
    { id: 'overview', label: 'Visão Geral', icon: BarChart3 },
    { id: 'analytics', label: 'Analytics IA', icon: Brain },
    { id: 'realtime', label: 'Tempo Real', icon: Activity },
    { id: 'insights', label: 'Insights', icon: Target, badge: aiInsightsCount }
  ] as const;

  return (
    <div className="flex items-center gap-2">
      {views.map((view) => (
        <button
          key={view.id}
          onClick={() => onViewChange(view.id as ViewType)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeView === view.id 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <view.icon className="w-4 h-4" />
          {view.label}
          {view.id === 'realtime' && realtimeEnabled && (
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          )}
          {view.badge && view.badge > 0 && (
            <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {view.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};