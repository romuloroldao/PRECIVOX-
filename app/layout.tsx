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
              // Recuperação de ChunkLoadError pós-deploy (HTML novo + chunks antigos em cache).
              // Contador só é limpo após hidratação React (Providers montam) — evita loop infinito.
              (function() {
                var REFRESH_KEY = 'precivox_chunk_reload_count';
                var MAX_RETRIES = 2;
                var recovering = false;

                function isNextStaticUrl(url) {
                  return typeof url === 'string' && url.indexOf('/_next/static/') !== -1;
                }

                function isChunkMessage(msg) {
                  if (!msg) return false;
                  return (
                    msg.indexOf('Loading chunk') !== -1 ||
                    msg.indexOf('ChunkLoadError') !== -1 ||
                    msg.indexOf('Failed to fetch dynamically imported module') !== -1 ||
                    msg.indexOf('Importing a module script failed') !== -1 ||
                    msg.indexOf('error loading dynamically imported module') !== -1
                  );
                }

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

                function reportTelemetry(event, extra) {
                  try {
                    var payload = JSON.stringify(Object.assign({
                      event: event,
                      route: location.pathname,
                      source: extra && extra.source ? extra.source : undefined,
                      retry: extra && extra.retry != null ? extra.retry : undefined,
                    }, extra || {}));
                    if (navigator.sendBeacon) {
                      navigator.sendBeacon('/api/telemetry/client', new Blob([payload], { type: 'application/json' }));
                    } else {
                      fetch('/api/telemetry/client', { method: 'POST', body: payload, keepalive: true });
                    }
                  } catch (e) { /* ignore */ }
                }

                function handleChunkError(source) {
                  if (recovering) return;
                  console.warn('[precivox] ChunkLoadError:', source || 'unknown');

                  try {
                    var currentRetries = parseInt(sessionStorage.getItem(REFRESH_KEY) || '0', 10);
                    reportTelemetry('chunk_load_error', { source: source, retry: currentRetries });
                    if (currentRetries < MAX_RETRIES) {
                      recovering = true;
                      reportTelemetry('chunk_recovery_attempt', { source: source, retry: currentRetries + 1 });
                      sessionStorage.setItem(REFRESH_KEY, String(currentRetries + 1));
                      clearClientCaches(hardReload);
                    } else {
                      reportTelemetry('chunk_recovery_exhausted', { source: source, retry: currentRetries });
                      console.error('[precivox] Limite de reload por chunk excedido. Use Ctrl+Shift+R.');
                    }
                  } catch (e) {
                    console.error('[precivox] Erro na recuperação de chunk:', e);
                  }
                }

                window.addEventListener('precivox:app-ready', function() {
                  try {
                    reportTelemetry('app_ready', {});
                    sessionStorage.removeItem(REFRESH_KEY);
                    var url = new URL(window.location.href);
                    if (url.searchParams.has('__chunk_reload')) {
                      url.searchParams.delete('__chunk_reload');
                      window.history.replaceState(null, '', url.pathname + url.search + url.hash);
                    }
                  } catch (e) { /* ignore */ }
                });

                window.addEventListener('error', function(e) {
                  var target = e.target;
                  if (target && (target.tagName === 'SCRIPT' || target.tagName === 'LINK')) {
                    var src = target.src || target.href || '';
                    if (isNextStaticUrl(src)) {
                      handleChunkError(src);
                      return;
                    }
                  }
                  if (isNextStaticUrl(e.filename) && isChunkMessage(e.message)) {
                    handleChunkError(e.filename);
                  }
                }, true);

                window.addEventListener('unhandledrejection', function(e) {
                  var reason = e && e.reason;
                  var msg = (reason && (reason.message || String(reason))) || '';
                  if (isChunkMessage(msg)) {
                    handleChunkError(msg);
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

