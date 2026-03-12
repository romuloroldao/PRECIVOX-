/**
 * PM2 Ecosystem — Produção PRECIVOX
 *
 * REGRAS:
 * - Sem npx: entrypoints estáveis (node + caminho direto).
 * - Sem tsx em produção: backend é backend/server.js (Node ESM).
 * - Frontend: Next.js via bin do next (node_modules/next/dist/bin/next).
 * - Variáveis de ambiente: exporte no shell antes de pm2 start
 *   ou use --env no deploy (ex: NEXTAUTH_SECRET, DATABASE_URL, INTERNAL_API_SECRET).
 *
 * cwd produção: /home/deploy/apps/precivox
 * Em local: altere cwd para o path absoluto do projeto.
 */

const CWD = process.env.PM2_CWD || '/home/deploy/apps/precivox';

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
        NEXTAUTH_URL: 'https://www.precivox.com.br',
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'REPLACE_WITH_STRONG_SECRET_IN_PROD',
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
