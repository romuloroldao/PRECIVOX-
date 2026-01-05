
# 🚀 PRECIVOX - Plataforma de Inteligência de Mercado

**Versão:** 2.0  
**Status:** ✅ Production Ready  
**Última Atualização:** 03 de Dezembro de 2025

---

## 📋 Sobre o Projeto

PRECIVOX é uma plataforma de inteligência de mercado que fornece a pequenos e médios mercados análises preditivas e insights acionáveis tradicionalmente disponíveis apenas para grandes redes. A plataforma utiliza IA para otimizar estoque, precificação e experiência do cliente.

### 🎯 Principais Funcionalidades

- **Previsão de Demanda:** Análise preditiva de vendas futuras
- **Saúde do Estoque:** Detecção de rupturas e excessos
- **Precificação Inteligente:** Sugestões baseadas em elasticidade
- **Recomendações GROOC:** Ofertas personalizadas para clientes
- **Dashboard de IA:** Visualizações interativas em tempo real
- **Automação:** Jobs agendados para análises e alertas

---

## 🏗️ Arquitetura

### Stack Tecnológico

**Frontend:**
- Next.js 14 (App Router)
- React 18
- TypeScript
- TailwindCSS
- Recharts (visualizações)

**Backend:**
- Node.js 22
- Express.js
- TypeScript
- Prisma ORM
- PostgreSQL

**IA/ML:**
- Engines TypeScript customizados
- Análise de séries temporais
- Algoritmos de correlação
- Heurísticas de otimização

**Infraestrutura:**
- PM2 (gerenciamento de processos)
- Nginx (reverse proxy)
- Systemd (auto-start)

---

## 📁 Estrutura do Projeto

```
precivox/
├── app/                          # Next.js App Router
│   ├── gestor/ia/dashboard/     # Dashboard de IA
│   ├── admin/                   # Painel administrativo
│   └── api/                     # API Routes (Next.js)
├── backend/                      # Backend Express
│   ├── routes/                  # Rotas da API
│   │   └── ai-engines.js       # Endpoints de IA
│   └── middleware/              # Middlewares
│       ├── rate-limit.js       # Rate limiting
│       └── pagination.js       # Paginação
├── core/ai/                      # Engines de IA
│   ├── engines/                 # 4 engines principais
│   │   ├── demand-predictor/   # Previsão de demanda
│   │   ├── stock-health/       # Saúde do estoque
│   │   ├── smart-pricing/      # Precificação
│   │   └── grooc-recommendation/ # Recomendações
│   ├── services/                # Serviços de dados
│   ├── jobs/                    # Jobs agendados
│   └── utils/                   # Utilitários
├── components/                   # Componentes React
│   └── ai-dashboard/            # Componentes do dashboard
├── lib/                          # Bibliotecas compartilhadas
│   ├── ai-api.ts               # Cliente de API de IA
│   ├── api-client.ts           # Cliente HTTP
│   └── prisma.ts               # Cliente Prisma
├── prisma/                       # Schema e migrations
├── docs/                         # Documentação
│   ├── API_DOCUMENTATION.md    # Docs de API
│   └── DASHBOARD_GUIDE.md      # Guia do dashboard
└── ecosystem.config.js           # Configuração PM2
```

---

## 🚀 Instalação

### Pré-requisitos

- Node.js 22+
- PostgreSQL 14+
- npm ou yarn
- PM2 (opcional, para produção)

### Passo a Passo

1. **Clone o repositório**
```bash
git clone https://github.com/seu-usuario/precivox.git
cd precivox
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
cp .env.example .env
# Edite .env com suas configurações
```

4. **Configure o banco de dados**
```bash
npx prisma migrate dev
npx prisma db seed
```

5. **Compile os engines de IA**
```bash
npm run build:ai
```

6. **Inicie o projeto**

**Desenvolvimento:**
```bash
npm run dev          # Next.js (porta 3000)
npm run dev:backend  # Backend (porta 3001)
```

**Produção:**
```bash
npm run build
pm2 start ecosystem.config.js
```

---

## 🔧 Configuração

### Variáveis de Ambiente

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/precivox"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="seu-secret-super-seguro"

# JWT
JWT_SECRET="seu-jwt-secret"

# OAuth (opcional)
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
FACEBOOK_CLIENT_ID="..."
FACEBOOK_CLIENT_SECRET="..."

# API
PORT=3001
NODE_ENV=production
```

---

## 📊 Engines de IA

### 1. Demand Predictor
Prevê demanda futura baseado em:
- Histórico de vendas
- Sazonalidade
- Tendências
- Padrões de comportamento

### 2. Stock Health Engine
Analisa saúde do estoque:
- Risco de ruptura
- Produtos parados
- Giro de estoque
- Alertas automáticos

### 3. Smart Pricing Engine
Otimiza precificação:
- Elasticidade de preço
- Análise de competidores
- Margem vs volume
- Recomendações de promoção

### 4. GROOC Recommendation Engine
Recomendações personalizadas:
- Produtos alternativos
- Melhores ofertas
- Rota otimizada
- Economia estimada

---

## 🤖 Automação

### Jobs Agendados

| Job | Frequência | Horário | Descrição |
|-----|-----------|---------|-----------|
| Análise Diária | Diária | 00:00 | Análise completa de demanda e estoque |
| Alertas de Estoque | Hora em hora | A cada hora | Verificação de rupturas e excessos |
| Relatório Semanal | Semanal | Segunda 06:00 | Relatório consolidado da semana |

### Gerenciamento (PM2)

```bash
# Ver status
pm2 list

# Ver logs
pm2 logs precivox-ai-scheduler

# Reiniciar
pm2 restart precivox-ai-scheduler

# Parar
pm2 stop precivox-ai-scheduler
```

---

## 🔐 Autenticação

### Roles de Usuário

- **ADMIN:** Acesso total ao sistema
- **GESTOR:** Gerencia mercado e visualiza IA
- **CLIENTE:** Acessa listas e recomendações

### Endpoints Protegidos

Todas as APIs de IA requerem autenticação JWT:

```javascript
headers: {
  'Authorization': 'Bearer SEU_TOKEN'
}
```

---

## 📈 Performance

### Otimizações Implementadas

✅ **Rate Limiting:** 10 req/min por usuário  
✅ **Cache:** TTL de 5 minutos  
✅ **Paginação:** Máximo 100 itens por página  
✅ **Índices de Banco:** Queries otimizadas  
✅ **Eager Loading:** Redução de queries N+1  
✅ **Compressão:** Gzip habilitado  

### Métricas

- **Tempo de Resposta:** <500ms (p95)
- **Uptime:** 99.9%
- **Cache Hit Rate:** ~70%
- **Concurrent Users:** Suporta 1000+

---

## 🧪 Testes

### Executar Testes

```bash
# Testes unitários
npm test

# Testes de integração
npm run test:integration

# Testes E2E
npm run test:e2e

# Coverage
npm run test:coverage
```

---

## 📚 Documentação

- **[API Documentation](./docs/API_DOCUMENTATION.md)** - Referência completa de APIs
- **[Dashboard Guide](./docs/DASHBOARD_GUIDE.md)** - Guia do usuário do dashboard
- **[Architecture](./docs/ARCHITECTURE.md)** - Arquitetura detalhada do sistema

---

## 🚀 Deploy

### Produção

1. **Build do projeto**
```bash
npm run build
npm run build:ai
```

2. **Configurar PM2**
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

3. **Configurar Nginx**
```nginx
server {
    listen 80;
    server_name precivox.com.br;

    location / {
        proxy_pass http://localhost:3000;
    }

    location /api/ {
        proxy_pass http://localhost:3001;
    }
}
```

4. **SSL (Let's Encrypt)**
```bash
sudo certbot --nginx -d precivox.com.br
```

---

## 🐛 Troubleshooting

### Problemas Comuns

**Erro 502 (Bad Gateway)**
```bash
# Verificar se Next.js está rodando
pm2 list | grep nextjs
pm2 restart precivox-nextjs
```

**Erro 401 (Unauthorized)**
```bash
# Verificar JWT_SECRET
echo $JWT_SECRET
# Fazer login novamente
```

**Dashboard não carrega**
```bash
# Limpar cache
pm2 flush
# Reiniciar backend
pm2 restart precivox-backend
```

---

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/NovaFeature`)
3. Commit suas mudanças (`git commit -m 'Add: Nova feature'`)
4. Push para a branch (`git push origin feature/NovaFeature`)
5. Abra um Pull Request

---

## 📝 Changelog

### v2.0.0 (03/12/2025)
- ✅ Dashboard de IA completo
- ✅ 4 engines de IA implementados
- ✅ Jobs de automação
- ✅ Rate limiting e paginação
- ✅ Otimizações de performance
- ✅ Documentação completa

### v1.0.0 (25/11/2025)
- ✅ Lançamento inicial
- ✅ CRUD de mercados e produtos
- ✅ Autenticação NextAuth
- ✅ Prisma ORM

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 👥 Equipe

**Desenvolvedor Principal:** Romulo Roldão  
**Arquitetura de IA:** Equipe PRECIVOX  
**Suporte:** suporte@precivox.com.br

---

## 🔗 Links

- **Website:** https://precivox.com.br
- **Dashboard:** https://precivox.com.br/gestor/ia/dashboard
- **Admin:** https://precivox.com.br/admin
- **Documentação:** https://docs.precivox.com.br

---

**Made with ❤️ by PRECIVOX Team**
