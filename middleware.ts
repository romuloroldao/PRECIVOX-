import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware do Next.js
 * 
 * IMPORTANTE: Assets estáticos (_next/static) devem SEMPRE ser ignorados
 * e nunca passar por lógica de autenticação ou validação.
 * 
 * Este middleware garante que:
 * 1. Assets estáticos são sempre servidos sem interceptação
 * 2. APIs retornam JSON, não HTML
 * 3. TokenManager é usado apenas em API routes, não em assets
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ============================================
  // BYPASS COMPLETO PARA ASSETS ESTÁTICOS
  // ============================================
  
  // Ignorar TODOS os assets estáticos do Next.js
  // Estes arquivos devem ser servidos diretamente pelo Next.js
  // sem nenhuma lógica de autenticação ou validação
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
    // Next.js servirá o arquivo com o Content-Type correto
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
  // dentro de cada route handler, não no middleware.
  // Isso permite:
  // 1. Retornar JSON em vez de HTML em caso de erro
  // 2. Usar TokenManager apenas onde necessário
  // 3. Não afetar assets estáticos
  
  if (pathname.startsWith('/api/')) {
    // APIs devem retornar JSON, não HTML
    // A validação de token será feita dentro de cada route handler
    // usando TokenManager.validateApiKey() ou similar
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
 * 
 * O matcher usa uma regex negativa para excluir:
 * - _next/static (arquivos estáticos)
 * - _next/image (otimização de imagens)
 * - favicon.ico
 * - sw.js (service worker)
 * - manifest.json (PWA manifest)
 * - Arquivos de imagem, fonte, etc.
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
    '/((?!_next/static|_next/image|_next/webpack|favicon.ico|sw.js|manifest.json|.*\\.(?:ico|png|jpg|jpeg|svg|gif|webp|woff|woff2|ttf|eot)).*)',
  ],
};

