# 🚀 GUIA RÁPIDO - PRECIVOX V7.0

## ✅ Sistema Restaurado e Funcional

---

## 🔑 CREDENCIAIS DE ACESSO

### Administrador
```
Email: admin@precivox.com
Senha: senha123
Acesso: Painel Administrativo
```

### Gestor de Mercado (2 usuários)
```
Email: gestor1@mercado.com
Senha: senha123
Acesso: Dashboard Gestor + Painel IA

Email: gestor2@mercado.com
Senha: senha123
Acesso: Dashboard Gestor + Painel IA
```

### Cliente
```
Email: cliente@email.com
Senha: senha123
Acesso: Comparação de Preços
```

---

## 🔄 FLUXO DE LOGIN

1. **Acesse** a aplicação em `http://localhost:3003`
2. **Clique** no botão "Entrar"
3. **Insira** as credenciais (email e senha)
4. **Sistema reconhece automaticamente** o tipo de usuário:
   - **Admin** → Redireciona para `/admin/dashboard`
   - **Gestor** → Redireciona para `/gestor/home`
   - **Cliente** → Redireciona para `/cliente/home`
5. **Acesso direto** ao dashboard correspondente (sem escolha manual)

---

## 🎯 FUNCIONALIDADES POR TIPO DE USUÁRIO

### 👤 Cliente
- 🔍 Comparar preços entre mercados
- 💰 Ver promoções e economia
- 🛒 Criar listas de compras
- 📊 Receber alertas de preços

### 👨‍💼 Gestor
- 📊 Dashboard com KPIs
- 🤖 Painel de Inteligência Artificial
- 📈 Análise de estoque e demanda
- 💡 Sugestões de compras e promoções
- 📉 Previsão de vendas

### 👨‍💻 Administrador
- 👥 Gestão de usuários
- 🏪 Gestão de mercados e unidades
- 📋 Planos de pagamento
- 📊 Analytics completo
- ⚙️ Configurações do sistema

---

## 🛠️ COMO TESTAR

### 1. Iniciar o Servidor
```bash
npm run dev
```
Servidor roda em: `http://localhost:3003`

### 2. Executar Seed (se necessário)
```bash
npx tsx prisma/seed.ts
```
Cria os usuários de teste no banco de dados.

### 3. Testar Login
1. Acesse `http://localhost:3003`
2. Faça login com qualquer uma das credenciais acima
3. Observe o redirecionamento automático

---

## ✅ O QUE ESTÁ FUNCIONANDO

- ✅ Login com validação no banco de dados
- ✅ Reconhecimento automático de role (CLIENTE/GESTOR/ADMIN)
- ✅ Redirecionamento automático por tipo de usuário
- ✅ Painéis completos para cada tipo de usuário
- ✅ CSS e estilos carregando corretamente
- ✅ Navegação entre módulos
- ✅ Autenticação com NextAuth
- ✅ Validação de senha com bcrypt

---

## 🔍 PROBLEMAS COMUNS

### Erro: "Email ou senha inválidos"
- Verifique se o seed foi executado
- Execute: `npx tsx prisma/seed.ts`

### Erro: "Port already in use"
- O servidor já está rodando na porta 3000 ou 3003
- Acesse o endereço exibido no terminal

### Usuário não encontrado
- Verifique se o banco de dados está configurado
- Verifique a variável `DATABASE_URL` no arquivo `.env`

---

## 📞 SUPORTE

Para mais informações, consulte:
- `RESTAURACAO_SISTEMA_V7.md` - Documentação completa
- `README_SISTEMA_LOGIN.md` - Sistema de autenticação
- `AUDITORIA_REATIVACAO_COMPLETA.md` - Detalhes técnicos

---

**Versão:** 7.0  
**Última Atualização:** 27 de outubro de 2025  
**Status:** ✅ TOTALMENTE FUNCIONAL
