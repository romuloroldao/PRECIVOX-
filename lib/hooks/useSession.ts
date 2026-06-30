'use client';

/**
 * Sessão via TokenManager (/api/auth/me). Substitui next-auth/react após PR-3.
 * Estado compartilhado entre hooks — evita múltiplos fetches e flashes de loading.
 */
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';

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

/** Chave para sincronizar logout entre abas. */
export const LOGOUT_BROADCAST_KEY = 'precivox_logout_at';

let clientSessionOverride: SessionState | null = null;
let cachedState: SessionState = { status: 'loading', user: null };
let inflight: Promise<SessionState> | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((fn) => fn());
}

function setSharedState(next: SessionState) {
  cachedState = next;
  emit();
}

/** Força estado deslogado no cliente antes do redirect (evita flash autenticado). */
export function invalidateClientSession(): void {
  clientSessionOverride = { status: 'unauthenticated', user: null };
  setSharedState(clientSessionOverride);
}

async function fetchSessionUser(): Promise<SessionState> {
  if (clientSessionOverride?.status === 'unauthenticated') {
    return clientSessionOverride;
  }

  if (typeof window !== 'undefined') {
    const logoutAt = localStorage.getItem(LOGOUT_BROADCAST_KEY);
    if (logoutAt && Date.now() - Number(logoutAt) < 10_000) {
      return { status: 'unauthenticated', user: null };
    }
  }

  try {
    const res = await fetch('/api/auth/me', {
      credentials: 'include',
      cache: 'no-store',
    });
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

function ensureSessionLoaded(): Promise<SessionState> {
  if (cachedState.status !== 'loading') {
    return Promise.resolve(cachedState);
  }
  if (!inflight) {
    inflight = fetchSessionUser()
      .then((next) => {
        setSharedState(next);
        inflight = null;
        return next;
      })
      .catch(() => {
        const fallback: SessionState = { status: 'unauthenticated', user: null };
        setSharedState(fallback);
        inflight = null;
        return fallback;
      });
  }
  return inflight;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): SessionState {
  return cachedState;
}

function getServerSnapshot(): SessionState {
  return { status: 'loading', user: null };
}

export function useSession() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const refresh = useCallback(async () => {
    clientSessionOverride = null;
    setSharedState({ status: 'loading', user: null });
    inflight = null;
    const next = await fetchSessionUser();
    setSharedState(next);
  }, []);

  useEffect(() => {
    void ensureSessionLoaded();

    const onStorage = (event: StorageEvent) => {
      if (event.key === LOGOUT_BROADCAST_KEY) {
        clientSessionOverride = { status: 'unauthenticated', user: null };
        setSharedState(clientSessionOverride);
      }
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return {
    data: state.user ? { user: state.user, expires: '' } : null,
    status: state.status,
    update: refresh,
  };
}

export default useSession;
