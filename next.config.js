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
      {
        source: '/uploads/produtos/:path*',
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
  // Obs.: as imagens de produto (public/uploads/produtos) já são webp
  // pré-dimensionadas e content-addressed, então <ProductImage/> usa
  // `unoptimized` e não passa pelo /_next/image. Os patterns abaixo cobrem
  // usos otimizados (logo, fontes externas como Open Food Facts).
  images: {
    domains: ['localhost', 'precivox.com.br', 'www.precivox.com.br'],
    remotePatterns: [
      { protocol: 'https', hostname: 'images.openfoodfacts.org' },
      { protocol: 'https', hostname: 'world.openfoodfacts.org' },
      { protocol: 'https', hostname: 'static.openfoodfacts.org' },
    ],
    formats: ['image/avif', 'image/webp'],
  },

  eslint: {
    // Desabilita falha de build por erros de lint em produção.
    // Lint continua disponível via `next lint` em pipelines dedicados.
    ignoreDuringBuilds: true,
  },

  // ssh2 usa binário nativo (.node) — não pode entrar no bundle webpack
  experimental: {
    serverComponentsExternalPackages: ['ssh2', 'ssh2-sftp-client'],
  },

  // Webpack Safe-Guards
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals ?? []), 'ssh2', 'ssh2-sftp-client'];
    } else {
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
