# 🔐 CREDENCIAIS CORRETAS - PRECIVOX

## ⚠️ **ATENÇÃO: EXISTEM MÚLTIPLAS CREDENCIAIS NO SISTEMA**

---

## 📊 **ANÁLISE DAS CREDENCIAIS ENCONTRADAS**

### 1️⃣ **Credenciais do Seed (prisma/seed.ts)**
```bash
Email: admin@precivox.com
Senha: senha123
Role: ADMIN
```

### 2️⃣ **Credenciais do ADMIN_CREDENTIALS.md**
```bash
Email: admin@precivox.com.br
Senha: admin123
Role: admin
```

### 3️⃣ **Credenciais do create-admin.js**
```bash
Email: admin@precivox.com
Senha: Admin123!
Role: ADMIN
```

---

## 🎯 **CREDENCIAIS CORRETAS PARA TESTE**

### **✅ USAR ESTAS CREDENCIAIS:**

```
Email: admin@precivox.com
Senha: senha123
```

**Por quê?** Porque o sistema NextAuth está configurado para usar a tabela `usuarios`, e existe um usuário ADMIN com essas credenciais.

---

## 📊 **USUÁRIOS DISPONÍVEIS NO SISTEMA**

### **Tabela USUARIOS (NextAuth - Sistema Corrigido):**

1. **👑 ADMIN**
   ```
   Email: admin@precivox.com
   Senha: senha123
   Role: ADMIN
   ```

2. **👔 GESTOR**
   ```
   Email: gestor@precivox.com
   Senha: senha123
   Role: GESTOR
   ```

3. **👤 CLIENTE**
   ```
   Email: cliente@precivox.com
   Senha: senha123
   Role: CLIENTE
   ```

### **Tabela USERS (Backend Antigo):**

1. **👑 ADMIN**
   ```
   Email: admin@precivox.com
   Senha: Admin123!
   Role: ADMIN
   ```

---

## 🔍 **VERIFICAR QUAL TABELA ESTÁ SENDO USADA**

O sistema tem **duas tabelas diferentes**:

1. **`users`** (backend antigo)
2. **`usuarios`** (NextAuth)

### Verificar qual está ativa:
<｜tool▁calls▁begin｜><｜tool▁call▁begin｜>
run_terminal_cmd
