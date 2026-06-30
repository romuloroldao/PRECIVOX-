'use client';

import { useEffect } from 'react';

/**
 * global-error.tsx captura erros lançados no próprio root layout.
 * Deve renderizar <html>/<body> pois substitui o layout raiz.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[GlobalError]', { message: error?.message, digest: error?.digest });
  }, [error]);

  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div
          role="alert"
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            padding: '2rem',
            textAlign: 'center',
            color: '#111827',
          }}
        >
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>
            Não foi possível carregar a aplicação
          </h2>
          <p style={{ color: '#6b7280', maxWidth: 420, margin: 0, fontSize: '0.875rem' }}>
            Ocorreu um erro inesperado. Tente recarregar — se persistir, atualize a página.
          </p>
          <button
            onClick={() => reset()}
            style={{
              background: '#059669',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '0.625rem 1.25rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Tentar novamente
          </button>
          {error?.digest && (
            <p style={{ color: '#9ca3af', fontSize: '0.75rem' }}>
              Código de referência: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
