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
              // Captura de ChunkLoadError para recarregar página automaticamente
              // Melhorado: verifica se é realmente um erro de chunk e adiciona debounce
              let chunkErrorCount = 0;
              let lastChunkError = 0;
              
              window.addEventListener('error', (e) => {
                const now = Date.now();
                // Debounce: máximo 1 reload por 5 segundos
                if (now - lastChunkError < 5000) return;
                
                if (e.message && (
                  e.message.includes('Loading chunk') ||
                  e.message.includes('ChunkLoadError') ||
                  e.message.includes('Failed to fetch dynamically imported module')
                )) {
                  chunkErrorCount++;
                  lastChunkError = now;
                  
                  // Limitar a 3 tentativas para evitar loop infinito
                  if (chunkErrorCount <= 3) {
                    console.warn('ChunkLoadError detectado, recarregando página... (tentativa ' + chunkErrorCount + ')');
                    setTimeout(() => {
                      window.location.reload(true);
                    }, 1000);
                  } else {
                    console.error('Muitos erros de chunk. Limpando cache e recarregando...');
                    // Limpar cache do navegador
                    if ('caches' in window) {
                      caches.keys().then(names => {
                        names.forEach(name => caches.delete(name));
                      });
                    }
                    chunkErrorCount = 0;
                    setTimeout(() => {
                      window.location.reload(true);
                    }, 2000);
                  }
                }
              });
              
              // Reset contador após 30 segundos sem erros
              setInterval(() => {
                if (Date.now() - lastChunkError > 30000) {
                  chunkErrorCount = 0;
                }
              }, 30000);
            `,
          }}
        />
      </body>
    </html>
  );
}

