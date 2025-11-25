# 🚨 GUIA RÁPIDO: Resolver Erros MIME Type / 404 no PRECIVOX

## ⚡ Solução Rápida (1 comando)

```bash
bash /root/deploy-production.sh
```

Aguarde ~2 minutos. Depois, limpe o cache do navegador (Ctrl+Shift+R).

---

## 🔍 Diagnóstico Rápido

### 1. Verificar se build IDs estão sincronizados

```bash
# Build ID do Next.js (deve ser igual ao Nginx)
curl -s http://localhost:3000 | grep -o 'build-[^"]*' | head -1

# Build ID no Nginx (deve ser igual ao Next.js)
ls /var/www/precivox/_next/static/ | grep build
```

**✅ Correto**: Ambos retornam o mesmo build ID  
**❌ Problema**: Build IDs diferentes → Execute o deploy

### 2. Verificar se serviços estão rodando

```bash
# Next.js (porta 3000)
curl -s http://localhost:3000 | head -5

# Backend (porta 3001)
curl -s http://localhost:3001/api/health

# Nginx
curl -I https://precivox.com.br/health
```

### 3. Verificar processos

```bash
ps aux | grep -E "(next-server|node server.js)" | grep -v grep
```

Deve mostrar:
- `next-server (v14.2.33)` → Next.js rodando ✅
- `node server.js` → Backend rodando ✅

---

## 🛠️ Solução Manual (se deploy falhar)

### Passo 1: Matar processos antigos

```bash
pkill -9 -f "next start"
pkill -9 -f "next-server"
pkill -9 -f "npm.*start"
pkill -9 -f "node.*server.js"
sleep 2
```

### Passo 2: Verificar porta 3000 livre

```bash
lsof -i :3000
# Se retornar algo, force:
fuser -k 3000/tcp
```

### Passo 3: Rebuild

```bash
cd /root
rm -rf .next
npm run build
```

### Passo 4: Sincronizar assets

```bash
sudo rm -rf /var/www/precivox/_next/static/*
sudo cp -R .next/static/* /var/www/precivox/_next/static/
sudo chown -R www-data:www-data /var/www/precivox
sudo chmod -R 755 /var/www/precivox
```

### Passo 5: Reiniciar serviços

```bash
# Next.js
nohup npm start > /var/log/precivox-nextjs.log 2>&1 &

# Backend
cd backend
nohup node server.js > /var/log/precivox-backend.log 2>&1 &
cd ..

# Nginx
sudo nginx -t && sudo systemctl reload nginx
```

---

## 📊 Verificação Final

```bash
# 1. Build IDs sincronizados?
curl -s http://localhost:3000 | grep -o 'build-[^"]*' | head -1
ls /var/www/precivox/_next/static/ | grep build

# 2. CSS carregando?
curl -I https://precivox.com.br/_next/static/css/$(curl -s http://localhost:3000 | grep -o '[a-f0-9]\{16\}\.css' | head -1)

# 3. Site funcionando?
curl -I https://precivox.com.br/
```

Todos devem retornar **HTTP/2 200** ✅

---

## 🎯 Checklist Pós-Deploy

- [ ] Build IDs sincronizados (Next.js = Nginx)
- [ ] CSS retorna `content-type: text/css`
- [ ] JS retorna `content-type: application/javascript`
- [ ] Site acessível em https://precivox.com.br
- [ ] Health check OK: https://precivox.com.br/health
- [ ] Logs sem erros: `tail -50 /var/log/precivox-nextjs.log`
- [ ] Cache do navegador limpo (Ctrl+Shift+R)

---

## 📞 Logs para Debug

```bash
# Next.js
tail -f /var/log/precivox-nextjs.log

# Backend
tail -f /var/log/precivox-backend.log

# Nginx
tail -f /var/log/nginx/precivox-error.log
```

---

**Documentação completa**: `/root/SOLUCAO_MIME_TYPE_ERRORS.md`
