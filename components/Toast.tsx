'use client';

import { useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X, ShoppingCart } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'lista';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastProps {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  action?: ToastAction;
  onClose: (id: string) => void;
}

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="w-5 h-5" />,
  error: <XCircle className="w-5 h-5" />,
  warning: <AlertTriangle className="w-5 h-5" />,
  info: <Info className="w-5 h-5" />,
  lista: <ShoppingCart className="w-4 h-4" />,
};

const styles: Record<ToastType, string> = {
  success: 'bg-white text-gray-900 border-l-4 border-emerald-500 shadow-lg',
  error: 'bg-white text-gray-900 border-l-4 border-red-500 shadow-lg',
  warning: 'bg-white text-gray-900 border-l-4 border-amber-500 shadow-lg',
  info: 'bg-white text-gray-900 border-l-4 border-blue-500 shadow-lg',
  lista: 'bg-gray-900 text-white shadow-xl',
};

const iconColors: Record<ToastType, string> = {
  success: 'text-emerald-500',
  error: 'text-red-500',
  warning: 'text-amber-500',
  info: 'text-blue-500',
  lista: 'text-emerald-400',
};

export default function Toast({ id, message, type, duration = 3000, action, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => onClose(id), duration);
    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  if (type === 'lista') {
    return (
      <div
        className="flex items-center gap-3 rounded-2xl bg-gray-900 px-4 py-3 shadow-xl animate-toast-up"
        role="status"
        aria-live="polite"
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
          <ShoppingCart className="h-4 w-4" />
        </span>
        <p className="flex-1 text-sm font-medium text-white leading-snug line-clamp-2">{message}</p>
        {action && (
          <button
            type="button"
            onClick={() => {
              action.onClick();
              onClose(id);
            }}
            className="shrink-0 rounded-xl bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-emerald-400 active:scale-95"
          >
            {action.label}
          </button>
        )}
        <button
          type="button"
          onClick={() => onClose(id)}
          className="shrink-0 rounded-lg p-1 text-gray-400 transition-colors hover:text-white"
          aria-label="Fechar notificação"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div
      className={`flex items-start gap-3 rounded-xl p-4 ${styles[type]} animate-toast-up`}
      role="alert"
      aria-live="assertive"
    >
      <span className={`mt-0.5 shrink-0 ${iconColors[type]}`}>{icons[type]}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-snug">{message}</p>
        {action && (
          <button
            type="button"
            onClick={() => {
              action.onClick();
              onClose(id);
            }}
            className="mt-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 underline-offset-2 hover:underline"
          >
            {action.label}
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={() => onClose(id)}
        className="shrink-0 rounded-md p-1 text-gray-400 transition-colors hover:text-gray-600"
        aria-label="Fechar notificação"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
