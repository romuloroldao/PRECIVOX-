# ✅ SOLUÇÃO: Erros de MIME Type no PRECIVOX

**Data**: 25/11/2025  
**Status**: ✅ RESOLVIDO

## 🔴 Problema Identificado

Ao acessar https://precivox.com.br, o console do navegador apresentava os seguintes erros:

```
Refused to apply style from 'https://precivox.com.br/_next/static/css/2c612c8768a47ce1.css' 
because its MIME type ('text/html') is not a supported stylesheet MIME type

Failed to load resource: the server responded with a status of 404 ()
page-19e776563c8236ec.js:1

Refused to execute script from 'https://precivox.com.br/_next/static/chunks/app/page-19e776563c8236ec.js' 
because its MIME type ('text/html') is not executable
```

## 🔍 Causa Raiz

O problema ocorreu devido a **dessincronia entre o servidor Next.js e os arquivos estáticos no Nginx**:

1. **Servidor Next.js** (porta 3000): Rodando com build ID antigo `build-1764001544603-7hm3iq`
2. **Arquivos estáticos Nginx** (`/var/www/precivox`): Build ID diferente `build-1764003969328-wacqp`
3. **Build local** (`.next/static`): Build ID mais recente `build-1764038495751-h8vb3`

### Por que isso aconteceu?

- O HTML gerado pelo Next.js referenciava arquivos CSS/JS com hashes específicos do build
- Esses arquivos não existiam no diretório servido pelo Nginx
- O Nginx retornava páginas 404 em HTML, mas o navegador esperava CSS/JS
- Resultado: MIME type `text/html` em vez de `text/css` ou `application/javascript`

## ✅ Solução Implementada

### 1. Rebuild Completo da Aplicação

```bash
bash deploy-production.sh
```

Isso executou:
- Parou processos antigos do Next.js e Backend
- Limpou cache e build anterior (`rm -rf .next`)
- Fez novo build (`npm run build`)
- Sincronizou arquivos estáticos para `/var/www/precivox`
- Reiniciou serviços

### 2. Correção de Processos Duplicados

O problema inicial foi que processos antigos do Next.js não foram completamente encerrados. Solução:

```bash
# Matar processos antigos
pkill -9 -f "next-server"
pkill -9 -f "npm.*start"

# Reiniciar Next.js
nohup npm start > /var/log/precivox-nextjs.log 2>&1 &
```

### 3. Melhoria no Script de Deploy

Atualizamos `/root/deploy-production.sh` para:

- Matar processos com `-9` (força)
- Verificar múltiplos padrões de processo
- Aguardar 2 segundos após matar processos
- Verificar se porta 3000 está livre antes de iniciar
- Usar `fuser -k 3000/tcp` como fallback

## 📊 Verificação da Solução

### Antes (❌ Erro)
```bash
$ curl -I https://precivox.com.br/_next/static/css/2c612c8768a47ce1.css
HTTP/2 404
content-type: text/html  # ❌ Errado!
```

### Depois (✅ Funcionando)
```bash
$ curl -I https://precivox.com.br/_next/static/css/77b168f7c598ec79.css
HTTP/2 200
content-type: text/css  # ✅ Correto!
content-length: 52595

$ curl -I https://precivox.com.br/_next/static/chunks/app/page-ac16937181f0479d.js
HTTP/2 200
content-type: application/javascript  # ✅ Correto!
```

### Build IDs Sincronizados

```bash
# Next.js Server (localhost:3000)
build-1764083656661-31ra9f ✅

# Nginx Static Files (/var/www/precivox)
build-1764083656661-31ra9f ✅
```

## 🎯 Status Final

✅ **CSS**: Carregando corretamente (`77b168f7c598ec79.css`)  
✅ **JavaScript**: Carregando corretamente (`page-ac16937181f0479d.js`)  
✅ **MIME Types**: Corretos (`text/css` e `application/javascript`)  
✅ **Build IDs**: Sincronizados entre Next.js e Nginx  
✅ **Site**: Funcionando em https://precivox.com.br

## 🔧 Comandos Úteis para Diagnóstico

```bash
# Verificar build ID do Next.js
curl -s http://localhost:3000 | grep -o 'build-[^"]*' | head -1

# Verificar build ID no Nginx
ls -la /var/www/precivox/_next/static/ | grep build

# Verificar processos Next.js
ps aux | grep -E "next|3000" | grep -v grep

# Verificar porta 3000
lsof -i :3000
ss -tulpn | grep :3000

# Testar CSS/JS em produção
curl -I https://precivox.com.br/_next/static/css/[hash].css
curl -I https://precivox.com.br/_next/static/chunks/app/page-[hash].js
```

## 📝 Prevenção Futura

Para evitar esse problema no futuro:

1. **Sempre use o script de deploy**: `bash deploy-production.sh`
2. **Não faça builds parciais**: Sempre rebuild completo
3. **Verifique sincronização**: Build IDs devem ser idênticos
4. **Limpe cache do navegador**: Após deploy, use Ctrl+Shift+R
5. **Monitore logs**: `/var/log/precivox-nextjs.log` e `/var/log/precivox-backend.log`

## 🚀 Próximos Passos

Se o problema ocorrer novamente:

1. Execute `bash deploy-production.sh`
2. Se persistir, verifique build IDs com os comandos acima
3. Se necessário, mate processos manualmente e reinicie
4. Limpe cache do navegador (Ctrl+Shift+R ou modo anônimo)

---

**Documentado por**: Antigravity AI  
**Última atualização**: 25/11/2025 12:19 BRT
