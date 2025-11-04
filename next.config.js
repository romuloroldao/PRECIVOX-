/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // ✅ Configuração de output standalone para produção
  output: 'standalone',
  
  // ✅ Configuração de imagens com domínio de produção
  images: {
    domains: ['precivox.com.br', 'localhost'],
    unoptimized: false,
  },
  
  // ✅ Configurações experimentais otimizadas
  experimental: {
    workerThreads: true,
  },
  
  // ✅ Headers de segurança e cache
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
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  
  // ✅ Remover rewrites desnecessários - Next.js gerencia automaticamente
  // Nginx fará o proxy correto para /_next/static
}

module.exports = nextConfig
