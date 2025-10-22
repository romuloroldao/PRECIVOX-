#!/bin/bash

# 🚨 DEPLOY URGENTE - PRECIVOX.COM.BR
# Execute este script no servidor de produção

echo "🚨 DEPLOY URGENTE - PRECIVOX.COM.BR"
echo "=================================="

# 1. Parar todos os serviços
echo "⏹️ Parando serviços..."
pm2 stop all || true
pkill -f "next" || true
pkill -f "node" || true

# 2. Ir para diretório do projeto
echo "📁 Navegando para diretório do projeto..."
cd /var/www/precivox || cd /root/precivox || cd /home/precivox || cd /opt/precivox

# 3. Backup rápido
echo "💾 Backup rápido..."
cp -r . ../precivox-backup-$(date +%Y%m%d_%H%M%S) || true

# 4. Aplicar correções de login
echo "🔧 Aplicando correções de login..."

# Criar middleware.ts
cat > middleware.ts << 'EOF'
import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    const role = token.role as string;

    if (path.startsWith('/admin') && role !== 'ADMIN') {
      const redirectUrl = role === 'GESTOR' ? '/gestor/home' : '/cliente/home';
      return NextResponse.redirect(new URL(redirectUrl, req.url));
    }

    if (path.startsWith('/gestor') && role !== 'GESTOR' && role !== 'ADMIN') {
      const redirectUrl = role === 'ADMIN' ? '/admin/dashboard' : '/cliente/home';
      return NextResponse.redirect(new URL(redirectUrl, req.url));
    }

    if (path.startsWith('/cliente') && role === 'ADMIN') {
      return NextResponse.redirect(new URL('/admin/dashboard', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    '/admin/:path*',
    '/gestor/:path*',
    '/cliente/:path*',
  ],
};
EOF

# 5. Instalar dependências
echo "📦 Instalando dependências..."
npm install

# 6. Build
echo "🏗️ Fazendo build..."
npm run build

# 7. Iniciar serviços
echo "🚀 Iniciando serviços..."
pm2 start ecosystem.config.js || pm2 start "npm run start" --name precivox

# 8. Verificar status
echo "✅ Verificando status..."
sleep 5
pm2 status

# 9. Teste
echo "🧪 Testando sistema..."
curl -I http://localhost:3000 || curl -I https://precivox.com.br

echo ""
echo "🎉 DEPLOY CONCLUÍDO!"
echo ""
echo "📋 CREDENCIAIS PARA TESTE:"
echo "Email: admin@precivox.com"
echo "Senha: senha123"
echo ""
echo "🌐 Acesse: https://precivox.com.br"
echo ""



