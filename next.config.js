/** @type {import('next').NextConfig} */
const nextConfig = {
  // Otimização para deploy (Docker/Self-hosted)
  output: 'standalone',

  reactStrictMode: true,
  swcMinify: true,

  // Headers para assets estáticos e PWA
  async headers() {
    return [
      // Assets estáticos - garantir Content-Type correto
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
      {
        source: '/_next/static/css/:path*.css',
        headers: [
          {
            key: 'Content-Type',
            value: 'text/css; charset=utf-8',
          },
        ],
      },
      {
        source: '/_next/static/chunks/:path*.js',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8',
          },
        ],
      },
      // PWA
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // Rotas antigas / atalhos → evita 404 quando o usuário acessa /busca em vez de /cliente/busca
  async redirects() {
    return [
      {
        source: '/busca',
        destination: '/cliente/busca',
        permanent: true,
      },
      {
        source: '/registrar',
        destination: '/signup',
        permanent: true,
      },
    ];
  },

  // Otimizações
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Imagens (URLs absolutas do próprio site em produção)
  images: {
    domains: ['localhost', 'precivox.com.br', 'www.precivox.com.br'],
    formats: ['image/avif', 'image/webp'],
  },

  // Experimental
  experimental: {
    optimizeCss: true,
  },

  eslint: {
    // Desabilita falha de build por erros de lint em produção.
    // Lint continua disponível via `next lint` em pipelines dedicados.
    ignoreDuringBuilds: true,
  },

  // Webpack Safe-Guards
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Bloquear Prisma no client-side
      config.resolve.fallback = {
        ...config.resolve.fallback,
        '@prisma/client': false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
