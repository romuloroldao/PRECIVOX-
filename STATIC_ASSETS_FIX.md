# 🔧 Correção: Assets Estáticos Retornando HTML (400)

## 📋 Diagnóstico

### Problema Identificado

Arquivos estáticos do Next.js (`/_next/static/chunks/*.js` e CSS) estão retornando:
- **Status**: 400 (Bad Request)
- **Content-Type**: `text/html` (incorreto)
- **Esperado**: `application/javascript` ou `text/css`

### Causa Raiz

**Não existe um `middleware.ts` na raiz do projeto** para proteger assets estáticos. Isso pode causar:

1. **Requisições de assets sendo interceptadas** por lógica de autenticação
2. **Erros de autenticação retornando HTML** (redirect para login) em vez de deixar passar assets
3. **API routes retornando HTML** quando deveriam retornar assets ou ignorar a requisição

### Arquivos Afetados

- `/_next/static/chunks/*.js`
- `/_next/static/chunks/app/layout-*.js`
- `/_next/static/chunks/app/page-*.js`
- `/_next/static/*.css`

---

## ✅ Solução

### 1. Criar Middleware do Next.js

**Arquivo**: `/root/middleware.ts` (na raiz do projeto)

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware do Next.js
 * 
 * IMPORTANTE: Assets estáticos (_next/static) devem SEMPRE ser ignorados
 * e nunca passar por lógica de autenticação ou validação.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ============================================
  // BYPASS COMPLETO PARA ASSETS ESTÁTICOS
  // ============================================
  
  // Ignorar TODOS os assets estáticos do Next.js
  if (
    pathname.startsWith('/_next/static') ||
    pathname.startsWith('/_next/image') ||
    pathname.startsWith('/_next/webpack') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/sw.js') ||
    pathname.startsWith('/manifest.json') ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp|woff|woff2|ttf|eot)$/)
  ) {
    // Deixar passar sem nenhuma modificação
    return NextResponse.next();
  }

  // ============================================
  // BYPASS PARA API ROUTES PÚBLICAS
  // ============================================
  
  // APIs públicas não precisam de autenticação
  if (pathname.startsWith('/api/public/')) {
    return NextResponse.next();
  }

  // ============================================
  // APLICAR LÓGICA DE AUTENTICAÇÃO APENAS PARA:
  // - Rotas de API protegidas
  // - Páginas protegidas
  // ============================================
  
  // Para rotas de API protegidas, a autenticação será feita
  // dentro de cada route handler, não no middleware
  // (isso permite retornar JSON em vez de HTML em caso de erro)
  
  if (pathname.startsWith('/api/')) {
    // APIs devem retornar JSON, não HTML
    // A validação de token será feita dentro de cada route handler
    return NextResponse.next();
  }

  // Para páginas protegidas, o NextAuth já gerencia a autenticação
  // Não precisamos fazer nada aqui
  
  return NextResponse.next();
}

/**
 * Matcher: Define quais rotas o middleware deve executar
 * 
 * IMPORTANTE: Excluir explicitamente assets estáticos
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - sw.js (service worker)
     * - manifest.json (PWA manifest)
     * - public files (images, fonts, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.json|.*\\.(?:ico|png|jpg|jpeg|svg|gif|webp|woff|woff2|ttf|eot)).*)',
  ],
};
```

### 2. Garantir que API Routes Retornem JSON, Não HTML

**Verificar**: Todas as API routes devem retornar `NextResponse.json()` em caso de erro, nunca HTML.

**Exemplo Correto**:
```typescript
// ✅ CORRETO
export async function GET(request: NextRequest) {
  try {
    // ... lógica ...
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    // ✅ Retornar JSON, não HTML
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}
```

**Exemplo Incorreto**:
```typescript
// ❌ INCORRETO - Nunca fazer isso
export async function GET(request: NextRequest) {
  if (!authenticated) {
    // ❌ NUNCA retornar HTML ou redirect em API routes
    return NextResponse.redirect('/login');
  }
}
```

### 3. Atualizar next.config.js (Opcional - Headers)

O `next.config.js` já está correto, mas podemos adicionar headers explícitos para assets:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Headers para assets estáticos
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
      {
        source: '/_next/static/css/:path*.css',
        headers: [
          {
            key: 'Content-Type',
            value: 'text/css; charset=utf-8',
          },
        ],
      },
      {
        source: '/_next/static/chunks/:path*.js',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8',
          },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // ... resto da configuração
};

module.exports = nextConfig;
```

---

## 🧪 Validação

### 1. Verificar Middleware

```bash
# Verificar se middleware.ts existe na raiz
ls -la /root/middleware.ts

# Verificar conteúdo
cat /root/middleware.ts | grep -A 5 "matcher"
```

### 2. Testar Assets Estáticos

```bash
# Testar chunk JS
curl -I "http://localhost:3000/_next/static/chunks/app/page-[hash].js"

# Deve retornar:
# HTTP/1.1 200 OK
# Content-Type: application/javascript; charset=utf-8

# Testar CSS
curl -I "http://localhost:3000/_next/static/css/[hash].css"

# Deve retornar:
# HTTP/1.1 200 OK
# Content-Type: text/css; charset=utf-8
```

### 3. Verificar no Navegador

1. Abrir DevTools (F12)
2. Ir para Network tab
3. Recarregar página (Ctrl+Shift+R para bypass cache)
4. Verificar requisições para `/_next/static/`:
   - ✅ Status: 200
   - ✅ Content-Type: `application/javascript` ou `text/css`
   - ❌ NÃO deve ser `text/html`

---

## 📝 Checklist de Implementação

- [ ] Criar `/root/middleware.ts` com matcher correto
- [ ] Verificar que todas as API routes retornam JSON (não HTML)
- [ ] Atualizar `next.config.js` com headers explícitos (opcional)
- [ ] Testar assets estáticos localmente
- [ ] Fazer rebuild: `npm run build`
- [ ] Testar em produção
- [ ] Limpar cache do navegador (Ctrl+Shift+R)

---

## 🔍 Troubleshooting

### Se o problema persistir:

1. **Verificar se há outros middlewares**:
   ```bash
   find . -name "middleware.*" -not -path "./node_modules/*"
   ```

2. **Verificar logs do Next.js**:
   ```bash
   # Em desenvolvimento
   npm run dev
   # Verificar console para erros
   ```

3. **Verificar se há rewrites/redirects** no `next.config.js` ou `vercel.json` que possam estar afetando `/_next/static`

4. **Verificar se há proxy reverso** (nginx, etc.) que possa estar interceptando requisições

---

## ✅ Resultado Esperado

Após implementar:

- ✅ Assets estáticos retornam status 200
- ✅ Content-Type correto (`application/javascript`, `text/css`)
- ✅ Navegador carrega chunks sem erros
- ✅ TokenManager continua funcionando nas APIs
- ✅ Autenticação não afeta assets estáticos

---

**Status**: Pronto para implementação

