import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware do Next.js - EXCLUSIVO PARA APIs
 * 
 * IMPORTANTE:
 * - Atua APENAS em rotas /api/*
 * - NUNCA intercepta assets estáticos (_next/static, CSS, imagens)
 * - NUNCA intercepta páginas públicas
 * - Usa TokenManager para validar autenticação
 * 
 * Fluxo:
 * 1. Assets estáticos → Bypass completo
 * 2. Rotas públicas → Bypass completo
 * 3. APIs públicas (/api/public/*) → Bypass
 * 4. APIs protegidas (/api/*) → Validar token via TokenManager
 */

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ============================================
  // BYPASS COMPLETO PARA ASSETS ESTÁTICOS
  // ============================================
  
  if (
    pathname.startsWith('/_next/static') ||
    pathname.startsWith('/_next/image') ||
    pathname.startsWith('/_next/webpack') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/sw.js') ||
    pathname.startsWith('/manifest.json') ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp|woff|woff2|ttf|eot|css|js)$/)
  ) {
    return NextResponse.next();
  }

  // ============================================
  // BYPASS PARA ROTAS PÚBLICAS (não APIs)
  // ============================================
  
  const publicRoutes = [
    '/',
    '/login',
    '/logout',
    '/signup',
    '/register',
    '/resetar-senha',
    '/confirmar-email',
    '/setup',
    '/login-simple',
    '/simple',
    '/onboarding',
    '/choose-persona',
  ];
  
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // ============================================
  // MIDDLEWARE APENAS PARA APIs
  // ============================================
  
  if (!pathname.startsWith('/api/')) {
    // Não é API, deixar passar (páginas são protegidas por RouteGuard)
    return NextResponse.next();
  }

  // ============================================
  // BYPASS PARA APIs PÚBLICAS
  // ============================================
  
  const publicApiRoutes = [
    '/api/auth/login',
    '/api/auth/refresh',
    '/api/auth/logout',
    '/api/auth/social/',
    '/api/auth/otp/',
    '/api/public/',
    '/api/stats/global',
    '/api/marketing/',
    '/api/health',
    '/api/telemetry/',
  ];

  if (publicApiRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // ============================================
  // VALIDAR AUTENTICAÇÃO PARA APIs PROTEGIDAS
  // ============================================
  
  // TokenManager.validateSession é assíncrono — validação nas rotas via requireApiSession.
  // Ver app/.cursor/rules/api-auth-required.mdc
  
  return NextResponse.next();
}

/**
 * Matcher: Apenas rotas /api/* (exceto assets)
 */
export const config = {
  matcher: [
    /*
     * Match apenas rotas /api/*, excluindo:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - Assets estáticos (imagens, fontes, CSS, JS)
     */
    '/api/:path*',
  ],
};
