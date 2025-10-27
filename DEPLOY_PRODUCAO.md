# 🚀 DEPLOY PRODUÇÃO - PRECIVOX

## 📋 Problemas Identificados e Corrigidos

### ❌ **Problemas Encontrados:**
1. **Homepage incorreta**: `package.json` apontava para GitHub ao invés do domínio de produção
2. **Configuração Nginx inadequada**: Configurado para React puro, não Next.js
3. **Falta de configuração de produção**: Não havia setup adequado para ambiente de produção
4. **Fast Refresh ativo**: Servidor rodando em modo desenvolvimento

### ✅ **Correções Aplicadas:**

#### 1. **package.json** - Homepage corrigida
```json
"homepage": "https://precivox.com.br"
```

#### 2. **Nginx** - Nova configuração para Next.js
- Criado `nginx/nextjs-production.conf`
- Configurado para servir Next.js na porta 3000
- Configurado para servir Express Backend na porta 3001
- Cache otimizado para arquivos estáticos

#### 3. **Script de Deploy** - Automatizado
- Criado `deploy-production.sh`
- Build automático
- Inicialização de serviços
- Verificação de status

## 🛠️ **Comandos para Deploy**

### **1. Deploy Automático (Recomendado)**
```bash
cd /root
./deploy-production.sh
```

### **2. Deploy Manual**
```bash
# 1. Build do projeto
npm run build

# 2. Iniciar Next.js em produção
npm start

# 3. Iniciar Backend Express (em outro terminal)
cd backend
node server.js

# 4. Configurar Nginx
sudo cp nginx/nextjs-production.conf /etc/nginx/sites-available/precivox
sudo nginx -t && sudo systemctl reload nginx
```

## 🔧 **Configuração do Nginx**

### **Arquivo:** `/etc/nginx/sites-available/precivox`
- **Frontend Next.js**: `http://127.0.0.1:3000`
- **Backend Express**: `http://127.0.0.1:3001`
- **SSL**: Configurado para `precivox.com.br`

### **Configuração Principal:**
```nginx
# Next.js Frontend
location / {
    proxy_pass http://nextjs_upstream;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

# API Backend
location /api {
    proxy_pass http://api_upstream;
    # ... headers de proxy
}
```

## 📊 **Verificação de Status**

### **Health Checks:**
- **Frontend**: `https://precivox.com.br/health`
- **Backend**: `https://precivox.com.br/api/health`

### **Logs:**
- **Next.js**: `/var/log/precivox-nextjs.log`
- **Backend**: `/var/log/precivox-backend.log`
- **Nginx**: `/var/log/nginx/precivox-access.log`

## 🎯 **Resultado Esperado**

Após o deploy correto:
- ✅ CSS carregando corretamente
- ✅ JavaScript funcionando
- ✅ Rotas funcionais (`/login`, `/cliente/comparar`, etc.)
- ✅ Sem logs de Fast Refresh
- ✅ Arquivos estáticos sendo servidos
- ✅ Nenhum erro 404 no console

## 🚨 **Troubleshooting**

### **Problema: Tela branca**
```bash
# Verificar se Next.js está rodando
curl http://localhost:3000

# Verificar logs
tail -f /var/log/precivox-nextjs.log
```

### **Problema: CSS não carrega**
```bash
# Verificar arquivos estáticos
ls -la /root/.next/static/

# Verificar Nginx
sudo nginx -t
```

### **Problema: API não funciona**
```bash
# Verificar Backend
curl http://localhost:3001/api/health

# Verificar logs
tail -f /var/log/precivox-backend.log
```

## 📝 **Checklist Final**

- [ ] ✅ Homepage corrigida no `package.json`
- [ ] ✅ Build executado com sucesso
- [ ] ✅ Nginx configurado para Next.js
- [ ] ✅ Next.js rodando na porta 3000
- [ ] ✅ Backend Express rodando na porta 3001
- [ ] ✅ SSL configurado
- [ ] ✅ Health checks funcionando
- [ ] ✅ CSS e JS carregando
- [ ] ✅ Rotas funcionais
- [ ] ✅ Sem logs de Fast Refresh

## 🌐 **URLs de Acesso**

- **Site Principal**: https://precivox.com.br
- **Health Check**: https://precivox.com.br/health
- **API Status**: https://precivox.com.br/api/health
