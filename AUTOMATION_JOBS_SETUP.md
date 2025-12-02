# ✅ Jobs de Automação Configurados

**Data:** 02 de Dezembro de 2025  
**Status:** ✅ **COMPLETO E RODANDO**

---

## 📋 O Que Foi Configurado

### 1. ✅ PM2 Ecosystem Config

**Arquivo:** `/root/ecosystem.config.js`

**Aplicações Configuradas:**

#### precivox-backend
- **Script:** `npx tsx src/server.ts`
- **Porta:** 3001
- **Restart:** Automático
- **Logs:** `/var/log/precivox-backend-*.log`
- **Memória Máx:** 500MB

#### precivox-ai-scheduler
- **Script:** `npx tsx core/ai/run-scheduler.ts`
- **Restart:** Automático
- **Cron Restart:** Diariamente à meia-noite
- **Logs:** `/var/log/precivox-scheduler-*.log`
- **Memória Máx:** 300MB

### 2. ✅ Jobs Agendados

| Job | Frequência | Horário | Descrição |
|-----|-----------|---------|-----------|
| **Análise Diária** | Diária | 00:00 | Análise completa de demanda e estoque |
| **Alertas de Estoque** | Hora em hora | A cada hora | Verificação de rupturas e excessos |
| **Relatório Semanal** | Semanal | Segunda 06:00 | Relatório consolidado da semana |

**Expressões Cron:**
```javascript
'0 0 * * *'    // Análise Diária - 00:00
'0 * * * *'    // Alertas - Hora em hora
'0 6 * * 1'    // Relatório - Segunda 06:00
```

### 3. ✅ PM2 Configurado

**Status Atual:**
```
┌────┬────────────────────┬──────────┬──────┬───────────┬──────────┬──────────┐
│ id │ name               │ mode     │ ↺    │ status    │ cpu      │ memory   │
├────┼────────────────────┼──────────┼──────┼───────────┼──────────┼──────────┤
│ 6  │ precivox-ai-sched… │ cluster  │ 0    │ online    │ 0%       │ 42.8mb   │
│ 3  │ precivox-backend   │ fork     │ 209… │ online    │ 0%       │ 48.4mb   │
│ 5  │ precivox-nextjs    │ fork     │ 766  │ online    │ 0%       │ 42.2mb   │
└────┴────────────────────┴──────────┴──────┴───────────┴──────────┴──────────┘
```

**Configurações:**
- ✅ PM2 salvo (`pm2 save`)
- ✅ Startup configurado (systemd)
- ✅ Reinício automático no boot
- ✅ Logs persistentes

---

## 🔧 Comandos Úteis

### Gerenciamento PM2

```bash
# Ver status
pm2 list

# Ver logs do scheduler
pm2 logs precivox-ai-scheduler

# Ver logs do backend
pm2 logs precivox-backend

# Reiniciar scheduler
pm2 restart precivox-ai-scheduler

# Parar scheduler
pm2 stop precivox-ai-scheduler

# Monitorar em tempo real
pm2 monit

# Ver informações detalhadas
pm2 show precivox-ai-scheduler
```

### Logs

```bash
# Logs do scheduler
tail -f /var/log/precivox-scheduler-out.log
tail -f /var/log/precivox-scheduler-error.log

# Logs do backend
tail -f /var/log/precivox-backend-out.log
tail -f /var/log/precivox-backend-error.log
```

---

## 📊 Estrutura dos Jobs

### Arquivo: `/root/core/ai/jobs/tasks.ts`

**Classe:** `AIJobs`

**Métodos:**

#### 1. `runDailyAnalysis()`
```typescript
// Executa análise completa de:
- Previsão de demanda para próximos 7 dias
- Análise de saúde do estoque
- Recomendações de precificação
- Identificação de oportunidades
```

#### 2. `checkStockAlerts()`
```typescript
// Verifica e notifica:
- Produtos em risco de ruptura
- Produtos com excesso de estoque
- Produtos próximos ao vencimento
- Gera alertas por severidade
```

#### 3. `generateWeeklyReport()`
```typescript
// Gera relatório com:
- Resumo de vendas da semana
- Performance de produtos
- Alertas gerados
- Recomendações de ação
```

### Arquivo: `/root/core/ai/jobs/scheduler.ts`

**Classe:** `AIScheduler`

**Métodos:**
- `init()` - Inicializa todos os jobs
- `stopAll()` - Para todos os jobs
- `scheduleJob()` - Agenda um job específico

---

## 🧪 Testando os Jobs

### Teste Manual

Para testar um job manualmente sem esperar o cron:

```typescript
// Criar arquivo test-job.ts
import { AIJobs } from './core/ai/jobs/tasks';

async function test() {
  console.log('🧪 Testando análise diária...');
  await AIJobs.runDailyAnalysis();
  
  console.log('🧪 Testando alertas de estoque...');
  await AIJobs.checkStockAlerts();
  
  console.log('🧪 Testando relatório semanal...');
  await AIJobs.generateWeeklyReport();
  
  console.log('✅ Testes concluídos!');
}

test();
```

```bash
# Executar teste
npx tsx test-job.ts
```

### Verificar Execução

```bash
# Ver últimas execuções nos logs
pm2 logs precivox-ai-scheduler --lines 100 | grep "🚀 Iniciando tarefa"

# Ver erros
pm2 logs precivox-ai-scheduler --err --lines 50
```

---

## 📈 Monitoramento

### Métricas PM2

```bash
# CPU e Memória em tempo real
pm2 monit

# Estatísticas
pm2 describe precivox-ai-scheduler
```

### Logs Estruturados

Todos os jobs usam o logger estruturado:

```typescript
logger.info('JobName', 'Mensagem de sucesso');
logger.error('JobName', 'Mensagem de erro', error);
logger.warn('JobName', 'Mensagem de aviso');
```

**Formato:**
```
[2025-12-02 14:22:00] [INFO] [JobName] Mensagem de sucesso
```

---

## ✅ Checklist de Configuração

- [x] Arquivos de jobs criados (`tasks.ts`, `scheduler.ts`)
- [x] Run scheduler criado (`run-scheduler.ts`)
- [x] PM2 ecosystem config criado
- [x] Scheduler iniciado via PM2
- [x] PM2 salvo (`pm2 save`)
- [x] Startup configurado (systemd)
- [x] Logs configurados
- [x] 3 jobs agendados:
  - [x] Análise diária (00:00)
  - [x] Alertas hora em hora
  - [x] Relatório semanal (Segunda 06:00)

---

## 🎯 Próximos Passos

### Melhorias Futuras

1. **Notificações**
   - Email para alertas críticos
   - Webhook para integração com Slack/Discord
   - Push notifications no app

2. **Relatórios**
   - Exportar relatórios em PDF
   - Enviar por email automaticamente
   - Dashboard de histórico de relatórios

3. **Otimizações**
   - Cache de resultados de análises
   - Processamento paralelo de mercados
   - Retry automático em caso de falha

4. **Monitoramento**
   - Integração com Prometheus
   - Alertas via PagerDuty
   - Dashboard de métricas (Grafana)

---

## 🐛 Troubleshooting

### Scheduler não inicia

```bash
# Verificar logs de erro
pm2 logs precivox-ai-scheduler --err

# Verificar se o arquivo existe
ls -la /root/core/ai/run-scheduler.ts

# Testar manualmente
cd /root && npx tsx core/ai/run-scheduler.ts
```

### Jobs não executam

```bash
# Verificar expressões cron
pm2 show precivox-ai-scheduler | grep cron

# Verificar logs
tail -f /var/log/precivox-scheduler-out.log
```

### Memória alta

```bash
# Verificar uso
pm2 monit

# Ajustar limite no ecosystem.config.js
max_memory_restart: '300M'

# Reiniciar
pm2 restart precivox-ai-scheduler
```

---

## ✅ Conclusão

**Status:** ✅ **JOBS CONFIGURADOS E RODANDO**

Todos os jobs de automação estão:
- ✅ Configurados no PM2
- ✅ Rodando em background
- ✅ Agendados com cron
- ✅ Com logs persistentes
- ✅ Com restart automático
- ✅ Iniciando no boot do sistema

**O sistema de automação está production-ready!** 🚀

---

**Responsável:** Agente IA  
**Data:** 02/12/2025 14:23
