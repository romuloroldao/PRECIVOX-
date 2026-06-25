'use client';

import { useMemo, useState } from 'react';
import { useCategories } from '@/app/hooks/useCategories';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import { Chip } from '@/components/ui';

interface CategoryFilterProps {
  categoriaSelecionada: string;
  onCategoriaChange: (categoria: string) => void;
}

/** Quantidade de categorias exibidas antes de "Ver mais". */
const VISIVEIS_PADRAO = 8;

export function CategoryFilter({ categoriaSelecionada, onCategoriaChange }: CategoryFilterProps) {
  const { categorias, loading } = useCategories();
  const [expandido, setExpandido] = useState(false);

  // Mantém a categoria selecionada sempre visível, mesmo fora do top inicial.
  const ordenadas = useMemo(() => {
    if (!categoriaSelecionada) return categorias;
    const idx = categorias.findIndex((c) => c.valor === categoriaSelecionada);
    if (idx < 0 || idx < VISIVEIS_PADRAO) return categorias;
    const copia = [...categorias];
    const [sel] = copia.splice(idx, 1);
    copia.unshift(sel);
    return copia;
  }, [categorias, categoriaSelecionada]);

  if (loading) {
    return (
      <div className="mb-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-10 w-28 flex-shrink-0 animate-pulse rounded-full bg-slate-200"
            />
          ))}
        </div>
      </div>
    );
  }

  if (categorias.length === 0) return null;

  const visiveis = expandido ? ordenadas : ordenadas.slice(0, VISIVEIS_PADRAO);
  const restantes = ordenadas.length - VISIVEIS_PADRAO;

  return (
    <div className="mb-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">Categorias</h2>
        {categoriaSelecionada && (
          <button
            onClick={() => onCategoriaChange('')}
            className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900"
          >
            <X className="h-4 w-4" />
            Limpar
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Chip selected={!categoriaSelecionada} onClick={() => onCategoriaChange('')}>
          Todas
        </Chip>

        {visiveis.map((categoria) => (
          <Chip
            key={categoria.valor}
            selected={categoriaSelecionada === categoria.valor}
            count={categoria.count}
            onClick={() => onCategoriaChange(categoria.valor)}
          >
            {categoria.nome}
          </Chip>
        ))}

        {restantes > 0 && (
          <button
            type="button"
            onClick={() => setExpandido((v) => !v)}
            className="inline-flex min-h-[44px] shrink-0 items-center gap-1 rounded-full border border-dashed border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 md:min-h-0"
            aria-expanded={expandido}
          >
            {expandido ? (
              <>
                Ver menos
                <ChevronUp className="h-4 w-4" />
              </>
            ) : (
              <>
                Ver mais ({restantes})
                <ChevronDown className="h-4 w-4" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
