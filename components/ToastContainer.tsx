'use client';

import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import Toast, { type ToastType, type ToastAction } from './Toast';

interface ToastData {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  action?: ToastAction;
}

interface ToastContextType {
  showToast: (message: string, type: ToastType, duration?: number, action?: ToastAction) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
  /** Toast especial para confirmar que item foi adicionado à lista — aparece na base. */
  listaAdicionado: (message: string, action?: ToastAction, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType, duration = 3000, action?: ToastAction) => {
      const id = Math.random().toString(36).substring(7);
      setToasts((prev) => {
        // Limita a 3 toasts simultâneos para não poluir a tela
        const next = prev.length >= 3 ? prev.slice(1) : prev;
        return [...next, { id, message, type, duration, action }];
      });
    },
    []
  );

  const success = useCallback(
    (message: string, duration?: number) => showToast(message, 'success', duration),
    [showToast]
  );
  const error = useCallback(
    (message: string, duration?: number) => showToast(message, 'error', duration),
    [showToast]
  );
  const warning = useCallback(
    (message: string, duration?: number) => showToast(message, 'warning', duration),
    [showToast]
  );
  const info = useCallback(
    (message: string, duration?: number) => showToast(message, 'info', duration),
    [showToast]
  );
  const listaAdicionado = useCallback(
    (message: string, action?: ToastAction, duration = 3500) => {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('precivox-lista-toast-show', { detail: { durationMs: duration + 300 } })
        );
      }
      showToast(message, 'lista', duration, action);
    },
    [showToast]
  );

  const listaToasts = toasts.filter((t) => t.type === 'lista');
  const regularToasts = toasts.filter((t) => t.type !== 'lista');

  // Memoizar o value evita recriar o objeto a cada render (que dispararia
  // re-execução de useEffect/useCallback dos consumidores que dependem de `toast`).
  const contextValue = useMemo(
    () => ({ showToast, success, error, warning, info, listaAdicionado }),
    [showToast, success, error, warning, info, listaAdicionado]
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}

      {/* Toasts regulares — topo direito no desktop, topo no mobile */}
      {regularToasts.length > 0 && (
        <div
          aria-live="polite"
          className="fixed right-4 top-4 z-50 flex w-full max-w-sm flex-col gap-2 sm:max-w-xs"
        >
          {regularToasts.map((t) => (
            <Toast
              key={t.id}
              id={t.id}
              message={t.message}
              type={t.type}
              duration={t.duration}
              action={t.action}
              onClose={removeToast}
            />
          ))}
        </div>
      )}

      {/* Toast de lista — sempre centralizado na base (evita conflito com FAB/NPS à direita) */}
      {listaToasts.length > 0 && (
        <div
          aria-live="polite"
          className="fixed bottom-[var(--cliente-toast-lista-bottom)] left-1/2 z-[55] flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 flex-col gap-2 md:bottom-6 lg:bottom-8"
        >
          {listaToasts.map((t) => (
            <Toast
              key={t.id}
              id={t.id}
              message={t.message}
              type={t.type}
              duration={t.duration}
              action={t.action}
              onClose={removeToast}
            />
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast deve ser usado dentro de um ToastProvider');
  }
  return context;
}
