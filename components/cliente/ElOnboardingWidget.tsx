'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSession } from '@/lib/hooks/useUnifiedSession';
import { ElOnboardingModal } from '@/components/cliente/ElOnboardingModal';
import {
  EL_PREFERENCIAS_PADRAO,
  preferenciasParaElConfig,
} from '@/lib/el-config-preferencias';
import { elConfigEfetivo } from '@/lib/el-config-usuario';
import { elOnboardingSnoozed, snoozeElOnboarding } from '@/lib/el-onboarding';

export function ElOnboardingWidget() {
  const { data: session, status } = useSession();
  const role = (session?.user as { role?: string })?.role;

  const [open, setOpen] = useState(false);
  const [elegivel, setElegivel] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const checandoRef = useRef(false);

  const verificarElegibilidade = useCallback(async (): Promise<boolean> => {
    if (checandoRef.current) return false;
    checandoRef.current = true;
    try {
      if (elOnboardingSnoozed()) return false;
      const res = await fetch('/api/cliente/perfil-preci', {
        credentials: 'include',
        cache: 'no-store',
      });
      if (!res.ok) return false;
      const json = await res.json();
      if (!json.success) return false;
      return json.data?.elOnboardingCompleto !== true;
    } finally {
      checandoRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (status !== 'authenticated' || role !== 'CLIENTE') return;

    const handler = (ev: Event) => {
      const ce = ev as CustomEvent<{ gatilho?: string; delayMs?: number }>;
      const delay = typeof ce.detail?.delayMs === 'number' ? ce.detail.delayMs : 600;

      void (async () => {
        const ok = await verificarElegibilidade();
        if (!ok) return;
        setElegivel(true);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setOpen(true), Math.max(0, delay));
      })();
    };

    window.addEventListener('precivox-el-onboarding-prompt', handler as EventListener);
    return () => {
      window.removeEventListener('precivox-el-onboarding-prompt', handler as EventListener);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [status, role, verificarElegibilidade]);

  const handleClose = () => {
    snoozeElOnboarding();
    setOpen(false);
  };

  const handleConcluir = async ({
    preferencias,
    usarPadrao,
  }: {
    preferencias: typeof EL_PREFERENCIAS_PADRAO;
    usarPadrao: boolean;
  }) => {
    const prefs = usarPadrao ? EL_PREFERENCIAS_PADRAO : preferencias;
    const elConfig = elConfigEfetivo(preferenciasParaElConfig(prefs));
    const res = await fetch('/api/cliente/perfil-preci', {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        preferencias: prefs,
        elConfig,
        onboardingCompleto: true,
      }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Não foi possível salvar');
    }
    setElegivel(false);
    setOpen(false);
  };

  if (status !== 'authenticated' || role !== 'CLIENTE') return null;
  if (!elegivel && !open) return null;

  return (
    <ElOnboardingModal
      isOpen={open}
      onClose={handleClose}
      onConcluir={handleConcluir}
    />
  );
}
