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
              // Captura de ChunkLoadError apenas para logging (sem reload automático)
              window.addEventListener('error', (e) => {
                if (!e?.message) return;
                const isChunkError =
                  e.message.includes('Loading chunk') ||
                  e.message.includes('ChunkLoadError') ||
                  e.message.includes('Failed to fetch dynamically imported module');
                if (isChunkError) {
                  console.error('ChunkLoadError detectado. Nenhum reload automático será disparado:', e);
                }
              });
            `,
          }}
        />
      </body>
    </html>
  );
}

