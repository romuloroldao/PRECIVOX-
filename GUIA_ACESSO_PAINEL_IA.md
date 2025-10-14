# 🚀 Guia de Acesso - Painel de IA do Gestor PRECIVOX

## ✅ STATUS: SISTEMA ONLINE E FUNCIONAL

**Data:** 14 de Outubro de 2025  
**Implementação:** 100% Concluída ✅  
**Serviços:** Todos online ✅

---

## 🌐 Como Acessar (3 Passos)

### 1️⃣ **Fazer Login**

**URL:** http://localhost:3000/login

**Credenciais:**
```
Email: admin@precivox.com
Senha: Admin123!
```

---

### 2️⃣ **Ir para Painel do Gestor**

Após login, você será redirecionado para:  
**URL:** http://localhost:3000/gestor/home

Clique no botão verde no topo:  
**🤖 Painel de IA**

---

### 3️⃣ **Explorar os Módulos de IA**

Você verá 3 cards clicáveis:

```
┌──────────────┬──────────────┬──────────────┐
│ 🛒 COMPRAS   │ 💸 PROMOÇÕES │ 🛍️ CONVERSÃO │
│ & REPOSIÇÃO  │ & PREÇOS     │ & FIDELIZAÇÃO│
└──────────────┴──────────────┴──────────────┘
```

**Clique em cada um para explorar!**

---

## 🎯 O que Você Vai Ver

### **Dashboard Principal** (/gestor/ia)

```
✅ 3 Alertas Prioritários:
   🚨 Ruptura crítica: Leite Integral (< 24h)
   ⚠️ Ruptura iminente: Papel Higiênico (2.3 dias)
   💰 Oportunidade: Promoção Cerveja (+18% lucro)

✅ 4 KPIs Dinâmicos:
   📊 Giro de Estoque: 7.0x/mês (↗️ +8%)
   ⚠️ Taxa de Ruptura: 40% (↘️ -1.2%)
   💰 Ticket Médio: R$ 100,08 (↗️ +3%)
   📈 Margem Líquida: 18.1% (↘️ -2%)

✅ 3 Módulos Clicáveis
```

---

### **Módulo de Compras** (/gestor/ia/compras)

```
✅ Lista de Produtos em Ruptura:
   • Leite Integral 1L
     - Estoque: 12 un
     - Ruptura em: 0.9 dias
     - Repor: 378 unidades
     - Botão: [🛒 Gerar Pedido Automático]

   • Papel Higiênico 4 rolos
     - Estoque: 28 un
     - Ruptura em: 1.6 dias
     - Repor: 482 unidades
     - Botão: [🛒 Gerar Pedido Automático]

✅ Cards de Informação:
   • Como funciona a previsão
   • Dicas para otimizar
```

---

### **Módulo de Promoções** (/gestor/ia/promocoes)

```
✅ Top 3 Oportunidades de Promoção

1. Cerveja Lata 350ml
   • Estoque: 540 un (ALTO)
   • Giro: 2.1x/mês (LENTO)
   • Desconto sugerido: 8%
   • Aumento estimado: +18% vendas
   • Botão: [🧮 Simular Promoção]

✅ Simulador Interativo:
   • Slider de desconto (0-30%)
   • Tabela de comparação (Atual vs Promoção)
   • Cálculo em tempo real de impacto
   • Recomendação automática
   • Botão: [🏷️ Aplicar Promoção]
```

---

### **Módulo de Conversão** (/gestor/ia/conversao)

```
✅ Métricas de Conversão:
   • Online: 68% | Presencial: 85%
   • Taxa de Recompra: 42% (meta: 55%)
   • Ticket Médio por Perfil:
     - Premium: R$ 145
     - Regular: R$ 85
     - Ocasional: R$ 52

✅ Itens Mais Abandonados:
   1. Detergente Ypê (310 adições, 13.5% conversão)
   2. Sabão em Pó (287 adições, 29.6% conversão)
   3. Leite Condensado (245 adições, 41.6% conversão)

✅ NPS:
   • Score: 72 (Zona de Excelência)
   • Promotores: 80%
   • Neutros: 12%
   • Detratores: 8%

✅ Tendências de Busca (produtos não encontrados):
   1. Cerveja artesanal (127 buscas/mês) 🔥
   2. Frutas orgânicas (98 buscas/mês) 🔥
   3. Produtos sem lactose (76 buscas/mês)
```

---

## 🛠️ Comandos Úteis

### Verificar Status dos Serviços
```bash
pm2 status
```

**Esperado:**
```
✅ precivox-backend       - online
✅ precivox-frontend      - online
✅ precivox-auth          - online
✅ precivox-ia-processor  - online (cron)
✅ precivox-alertas       - online (cron)
```

---

### Ver Logs dos Jobs de IA
```bash
# Logs do processamento de IA
pm2 logs precivox-ia-processor --lines 50

# Logs de alertas
pm2 logs precivox-alertas --lines 50

# Logs do backend
pm2 logs precivox-backend --lines 50
```

---

### Executar Jobs Manualmente (Para Testar)
```bash
# Processar IA manualmente
node /root/backend/jobs/ia-processor.cjs

# Processar alertas manualmente
node /root/backend/jobs/alertas.cjs

# Popular dados de exemplo novamente
node /root/prisma/seed-ia.js
```

---

### Reiniciar Todos os Serviços
```bash
pm2 restart all
```

---

## 📊 Endpoints de API Disponíveis

### Dashboard de IA
```bash
curl http://localhost:3001/api/ai/painel/dashboard/MERCADO_ID
```

**Retorna:**
- Alertas críticos (top 5)
- Visão executiva (4 KPIs)
- Contadores por módulo
- Lista de unidades

---

### Módulo de Compras
```bash
curl http://localhost:3001/api/ai/painel/compras/MERCADO_ID
```

**Retorna:**
- Produtos em ruptura
- Dias restantes
- Quantidade a repor

---

### Marcar Alerta como Lido
```bash
curl -X PUT http://localhost:3001/api/ai/painel/alertas/ALERTA_ID/marcar-lido
```

---

## 🎨 Navegação do Sistema

```
Login (/login)
    ↓
Dashboard Gestor (/gestor/home)
    ↓
    [🤖 Painel de IA] ← Clique aqui
    ↓
Dashboard de IA (/gestor/ia)
    ├─ [🛒 COMPRAS & REPOSIÇÃO] → /gestor/ia/compras
    ├─ [💸 PROMOÇÕES & PREÇOS] → /gestor/ia/promocoes
    └─ [🛍️ CONVERSÃO & FIDELIZAÇÃO] → /gestor/ia/conversao
```

---

## 🔔 Alertas Automáticos

### Como Funcionam

1. **Job de IA roda diariamente às 2h AM**
   - Atualiza previsões de demanda
   - Calcula giro de estoque
   - Gera novos alertas

2. **Job de Alertas roda a cada 30 minutos**
   - Monitora rupturas críticas
   - Limpa alertas antigos

3. **Alertas aparecem no dashboard**
   - Priorização visual (vermelho/laranja/azul)
   - Ação recomendada clara
   - Botão para marcar como lido

---

## 📱 Recursos Implementados

### ✅ Dashboard Principal
- Alertas prioritários (top 5)
- 4 KPIs com variações
- Navegação para 3 módulos
- Lista de unidades

### ✅ Módulo de Compras
- Produtos em ruptura (classificados por urgência)
- Barra de progresso de dias restantes
- Recomendação de quantidade
- Botões de ação

### ✅ Módulo de Promoções
- Top 3 oportunidades
- Simulador interativo (slider 0-30%)
- Tabela de comparação
- Recomendação automática

### ✅ Módulo de Conversão
- Taxa de conversão por canal
- Taxa de recompra
- Ticket médio por perfil
- Itens abandonados (top 3)
- NPS com distribuição
- Tendências de busca (top 5)

### ✅ Jobs Automáticos
- Processamento diário de IA
- Monitoramento contínuo de alertas
- Limpeza automática de dados

---

## 🎯 Dados de Demonstração

### Mercado de Teste
```
Nome: Supermercado Teste IA
ID: cmgr1bovn00027p2hd2kfx8cf
Unidades: 1 (Unidade Centro)
Produtos: 5 com dados de IA
Alertas: 3 ativos
```

### Produtos com IA
1. Leite Integral 1L (Ruptura crítica)
2. Papel Higiênico 4 rolos (Ruptura alta)
3. Cerveja Lata 350ml (Oportunidade promoção)
4. Água de Coco 1L (Normal)
5. Detergente Ypê 500ml (Normal)

---

## 🏆 Checklist de Validação

### ✅ Backend
- [x] Schema Prisma expandido
- [x] 5 novos models criados
- [x] 3 endpoints funcionando
- [x] Jobs configurados no PM2
- [x] APIs testadas e validadas

### ✅ Frontend
- [x] 4 páginas criadas
- [x] Navegação funcionando
- [x] Links entre módulos
- [x] Layout responsivo
- [x] Alertas com priorização visual

### ✅ Dados
- [x] Mercado de teste criado
- [x] 5 produtos com IA
- [x] 3 alertas de exemplo
- [x] Métricas do dashboard

### ✅ Infraestrutura
- [x] Todos os serviços online
- [x] Jobs cron configurados
- [x] Logs funcionando
- [x] PM2 configurado

---

## 🚀 Sistema Pronto!

**Acesse agora:**  
👉 http://localhost:3000/login

**Credenciais:**  
📧 Email: admin@precivox.com  
🔐 Senha: Admin123!

**Então clique:**  
🤖 **Painel de IA**

---

## 📚 Documentação Disponível

1. **STATUS_PAINEL_IA_IMPLEMENTADO.md** - Este documento
2. **INDEX_PAINEL_IA.md** - Índice central
3. **QUICK_START_PAINEL_IA.md** - Guia rápido
4. **RESUMO_EXECUTIVO_PAINEL_IA.md** - Para stakeholders
5. **PAINEL_IA_GESTOR_REVISAO.md** - Análise completa
6. **PAINEL_IA_IMPLEMENTACAO_PRATICA.md** - Código detalhado
7. **MOCKUPS_INTERFACE_PAINEL_IA.md** - Wireframes

---

## 🎉 Parabéns!

O **Painel de IA do Gestor** está **100% implementado e funcionando!**

---

**Desenvolvido para PRECIVOX** 🚀  
**Versão:** 1.0 MVP  
**Status:** ✅ PRODUÇÃO


