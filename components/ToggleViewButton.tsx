'use client';

import { LayoutGrid, List } from 'lucide-react';

interface ToggleViewButtonProps {
  modo: 'cards' | 'lista';
  setModo: (modo: 'cards' | 'lista') => void;
}

export function ToggleViewButton({ modo, setModo }: ToggleViewButtonProps) {
  return (
    <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
      <button
        onClick={() => setModo('cards')}
        className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
          modo === 'cards'
            ? 'bg-white text-precivox-blue shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
        title="Visualização em cards"
      >
        <LayoutGrid className="w-5 h-5" />
        <span className="hidden sm:inline">Cards</span>
      </button>
      <button
        onClick={() => setModo('lista')}
        className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
          modo === 'lista'
            ? 'bg-white text-precivox-blue shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
        title="Visualização em lista"
      >
        <List className="w-5 h-5" />
        <span className="hidden sm:inline">Lista</span>
      </button>
    </div>
  );
}

