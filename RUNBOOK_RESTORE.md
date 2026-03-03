## RUNBOOK — Restore Completo (Banco + App + Nginx + Env)

Este documento descreve como restaurar o ambiente `precivox` em caso de desastre ou migração para nova VPS.

Assume-se que os backups são gerados por `/usr/local/bin/backup_precivox.sh` em:

- `/var/backups/precivox/db_YYYY-MM-DD_HH-MM.sql`
- `/var/backups/precivox/env_YYYY-MM-DD_HH-MM.backup`
- `/var/backups/precivox/nginx_YYYY-MM-DD_HH-MM.tar.gz`
- `/var/backups/precivox/app_YYYY-MM-DD_HH-MM.tar.gz`

Banco: PostgreSQL  
Usuário de aplicação: `precivox_app`  
Banco: `precivox`

---

## 1. Escolher o conjunto de backup

Listar backups disponíveis:

```bash
ls -lh /var/backups/precivox
```

Escolha um grupo consistente (mesmo timestamp), por exemplo:

- `db_2026-03-03_16-09.sql`
- `env_2026-03-03_16-09.backup`
- `nginx_2026-03-03_16-09.tar.gz`
- `app_2026-03-03_16-09.tar.gz`

No restante do documento usaremos o timestamp `2026-03-03_16-09` apenas como exemplo.

---

## 2. Restore do banco PostgreSQL

### 2.1. Garantir existência do banco (nova VPS)

```bash
sudo -u postgres createdb precivox || echo "db já existe"
```

### 2.2. Restaurar o dump

**Opção A — Restaurar sobre o banco existente (sobrescreve dados atuais):**

```bash
sudo -u postgres psql -d precivox -f /var/backups/precivox/db_2026-03-03_16-09.sql
```

**Opção B — Zerar e recriar o banco antes (recomendado em ambiente limpo):**

```bash
sudo -u postgres dropdb precivox
sudo -u postgres createdb precivox
sudo -u postgres psql -d precivox -f /var/backups/precivox/db_2026-03-03_16-09.sql
```

### 2.3. Garantir usuário de aplicação e permissões

Em caso de nova VPS (ou se o usuário tiver sido removido), recriar `precivox_app` e dar privilégios:

```bash
sudo -u postgres psql <<'SQL'
DO
$$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'precivox_app') THEN
      CREATE ROLE precivox_app LOGIN ENCRYPTED PASSWORD 'R0R0lda0.864050!';
   END IF;
END
$$;
GRANT ALL PRIVILEGES ON DATABASE precivox TO precivox_app;
\c precivox
GRANT ALL ON SCHEMA public TO precivox_app;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO precivox_app;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO precivox_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO precivox_app;
SQL
```

---

## 3. Restore do `.env.production`

Restaurar o arquivo de env principal:

```bash
cp /var/backups/precivox/env_2026-03-03_16-09.backup /root/.env.production
```

Em **nova VPS**, revisar e ajustar variáveis sensíveis a ambiente (hosts, URLs externas, chaves de APIs, etc.):

```bash
nano /root/.env.production
```

Certifique-se de que o `DATABASE_URL` aponta para:

```text
postgresql://precivox_app:R0R0lda0.864050!@localhost:5432/precivox
```

---

## 4. Restore das configs do Nginx

> ATENÇÃO: este passo sobrescreve as configurações atuais de `/etc/nginx`.

Restaurar:

```bash
tar -xzf /var/backups/precivox/nginx_2026-03-03_16-09.tar.gz -C /
```

Validar sintaxe:

```bash
nginx -t
```

Se o teste estiver OK:

```bash
systemctl restart nginx
```

Se houver erro, corrigir o arquivo indicado pelo `nginx -t` antes de reiniciar.

---

## 5. Restore do código da aplicação (`/root/app`)

### 5.1. Parar serviços da aplicação (se for mesma VPS)

```bash
pm2 stop all
```

### 5.2. Backup de segurança do código atual (opcional, recomendado)

```bash
mv /root/app /root/app_antes_restore_$(date +%F_%H-%M)
```

### 5.3. Restaurar o código do backup

Os arquivos de backup foram criados com caminhos absolutos; para restaurar:

```bash
tar -xzf /var/backups/precivox/app_2026-03-03_16-09.tar.gz -C /
chown -R root:root /root/app
```

Verificar se o diretório `/root/app` está no lugar:

```bash
ls -lh /root/app
```

Em **nova VPS**, instale dependências após restaurar:

```bash
cd /root/app
npm ci --only=production  # ou npm install, conforme padrão do projeto
```

---

## 6. Subir novamente a aplicação com PM2

### 6.1. Em servidor já configurado com ecosytem PM2

Se o `ecosystem.config.js` já estiver configurado:

```bash
cd /root/app
pm2 start ecosystem.config.js
pm2 save  # opcional, persiste a config
pm2 status
```

### 6.2. Se os processos já existirem no PM2

Quando estiver apenas restaurando dados/configs:

```bash
pm2 restart all
pm2 status
```

Certifique-se de que:

- `precivox-backend` está `online`
- `precivox-frontend` está `online`
- Qualquer outro serviço crítico (ex.: `precivox-ai-scheduler`) está `online`

---

## 7. Teste funcional pós-restore

### 7.1. Banco de dados

Verificar se as tabelas e dados principais existem:

```bash
sudo -u postgres psql
\c precivox
\dt
SELECT COUNT(*) FROM alguma_tabela_critica;
\q
```

### 7.2. Backend

Validar rotas básicas (ajustar URL conforme ambiente):

```bash
curl -i http://127.0.0.1:3001/health || echo "verificar rota de health"
```

### 7.3. Frontend

- Abrir o domínio público configurado no Nginx.
- Testar:
  - Login
  - Tela principal
  - Um fluxo de negócio crítico (ex.: criação/edição de entidade importante).

### 7.4. Logs

Verificar se há erros logo após o restore:

```bash
pm2 logs --lines 100
tail -n 100 /var/log/nginx/error.log
```

---

## 8. Restore em nova VPS — Ordem recomendada

Resumo da ordem para reconstruir o ambiente em uma VPS nova:

1. **Instalar dependências**:
   - PostgreSQL (mesma versão ou compatível),
   - Node.js + PM2,
   - Nginx.
2. **Transferir backups** para a nova VPS:
   - Copiar os arquivos para `/var/backups/precivox` (via `scp`, rsync, S3 CLI, etc.).
3. **Restaurar o banco**:
   - Criar banco `precivox`,
   - Rodar o `psql -f` com o dump escolhido,
   - Recriar usuário `precivox_app` e privilégios, se necessário.
4. **Restaurar `.env.production`**:
   - Copiar o backup escolhido para `/root/.env.production`,
   - Ajustar qualquer variável específica do novo ambiente.
5. **Restaurar Nginx**:
   - Extrair o tar em `/`,
   - Validar com `nginx -t`,
   - `systemctl restart nginx`.
6. **Restaurar código da aplicação**:
   - Extrair `app_*.tar.gz` em `/`,
   - Instalar dependências (`npm ci` ou `npm install`).
7. **Subir PM2**:
   - `pm2 start ecosystem.config.js`,
   - `pm2 save`,
   - `pm2 status`.
8. **Rodar testes funcionais**:
   - Checar banco, backend, frontend e logs conforme seção 7.

Com todos esses passos concluídos e testados, o ambiente está considerado restaurado de forma profissional, com capacidade real de rollback a partir dos backups em `/var/backups/precivox`.

