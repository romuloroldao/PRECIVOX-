# ✅ Como Validar o JSON do Assai Franco

## 📋 Resumo

Este guia explica como verificar se o arquivo `assai_Franco_atualizado.json` atende aos requisitos do sistema Precivox antes de fazer o upload via interface.

---

## 🚀 Passo a Passo Rápido

### 1️⃣ Validar o JSON

Execute o script de validação:

```bash
cd /root
node scripts/validar-json-assai.js <caminho-do-seu-json>
```

**Exemplo:**
```bash
node scripts/validar-json-assai.js /caminho/para/assai_Franco_atualizado.json
```

O script irá:
- ✅ Verificar se todos os produtos têm `nome` e `preco`
- ✅ Validar tipos de dados
- ✅ Gerar estatísticas
- ✅ Listar erros e avisos
- ✅ Criar relatório detalhado

### 2️⃣ Verificar se o Mercado Existe

Execute o script para verificar se o mercado "Assai Franco" está cadastrado:

```bash
node scripts/verificar-mercado-assai.js
```

**Se o mercado não existir:**
1. Acesse o sistema como ADMIN
2. Vá para a seção de Mercados
3. Crie o mercado "Assai Franco" com CNPJ
4. Crie pelo menos uma unidade

### 3️⃣ Fazer Upload via Interface

1. **Acesse o sistema como ADMIN**
2. **Navegue até o mercado "Assai Franco"**
3. **Localize a seção "Upload de Base de Dados"**
4. **Selecione uma unidade**
5. **Escolha o arquivo JSON**
6. **Clique em "Fazer Upload"**

---

## ✅ Requisitos Mínimos do JSON

### Campos Obrigatórios:
- ✅ `nome` (string, não vazio)
- ✅ `preco` (number, maior que zero)

### Campos Opcionais (mas recomendados):
- `categoria`
- `marca`
- `quantidade` ou `estoque` (para criar estoque no sistema)
- `codigoBarras` ou `codigo_barras`
- `descricao`
- `precoPromocional`

### Formatos Aceitos:
1. **Array direto**: `[{ "nome": "...", "preco": 10.50 }]`
2. **Objeto com produtos**: `{ "produtos": [{ "nome": "...", "preco": 10.50 }] }`

---

## 📊 Exemplo de JSON Válido

```json
{
  "produtos": [
    {
      "nome": "Arroz Tio João 5kg",
      "preco": 24.90,
      "categoria": "Alimentos",
      "marca": "Tio João",
      "quantidade": 50,
      "codigoBarras": "7891234567890"
    },
    {
      "nome": "Feijão Carioca 1kg",
      "preco": 8.50,
      "categoria": "Alimentos",
      "quantidade": 30
    }
  ]
}
```

---

## ⚠️ Problemas Comuns

### ❌ Erro: "Campo nome é obrigatório"
**Solução**: Verifique se todos os produtos têm `nome` preenchido.

### ❌ Erro: "Preço inválido"
**Solução**: Certifique-se de que `preco` é um número maior que zero.

### ❌ Erro: "JSON inválido"
**Solução**: Use um validador JSON online ou verifique a sintaxe.

### ❌ Erro: "Mercado não encontrado"
**Solução**: Crie o mercado "Assai Franco" no sistema antes do upload.

---

## 📝 Checklist Antes do Upload

- [ ] Executei o script de validação e não há erros críticos
- [ ] Todos os produtos têm `nome` e `preco`
- [ ] Preços são números válidos
- [ ] Arquivo não excede 50MB
- [ ] Estou logado como ADMIN
- [ ] Mercado "Assai Franco" existe no sistema
- [ ] Pelo menos uma unidade está cadastrada

---

## 📄 Documentação Completa

Para mais detalhes, consulte:
- `REQUISITOS_JSON_ASSAI_FRANCO.md` - Requisitos completos do JSON
- `scripts/validar-json-assai.js` - Script de validação
- `scripts/verificar-mercado-assai.js` - Script de verificação do mercado

---

**Última atualização**: Janeiro 2025

