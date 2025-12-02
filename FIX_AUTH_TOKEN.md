# 🔧 Correção: Token de Autenticação no Frontend

## Problema Identificado
- **Erro**: "Token não fornecido" (401) ao criar mercado
- **Causa**: Frontend não envia header `Authorization: Bearer <token>`
- **Backend espera**: Token JWT no header Authorization
- **Frontend envia**: Apenas cookies (credentials: 'include')

## Solução

### Opção 1: Modificar apiFetch para incluir token do NextAuth
```typescript
import { getSession } from 'next-auth/react';

export async function apiFetch(path, options) {
  const session = await getSession();
  const token = session?.accessToken || session?.user?.token;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options?.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return fetch(url, {
    ...options,
    credentials: 'include',
    headers,
  });
}
```

### Opção 2: Modificar backend para aceitar cookies do NextAuth
Adicionar middleware que verifica cookies além do header Authorization.

## Recomendação
**Opção 1** é mais simples e mantém a arquitetura atual do backend.

---
**Status**: Aguardando implementação
