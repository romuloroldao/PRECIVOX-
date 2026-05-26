'use client';

import { useEffect, useState } from 'react';
import { Flame } from 'lucide-react';

export function EconomiaStreakCard() {
  const [data, setData] = useState<{
    semanasConsecutivas: number;
    totalEconomiaEstimada: number;
    recorde: number;
  } | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch('/api/cliente/economia-streak', { credentials: 'include' });
      const json = await res.json();
      if (json.success) setData(json.data);
    })();
  }, []);

  if (!data) return null;

  return (
    <div className="rounded-xl border border-orange-200 bg-orange-50/60 p-4">
      <div className="flex items-center gap-2">
        <Flame className="h-5 w-5 text-orange-600" />
        <h3 className="font-semibold text-orange-950">Streak de economia</h3>
      </div>
      <p className="mt-2 text-2xl font-bold tabular-nums text-orange-900">
        {data.semanasConsecutivas}{' '}
        <span className="text-sm font-medium">semana(s) confirmando compra</span>
      </p>
      {data.totalEconomiaEstimada > 0 && (
        <p className="text-xs text-orange-800/90">
          Economia estimada acumulada: R$ {data.totalEconomiaEstimada.toFixed(2).replace('.', ',')}
        </p>
      )}
      <p className="mt-1 text-[11px] text-orange-700/80">
        Confirme suas compras no app para manter o streak (recorde: {data.recorde}).
      </p>
    </div>
  );
}
