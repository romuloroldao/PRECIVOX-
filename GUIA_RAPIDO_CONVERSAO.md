# 🚀 GUIA RÁPIDO - Módulo de Conversão de Produtos

## ✅ STATUS: IMPLEMENTADO E PRONTO PARA USO

---

## 📍 COMO ACESSAR

### Opção 1: Interface Web (Recomendado)

#### Para Gestores:
```
https://precivox.com.br/gestor/produtos
```

#### Para Admins:
```
https://precivox.com.br/admin/produtos
```

### Opção 2: API Direta

```bash
POST /api/products/upload-smart/:marketId
```

---

## 📁 FORMATOS SUPORTADOS

✅ **CSV** - Arquivos com vírgula (mais comum)  
✅ **XLSX** - Excel moderno  
✅ **XLS** - Excel legado  
✅ **JSON** - Formato JSON  
✅ **XML** - Arquivos XML  

---

## 🎯 EXEMPLO RÁPIDO - ARQUIVO CSV

### Criar um arquivo `produtos.csv`:

```csv
nome,preco,quantidade
Arroz Tio João 5kg,25.90,100
Feijão Preto 1kg,8.50,50
Detergente Limão 500ml,2.99,200
Sabonete Dove 90g,3.50,150
Café Pilão 500g,15.90,80
```

### O sistema vai INFERIR automaticamente:

- ✨ **Categoria**: Alimentos, Limpeza, Higiene
- ✨ **Marca**: Tio João, Dove, Pilão
- ✨ **Unidade**: KG, ML, G

---

## 🔧 CAMPOS RECONHECIDOS

### Obrigatórios (mínimo):
- `nome` ou `product` ou `item`
- `preco` ou `price` ou `valor`
- `quantidade` ou `stock` ou `qtd`

### Opcionais:
- `categoria` ou `category`
- `marca` ou `brand`
- `unidade_medida` ou `unit`
- `codigo_barras` ou `ean`
- `descricao` ou `description`

---

## 💡 DICAS

### ✅ Boas Práticas:

1. **Use nomes descritivos**
   ```
   ✅ "Arroz Tio João 5kg"
   ❌ "Produto 123"
   ```

2. **Inclua a unidade no nome** (se não tiver coluna separada)
   ```
   ✅ "Detergente 500ml"
   ✅ "Café 500g"
   ```

3. **Inclua a marca no nome** (se não tiver coluna separada)
   ```
   ✅ "Arroz Tio João"
   ✅ "Sabonete Dove"
   ```

4. **Use vírgula ou ponto para preços**
   ```
   ✅ "25.90" ou "25,90"
   ✅ "R$ 25,90" (símbolo será removido)
   ```

---

## 🧪 TESTE RÁPIDO

### 1. Baixe o arquivo de teste:

```bash
# Já está criado em: /root/teste-produtos.csv
```

### 2. Acesse a interface:

```
https://precivox.com.br/gestor/produtos
```

### 3. Faça o upload:

1. Arraste o arquivo ou clique para selecionar
2. Clique em "Fazer Upload e Importar"
3. Veja as estatísticas!

---

## 📊 RESULTADO ESPERADO

Após o upload, você verá:

```
✅ Upload concluído: 10 produtos importados com sucesso

📊 Estatísticas:
   Total:      10
   Importados: 10
   Inferidos:  10 (categoria, marca, unidade)
   Ignorados:  0

⚠️ Avisos:
   - Campos inferidos automaticamente: categoria, marca, unidade_medida
```

---

## ❌ ERROS COMUNS

### 1. "Nome do produto ausente"
**Solução:** Certifique-se de que tem uma coluna `nome`, `product` ou `item`

### 2. "Preço inválido"
**Solução:** Verifique se os preços são números válidos (> 0)

### 3. "Formato não suportado"
**Solução:** Use CSV, XLSX, XLS, JSON ou XML

### 4. "Erro de autenticação"
**Solução:** Faça login novamente e tente novamente

---

## 🔍 VERIFICAR SE FUNCIONOU

### Via API:

```bash
# Listar produtos do mercado
curl https://precivox.com.br/api/products?mercado=SEU_MARKET_ID
```

### Via Interface:

1. Acesse o dashboard do gestor/admin
2. Veja a lista de produtos
3. Os produtos importados terão `data_source: 'smart_upload'`

---

## 🆘 PROBLEMAS?

### Backend não está respondendo:

```bash
# Verificar se está rodando
lsof -i :3001 | grep LISTEN

# Se não estiver, iniciar:
cd /root/backend && PORT=3001 node server.js &
```

### Logs do backend:

```bash
# Ver logs em tempo real
lsof -ti:3001 | xargs -I{} tail -f /proc/{}/fd/1
```

### Testar conversão localmente:

```bash
# Testar via Node.js
cd /root/backend
node -e "
import('./utils/fileConverter.js').then(async (m) => {
  const result = await m.convertToPrecivoxStandard('/root/teste-produtos.csv');
  console.log(JSON.stringify(result, null, 2));
});
"
```

---

## 📚 DOCUMENTAÇÃO COMPLETA

Veja o arquivo completo:
```
/root/MODULO_CONVERSAO_IMPLEMENTADO.md
```

---

## 🎉 PRONTO!

Agora você pode:
- ✅ Importar produtos de qualquer formato
- ✅ Economizar horas de trabalho manual
- ✅ Ter dados padronizados automaticamente
- ✅ Categorias e marcas inferidas inteligentemente

**Aproveite! 🚀**

