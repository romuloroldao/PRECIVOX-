import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'PRECIVOX - Buscar Produtos',
  description: 'Plataforma inteligente de comparação e gestão de preços',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <Providers>{children}</Providers>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // ✅ Handler para ChunkLoadError - força reload com bypass de cache
              (function() {
                let reloadAttempted = false;
                let errorCount = 0;
                const MAX_ERRORS = 3;
                
                function handleChunkError() {
                  errorCount++;
                  
                  if (reloadAttempted) {
                    if (errorCount >= MAX_ERRORS) {
                      console.error('ChunkLoadError: Múltiplos erros detectados. Limpe o cache manualmente (Ctrl+Shift+R)');
                      // Forçar reload mesmo após múltiplas tentativas
                      window.location.href = window.location.href.split('?')[0] + '?v=' + Date.now() + '&nocache=1';
                    }
                    return;
                  }
                  
                  console.warn('ChunkLoadError detectado. Forçando reload com bypass de cache...');
                  reloadAttempted = true;
                  
                  // Forçar reload com bypass de cache imediatamente
                  setTimeout(() => {
                    // Método 1: reload com bypass
                    if (window.location.reload) {
                      window.location.reload(true);
                    }
                    // Método 2: redirect com query string para forçar novo request
                    setTimeout(() => {
                      const url = window.location.href.split('?')[0] + '?v=' + Date.now() + '&nocache=1';
                      window.location.replace(url);
                    }, 500);
                  }, 500);
                }
                
                // Capturar erros de chunk via error event
                window.addEventListener('error', (e) => {
                  // Verificar se é erro de chunk (ERR_ABORTED, 400, 404, etc)
                  const isChunkError = 
                    (e.filename && e.filename.includes('_next/static/chunks')) ||
                    (e.message && (
                      e.message.includes('Loading chunk') ||
                      e.message.includes('ChunkLoadError') ||
                      e.message.includes('Failed to fetch dynamically imported module') ||
                      e.message.includes('Failed to load resource') ||
                      e.message.includes('ERR_ABORTED') ||
                      e.message.includes('400') ||
                      e.message.includes('404')
                    ));
                  
                  if (isChunkError) {
                    console.error('Erro de chunk detectado:', e.filename || e.message);
                    handleChunkError();
                  }
                }, true);
                
                // Capturar promises rejeitadas (chunks que falharam)
                window.addEventListener('unhandledrejection', (e) => {
                  if (e?.reason) {
                    const reason = e.reason.message || e.reason.toString() || '';
                    const isChunkError =
                      reason.includes('Loading chunk') ||
                      reason.includes('ChunkLoadError') ||
                      reason.includes('Failed to fetch dynamically imported module') ||
                      reason.includes('ERR_ABORTED') ||
                      reason.includes('400') ||
                      reason.includes('404');
                    
                    if (isChunkError) {
                      console.error('Promise rejeitada - ChunkLoadError:', reason);
                      handleChunkError();
                    }
                  }
                });
                
                // Interceptar fetch/XMLHttpRequest para chunks que retornam 400/404
                const originalFetch = window.fetch;
                window.fetch = function(...args) {
                  const url = args[0];
                  if (typeof url === 'string' && url.includes('_next/static/chunks')) {
                    return originalFetch.apply(this, args).catch((error) => {
                      console.error('Fetch error para chunk:', url, error);
                      if (error.message && (error.message.includes('400') || error.message.includes('404') || error.message.includes('ERR_ABORTED'))) {
                        handleChunkError();
                      }
                      throw error;
                    });
                  }
                  return originalFetch.apply(this, args);
                };
              })();
            `,
          }}
        />
      </body>
    </html>
  );
}

