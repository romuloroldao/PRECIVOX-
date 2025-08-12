# 🚀 Ambiente de Staging - Precivox

> **Ambiente de Teste**: `test.precivox.com.br`  
> **Objetivo**: Testar melhorias sem afetar a produção

## 📋 Visão Geral

Este ambiente de staging permite:
- ✅ Testar novas funcionalidades isoladamente
- ✅ Validar mudanças antes da produção
- ✅ Desenvolvimento colaborativo seguro
- ✅ Backup automático de dados
- ✅ Monitoramento e logs centralizados

## 🏗️ Arquitetura

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Nginx Proxy   │────│  Frontend React │────│  Backend Node   │
│   Port: 8080    │    │   Port: 80      │    │   Port: 3001    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                       │
                                               ┌─────────────────┐
                                               │  SQLite + Backup│
                                               │   Volume Docker │
                                               └─────────────────┘
```

## 🚀 Quick Start

### 1. Deploy Inicial
```bash
# Deploy completo do ambiente
./scripts/deploy-staging.sh
```

### 2. Gerenciamento Diário
```bash
# Utilitários para o dia a dia
./scripts/staging-utils.sh [comando]

# Comandos disponíveis:
./scripts/staging-utils.sh start    # Iniciar
./scripts/staging-utils.sh stop     # Parar
./scripts/staging-utils.sh logs     # Ver logs
./scripts/staging-utils.sh status   # Status
./scripts/staging-utils.sh test     # Testes
```

## 📁 Estrutura de Arquivos

```
📦 precivox/
├── 🐳 docker-compose.staging.yml     # Orquestração completa
├── 🔧 .env.staging                   # Configurações de staging
├── 📜 scripts/
│   ├── deploy-staging.sh             # Script de deploy
│   └── staging-utils.sh              # Utilitários
├── 🌐 nginx/
│   └── staging.conf                  # Configuração Nginx
├── 🔙 backend/
│   └── Dockerfile                    # Container do backend
├── 🎨 frontend-react/
│   ├── Dockerfile                    # Container do frontend
│   └── nginx.conf                    # Servidor web
└── 💾 backups/                       # Backups automáticos
```

## 🌐 URLs e Endpoints

| Serviço | URL | Descrição |
|---------|-----|-----------|
| **Staging Backend** | https://test.precivox.com.br:3002 | API REST (Ambiente de Teste) |
| **API Status** | https://test.precivox.com.br:3002/api/admin/status | Status da API |
| **API Endpoints** | https://test.precivox.com.br:3002/api/* | Todas as APIs |
| **Frontend Local** | http://localhost:80 | Interface local (quando rodando) |
| **Proxy Local** | http://localhost:8080 | Nginx reverse proxy local |

## 🔧 Configurações Importantes

### Variáveis de Environment (.env.staging)
```bash
# APIs apontam para staging
VITE_API_URL=https://test.precivox.com.br:3002/api
VITE_BACKEND_URL=https://test.precivox.com.br:3002

# Ambiente identificado
VITE_APP_NAME=PRECIVOX [TESTE]
NODE_ENV=staging

# Cache reduzido para testes
VITE_CACHE_DURATION=60000
VITE_API_TIMEOUT=15000
```

### Docker Compose Services
- **Backend**: Node.js + Express (porta 3001)
- **Frontend**: React + Nginx (porta 80)
- **Proxy**: Nginx reverse proxy (porta 8080)
- **DB Backup**: Backup automático a cada hora

## 📊 Monitoramento e Logs

### Ver Logs em Tempo Real
```bash
# Todos os serviços
./scripts/staging-utils.sh logs

# Serviço específico
docker-compose -f docker-compose.staging.yml logs -f backend
docker-compose -f docker-compose.staging.yml logs -f frontend
```

### Health Checks
```bash
# Verificação automática
./scripts/staging-utils.sh test

# Verificação manual
curl http://localhost:80/health
curl http://localhost:3001/api/admin/status
```

### Monitorar Recursos
```bash
# CPU, Memória, Rede em tempo real
./scripts/staging-utils.sh monitor
```

## 💾 Backup e Restore

### Backup Automático
- ✅ Backup a cada 1 hora automaticamente
- ✅ Arquivos mantidos por 7 dias
- ✅ Localização: `./backups/`

### Backup Manual
```bash
./scripts/staging-utils.sh backup
```

### Restaurar Backup
```bash
./scripts/staging-utils.sh restore
```

## 🛠️ Comandos Úteis

### Gerenciamento de Containers
```bash
# Status dos containers
docker-compose -f docker-compose.staging.yml ps

# Parar todos os serviços
docker-compose -f docker-compose.staging.yml down

# Rebuild completo
docker-compose -f docker-compose.staging.yml build --no-cache

# Acessar shell do container
./scripts/staging-utils.sh shell
```

### Limpeza e Manutenção
```bash
# Limpar tudo (cuidado!)
./scripts/staging-utils.sh clean

# Limpar apenas containers parados
docker container prune -f

# Limpar imagens não utilizadas
docker image prune -f
```

## 🔍 Troubleshooting

### Container não inicia
```bash
# Ver logs do container com problema
docker-compose -f docker-compose.staging.yml logs [service-name]

# Verificar configurações
cat .env.staging

# Testar build manual
docker-compose -f docker-compose.staging.yml build backend
```

### Frontend não carrega
```bash
# Verificar se o build foi bem-sucedido
docker-compose -f docker-compose.staging.yml logs frontend

# Testar diretamente
curl http://localhost:80/health
```

### API não responde
```bash
# Verificar backend
curl http://localhost:3001/api/admin/status

# Ver logs do backend
docker-compose -f docker-compose.staging.yml logs backend
```

### Banco de dados corrompido
```bash
# Restaurar último backup
./scripts/staging-utils.sh restore

# Ou iniciar com banco limpo
rm -f backend/data/precivox_analytics_staging.db
docker-compose -f docker-compose.staging.yml restart backend
```

## 🔐 Segurança

### Configurações de Segurança
- ✅ Headers de segurança no Nginx
- ✅ Rate limiting configurado
- ✅ Isolamento por containers
- ✅ Logs de acesso centralizados
- ✅ Ambiente identificado como "staging"

### Dados Sensíveis
- ⚠️  **NUNCA** use chaves de produção no staging
- ⚠️  Use dados de teste ou mock
- ⚠️  Chaves de API devem ser específicas para teste

## 🚀 Deploy para Produção

Quando estiver satisfeito com os testes no staging:

1. **Validar** todas as funcionalidades
2. **Testar** performance e carga
3. **Criar** branch de release
4. **Deploy** para produção com configurações específicas

## 📞 Suporte

Em caso de problemas:
1. Consulte os logs: `./scripts/staging-utils.sh logs`
2. Verifique o status: `./scripts/staging-utils.sh status`
3. Execute testes: `./scripts/staging-utils.sh test`
4. Consulte este documento para soluções comuns

---

> **💡 Dica**: Use o ambiente de staging para testar TODAS as mudanças antes de aplicar em produção. É melhor quebrar aqui do que na produção! 🛡️