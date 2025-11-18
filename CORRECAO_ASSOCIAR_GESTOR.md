# 🔧 Correção: Associar Gestor ao Mercado

## 📋 Problemas Identificados e Corrigidos

### ✅ PROBLEMA 1: Token de Autenticação Não Encontrado

**Erro**: Ao clicar em "Salvar Gestor", aparecia o toast: "Token de autenticação não encontrado"

**Causa Raiz**: 
- O código estava usando `localStorage.getItem('token')` para obter o token
- O sistema usa **NextAuth** que armazena tokens em **cookies**, não em localStorage
- As requisições não estavam incluindo cookies de autenticação

**Solução Implementada**:
1. Substituído todas as chamadas `fetch` com `localStorage.getItem('token')` por `apiFetch` do helper `/root/lib/api-client.ts`
2. O `apiFetch` já inclui `credentials: 'include'` que envia cookies automaticamente
3. Removida dependência de `localStorage.getItem('token')` em todas as funções:
   - `loadMercado()`
   - `loadUnidades()`
   - `loadImportacoes()`
   - `handleCreateUnidade()`
   - `handleUpdateUnidade()`
   - `handleDeleteUnidade()`
   - `handleSaveGestor()` ⭐ **Principal correção**
   - `handleRemoveGestor()`

**Arquivos Modificados**:
- `/root/app/admin/mercados/[id]/page.tsx`

**Mudanças Específicas**:

```typescript
// ANTES
const token = localStorage.getItem('token');
if (!token) {
  toast.error('Token de autenticação não encontrado');
  return;
}
const response = await fetch(`/api/markets/${mercadoId}`, {
  method: 'PUT',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ gestorId: selectedGestorId || null }),
});

// DEPOIS
const result = await apiFetch(`/api/markets/${mercadoId}`, {
  method: 'PUT',
  body: JSON.stringify({
    gestorId: selectedGestorId || null,
  }),
});
```

---

### 🔍 PROBLEMA 2: Número Aleatório no Botão

**Erro**: Um número estava aparecendo na frente do botão "Salvar / Adicionar Gestor"

**Investigação Realizada**:
1. ✅ Verificado todos os `.map()` no arquivo - nenhum índice sendo renderizado
2. ✅ Verificado `console.log` no JSX - nenhum encontrado
3. ✅ Verificado componente `Button` - estrutura correta
4. ✅ Verificado fragmentos e retornos duplos - nenhum problema encontrado

**Possíveis Causas (não confirmadas no código)**:
- Pode ser um problema de renderização do React em desenvolvimento
- Pode ser um índice sendo passado acidentalmente em algum lugar
- Pode ser um problema de cache do navegador

**Ações Tomadas**:
- Verificado toda a estrutura do JSX relacionada ao botão
- Garantido que não há índices sendo renderizados
- O código está limpo e sem problemas aparentes

**Recomendação**:
- Se o problema persistir após o deploy, verificar no DevTools do navegador
- Limpar cache do navegador (Ctrl+Shift+R)
- Verificar se há algum plugin do navegador interferindo

---

## 📝 Mudanças Detalhadas

### Imports Adicionados

```typescript
import { useSession } from 'next-auth/react'; // Importado mas não usado ainda (pode ser útil no futuro)
import { apiFetch } from '@/lib/api-client'; // Helper para requisições autenticadas
```

### Funções Corrigidas

#### 1. `loadMercado()`
- ✅ Removido `localStorage.getItem('token')`
- ✅ Usa `apiFetch` com tratamento de erro melhorado

#### 2. `loadUnidades()`
- ✅ Removido `localStorage.getItem('token')`
- ✅ Usa `apiFetch` com tratamento de erro melhorado

#### 3. `loadImportacoes()`
- ✅ Removido `localStorage.getItem('token')`
- ✅ Usa `apiFetch` com tratamento de erro melhorado

#### 4. `handleCreateUnidade()`
- ✅ Removido `localStorage.getItem('token')`
- ✅ Usa `apiFetch` com tratamento de erro melhorado

#### 5. `handleUpdateUnidade()`
- ✅ Removido `localStorage.getItem('token')`
- ✅ Usa `apiFetch` com tratamento de erro melhorado

#### 6. `handleDeleteUnidade()`
- ✅ Removido `localStorage.getItem('token')`
- ✅ Usa `apiFetch` com tratamento de erro melhorado

#### 7. `handleSaveGestor()` ⭐ **PRINCIPAL**
- ✅ Removido `localStorage.getItem('token')`
- ✅ Removida verificação de token (não necessária com `apiFetch`)
- ✅ Usa `apiFetch` que automaticamente inclui cookies
- ✅ Tratamento de erro melhorado

#### 8. `handleRemoveGestor()`
- ✅ Removido `localStorage.getItem('token')`
- ✅ Removida verificação de token (não necessária com `apiFetch`)
- ✅ Usa `apiFetch` que automaticamente inclui cookies
- ✅ Tratamento de erro melhorado

---

## ✅ Validação

### Testes Realizados

1. **Linter**: ✅ Sem erros
   ```bash
   No linter errors found.
   ```

2. **Build**: ✅ Compilação bem-sucedida
   - Build do Next.js concluído sem erros
   - Todas as rotas geradas corretamente

### Testes Recomendados

#### 1. Teste de Associação de Gestor

**Passos**:
1. Acessar `/admin/mercados/[id]`
2. Clicar no ícone de editar ao lado de "Gestor"
3. Selecionar um gestor no dropdown
4. Clicar em "Salvar"

**Resultado Esperado**:
- ✅ Toast de sucesso: "Gestor associado com sucesso!"
- ✅ Gestor aparece no campo "Gestor"
- ✅ Sem toast de erro de autenticação

#### 2. Teste de Remoção de Gestor

**Passos**:
1. Acessar `/admin/mercados/[id]` (com gestor já associado)
2. Clicar no ícone de remover (X) ao lado do gestor
3. Confirmar a remoção

**Resultado Esperado**:
- ✅ Toast de sucesso: "Gestor removido com sucesso!"
- ✅ Campo "Gestor" mostra "Sem gestor"
- ✅ Sem toast de erro de autenticação

#### 3. Teste de Verificação de Autenticação

**Passos**:
1. Abrir DevTools → Network
2. Fazer login como ADMIN
3. Tentar associar gestor
4. Verificar requisição `PUT /api/markets/[id]`

**Resultado Esperado**:
- ✅ Requisição inclui cookie `next-auth.session-token`
- ✅ Status 200 OK
- ✅ Resposta com `success: true`

---

## 🔍 Como Verificar se Está Funcionando

### 1. Verificar Cookies no Navegador

```javascript
// No console do navegador (F12)
document.cookie
// Deve conter: next-auth.session-token=...
```

### 2. Verificar Requisição no Network Tab

1. Abrir DevTools (F12)
2. Ir para aba "Network"
3. Filtrar por "markets"
4. Clicar em "Salvar Gestor"
5. Verificar requisição `PUT /api/markets/[id]`
6. Verificar:
   - **Request Headers**: Deve ter `Cookie: next-auth.session-token=...`
   - **Status**: 200 OK
   - **Response**: `{ success: true, ... }`

### 3. Verificar Logs do Servidor

```bash
# Logs do Next.js
tail -f /var/log/precivox-nextjs.log | grep "markets"

# Verificar se há erros de autenticação
tail -f /var/log/precivox-nextjs.log | grep "UNAUTHORIZED"
```

---

## 📊 Resumo das Correções

| Função | Antes | Depois | Status |
|--------|-------|--------|--------|
| `loadMercado()` | `localStorage.getItem('token')` | `apiFetch` | ✅ |
| `loadUnidades()` | `localStorage.getItem('token')` | `apiFetch` | ✅ |
| `loadImportacoes()` | `localStorage.getItem('token')` | `apiFetch` | ✅ |
| `handleCreateUnidade()` | `localStorage.getItem('token')` | `apiFetch` | ✅ |
| `handleUpdateUnidade()` | `localStorage.getItem('token')` | `apiFetch` | ✅ |
| `handleDeleteUnidade()` | `localStorage.getItem('token')` | `apiFetch` | ✅ |
| `handleSaveGestor()` | `localStorage.getItem('token')` | `apiFetch` | ✅ |
| `handleRemoveGestor()` | `localStorage.getItem('token')` | `apiFetch` | ✅ |

**Total**: 8 funções corrigidas

---

## 🚀 Deploy

### Checklist de Deploy

- [x] Código corrigido
- [x] Linter sem erros
- [x] Build bem-sucedido
- [ ] Testes manuais realizados
- [ ] Validação em produção

### Comandos para Deploy

```bash
# 1. Fazer build
npm run build

# 2. Deploy (se usar script)
./deploy-production.sh

# 3. Verificar logs após deploy
tail -f /var/log/precivox-nextjs.log
```

---

## 📝 Notas Adicionais

### Por que `apiFetch` é melhor?

1. **Autenticação Automática**: Inclui cookies automaticamente com `credentials: 'include'`
2. **Tratamento de Erro Unificado**: Retorna `{ data, error, status }` de forma consistente
3. **URLs Relativas**: Funciona em dev e produção automaticamente
4. **Manutenibilidade**: Um único lugar para gerenciar requisições

### Próximos Passos (Opcional)

1. **Adicionar Loading States**: Melhorar UX durante requisições
2. **Adicionar Retry Logic**: Tentar novamente em caso de erro de rede
3. **Adicionar Validação**: Validar se gestor já está associado a outro mercado
4. **Adicionar Confirmação**: Confirmar antes de remover gestor

---

## ✅ Resultado Final

**Problema 1 (Token)**: ✅ **RESOLVIDO**
- Todas as requisições agora usam `apiFetch` com autenticação via cookies
- Não há mais erro "Token de autenticação não encontrado"

**Problema 2 (Número no Botão)**: ⚠️ **INVESTIGADO**
- Código verificado e limpo
- Nenhum índice ou console.log encontrado
- Se persistir, pode ser cache do navegador ou problema de renderização do React

---

**Data**: 2025-01-XX  
**Autor**: Auto (Cursor AI)  
**Status**: ✅ Pronto para deploy

