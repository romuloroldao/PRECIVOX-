'use client';

/**
 * Sessão via TokenManager (/api/auth/me). Substitui next-auth/react após PR-3.
 */
import { useCallback, useEffect, useState } from 'react';

type Status = 'loading' | 'authenticated' | 'unauthenticated';

export interface UnifiedUser {
  id?: string;
  email?: string;
  nome?: string | null;
  name?: string | null;
  role?: string;
  image?: string | null;
}

interface SessionState {
  status: Status;
  user: UnifiedUser | null;
}

async function fetchSessionUser(): Promise<SessionState> {
  try {
    const res = await fetch('/api/auth/me', { credentials: 'include' });
    if (!res.ok) return { status: 'unauthenticated', user: null };
    const data = await res.json();
    if (data?.success && data.user) {
      return {
        status: 'authenticated',
        user: { ...data.user, name: data.user.nome ?? data.user.name ?? null },
      };
    }
    return { status: 'unauthenticated', user: null };
  } catch {
    return { status: 'unauthenticated', user: null };
  }
}

export function useSession() {
  const [state, setState] = useState<SessionState>({ status: 'loading', user: null });

  const refresh = useCallback(async () => {
    setState((prev) => (prev.status === 'authenticated' ? prev : { status: 'loading', user: null }));
    setState(await fetchSessionUser());
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchSessionUser().then((next) => {
      if (!cancelled) setState(next);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    data: state.user ? { user: state.user, expires: '' } : null,
    status: state.status,
    update: refresh,
  };
}

export default useSession;
