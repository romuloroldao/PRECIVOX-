/**
 * PM2 Ecosystem — Produção PRECIVOX
 *
 * REGRAS:
 * - Sem npx: entrypoints estáveis (node + caminho direto).
 * - Sem tsx em produção: backend é backend/server.js (Node ESM).
 * - Frontend: Next.js via bin do next (node_modules/next/dist/bin/next).
 * - Variáveis de ambiente: carregadas de .env.production (na pasta do ecosystem)
 *   para o frontend (JWT_SECRET, DATABASE_URL, NEXT_PUBLIC_URL). Backend usa seu próprio .env.
 *
 * cwd produção: DEPLOY_DEST (padrão /home/deploy/apps/precivox)
 * Build/fonte:   DEPLOY_SRC  (padrão /root) — ver deploy-prod.sh
 */

const path = require('path');
const fs = require('fs');

// Runtime PM2 sempre em DEPLOY_DEST (não usar __dirname — ecosystem pode estar em /root)
const DEPLOY_DEST = process.env.DEPLOY_DEST || '/home/deploy/apps/precivox';
const CWD = process.env.PM2_CWD || DEPLOY_DEST;

// Carregar .env.production da pasta onde está este arquivo (projeto root)
function loadEnvProduction() {
  const envPath = path.join(__dirname, '.env.production');
  try {
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split('\n').forEach((line) => {
        const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
        if (m && !m[1].startsWith('#')) {
          const value = m[2].replace(/^["']|["']$/g, '').trim();
          if (!process.env[m[1]]) process.env[m[1]] = value;
        }
      });
    }
  } catch (e) {
    console.warn('[ecosystem] .env.production não encontrado ou erro ao ler:', e.message);
  }
}
loadEnvProduction();

// Legado NextAuth removido (Fase 2) — não propagar para processos PM2
delete process.env.NEXTAUTH_URL;
delete process.env.NEXTAUTH_SECRET;
delete process.env.NEXT_PUBLIC_NEXTAUTH_URL;

module.exports = {
  apps: [
    {
      name: 'precivox-backend',
      script: 'server.js',
      cwd: `${CWD}/backend`,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      restart_delay: 5000,
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        // IA (Groq) — carregada de .env.production via loadEnvProduction()
        GROQ_API_KEY: process.env.GROQ_API_KEY,
        GROQ_MODEL_REASONING: process.env.GROQ_MODEL_REASONING,
        GROQ_MODEL_FAST: process.env.GROQ_MODEL_FAST,
      },
      error_file: '/var/log/precivox-backend-error.log',
      out_file: '/var/log/precivox-backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
    {
      name: 'precivox-frontend',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      cwd: CWD,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      restart_delay: 5000,
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        // Canônico: apex (igual .env.production). Cookies Precivox usam domain .precivox.com.br.
        JWT_SECRET: process.env.JWT_SECRET,
        DATABASE_URL: process.env.DATABASE_URL,
        NEXT_PUBLIC_URL: process.env.NEXT_PUBLIC_URL || 'https://precivox.com.br',
      },
      error_file: '/var/log/precivox-frontend-error.log',
      out_file: '/var/log/precivox-frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
    {
      name: 'precivox-ai-scheduler',
      script: 'node_modules/tsx/dist/cli.mjs',
      args: 'core/ai/run-scheduler.ts',
      cwd: CWD,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      restart_delay: 5000,
      env: {
        NODE_ENV: 'production',
      },
      error_file: '/var/log/precivox-scheduler-error.log',
      out_file: '/var/log/precivox-scheduler-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      cron_restart: '0 0 * * *',
    },
  ],
};
