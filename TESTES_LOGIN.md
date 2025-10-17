# 🧪 TESTES DO SISTEMA DE LOGIN - PRECIVOX

## 📋 CHECKLIST DE TESTES

Execute cada teste na ordem e marque como concluído:

---

## ✅ TESTE 1: LOGIN COM ADMIN

### Passos:
1. Iniciar servidor: `npm run dev`
2. Abrir navegador em `http://localhost:3000`
3. Verificar redirecionamento automático para `/login`
4. Inserir credenciais:
   - Email: `admin@precivox.com`
   - Senha: `senha123`
5. Clicar em "Login"
6. Aguardar processamento

### Resultado Esperado:
- ✅ Não deve haver loop ou piscar
- ✅ Deve redirecionar para `/admin/dashboard`
- ✅ Dashboard deve carregar corretamente
- ✅ Não deve voltar para login

### Status: [ ]

---

## ✅ TESTE 2: PROTEÇÃO DE ROTA (Admin tentando acessar área cliente)

### Passos:
1. Estar logado como ADMIN
2. Abrir nova aba
3. Acessar `http://localhost:3000/cliente/home`

### Resultado Esperado:
- ✅ Deve permitir acesso (Admin pode acessar tudo)
- ✅ Não deve redirecionar

### Status: [ ]

---

## ✅ TESTE 3: LOGOUT

### Passos:
1. Estar logado
2. Abrir DevTools (F12)
3. Console > Digitar: `signOut()`
4. Pressionar Enter

### Resultado Esperado:
- ✅ Deve fazer logout
- ✅ Deve redirecionar para `/login`
- ✅ Tentar acessar `/admin/dashboard` deve redirecionar para `/login`

### Status: [ ]

---

## ✅ TESTE 4: PERSISTÊNCIA DE SESSÃO

### Passos:
1. Fazer login
2. Verificar que está logado
3. Fechar COMPLETAMENTE o navegador
4. Reabrir navegador
5. Acessar `http://localhost:3000`

### Resultado Esperado:
- ✅ Deve estar ainda logado
- ✅ Deve redirecionar para dashboard correto
- ✅ Não deve pedir login novamente

### Status: [ ]

---

## ✅ TESTE 5: LOGIN COM CREDENCIAIS INVÁLIDAS

### Passos:
1. Estar deslogado
2. Acessar `/login`
3. Inserir:
   - Email: `admin@precivox.com`
   - Senha: `senhaerrada`
4. Clicar em "Login"

### Resultado Esperado:
- ✅ Deve mostrar mensagem de erro
- ✅ Deve permanecer na página de login
- ✅ Não deve fazer login

### Status: [ ]

---

## ✅ TESTE 6: CADASTRO DE NOVO USUÁRIO

### Passos:
1. Estar deslogado
2. Acessar `/login`
3. Clicar em "Cadastre-se gratuitamente"
4. Preencher formulário:
   - Nome: `Teste Usuário`
   - Email: `teste@exemplo.com`
   - Senha: `Senha123` (com maiúscula e número)
5. Clicar em "Cadastrar"

### Resultado Esperado:
- ✅ Deve criar conta com sucesso
- ✅ Deve fazer login automático
- ✅ Deve redirecionar para `/cliente/home`
- ✅ Usuário deve ter role CLIENTE

### Status: [ ]

---

## ✅ TESTE 7: EMAIL DUPLICADO

### Passos:
1. Tentar cadastrar com email já existente
2. Usar: `admin@precivox.com`

### Resultado Esperado:
- ✅ Deve mostrar erro "Este email já está cadastrado"
- ✅ Não deve criar conta duplicada

### Status: [ ]

---

## ✅ TESTE 8: ACESSO DIRETO A ROTA PROTEGIDA

### Passos:
1. Estar DESLOGADO
2. Tentar acessar diretamente: `http://localhost:3000/admin/dashboard`

### Resultado Esperado:
- ✅ Middleware deve bloquear
- ✅ Deve redirecionar para `/login`

### Status: [ ]

---

## ✅ TESTE 9: CLIENTE TENTANDO ACESSAR ÁREA ADMIN

### Passos:
1. Fazer login como CLIENTE
2. Tentar acessar: `http://localhost:3000/admin/dashboard`

### Resultado Esperado:
- ✅ Middleware deve bloquear
- ✅ Deve redirecionar para `/cliente/home`

### Status: [ ]

---

## ✅ TESTE 10: MÚLTIPLAS ABAS

### Passos:
1. Fazer login em uma aba
2. Abrir nova aba
3. Acessar `http://localhost:3000`

### Resultado Esperado:
- ✅ Nova aba deve reconhecer sessão
- ✅ Deve redirecionar para dashboard correto
- ✅ Não deve pedir login novamente

### Status: [ ]

---

## ✅ TESTE 11: VERIFICAR COOKIES

### Passos:
1. Fazer login
2. Abrir DevTools (F12)
3. Application > Cookies > localhost:3000
4. Procurar cookie `next-auth.session-token`

### Resultado Esperado:
- ✅ Cookie deve existir
- ✅ HttpOnly deve ser `true`
- ✅ SameSite deve ser `Lax`
- ✅ Path deve ser `/`

### Status: [ ]

---

## ✅ TESTE 12: VERIFICAR SESSÃO NA API

### Passos:
1. Estar logado
2. Abrir nova aba
3. Acessar: `http://localhost:3000/api/auth/session`

### Resultado Esperado:
```json
{
  "user": {
    "id": "user-xxx",
    "email": "admin@precivox.com",
    "name": "Admin",
    "role": "ADMIN",
    "image": null
  },
  "expires": "2025-10-24T..."
}
```

### Status: [ ]

---

## ✅ TESTE 13: LOGIN RÁPIDO MÚLTIPLO

### Passos:
1. Fazer login
2. Fazer logout
3. Fazer login novamente
4. Repetir 3 vezes

### Resultado Esperado:
- ✅ Não deve travar
- ✅ Não deve dar erro
- ✅ Deve funcionar todas as vezes

### Status: [ ]

---

## ✅ TESTE 14: VERIFICAR ROLE NO BANCO

### Passos:
1. Abrir Prisma Studio: `npm run prisma:studio`
2. Ir em tabela `usuarios`
3. Verificar campos

### Resultado Esperado:
- ✅ Campo `role` deve existir
- ✅ Valores possíveis: ADMIN, GESTOR, CLIENTE
- ✅ Usuário admin deve ter role ADMIN

### Status: [ ]

---

## ✅ TESTE 15: TEMPO DE CARREGAMENTO

### Passos:
1. Abrir DevTools (F12)
2. Ir na aba "Network"
3. Fazer login
4. Verificar tempo do request `/api/auth/callback/credentials`

### Resultado Esperado:
- ✅ Request deve completar em < 1 segundo
- ✅ Status code deve ser 200
- ✅ Redirecionamento deve ser rápido (< 500ms)

### Status: [ ]

---

## 🔍 TESTES VISUAIS

### Teste 16: Verificar Loading State
- [ ] Botão "Login" muda para "Entrando..." durante login
- [ ] Spinner aparece quando necessário
- [ ] Não há flash de conteúdo não autorizado

### Teste 17: Verificar Mensagens de Erro
- [ ] Mensagem de erro aparece em vermelho
- [ ] Mensagem é clara e informativa
- [ ] Mensagem desaparece após novo submit

### Teste 18: Verificar Layout
- [ ] Página de login está centralizada
- [ ] Campos estão alinhados
- [ ] Botões têm hover effect
- [ ] Responsivo em mobile

---

## 🧪 TESTES DE STRESS

### Teste 19: Login Simultâneo
1. Abrir 5 abas
2. Fazer login em todas ao mesmo tempo
3. Verificar se todas funcionam

### Teste 20: Refresh Durante Login
1. Clicar em "Login"
2. Antes de completar, pressionar F5
3. Verificar se não quebra

---

## 📊 RESULTADOS ESPERADOS

### Performance:
- ✅ Login em < 1 segundo
- ✅ Redirecionamento em < 500ms
- ✅ Zero loops
- ✅ Zero piscar

### Segurança:
- ✅ Senhas com hash bcrypt
- ✅ Cookies httpOnly
- ✅ JWT assinado
- ✅ Middleware protegendo rotas

### UX:
- ✅ Feedback visual claro
- ✅ Mensagens de erro úteis
- ✅ Loading states apropriados
- ✅ Redirecionamento suave

---

## 🐛 COMO REPORTAR PROBLEMAS

Se algum teste falhar:

1. **Anote o número do teste**
2. **Capture screenshot**
3. **Copie logs do console:**
   ```
   DevTools > Console > Botão direito > Save as...
   ```
4. **Copie logs do servidor:**
   ```
   No terminal onde rodou npm run dev
   ```
5. **Descreva o comportamento esperado vs real**

---

## ✅ CRITÉRIOS DE APROVAÇÃO

O sistema está aprovado se:
- ✅ Todos os 20 testes passam
- ✅ Nenhum loop de autenticação
- ✅ Nenhuma tela piscando
- ✅ Performance adequada (< 1s)
- ✅ Todas as proteções funcionando

---

## 📝 RELATÓRIO DE TESTES

Após completar todos os testes, preencha:

```
Data: _______________
Testador: _______________

Testes Passados: ___ / 20
Testes Falhados: ___ / 20

Status Final: [ ] APROVADO  [ ] REPROVADO

Observações:
_________________________________
_________________________________
_________________________________
```

---

**Status do Sistema:** ✅ PRONTO PARA TESTES  
**Versão:** 1.0.0  
**Data:** Outubro 2025

