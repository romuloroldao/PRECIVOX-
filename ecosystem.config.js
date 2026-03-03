module.exports = {
  // cwd em produção: /home/deploy/apps/precivox
  // Em ambiente local, altere para o path absoluto do projeto (ex: process.env.PWD ou /caminho/local)
  apps: [
    {
      name: 'precivox-backend',
      script: 'npx',
      args: 'tsx src/server.ts',
      cwd: '/home/deploy/apps/precivox',
      instances: 1,
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
      script: 'npx',
      args: 'next start',
      cwd: '/home/deploy/apps/precivox',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      restart_delay: 5000,
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        /**
         * NextAuth (getServerSession) exige NEXTAUTH_SECRET e NEXTAUTH_URL no runtime.
         *
         * NEXTAUTH_URL: domínio público da aplicação.
         * NEXTAUTH_SECRET: valor forte e SECRETO — NUNCA commitar o valor real.
         *
         * Fluxo seguro no servidor de produção:
         *   1. export NEXTAUTH_SECRET='um_secret_realmente_forte_e_longo'
         *   2. pm2 restart precivox-frontend --update-env
         *   3. pm2 env precivox-frontend | grep NEXTAUTH_SECRET  (deve aparecer)
         *
         * O fallback 'REPLACE_WITH_STRONG_SECRET_IN_PROD' evita secret aleatório
         * (que quebra getServerSession), mas é INSECURO em produção — defina sempre
         * NEXTAUTH_SECRET no ambiente do servidor.
         */
        NEXTAUTH_URL: 'https://precivox.com.br',
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'REPLACE_WITH_STRONG_SECRET_IN_PROD',
      },
      error_file: '/var/log/precivox-frontend-error.log',
      out_file: '/var/log/precivox-frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
    {
      name: 'precivox-ai-scheduler',
      script: 'npx',
      args: 'tsx core/ai/run-scheduler.ts',
      cwd: '/home/deploy/apps/precivox',
      instances: 1,
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
