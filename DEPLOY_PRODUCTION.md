# 🚀 Deploy para Produção - PRECIVOX

## ✅ Build Concluído

O build foi executado com sucesso:
- ✅ Compilação: OK
- ✅ Linting: OK
- ✅ Type checking: OK
- ✅ Static pages: 43/43 geradas
- ✅ Middleware: 25.8 kB
- ⚠️ Erros em /404 e /500 são esperados (não impedem deploy)

## 📋 Arquivos Modificados para Deploy

### 1. Middleware Criado
- **Arquivo**: `/root/middleware.ts`
- **Função**: Protege assets estáticos, garante que TokenManager não afete chunks/CSS
- **Status**: ✅ Pronto

### 2. Next.js Config Atualizado
- **Arquivo**: `/root/next.config.js`
- **Mudanças**: Headers explícitos para Content-Type correto em assets
- **Status**: ✅ Pronto

### 3. Dependências
- **critters**: Instalado (necessário para optimizeCss)
- **Status**: ✅ Pronto

## 🚀 Opções de Deploy

### Opção 1: Vercel (Recomendado)

O projeto já está configurado com `vercel.json`:

```bash
# 1. Instalar Vercel CLI (se não tiver)
npm i -g vercel

# 2. Fazer login
vercel login

# 3. Deploy para produção
vercel --prod

# Ou fazer commit e push (deploy automático)
git add .
git commit -m "fix: middleware para proteger assets estáticos + headers Content-Type"
git push origin main
```

**Variáveis de Ambiente Necessárias** (configurar no dashboard da Vercel):
- `DATABASE_URL`
- `NEXTAUTH_URL` (https://precivox.com.br)
- `NEXTAUTH_SECRET`
- `REDIS_URL`
- `FIREBASE_SERVICE_ACCOUNT`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `FACEBOOK_CLIENT_ID`
- `FACEBOOK_CLIENT_SECRET`
- `LINKEDIN_CLIENT_ID`
- `LINKEDIN_CLIENT_SECRET`

### Opção 2: Deploy Manual (VPS/Server)

Se você tem um servidor próprio:

```bash
# 1. Fazer build (já feito)
npm run build

# 2. Gerar Prisma Client
npm run prisma:generate

# 3. Iniciar servidor de produção
npm run start

# Ou usar PM2 para gerenciar processo
pm2 start npm --name "precivox" -- start
```

**Configuração Nginx** (se necessário):
```nginx
location /_next/static/ {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    add_header Cache-Control "public, max-age=31536000, immutable" always;
    expires 1y;
    access_log off;
}
```

## ✅ Validação Pós-Deploy

### 1. Verificar Assets Estáticos

```bash
# Testar chunk JS
curl -I "https://precivox.com.br/_next/static/chunks/app/page-[hash].js"

# Deve retornar:
# HTTP/1.1 200 OK
# Content-Type: application/javascript; charset=utf-8

# Testar CSS
curl -I "https://precivox.com.br/_next/static/css/[hash].css"

# Deve retornar:
# HTTP/1.1 200 OK
# Content-Type: text/css; charset=utf-8
```

### 2. Verificar no Navegador

1. Abrir https://precivox.com.br
2. Abrir DevTools (F12) → Network
3. Recarregar com Ctrl+Shift+R (bypass cache)
4. Verificar requisições `/_next/static/`:
   - ✅ Status: 200
   - ✅ Content-Type: `application/javascript` ou `text/css`
   - ❌ NÃO deve ser `text/html`

### 3. Verificar APIs

```bash
# Testar API pública
curl https://precivox.com.br/api/stats/global

# Deve retornar JSON, não HTML
```

### 4. Verificar Middleware

O middleware deve:
- ✅ Ignorar assets estáticos
- ✅ Permitir APIs públicas
- ✅ Não afetar TokenManager

## 📝 Checklist de Deploy

- [x] Build concluído com sucesso
- [x] Middleware criado e configurado
- [x] next.config.js atualizado
- [x] Dependências instaladas
- [ ] Variáveis de ambiente configuradas
- [ ] Deploy executado
- [ ] Assets estáticos validados
- [ ] APIs testadas
- [ ] Cache do navegador limpo

## 🔍 Troubleshooting

### Se assets ainda retornam HTML:

1. **Verificar se middleware.ts está na raiz**:
   ```bash
   ls -la /root/middleware.ts
   ```

2. **Verificar matcher do middleware**:
   ```bash
   grep -A 5 "matcher" /root/middleware.ts
   ```

3. **Verificar se há cache no servidor**:
   - Limpar cache do Next.js: `rm -rf .next`
   - Rebuild: `npm run build`

4. **Verificar logs do servidor**:
   ```bash
   # Vercel
   vercel logs

   # PM2
   pm2 logs precivox
   ```

### Se APIs retornam HTML:

1. **Verificar se API routes retornam JSON**:
   ```typescript
   // ✅ CORRETO
   return NextResponse.json({ success: false, error: '...' }, { status: 400 });
   
   // ❌ INCORRETO
   return NextResponse.redirect('/login');
   ```

## 🎯 Resultado Esperado

Após deploy:

- ✅ Assets estáticos retornam status 200
- ✅ Content-Type correto (`application/javascript`, `text/css`)
- ✅ Navegador carrega chunks sem erros
- ✅ TokenManager continua funcionando nas APIs
- ✅ Autenticação não afeta assets estáticos
- ✅ Aplicação carrega completamente

---

**Status**: Build concluído, pronto para deploy

