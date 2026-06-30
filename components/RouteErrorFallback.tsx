'use client';

import { useEffect } from 'react';

interface RouteErrorFallbackProps {
  error: Error & { digest?: string };
  reset: () => void;
  area?: string;
}

/**
 * Fallback visual compartilhado pelos error.tsx do App Router.
 * Mantém o usuário dentro de uma demo sem expor stack traces técnicas,
 * oferecendo recuperação (reset) e navegação segura.
 */
export default function RouteErrorFallback({ error, reset, area }: RouteErrorFallbackProps) {
  useEffect(() => {
    // Observabilidade: log com contexto de área + digest (Next associa ao server log).
    console.error(`[RouteError${area ? `:${area}` : ''}]`, {
      message: error?.message,
      digest: error?.digest,
    });
  }, [error, area]);

  return (
    <div
      role="alert"
      className="flex min-h-[60vh] w-full flex-col items-center justify-center gap-4 px-6 py-12 text-center"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
        <svg className="h-7 w-7 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
        </svg>
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-gray-900">Algo não carregou como esperado</h2>
        <p className="max-w-md text-sm text-gray-500">
          Tivemos um problema temporário ao exibir esta página. Você pode tentar novamente — seus dados estão seguros.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => reset()}
          className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700"
        >
          Tentar novamente
        </button>
        <a
          href="/"
          className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          Voltar ao início
        </a>
      </div>
      {error?.digest && (
        <p className="text-xs text-gray-400">Código de referência: {error.digest}</p>
      )}
    </div>
  );
}
