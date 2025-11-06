# 📋 Requisitos do JSON para Upload no Sistema Precivox

## ✅ Validação do Arquivo `assai_Franco_atualizado.json`

Este documento explica os requisitos necessários para que o arquivo JSON do Assai Franco seja aceito pelo sistema Precivox.

---

## 🎯 Campos Obrigatórios

O sistema Precivox **exige** os seguintes campos em cada produto:

| Campo | Tipo | Descrição | Exemplo |
|-------|------|-----------|---------|
| `nome` | string | Nome do produto (não pode estar vazio) | `"Arroz Tio João 5kg"` |
| `preco` | number | Preço do produto (deve ser maior que zero) | `24.90` |

---

## 📝 Campos Opcionais (mas Recomendados)

Para melhor integração com o sistema, é recomendado incluir:

| Campo | Tipo | Descrição | Exemplo |
|-------|------|-----------|---------|
| `categoria` | string | Categoria do produto | `"Alimentos"`, `"Bebidas"`, `"Limpeza"` |
| `marca` | string | Marca do produto | `"Tio João"`, `"Coca-Cola"` |
| `quantidade` ou `estoque` | number | Quantidade em estoque (para criar estoque no sistema) | `50` |
| `codigoBarras` ou `codigo_barras` | string | Código de barras (EAN/GTIN) | `"7891234567890"` |
| `descricao` | string | Descrição detalhada do produto | `"Arroz tipo 1, pacote de 5kg"` |
| `precoPromocional` ou `preco_promocional` | number | Preço em promoção | `19.90` |
| `unidadeMedida` ou `unidade_medida` | string | Unidade de medida | `"kg"`, `"L"`, `"unidade"` |

---

## 📦 Formatos Aceitos

O sistema aceita JSON em dois formatos:

### Formato 1: Array Direto
```json
[
  {
    "nome": "Arroz Tio João 5kg",
    "preco": 24.90,
    "categoria": "Alimentos",
    "marca": "Tio João",
    "quantidade": 50
  },
  {
    "nome": "Feijão Carioca 1kg",
    "preco": 8.50,
    "categoria": "Alimentos",
    "quantidade": 30
  }
]
```

### Formato 2: Objeto com Propriedade "produtos"
```json
{
  "produtos": [
    {
      "nome": "Arroz Tio João 5kg",
      "preco": 24.90,
      "categoria": "Alimentos",
      "marca": "Tio João",
      "quantidade": 50
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

## 🔍 Como Validar o JSON Antes do Upload

Execute o script de validação:

```bash
node scripts/validar-json-assai.js <caminho-do-json>
```

Exemplo:
```bash
node scripts/validar-json-assai.js assai_Franco_atualizado.json
```

O script irá:
- ✅ Verificar se todos os produtos têm `nome` e `preco`
- ✅ Validar tipos de dados
- ✅ Gerar estatísticas do arquivo
- ✅ Listar erros e avisos
- ✅ Criar um relatório detalhado

---

## 🚀 Como Fazer Upload no Sistema

### Pré-requisitos:
1. ✅ Estar logado como **ADMIN** no sistema Precivox
2. ✅ Ter o mercado "Assai Franco" cadastrado no sistema
3. ✅ Ter pelo menos uma unidade cadastrada para o mercado

### Passos:
1. Acesse o sistema Precivox como ADMIN
2. Navegue até a página de administração do mercado "Assai Franco"
3. Localize a seção **"Upload de Base de Dados"**
4. Selecione uma **unidade** de destino
5. Clique em **"Selecione um arquivo"** e escolha o JSON
6. Clique em **"Fazer Upload"**
7. Aguarde o processamento (o sistema mostrará o progresso)

---

## ⚠️ Observações Importantes

1. **Tamanho máximo**: 50MB
2. **Formatos aceitos**: CSV, XLSX, XLS ou JSON
3. **Quantidade/Estoque**: Se não informado, será definido como 0
4. **Preço promocional**: Se informado, o sistema automaticamente marca o produto como "em promoção"
5. **Código de barras**: O sistema aceita variações como `codigoBarras`, `codigo_barras`, `ean`, `gtin`

---

## 🔧 Problemas Comuns e Soluções

### ❌ Erro: "Campo nome é obrigatório"
**Solução**: Verifique se todos os produtos têm o campo `nome` preenchido e não vazio.

### ❌ Erro: "Preço inválido"
**Solução**: Certifique-se de que `preco` é um número maior que zero.

### ❌ Erro: "JSON inválido"
**Solução**: 
- Verifique se o JSON está bem formatado (use um validador JSON online)
- Certifique-se de que é um array ou objeto com propriedade `produtos`

### ❌ Erro: "Nenhum produto válido encontrado"
**Solução**: Execute o script de validação para identificar produtos com problemas.

---

## 📊 Estrutura do Banco de Dados Precivox

O sistema Precivox usa Prisma com as seguintes tabelas principais:

- **`mercados`**: Informações do mercado
- **`unidades`**: Unidades/filiais do mercado
- **`produtos`**: Catálogo de produtos (compartilhado entre mercados)
- **`estoques`**: Estoque de produtos por unidade

Quando você faz upload:
1. O sistema cria/atualiza produtos na tabela `produtos`
2. O sistema cria registros de estoque na tabela `estoques` associando produtos às unidades

---

## ✅ Checklist Antes do Upload

- [ ] Arquivo JSON está bem formatado
- [ ] Todos os produtos têm `nome` e `preco`
- [ ] Preços são números válidos (maior que zero)
- [ ] Arquivo não excede 50MB
- [ ] Estou logado como ADMIN
- [ ] Mercado "Assai Franco" existe no sistema
- [ ] Pelo menos uma unidade está cadastrada
- [ ] Executei o script de validação e não há erros críticos

---

## 📞 Suporte

Se encontrar problemas durante o upload, verifique:
1. Os logs do sistema (console do navegador)
2. O relatório de validação gerado pelo script
3. Os logs do servidor backend

---

**Última atualização**: Janeiro 2025

