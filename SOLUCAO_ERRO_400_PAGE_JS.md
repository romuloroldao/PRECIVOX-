# Solução para Erro 400 - page-*.js não encontrado

## Problema Identificado

O erro `Failed to load resource: the server responded with a status of 400` ao tentar carregar `page-5851fced0b43ea2c.js` ocorre quando:

1. **Arquivo de build antigo**: O navegador está tentando carregar um arquivo JavaScript de um build anterior que não existe mais no servidor
2. **Configuração do Nginx**: O nginx estava retornando 400 em vez de 404 para arquivos estáticos não encontrados
3. **Ordem das locations**: As locations do nginx não estavam na ordem correta, causando conflitos

## Correções Implementadas

### 1. Configuração do Nginx (`nginx/production-nextjs.conf`)

#### Mudanças principais:

- ✅ **Ordem correta das locations**: Todas as locations `/_next/*` agora vêm ANTES de `location /`
- ✅ **Tratamento de erros**: Adicionado `proxy_intercept_errors off` para permitir que Next.js retorne 404 corretamente
- ✅ **Headers corretos**: Todos os headers necessários (Host, X-Real-IP, etc.) estão sendo passados
- ✅ **Timeouts otimizados**: Timeouts reduzidos para arquivos estáticos (5s em vez de 10s)
- ✅ **Cache adequado**: Headers de cache configurados corretamente com `always` flag

#### Estrutura corrigida:

```nginx
# 1. API routes (Next.js e Express)
location ~ ^/api/(markets|planos|auth) { ... }
location /api { ... }

# 2. Arquivos estáticos do Next.js (ANTES de location /)
location /_next/static { ... }
location /_next/image { ... }
location ~ ^/_next/(chunks|webpack-runtime) { ... }

# 3. Frontend Next.js (catch-all - DEPOIS de tudo)
location / { ... }
```

### 2. Por que isso resolve o problema?

1. **404 em vez de 400**: Com `proxy_intercept_errors off`, o Next.js pode retornar 404 corretamente quando um arquivo não existe
2. **Cache do navegador**: Quando o navegador recebe 404, ele sabe que deve invalidar o cache e buscar o arquivo correto do novo build
3. **Headers corretos**: Headers adequados garantem que o Next.js receba todas as informações necessárias

### 3. Comportamento Esperado

- ✅ Arquivos válidos retornam 200 com cache agressivo
- ✅ Arquivos não encontrados retornam 404 (não 400)
- ✅ Navegador invalida cache automaticamente ao receber 404
- ✅ Novos builds são carregados corretamente

## Como Aplicar as Correções

### 1. Verificar qual arquivo nginx está em uso:

```bash
# Verificar qual arquivo está sendo usado
ls -la /etc/nginx/sites-enabled/
cat /etc/nginx/nginx.conf | grep include
```

### 2. Copiar a configuração corrigida:

```bash
# Se o arquivo em uso for diferente, copie as correções
# As correções estão em: /root/nginx/production-nextjs.conf
```

### 3. Testar a configuração:

```bash
# Testar sintaxe do nginx
sudo nginx -t
```

### 4. Recarregar o nginx:

```bash
# Recarregar configuração sem downtime
sudo nginx -s reload
```

### 5. Limpar cache do navegador:

Para testar, limpe o cache do navegador ou use modo anônimo:
- Chrome/Edge: Ctrl+Shift+Delete ou Ctrl+Shift+N (modo anônimo)
- Firefox: Ctrl+Shift+Delete ou Ctrl+Shift+P (modo privado)

## Verificação

### Verificar se o erro foi resolvido:

1. Abra o console do navegador (F12)
2. Acesse o site
3. Verifique se:
   - Arquivos válidos retornam 200
   - Arquivos antigos retornam 404 (não 400)
   - Não há mais erros 400 no console

### Verificar logs do nginx:

```bash
# Ver logs de erro
sudo tail -f /var/log/nginx/precivox-error.log

# Ver logs de acesso
sudo tail -f /var/log/nginx/precivox-access.log | grep "_next"
```

## Prevenção Futura

### 1. Builds consistentes:

- Sempre faça `npm run build` antes de fazer deploy
- Não misture arquivos de builds diferentes
- Use versionamento adequado

### 2. Cache do Next.js:

O Next.js já gerencia corretamente os hashes dos arquivos. Cada build gera novos hashes, então:
- Arquivos antigos não são mais referenciados
- Navegador busca automaticamente os novos arquivos

### 3. Monitoramento:

- Monitore logs do nginx regularmente
- Configure alertas para muitos erros 404 de `/_next/static`
- Isso pode indicar problemas de build ou deploy

## Notas Técnicas

### Por que `proxy_intercept_errors off` é importante?

- `proxy_intercept_errors on` (padrão em algumas versões): Nginx intercepta erros e pode transformar 404 em 400
- `proxy_intercept_errors off`: Permite que o Next.js retorne códigos de status HTTP corretos

### Por que a ordem das locations importa?

No nginx, a ordem de precedência é:
1. Prefixos exatos (`=`)
2. Prefixos mais longos
3. Regex (`~`)
4. Prefixos genéricos

Se `location /` vier antes de `location /_next/static`, o nginx pode processar requisições para `/_next/static` através da location genérica, causando problemas.

## Arquivos Modificados

- `/root/nginx/production-nextjs.conf` - Configuração do nginx corrigida

## Suporte

Se o problema persistir após aplicar as correções:

1. Verifique se o Next.js está rodando corretamente: `ps aux | grep next`
2. Verifique se o build está atualizado: `ls -la /root/.next/static/chunks/app/`
3. Verifique logs do Next.js: `pm2 logs` ou logs do processo
4. Limpe o cache do navegador completamente

