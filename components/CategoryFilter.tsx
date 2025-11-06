'use client';

import { useCategories } from '@/app/hooks/useCategories';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CategoryFilterProps {
  categoriaSelecionada: string;
  onCategoriaChange: (categoria: string) => void;
}

export function CategoryFilter({ categoriaSelecionada, onCategoriaChange }: CategoryFilterProps) {
  const { categorias, loading } = useCategories();

  if (loading) {
    return (
      <div className="mb-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse flex-shrink-0"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-900">Categorias</h2>
        {categoriaSelecionada && (
          <button
            onClick={() => onCategoriaChange('')}
            className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
          >
            <X className="w-4 h-4" />
            Limpar
          </button>
        )}
      </div>

      {/* Desktop: Grid horizontal fixo */}
      <div className="hidden md:flex flex-wrap gap-2">
        <button
          onClick={() => onCategoriaChange('')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            !categoriaSelecionada
              ? 'bg-precivox-blue text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          )}
        >
          Todas
        </button>
        {categorias.map((categoria) => (
          <button
            key={categoria.nome}
            onClick={() => onCategoriaChange(categoria.nome)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              categoriaSelecionada === categoria.nome
                ? 'bg-precivox-blue text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            {categoria.nome}
            <span className="ml-2 text-xs opacity-75">({categoria.count})</span>
          </button>
        ))}
      </div>

      {/* Mobile: Scroll horizontal */}
      <div className="md:hidden">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => onCategoriaChange('')}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-shrink-0 whitespace-nowrap',
              !categoriaSelecionada
                ? 'bg-precivox-blue text-white'
                : 'bg-gray-100 text-gray-700'
            )}
          >
            Todas
          </button>
          {categorias.map((categoria) => (
            <button
              key={categoria.nome}
              onClick={() => onCategoriaChange(categoria.nome)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-shrink-0 whitespace-nowrap',
                categoriaSelecionada === categoria.nome
                  ? 'bg-precivox-blue text-white'
                  : 'bg-gray-100 text-gray-700'
              )}
            >
              {categoria.nome}
              <span className="ml-2 text-xs opacity-75">({categoria.count})</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
