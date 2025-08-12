import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  define: {
    'process.env': JSON.stringify(process.env),
    global: 'globalThis',
  },

  // ✅ OTIMIZAÇÕES DE PERFORMANCE - SPRINT 3
  build: {
    target: 'es2015',
    minify: 'esbuild',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          // Separar vendor libraries para melhor cache
          vendor: ['react', 'react-dom'],
          ui: ['lucide-react'],
          router: ['react-router-dom'],
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    // Pre-carregamento de assets críticos
    assetsInlineLimit: 4096
  },

  // Cache otimizado para desenvolvimento
  optimizeDeps: {
    include: ['react', 'react-dom', 'lucide-react'],
    exclude: []
  },

  server: {
    port: 5176,
    host: true,
    cors: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path
      }
    }
  },

  preview: {
    port: 8080,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path
      }
    },
    allowedHosts: [
      'www.precivox.com.br',
      'precivox.com.br',
      '189.126.111.149',
      'localhost'
    ]
  }
})
