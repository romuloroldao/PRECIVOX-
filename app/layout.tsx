import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  metadataBase: new URL('https://precivox.com.br'),
  title: {
    default: 'PRECIVOX — Inteligência de consumo alimentar',
    template: '%s | PRECIVOX',
  },
  description:
    'Plataforma de inteligência de consumo alimentar para consumidores, mercados e indústria. Economia Líquida™, radar de demanda e IA explicável.',
  icons: {
    icon: '/logo-precivox.svg',
    apple: '/logo-precivox.svg',
  },
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
              // Handler ChunkLoadError — bypass de cache após deploy (evita HTML novo + chunks antigos)
              (function() {
                const REFRESH_KEY = 'precivox_chunk_reload_count';
                const MAX_RETRIES = 2;
                let recovering = false;

                function hardReload() {
                  try {
                    var url = new URL(window.location.href);
                    url.searchParams.set('__chunk_reload', String(Date.now()));
                    window.location.replace(url.toString());
                  } catch (e) {
                    window.location.reload();
                  }
                }

                function clearClientCaches(cb) {
                  var done = function() { if (cb) cb(); };
                  if (!('serviceWorker' in navigator) && !('caches' in window)) {
                    done();
                    return;
                  }
                  var p = Promise.resolve();
                  if ('serviceWorker' in navigator) {
                    p = p.then(function() {
                      return navigator.serviceWorker.getRegistrations().then(function(regs) {
                        return Promise.all(regs.map(function(r) { return r.unregister(); }));
                      });
                    });
                  }
                  if ('caches' in window) {
                    p = p.then(function() {
                      return caches.keys().then(function(keys) {
                        return Promise.all(keys.map(function(k) { return caches.delete(k); }));
                      });
                    });
                  }
                  p.then(done).catch(done);
                }

                function handleChunkError() {
                  if (recovering) return;
                  console.warn('ChunkLoadError detectado. Verificando possibilidade de reload...');

                  try {
                    var currentRetries = parseInt(sessionStorage.getItem(REFRESH_KEY) || '0', 10);

                    if (currentRetries < MAX_RETRIES) {
                      recovering = true;
                      console.log('Tentativa de recuperação ' + (currentRetries + 1) + '/' + MAX_RETRIES);
                      sessionStorage.setItem(REFRESH_KEY, String(currentRetries + 1));
                      clearClientCaches(hardReload);
                    } else {
                      console.error('Limite de tentativas de reload excedido. Limpe o cache do site (Ctrl+Shift+R).');
                    }
                  } catch (e) {
                    console.error('Erro ao recuperar chunk:', e);
                    hardReload();
                  }
                }
                
                // Limpar contador em navegação bem sucedida
                window.addEventListener('load', () => {
                  // Se carregou com sucesso, reseta o contador (mas com um pequeno delay para garantir que não é um falso positivo imediato)
                  setTimeout(() => {
                     sessionStorage.removeItem(REFRESH_KEY);
                  }, 1000);
                });

                // Capturar erros de chunk via error event
                window.addEventListener('error', (e) => {
                  // Verificar se é erro de chunk (ERR_ABORTED, 400, 404, etc) ou CSS
                  const isLinkError = e.target && (e.target.tagName === 'LINK' || e.target.tagName === 'SCRIPT');
                  
                  const isChunkError = 
                    isLinkError ||
                    (e.filename && (e.filename.includes('_next/static/chunks') || e.filename.includes('_next/static/css'))) ||
                    (e.message && (
                      e.message.includes('Loading chunk') ||
                      e.message.includes('ChunkLoadError') ||
                      e.message.includes('Failed to fetch dynamically imported module') ||
                      e.message.includes('ERR_ABORTED') ||
                      e.message.includes('400') ||
                      e.message.includes('404')
                    ));
                  
                  if (isChunkError) {
                    handleChunkError();
                  }
                }, true);
                
                // Capturar promises rejeitadas
                window.addEventListener('unhandledrejection', (e) => {
                  if (e?.reason) {
                    const reason = e.reason.message || e.reason.toString() || '';
                    const isChunkError =
                      reason.includes('Loading chunk') ||
                      reason.includes('ChunkLoadError') ||
                      reason.includes('Failed to fetch dynamically imported module');
                    
                    if (isChunkError) {
                      handleChunkError();
                    }
                  }
                });
              })();
            `,
          }}
        />
      </body>
    </html>
  );
}

