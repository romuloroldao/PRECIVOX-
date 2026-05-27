'use client';

import { useGeofenceRaio } from '@/app/hooks/useGeofenceRaio';
import { Radio } from 'lucide-react';

interface Props {
  compact?: boolean;
  dark?: boolean;
  onChange?: (metros: number) => void;
  className?: string;
}

export function GeofenceRaioSelector({ compact, dark, onChange, className = '' }: Props) {
  const { raioMetros, opcoes, carregando, setRaioMetros } = useGeofenceRaio();

  const escolher = (m: number) => {
    void setRaioMetros(m);
    onChange?.(m);
  };

  return (
    <div className={className}>
      <p
        className={`flex items-center gap-1 font-medium ${dark ? 'text-emerald-100' : 'text-gray-700'} ${compact ? 'text-[10px]' : 'text-xs'}`}
      >
        <Radio className="h-3.5 w-3.5 shrink-0" />
        Abrangência da detecção
      </p>
      <div className={`mt-1.5 flex flex-wrap gap-1.5 ${carregando ? 'opacity-60' : ''}`}>
        {opcoes.map((m) => (
          <button
            key={m}
            type="button"
            disabled={carregando}
            onClick={() => escolher(m)}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
              raioMetros === m
                ? 'bg-emerald-400 text-gray-950 shadow-sm'
                : dark
                  ? 'bg-emerald-950/80 text-emerald-100 ring-1 ring-emerald-700 hover:bg-emerald-900'
                  : 'bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50'
            }`}
          >
            {m} m
          </button>
        ))}
      </div>
      {!compact && (
        <p className={`mt-1 text-[10px] ${dark ? 'text-emerald-200/80' : 'text-gray-500'}`}>
          Quanto maior o raio, mais cedo o PRECIVOX detecta que você chegou ao mercado (útil em
          estacionamentos amplos).
        </p>
      )}
    </div>
  );
}
