# Correção do Endpoint GET /api/produtos/analises-precos

## 🎯 Problema Original

- **Erro 404**: `GET https://precivox.com.br/api/produtos/analises-precos` retornando 404 (Not Found)
- **Causa**: Rota não existia no back-end (Next.js)
- **Impacto**: Front-end não conseguia carregar análises de preços

## ✅ Solução Implementada

### 1. Arquivos Criados

#### `/root/app/api/produtos/analises-precos/route.ts`
- **Rota GET**: Implementada com autenticação, autorização e validação
- **Funcionalidade**: 
  - Agrupa estoques por produtoId
  - Calcula estatísticas (preço médio, mínimo, máximo)
  - Determina tendência (alta/baixa/estável) baseada em variação histórica
  - Gera recomendações personalizadas
  - Implementa paginação (offset/limit)
  - Filtra por mercados do gestor (role GESTOR)
  - Logs com request ID e correlation

#### `/root/lib/api-client.ts`
- **Helper de API**: Funções utilitárias para requisições HTTP
- **Funções**:
  - `getApiUrl()`: Obtém URL base baseada no ambiente
  - `getApiEndpoint(path)`: Constrói URL completa para uma rota
  - `apiFetch<T>(path, options)`: Fetch com tratamento de erro robusto

### 2. Arquivos Modificados

#### `/root/components/ModuloIA.tsx`
- **Mudanças**:
  - Substituído `fetch` direto por `apiFetch` helper
  - Adicionado estado `error` para tratamento de erros
  - Implementado UI de erro com mensagem clara
  - Adicionado botão "Tentar Novamente" para retry
  - Adicionado detalhes técnicos expansíveis em dev mode
  - Suporte para formato novo (`items`) e antigo (array direto)
  - Telemetria para erros (evento `api_request_failed`)

#### `/root/nginx/production-nextjs.conf`
- **Mudanças**:
  - Adicionado `location /api/produtos` (ANTES de `location /api`)
  - Configurado para proxy_pass para `nextjs_upstream` (porta 3000)
  - Garante que rotas `/api/produtos/*` vão para Next.js, não Express

#### `/root/env.example`
- **Mudanças**:
  - Adicionado `NEXT_PUBLIC_API_URL` e `API_URL`
  - Adicionado `DATABASE_URL`
  - Adicionado variáveis NextAuth
  - Documentado uso em dev/prod

## 📋 Contrato da API

### Endpoint
```
GET /api/produtos/analises-precos
```

### Autenticação
- Requer sessão válida (NextAuth)
- Roles permitidos: `ADMIN`, `GESTOR`, `CLIENTE`

### Query Parameters (opcionais)
- `produtoId` (string): Filtrar por produto específico
- `limit` (number, padrão: 50): Número máximo de resultados
- `offset` (number, padrão: 0): Offset para paginação

### Resposta de Sucesso (200)
```json
{
  "items": [
    {
      "id": "ap-produtoId-0",
      "produtoId": "prod-123",
      "produtoNome": "Arroz Branco 5kg",
      "data": "2025-11-14",
      "preco": 19.90,
      "precoMedio": 22.50,
      "precoMin": 19.90,
      "precoMax": 25.00,
      "tendencia": "baixa",
      "recomendacao": "Preço em queda. Pode ser um bom momento para comprar.",
      "moeda": "BRL"
    }
  ],
  "count": 1,
  "total": 50,
  "offset": 0,
  "limit": 50
}
```

### Respostas de Erro

#### 401 Unauthorized
```json
{
  "success": false,
  "error": "Não autenticado",
  "code": "UNAUTHORIZED"
}
```

#### 403 Forbidden
```json
{
  "success": false,
  "error": "Acesso negado",
  "code": "FORBIDDEN"
}
```

#### 404 Not Found
```json
{
  "success": false,
  "error": "Recurso não encontrado",
  "code": "NOT_FOUND"
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Erro ao buscar análises de preços",
  "code": "INTERNAL_SERVER_ERROR",
  "message": "Detalhes do erro"
}
```

## 🔍 Como Validar

### 1. Validação Local (Desenvolvimento)

```bash
# 1. Fazer build
npm run build

# 2. Iniciar servidor
npm run dev

# 3. Testar endpoint (com autenticação)
curl -X GET http://localhost:3000/api/produtos/analises-precos \
  -H "Cookie: next-auth.session-token=SEU_TOKEN"
```

### 2. Validação em Produção

```bash
# 1. Verificar se a rota está acessível
curl -I https://precivox.com.br/api/produtos/analises-precos

# 2. Verificar logs do servidor
pm2 logs precivox-nextjs --lines 50

# 3. Verificar logs do Nginx
sudo tail -f /var/log/nginx/precivox-access.log
sudo tail -f /var/log/nginx/precivox-error.log
```

### 3. Validação no Front-end

1. Acesse https://precivox.com.br
2. Faça login
3. Abra o módulo de IA (botão "IA" na página de busca)
4. Clique na aba "Análises"
5. Verifique se as análises carregam ou se há mensagem de erro adequada

### 4. Validação de Tratamento de Erro

1. **404**: Se não houver dados, deve mostrar: "Nenhum dado encontrado para análises de preços."
2. **Erro de rede**: Deve mostrar mensagem de erro com botão "Tentar Novamente"
3. **Dev mode**: Deve mostrar detalhes técnicos expansíveis

## 📊 Observabilidade

### Logs do Servidor
- Request ID: `req-{timestamp}-{random}`
- Correlation ID: `X-Request-ID` header
- Tempo de resposta: `X-Response-Time` header
- Logs estruturados: `[${requestId}] GET /api/produtos/analises-precos - Sucesso/Erro`

### Telemetria (Front-end)
- Evento: `api_request_failed`
- Categoria: `API`
- Label: `analises-precos`
- Acionado quando há erro na requisição

## 🔧 Configuração de Variáveis de Ambiente

### Desenvolvimento (`.env.local`)
```env
NEXT_PUBLIC_API_URL=
API_URL=
NODE_ENV=development
DATABASE_URL=postgresql://postgres:senha@localhost:5432/precivox
```

### Produção (`.env.production`)
```env
NEXT_PUBLIC_API_URL=https://precivox.com.br
API_URL=https://precivox.com.br
NODE_ENV=production
DATABASE_URL=postgresql://usuario:senha@host:5432/precivox
```

## 🚀 Deploy

### Passos para Deploy

1. **Fazer build**
   ```bash
   npm run build
   ```

2. **Copiar assets estáticos**
   ```bash
   rm -rf .next/standalone/.next/static
   mkdir -p .next/standalone/.next
   cp -R .next/static .next/standalone/.next/static
   ```

3. **Reiniciar servidor Next.js**
   ```bash
   pm2 restart precivox-nextjs
   ```

4. **Recarregar Nginx**
   ```bash
   sudo systemctl reload nginx
   ```

5. **Validar**
   ```bash
   curl -I https://precivox.com.br/api/produtos/analises-precos
   ```

## 🐛 Como Depurar se Voltar o 404

### 1. Verificar se a rota existe no build
```bash
grep -r "analises-precos" .next/standalone/.next/server
```

### 2. Verificar logs do servidor
```bash
pm2 logs precivox-nextjs --lines 100
```

### 3. Verificar configuração do Nginx
```bash
sudo nginx -t
sudo cat /etc/nginx/sites-enabled/precivox | grep -A 20 "/api/produtos"
```

### 4. Testar diretamente no servidor Next.js
```bash
curl -I http://localhost:3000/api/produtos/analises-precos
```

### 5. Verificar se o arquivo da rota existe
```bash
ls -la app/api/produtos/analises-precos/route.ts
```

## ✅ Checklist de Validação Final

- [x] Endpoint acessível: `GET /api/produtos/analises-precos` → 200 com JSON esperado
- [x] Front-end usa `apiFetch` helper (não hardcode de domínio)
- [x] Nginx proxy configurado: `/api/produtos` → `nextjs_upstream` (porta 3000)
- [x] Tratamento de erro robusto implementado
- [x] Loading, empty-state e erro visíveis
- [x] Logs com correlation IDs
- [x] Variáveis de ambiente documentadas em `.env.example`
- [x] UI de erro com botão "Tentar Novamente"
- [x] Detalhes técnicos expansíveis em dev mode

## 📝 Arquivos Modificados/Criados

### Criados:
1. `/root/app/api/produtos/analises-precos/route.ts` (272 linhas)
2. `/root/lib/api-client.ts` (109 linhas)
3. `/root/CORRECAO_ENDPOINT_ANALISES_PRECOS.md` (este arquivo)

### Modificados:
1. `/root/components/ModuloIA.tsx`
2. `/root/nginx/production-nextjs.conf`
3. `/root/env.example`

### Total de Mudanças:
- 5 arquivos modificados/criados
- 532 inserções, 8 deleções

## 🎉 Resultado

O endpoint `/api/produtos/analises-precos` agora:
- ✅ Existe e está funcional
- ✅ Retorna análises de preços baseadas nos estoques
- ✅ Tem tratamento de erro robusto
- ✅ Loga adequadamente para debugging
- ✅ Tem UI de erro clara para o usuário
- ✅ Está configurado corretamente no Nginx
- ✅ Usa variáveis de ambiente (não hardcode)

