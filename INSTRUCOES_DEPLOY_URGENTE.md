# 🚨 DEPLOY URGENTE - PRECIVOX.COM.BR

## ⚡ INSTRUÇÕES SIMPLES

### 1️⃣ **Acesse o servidor via SSH:**
```bash
ssh root@precivox.com.br
# ou
ssh usuario@precivox.com.br
```

### 2️⃣ **Execute o script de deploy:**
```bash
cd /root
chmod +x deploy-urgente.sh
./deploy-urgente.sh
```

### 3️⃣ **Aguarde o script terminar** (2-3 minutos)

### 4️⃣ **Teste o sistema:**
- Acesse: https://precivox.com.br
- Faça login com:
  - Email: `admin@precivox.com`
  - Senha: `senha123`

---

## 🔧 **O QUE O SCRIPT FAZ:**

1. ✅ Para todos os serviços
2. ✅ Faz backup do sistema atual
3. ✅ Aplica correções de login
4. ✅ Instala dependências
5. ✅ Faz build do sistema
6. ✅ Reinicia serviços
7. ✅ Testa se está funcionando

---

## 📞 **SE DER PROBLEMA:**

### Verificar logs:
```bash
pm2 logs precivox
```

### Reiniciar manualmente:
```bash
pm2 restart precivox
```

### Verificar status:
```bash
pm2 status
```

---

## ✅ **RESULTADO ESPERADO:**

- ✅ Site funcionando: https://precivox.com.br
- ✅ Login sem loops
- ✅ Redirecionamento correto
- ✅ Sistema estável

---

**🚀 Execute o script e o sistema estará funcionando!**



