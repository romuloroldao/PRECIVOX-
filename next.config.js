/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // ⚠️ DESABILITADO TEMPORARIAMENTE - Bug do Next.js 14.2.33 em modo standalone
  // gera HTML com referências incorretas aos chunks
  // output: 'standalone',
  
  // ✅ Configuração de imagens com domínio de produção
  images: {
    domains: ['precivox.com.br', 'localhost'],
    unoptimized: false,
  },
  
  // ✅ Configurações experimentais otimizadas
  experimental: {
    workerThreads: true,
  },
  
  // ✅ Forçar regeneração de chunks e evitar cache de manifests
  generateBuildId: async () => {
    // Gerar BUILD_ID único baseado em timestamp para evitar cache
    return `build-${Date.now()}-${Math.random().toString(36).substring(7)}`;
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
      {
        // ✅ Forçar no-cache para HTML de rotas dinâmicas
        source: '/admin/mercados/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
    ];
  },
  
  // ✅ Remover rewrites desnecessários - Next.js gerencia automaticamente
  // Nginx fará o proxy correto para /_next/static
}

module.exports = nextConfig
