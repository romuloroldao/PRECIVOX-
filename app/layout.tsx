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
              // ✅ Handler para ChunkLoadError - força reload com bypass de cache (Protegido contra loop infinito)
              (function() {
                const REFRESH_KEY = 'precivox_chunk_reload_count';
                const MAX_RETRIES = 1;

                function handleChunkError() {
                  console.warn('ChunkLoadError detectado. Verificando possibilidade de reload...');
                  
                  try {
                    const currentRetries = parseInt(sessionStorage.getItem(REFRESH_KEY) || '0', 10);
                    
                    if (currentRetries < MAX_RETRIES) {
                      console.log('Tentativa de recuperação ' + (currentRetries + 1) + '/' + MAX_RETRIES);
                      sessionStorage.setItem(REFRESH_KEY, (currentRetries + 1).toString());
                      
                      // Forçar reload com bypass de cache
                      window.location.reload(true);
                    } else {
                      console.error('Limite de tentativas de reload excedido. Exibindo UI de erro.');
                      // Opcional: Disparar evento customizado para o React ErrorBoundary pegar, se necessário
                      // Mas, geralmente, se o chunk não carrega, o React já vai jogar o erro para o Boundary.
                      // Aqui apenas EVITAMOS o reload infinito.
                    }
                  } catch (e) {
                    console.error('Erro ao acessar sessionStorage:', e);
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

