#!/usr/bin/env node
// scripts/production-setup.js - SETUP SEGURO PARA PRODUÇÃO
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 PRECIVOX - Setup de Produção Iniciado');
console.log('=======================================\n');

class ProductionSetup {
  constructor() {
    this.rootDir = path.join(__dirname, '..');
    this.errors = [];
    this.warnings = [];
  }

  /**
   * Gerar chaves JWT seguras
   */
  generateJWTSecrets() {
    console.log('🔐 Gerando chaves JWT seguras...');
    
    const secrets = {
      JWT_ACCESS_SECRET: crypto.randomBytes(64).toString('hex'),
      JWT_REFRESH_SECRET: crypto.randomBytes(64).toString('hex'),
      JWT_RESET_SECRET: crypto.randomBytes(64).toString('hex')
    };

    console.log('✅ Chaves JWT geradas com sucesso');
    console.log('📋 Adicione estas chaves ao seu arquivo .env:');
    console.log('');
    
    Object.entries(secrets).forEach(([key, value]) => {
      console.log(`${key}=${value}`);
    });
    
    console.log('');
    return secrets;
  }

  /**
   * Validar variáveis de ambiente obrigatórias
   */
  validateEnvironment() {
    console.log('🔍 Validando variáveis de ambiente...');
    
    const required = [
      'NODE_ENV',
      'DB_HOST',
      'DB_PORT',
      'DB_NAME',
      'DB_USER',
      'DB_PASSWORD',
      'JWT_ACCESS_SECRET',
      'JWT_REFRESH_SECRET'
    ];

    const missing = [];
    
    required.forEach(env => {
      if (!process.env[env]) {
        missing.push(env);
      }
    });

    if (missing.length > 0) {
      this.errors.push(`Variáveis de ambiente obrigatórias ausentes: ${missing.join(', ')}`);
    } else {
      console.log('✅ Todas as variáveis obrigatórias estão configuradas');
    }

    // Validações específicas
    if (process.env.NODE_ENV !== 'production') {
      this.warnings.push('NODE_ENV não está definido como "production"');
    }

    if (process.env.JWT_ACCESS_SECRET && process.env.JWT_ACCESS_SECRET.length < 64) {
      this.errors.push('JWT_ACCESS_SECRET deve ter pelo menos 64 caracteres');
    }

    if (process.env.DB_PASSWORD && process.env.DB_PASSWORD.length < 8) {
      this.warnings.push('Senha do banco de dados parece ser muito simples');
    }
  }

  /**
   * Verificar permissões de arquivos
   */
  checkFilePermissions() {
    console.log('📁 Verificando permissões de arquivos...');
    
    const sensitiveFiles = [
      '.env',
      '.env.production',
      'config/database.js',
      'middleware/auth.js'
    ];

    sensitiveFiles.forEach(file => {
      const filePath = path.join(this.rootDir, file);
      
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        const mode = stats.mode & parseInt('777', 8);
        
        if (mode !== parseInt('600', 8) && mode !== parseInt('644', 8)) {
          this.warnings.push(`Arquivo ${file} tem permissões inseguras: ${mode.toString(8)}`);
        }
      }
    });

    console.log('✅ Verificação de permissões concluída');
  }

  /**
   * Verificar dependências de segurança
   */
  async checkSecurityDependencies() {
    console.log('🔒 Verificando dependências de segurança...');
    
    try {
      // Verificar se npm audit passa
      const { stdout, stderr } = await execAsync('npm audit --audit-level=high');
      
      if (stderr && stderr.includes('vulnerabilities')) {
        this.warnings.push('Foram encontradas vulnerabilidades de segurança nas dependências');
        console.log('⚠️ Execute "npm audit fix" para corrigir vulnerabilidades');
      } else {
        console.log('✅ Nenhuma vulnerabilidade crítica encontrada');
      }
    } catch (error) {
      console.log('⚠️ Não foi possível executar auditoria de segurança');
    }
  }

  /**
   * Verificar configuração do banco de dados
   */
  async checkDatabaseConnection() {
    console.log('🗄️ Verificando conexão com banco de dados...');
    
    try {
      // Importar função de teste de conexão
      const { testConnection } = await import('../config/database.js');
      
      const isConnected = await testConnection();
      
      if (isConnected) {
        console.log('✅ Conexão com banco de dados estabelecida com sucesso');
      } else {
        this.errors.push('Não foi possível conectar ao banco de dados');
      }
    } catch (error) {
      this.errors.push(`Erro ao testar conexão com banco: ${error.message}`);
    }
  }

  /**
   * Configurar logs seguros
   */
  setupSecureLogs() {
    console.log('📝 Configurando sistema de logs...');
    
    const logsDir = path.join(this.rootDir, 'logs');
    
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { mode: 0o750 });
      console.log('✅ Diretório de logs criado');
    }

    // Configurar rotação de logs
    const logrotateConfig = `
${logsDir}/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    sharedscripts
    postrotate
        /bin/kill -USR1 \`cat /var/run/precivox.pid 2> /dev/null\` 2> /dev/null || true
    endscript
}`;

    const logrotateFile = path.join(this.rootDir, 'logrotate.conf');
    fs.writeFileSync(logrotateFile, logrotateConfig);
    
    console.log('✅ Configuração de rotação de logs criada');
  }

  /**
   * Criar script de monitoramento
   */
  createMonitoringScript() {
    console.log('📊 Criando script de monitoramento...');
    
    const monitoringScript = `#!/bin/bash
# monitoring.sh - Script de monitoramento do PRECIVOX

LOG_FILE="/var/log/precivox-monitor.log"
PID_FILE="/var/run/precivox.pid"
APP_PORT=\${PORT:-3001}

# Função para log
log() {
    echo "\$(date '+%Y-%m-%d %H:%M:%S') - \$1" >> \$LOG_FILE
}

# Verificar se o processo está rodando
check_process() {
    if [ -f "\$PID_FILE" ]; then
        PID=\$(cat \$PID_FILE)
        if ps -p \$PID > /dev/null 2>&1; then
            return 0
        fi
    fi
    return 1
}

# Verificar se a porta está respondendo
check_port() {
    nc -z localhost \$APP_PORT > /dev/null 2>&1
    return \$?
}

# Verificar saúde da aplicação
check_health() {
    response=\$(curl -s -o /dev/null -w "%{http_code}" http://localhost:\$APP_PORT/api/health)
    if [ "\$response" = "200" ]; then
        return 0
    fi
    return 1
}

# Monitoramento principal
if ! check_process; then
    log "ERROR: Processo não está rodando"
    exit 1
fi

if ! check_port; then
    log "ERROR: Porta \$APP_PORT não está respondendo"
    exit 1
fi

if ! check_health; then
    log "WARNING: Health check falhou"
    exit 1
fi

log "INFO: Todos os checks passaram"
exit 0
`;

    const scriptPath = path.join(this.rootDir, 'scripts', 'monitoring.sh');
    fs.writeFileSync(scriptPath, monitoringScript);
    fs.chmodSync(scriptPath, 0o755);
    
    console.log('✅ Script de monitoramento criado');
  }

  /**
   * Executar setup completo
   */
  async run() {
    console.log('🚀 Iniciando setup de produção...\n');

    // 1. Gerar chaves JWT
    this.generateJWTSecrets();

    // 2. Validar ambiente
    this.validateEnvironment();

    // 3. Verificar permissões
    this.checkFilePermissions();

    // 4. Verificar dependências
    await this.checkSecurityDependencies();

    // 5. Testar banco de dados
    await this.checkDatabaseConnection();

    // 6. Configurar logs
    this.setupSecureLogs();

    // 7. Criar monitoramento
    this.createMonitoringScript();

    // Relatório final
    console.log('\n📋 RELATÓRIO DO SETUP');
    console.log('=====================');

    if (this.errors.length > 0) {
      console.log('\n❌ ERROS CRÍTICOS:');
      this.errors.forEach(error => console.log(`  • ${error}`));
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️ AVISOS:');
      this.warnings.forEach(warning => console.log(`  • ${warning}`));
    }

    if (this.errors.length === 0) {
      console.log('\n✅ Setup concluído com sucesso!');
      console.log('\n📝 PRÓXIMOS PASSOS:');
      console.log('  1. Configure as variáveis de ambiente no .env');
      console.log('  2. Execute as migrações do banco: npm run migrate');
      console.log('  3. Inicie a aplicação: npm run start:prod');
      console.log('  4. Configure monitoramento: crontab -e');
      console.log('     */5 * * * * /path/to/scripts/monitoring.sh');
    } else {
      console.log('\n❌ Setup incompleto. Corrija os erros acima antes de continuar.');
      process.exit(1);
    }
  }
}

// Executar setup se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const setup = new ProductionSetup();
  setup.run().catch(error => {
    console.error('❌ Erro durante setup:', error);
    process.exit(1);
  });
}

export default ProductionSetup;