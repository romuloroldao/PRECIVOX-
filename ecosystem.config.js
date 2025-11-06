module.exports = {
  apps: [
    {
      name: 'precivox-nextjs',
      script: 'npm',
      args: 'start',
      cwd: '/root',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env_file: '/root/.env',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/root/logs/precivox-nextjs-error.log',
      out_file: '/root/logs/precivox-nextjs-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    },
    {
      name: 'precivox-backend',
      script: 'npx',
      args: 'tsx src/server.ts',
      cwd: '/root',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env_file: '/root/.env',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: '/root/logs/precivox-backend-error.log',
      out_file: '/root/logs/precivox-backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    },
    // 🆕 Job de Processamento de IA (roda diariamente às 2h AM)
    {
      name: 'precivox-ia-processor',
      script: '/root/backend/jobs/ia-processor.cjs',
      cwd: '/root',
      instances: 1,
      exec_mode: 'fork',
      autorestart: false,
      cron_restart: '0 2 * * *', // Todos os dias às 2h AM
      env: {
        NODE_ENV: 'production'
      },
      error_file: '/root/logs/ia-processor-error.log',
      out_file: '/root/logs/ia-processor-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    },
    // 🆕 Job de Monitoramento de Alertas (roda a cada 30 minutos)
    {
      name: 'precivox-alertas',
      script: '/root/backend/jobs/alertas.cjs',
      cwd: '/root',
      instances: 1,
      exec_mode: 'fork',
      autorestart: false,
      cron_restart: '*/30 * * * *', // A cada 30 minutos
      env: {
        NODE_ENV: 'production'
      },
      error_file: '/root/logs/alertas-error.log',
      out_file: '/root/logs/alertas-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ]
};
