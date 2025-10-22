// Middleware temporariamente desabilitado para evitar conflitos com next-auth
// TODO: Implementar middleware customizado com JWT

// import { withAuth } from 'next-auth/middleware';
// import { NextResponse } from 'next/server';

// export default withAuth(
//   function middleware(req) {
//     const token = req.nextauth.token;
//     const path = req.nextUrl.pathname;

//     // Se não tem token mas está tentando acessar área protegida
//     if (!token) {
//       return NextResponse.redirect(new URL('/login', req.url));
//     }

//     // Verificar se o role do usuário tem permissão para acessar a rota
//     const role = token.role as string;

//     // Proteção de rotas por role
//     if (path.startsWith('/admin') && role !== 'ADMIN') {
//       const redirectUrl = role === 'GESTOR' ? '/gestor/home' : '/cliente/home';
//       return NextResponse.redirect(new URL(redirectUrl, req.url));
//     }

//     if (path.startsWith('/gestor') && role !== 'GESTOR' && role !== 'ADMIN') {
//       const redirectUrl = role === 'ADMIN' ? '/admin/dashboard' : '/cliente/home';
//       return NextResponse.redirect(new URL(redirectUrl, req.url));
//     }

//     if (path.startsWith('/cliente') && role === 'ADMIN') {
//       return NextResponse.redirect(new URL('/admin/dashboard', req.url));
//     }

//     return NextResponse.next();
//   },
//   {
//     callbacks: {
//       authorized: ({ token }) => !!token,
//     },
//   }
// );

// export const config = {
//   matcher: [
//     '/admin/:path*',
//     '/gestor/:path*',
//     '/cliente/:path*',
//   ],
// };
