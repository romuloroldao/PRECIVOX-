# Testes Automatizados - Precivox

Este diretório contém a suíte completa de testes automatizados para o sistema Precivox.

## Estrutura

```
tests/
├── unit/              # Testes unitários
│   └── engines/       # Testes dos engines de IA
├── integration/       # Testes de integração
│   └── ai-engines.test.ts
├── e2e/              # Testes end-to-end
│   └── dashboard.test.ts
├── setup.ts          # Configuração global
└── README.md         # Este arquivo
```

## Instalação

```bash
npm install
```

## Executando Testes

### Todos os testes
```bash
npm test
```

### Testes unitários apenas
```bash
npm run test:unit
```

### Testes de integração apenas
```bash
npm run test:integration
```

### Testes E2E apenas
```bash
npm run test:e2e
```

### Modo watch (desenvolvimento)
```bash
npm run test:watch
```

### Com cobertura de código
```bash
npm run test:coverage
```

## Tipos de Testes

### Testes Unitários

Testam componentes isolados sem dependências externas:
- **Engines de IA**: `demand-predictor`, `stock-health`, `smart-pricing`, `grooc-recommendation`
- Serviços de dados
- Utilitários

**Localização**: `tests/unit/`

### Testes de Integração

Testam a integração entre componentes e APIs:
- Endpoints de IA
- Autenticação JWT
- Paginação
- Rate limiting
- Filtros

**Localização**: `tests/integration/`

### Testes E2E

Testam o fluxo completo do usuário no navegador:
- Login e autenticação
- Dashboard principal
- Painel de IA
- Navegação
- Responsividade

**Requisitos**: 
- Aplicação rodando em `http://localhost:3000`
- Playwright instalado: `npx playwright install`

**Localização**: `tests/e2e/`

## Configuração

### Variáveis de Ambiente

Os testes usam variáveis de ambiente de teste definidas em `tests/setup.ts`:
- `JWT_SECRET`: Chave secreta para tokens JWT
- `DATABASE_URL`: URL do banco de dados de teste
- `NODE_ENV`: Definido como 'test'

### Jest

Configuração em `jest.config.js`:
- Preset: `ts-jest`
- Ambiente: `node`
- Timeout: 30 segundos
- Cobertura: HTML, LCOV, texto

## Cobertura de Código

Após executar `npm run test:coverage`, os relatórios estarão em:
- `coverage/lcov-report/index.html` (HTML)
- `coverage/lcov.info` (LCOV)
- Console (texto)

## Melhores Práticas

1. **Isolamento**: Cada teste deve ser independente
2. **Mocks**: Use mocks para dependências externas
3. **Nomenclatura**: Use descrições claras (`deve fazer X quando Y`)
4. **Arrange-Act-Assert**: Estruture testes em 3 fases
5. **Limpeza**: Limpe mocks e estado após cada teste

## Troubleshooting

### Erros de importação
- Verifique se `tsconfig.json` está configurado corretamente
- Execute `npm run build:ai` antes dos testes

### Erros de conexão (E2E)
- Certifique-se de que a aplicação está rodando
- Verifique a URL em `tests/e2e/dashboard.test.ts`

### Timeouts
- Aumente o timeout em `jest.config.js` se necessário
- Verifique se os mocks estão configurados corretamente

## Contribuindo

Ao adicionar novos testes:
1. Siga a estrutura de diretórios existente
2. Use a convenção de nomenclatura `*.test.ts`
3. Adicione mocks apropriados
4. Documente casos de teste complexos
5. Execute `npm test` antes de commitar

