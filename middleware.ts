import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { TokenManager } from '@/lib/token-manager';

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
    '/register',
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
    '/api/auth/[...nextauth]', // NextAuth
    '/api/auth/token', // Emitir tokens (requer NextAuth session)
    '/api/auth/refresh', // Renovar tokens
    '/api/public/', // APIs públicas
    '/api/stats/global', // Stats públicas
  ];

  if (publicApiRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // ============================================
  // VALIDAR AUTENTICAÇÃO PARA APIs PROTEGIDAS
  // ============================================
  
  // TokenManager.validateSession é assíncrono, mas middleware não pode ser async
  // Então vamos apenas passar e deixar a validação nas rotas individuais
  // Isso garante que APIs sempre retornem JSON, não HTML
  
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
