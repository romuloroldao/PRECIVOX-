/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['localhost'],
  },
  // Removido rewrites - Nginx agora gerencia roteamento de APIs
}

module.exports = nextConfig
