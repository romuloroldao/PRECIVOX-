'use client';

import { useEffect, useState } from 'react';
import { Share2 } from 'lucide-react';

export function ShareEconomiaCard() {
  const [total, setTotal] = useState(0);

  useEffect(() => {
    void (async () => {
      const res = await fetch('/api/cliente/economia-streak', { credentials: 'include' });
      const json = await res.json();
      if (json.success) setTotal(json.data.totalEconomiaEstimada ?? 0);
    })();
  }, []);

  const compartilhar = async () => {
    const texto = `Economizei R$ ${total.toFixed(2).replace('.', ',')} com inteligência de consumo no PRECIVOX 🛒`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'PRECIVOX', text: texto, url: window.location.origin });
        return;
      } catch {
        /* fallback */
      }
    }
    await navigator.clipboard.writeText(texto);
    alert('Texto copiado! Cole nas suas redes.');
  };

  if (total <= 0) return null;

  return (
    <button
      type="button"
      onClick={() => void compartilhar()}
      className="flex w-full items-center justify-center gap-2 rounded-xl border border-violet-200 bg-violet-50 py-3 text-sm font-semibold text-violet-900 hover:bg-violet-100"
    >
      <Share2 className="h-4 w-4" />
      Compartilhar: economizei R$ {total.toFixed(2).replace('.', ',')}
    </button>
  );
}
