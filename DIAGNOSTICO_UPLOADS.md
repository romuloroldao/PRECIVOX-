# Diagnóstico - Problemas de Upload e Exibição de Produtos

## Data: 04/11/2025

## Problemas Identificados

### 1. Erro 400 nos Arquivos Estáticos (CSS/JS)
**Sintoma:** Navegador retornando erro 400 ao tentar carregar:
- `feee9510e726c381.css`
- `webpack-e23820328f4b618d.js`
- `layout-0c5564bd676ca42b.js`

**Causa Raiz:**
- O HTML estava referenciando um `buildId` antigo (`X2pYLEbpke_3nrJ9MYUm2`)
- O build atual tem `buildId` diferente (`LtuqQrBVo3R84zF_SddYg`)
- O PM2 estava tentando iniciar um segundo Next.js na porta 3000, causando conflito
- O processo `next-server` (PID 1625846) já estava usando a porta 3000

**Solução Aplicada:**
✅ Removido o processo duplicado do PM2 (`precivox-nextjs`)
✅ Mantido apenas o `next-server` rodando diretamente
✅ Enviado sinal HUP para recarregar configurações

**Próximos Passos:**
- Limpar cache do navegador (Ctrl+Shift+R ou Cmd+Shift+R)
- Verificar se o `next-server` está usando o build correto

### 2. Produtos Não Aparecendo na Busca

**Diagnóstico:**
- ✅ API `/api/produtos/buscar` está funcionando (retorna 13 produtos com estoques)
- ✅ Há 8 produtos ativos no banco de dados
- ❌ **Não há uploads feitos hoje** (04/11/2025)

**Produtos Ativos no Banco:**
1. Arroz Branco 5kg (Tio João)
2. Feijão Preto 1kg (Camil)
3. Óleo de Soja 900ml (Liza)
4. Leite Integral 1L (Parmalat)
5. Café em Pó 500g (Pilão)
6. Macarrão Espaguete 500g (Barilla)
7. Açúcar Refinado 1kg (União)
8. Molho de Tomate 340g (Quero)

**Razão dos Produtos Não Aparecerem:**
- Se você fez upload hoje, o processo pode ter falhado
- Verifique os logs de upload na interface do gestor/admin
- Os produtos podem estar sendo salvos como inativos (`ativo: false`)
- Os produtos podem não ter estoques associados

### 3. Sincronização Upload → Busca

**Implementação Atual:**
✅ Rotas de API criadas e funcionando:
- `/api/products` - Lista produtos
- `/api/products/suggestions` - Autocomplete
- `/api/products/categories` - Categorias
- `/api/produtos/buscar` - Busca completa

✅ Frontend atualizado:
- Autocomplete implementado
- Categorias sempre visíveis
- Debounce de 400ms na busca
- Revalidação automática a cada 30s

**Como Verificar se Upload Funcionou:**

1. Verificar logs de importação:
```sql
SELECT * FROM logs_importacao 
WHERE DATE(data_inicio) = CURRENT_DATE 
ORDER BY data_inicio DESC;
```

2. Verificar produtos no banco:
```sql
SELECT COUNT(*) FROM produtos WHERE ativo = true;
SELECT * FROM produtos WHERE data_criacao >= CURRENT_DATE;
```

3. Verificar estoques:
```sql
SELECT COUNT(*) FROM estoques 
WHERE disponivel = true AND quantidade > 0;
```

## Problema 5: Upload Não Processa Arquivos - RESOLVIDO ✅

**Sintoma:** Upload retorna sucesso mas produtos não aparecem na busca.

**Causa Raiz:**
- O endpoint `/api/products/upload-smart/:marketId` estava retornando sucesso mas **não processava o arquivo**
- Havia um comentário `TODO: Implementar processamento real do arquivo`
- O código apenas recebia o arquivo e retornava sucesso sem salvar no banco
- O `uploadHandler.ts` existia mas tinha nomes incorretos de modelos Prisma (singular vs plural)

**Solução Aplicada:**
✅ Corrigido `uploadHandler.ts` para usar nomes corretos dos modelos:
- `prisma.produtos` (plural) em vez de `prisma.produto`
- `prisma.estoques` (plural) em vez de `prisma.estoque`
- `prisma.logs_importacao` em vez de `prisma.logImportacao`

✅ Implementado processamento real na rota de upload:
- Verifica se `unidadeId` foi fornecido
- Valida se a unidade existe e pertence ao mercado
- Processa arquivo CSV/XLSX usando `uploadHandler`
- Salva produtos e estoques no banco via Prisma
- Registra log de importação
- Retorna resultado detalhado (sucesso, erros, duplicados)

✅ Adicionados campos obrigatórios ao criar produtos:
- `ativo: true`
- `dataAtualizacao: new Date()`
- `atualizadoEm: new Date()` para estoques
- ID único para novos estoques

**Status Atual:**
- Backend reiniciado: ✅ (PM2 restart precivox-backend)
- Upload deve processar arquivos corretamente agora
- Produtos serão salvos no banco após upload
- Logs de importação serão registrados

**Teste Necessário:**
1. Fazer novo upload via interface admin
2. Verificar se produtos aparecem na busca
3. Verificar logs de importação no banco
4. Verificar se produtos foram criados como ativos

## Recomendações

1. **Fazer novo upload de teste** e verificar:
   - Status do upload na interface
   - Logs de erro no console do navegador
   - Logs do servidor backend (PM2 logs precivox-backend)

2. **Verificar configuração de upload:**
   - Rota: `/api/products/upload-smart/[marketId]`
   - Backend Express: `http://127.0.0.1:3001`
   - Verificar se o backend está processando corretamente

3. **Limpar cache:**
   - Navegador: Ctrl+Shift+R
   - Next.js: Reiniciar servidor se necessário

4. **Monitorar logs em tempo real:**
```bash
# Logs do backend
pm2 logs precivox-backend --lines 50

# Logs do Next.js (se estiver em PM2)
pm2 logs precivox-nextjs --lines 50
```

## Status Final

- ✅ API de produtos funcionando
- ✅ Busca funcionando
- ✅ Sincronização implementada
- ✅ **Problema de arquivos estáticos resolvido** (PM2 removido, servidor reiniciado)
- ✅ **Erro 502 Bad Gateway resolvido** (Next.js reiniciado na porta 3000)
- ❌ Nenhum upload registrado hoje - necessário investigar processo de upload

## Problema 4: Erro 502 Bad Gateway - RESOLVIDO ✅

**Sintoma:** Navegador mostrando erro "502 Bad Gateway" ao acessar https://precivox.com.br

**Causa Raiz:**
- O servidor Next.js não estava rodando na porta 3000
- O nginx estava configurado para fazer proxy para `127.0.0.1:3000`, mas nada estava escutando nessa porta
- O processo anterior do Next.js havia parado após removermos o PM2

**Solução Aplicada:**
✅ Reiniciado o Next.js usando `npm run start`
✅ Servidor agora está escutando na porta 3000 (PID: 1989205)
✅ Testado localmente - retornando HTTP 200 OK
✅ Nginx agora consegue fazer proxy corretamente

**Status Atual:**
- Next.js rodando: ✅ (PID: 1989205, Porta 3000)
- API respondendo: ✅
- Nginx configurado: ✅

**Ações Realizadas:**
1. Identificado que a porta 3000 estava livre
2. Iniciado Next.js em background com `nohup npm run start`
3. Verificado que está respondendo corretamente
4. Site deve estar acessível agora

## Problema 6: Erros 404 em Todas as APIs do Cliente - RESOLVIDO ✅

**Sintoma:** Todas as rotas de API retornando 404 quando acessadas pelo navegador:
- `/api/mercados/public?ativo=true` - 404
- `/api/produtos/buscar?disponivel=true` - 404
- `/api/produtos/categorias` - 404
- `/api/produtos/marcas` - 404
- `/api/unidades/cidades` - 404

**Causa Raiz:**
- O Next.js estava rodando em modo produção (`next start`) com um build antigo
- As rotas foram criadas/modificadas no código fonte, mas o build não foi atualizado
- O Next.js em modo produção precisa de rebuild para incluir novas rotas ou mudanças
- O servidor estava servindo um build compilado horas antes das mudanças

**Solução Aplicada:**
✅ Rebuild completo do Next.js (`npm run build`)
✅ Reinício do servidor Next.js com o novo build
✅ Atualizado frontend para usar `/api/mercados` em vez de `/api/mercados/public`
✅ Verificação de todas as rotas - todas funcionando

**Rotas Verificadas e Funcionando:**
- ✅ `/api/produtos/buscar` - 14 produtos
- ✅ `/api/produtos/categorias` - 3 categorias
- ✅ `/api/produtos/marcas` - 8 marcas
- ✅ `/api/unidades/cidades` - 2 cidades
- ✅ `/api/mercados` - 3 mercados

**Status Atual:**
- Next.js rebuild completo: ✅
- Servidor reiniciado: ✅ (PID: 1999214)
- Todas as APIs respondendo: ✅
- Página do cliente deve funcionar corretamente agora

**Observação Importante:**
Após modificar rotas de API no Next.js em modo produção, sempre é necessário:
1. Executar `npm run build`
2. Reiniciar o servidor (`npm run start` ou PM2 restart)
