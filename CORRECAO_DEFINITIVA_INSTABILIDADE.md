# 🔧 Correção Definitiva de Instabilidade - Precivox

## ✅ Correções Aplicadas

### 1. **next.config.js** - Configuração Otimizada
- ✅ Adicionado `output: 'standalone'` para produção
- ✅ Configurado `images.domains` com `precivox.com.br`
- ✅ Removidos rewrites desnecessários que causavam conflitos
- ✅ Headers de cache otimizados para `/_next/static/*`

### 2. **Nginx** - Roteamento Correto de Arquivos Estáticos
- ✅ Configuração melhorada para `/_next/static/` com alias correto
- ✅ Headers de cache e CORS configurados
- ✅ Timeouts e buffers otimizados
- ✅ Verificação de arquivos antes de servir

### 3. **Variáveis de Ambiente**
- ✅ Script criado: `scripts/setup-env-production.sh`
- ✅ Garante `NEXTAUTH_URL=https://precivox.com.br` (sem trailing slash)
- ✅ Garante `NEXT_PUBLIC_URL=https://precivox.com.br`

### 4. **Layout e Espaçamentos**
- ✅ Padronização de espaçamentos usando múltiplos de 8 (8, 16, 24, 32)
- ✅ Transições suaves (`transition-all duration-300 ease-in-out`)
- ✅ ListaLateral corrigida para não deixar espaços fantasmas
- ✅ Melhorias de acessibilidade (aria-labels)

### 5. **Tratamento de Erros de Chunk**
- ✅ Handler melhorado no `layout.tsx` com:
  - Debounce para evitar loops infinitos
  - Limite de 3 tentativas antes de limpar cache
  - Limpeza automática de cache do navegador
  - Reset automático do contador após 30s

### 6. **Scripts de Deploy e Verificação**
- ✅ `scripts/verify-build.js` - Verifica consistência do build
- ✅ `scripts/deploy-production.sh` - Deploy completo e seguro
- ✅ `scripts/setup-env-production.sh` - Configuração de variáveis

## 🚀 Como Aplicar as Correções

### Passo 1: Configurar Variáveis de Ambiente
```bash
bash /root/scripts/setup-env-production.sh
```

### Passo 2: Executar Deploy Completo
```bash
bash /root/scripts/deploy-production.sh
```

Este script:
1. Configura variáveis de ambiente
2. Limpa build anterior
3. Instala dependências
4. Gera Prisma Client
5. Executa build de produção
6. Verifica consistência do build
7. Configura permissões
8. Reinicia PM2
9. Verifica saúde da aplicação

### Passo 3: Verificar Nginx
Certifique-se de que o Nginx está usando a configuração correta:
```bash
# Verificar qual config está ativa
ls -la /etc/nginx/sites-enabled/

# Se necessário, atualizar para usar nextjs-production.conf
sudo cp /root/nginx/nextjs-production.conf /etc/nginx/sites-available/precivox
sudo ln -sf /etc/nginx/sites-available/precivox /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Passo 4: Verificar Build Manualmente (Opcional)
```bash
node /root/scripts/verify-build.js
```

## 📋 Checklist Pós-Deploy

- [ ] Nenhum erro 400, 502 ou 503 no console do navegador
- [ ] Arquivos `/_next/static/chunks/*.js` carregam com 200 OK
- [ ] Rotas `/api/*` respondem corretamente
- [ ] Página não pisca ou trava após login
- [ ] Lista lateral expande/retrai sem espaços indevidos
- [ ] Layout responsivo e fluido
- [ ] PM2 mostra status "online"
- [ ] Logs sem erros críticos: `pm2 logs precivox-auth --lines 50`

## 🔍 Comandos Úteis

### Verificar Status
```bash
pm2 status
pm2 logs precivox-auth --lines 50
pm2 monit
```

### Verificar Build
```bash
ls -la /root/.next/static/chunks/ | head -20
du -sh /root/.next/static
```

### Verificar Variáveis de Ambiente
```bash
grep -E "NEXTAUTH_URL|NEXT_PUBLIC_URL" /root/.env
```

### Testar Health Check
```bash
curl http://localhost:3000/health
curl https://precivox.com.br/health
```

### Limpar Cache do Nginx (se necessário)
```bash
sudo rm -rf /var/cache/nginx/precivox/*
sudo nginx -s reload
```

## 🐛 Troubleshooting

### Erro 400 em chunks
1. Verificar se `.next/static/chunks` existe e tem permissões corretas
2. Verificar configuração do Nginx para `/_next/static/`
3. Limpar cache do navegador (Ctrl+Shift+R)
4. Rebuild completo: `rm -rf .next && npm run build`

### Erro 502/503 em APIs
1. Verificar se PM2 está rodando: `pm2 status`
2. Verificar logs: `pm2 logs precivox-auth`
3. Verificar se backend Express está rodando (porta 3001)
4. Verificar timeouts no Nginx

### Página piscando/travando
1. Verificar console do navegador para erros de chunk
2. Limpar cache do navegador completamente
3. Verificar se há service workers antigos (DevTools > Application > Service Workers)
4. Verificar se `NEXTAUTH_URL` está correto

### Espaços indevidos no layout
1. Verificar se ListaLateral está usando `fixed` corretamente
2. Verificar se há elementos com `margin` ou `padding` incorretos
3. Inspecionar no DevTools para identificar elemento causador

## 📝 Arquivos Modificados

1. `/root/next.config.js` - Configuração otimizada
2. `/root/nginx/nextjs-production.conf` - Roteamento melhorado
3. `/root/components/ListaLateral.tsx` - Espaçamentos padronizados
4. `/root/app/layout.tsx` - Handler de erros melhorado
5. `/root/scripts/verify-build.js` - Novo script
6. `/root/scripts/deploy-production.sh` - Novo script
7. `/root/scripts/setup-env-production.sh` - Novo script

## 🎯 Resultado Esperado

Após aplicar todas as correções:

✅ Sistema totalmente estável sem erros 400/502/503
✅ Frontend e backend carregando sem piscadas ou loops
✅ Layout totalmente responsivo sem espaços indevidos
✅ Build consistente e cacheado corretamente
✅ PM2 estável com uptime > 99%

## 📞 Suporte

Se os problemas persistirem após aplicar todas as correções:

1. Coletar logs completos:
   ```bash
   pm2 logs precivox-auth --lines 100 > logs-pm2.txt
   sudo tail -100 /var/log/nginx/precivox-error.log > logs-nginx-error.txt
   ```

2. Verificar console do navegador (F12) e salvar erros

3. Verificar build:
   ```bash
   node /root/scripts/verify-build.js > build-verification.txt
   ```

---

**Data da Correção**: $(date)
**Versão**: 1.0.0

