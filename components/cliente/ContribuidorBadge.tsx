'use client';

import { useEffect, useState } from 'react';
import { Award } from 'lucide-react';
import type { NivelContribuidor } from '@/lib/crowd-reputacao-labels';
import { LABEL_NIVEL } from '@/lib/crowd-reputacao-labels';

interface ContribuidorBadgeProps {
  className?: string;
}

export function ContribuidorBadge({ className = '' }: ContribuidorBadgeProps) {
  const [nivel, setNivel] = useState<NivelContribuidor | null>(null);
  const [confirmacoes, setConfirmacoes] = useState(0);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/cliente/perfil-preci', { cache: 'no-store', credentials: 'include' });
        const json = await res.json();
        if (json.success?.data?.reputacaoCrowd) {
          setNivel(json.data.reputacaoCrowd.nivel);
          setConfirmacoes(json.data.reputacaoCrowd.confirmacoes);
        }
      } catch {
        /* ignore */
      }
    })();
  }, []);

  if (!nivel || nivel === 'observador') return null;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-900 ${className}`}
      title={`${confirmacoes} preços confirmados`}
    >
      <Award className="h-3.5 w-3.5" />
      {LABEL_NIVEL[nivel]}
    </span>
  );
}
