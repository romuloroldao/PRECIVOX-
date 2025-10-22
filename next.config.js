/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['localhost'],
  },
  // Removido rewrites - Nginx agora gerencia roteamento de APIs
  
  // Configurações de performance para evitar erro 502
  experimental: {
    // Aumentar timeout para builds grandes
    workerThreads: true,
  },
  
  // Configurações de servidor
  serverRuntimeConfig: {
    // Timeout de 30 segundos para APIs
    apiTimeout: 30000,
  },
  
  // Otimização de build
  onDemandEntries: {
    // Período que uma página fica no cache (em ms)
    maxInactiveAge: 60 * 1000,
    // Número de páginas a manter simultaneamente
    pagesBufferLength: 5,
  },
  
  // Headers de segurança e cache
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig
