'use client';

import { useState } from 'react';
import { Bell } from 'lucide-react';

export function NotificacaoPermissaoBanner() {
  const [hidden, setHidden] = useState(false);

  if (hidden || typeof window === 'undefined') return null;
  if (!('Notification' in window)) return null;
  if (Notification.permission === 'granted' || Notification.permission === 'denied') {
    return null;
  }

  const ativar = async () => {
    const p = await Notification.requestPermission();
    if (p === 'granted') setHidden(true);
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
      <div className="flex items-center gap-2 text-sm text-blue-900">
        <Bell className="h-4 w-4 shrink-0" />
        <span>Ative avisos da cesta provável e do seu dia de mercado.</span>
      </div>
      <button
        type="button"
        onClick={() => void ativar()}
        className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
      >
        Ativar
      </button>
    </div>
  );
}
