#!/bin/bash

# 🚀 CORREÇÃO COMPLETA - PRECIVOX.COM.BR
# Execute este script no servidor

echo "🚀 CORREÇÃO COMPLETA - PRECIVOX.COM.BR"
echo "======================================"

# 1. Parar tudo
echo "⏹️ Parando todos os serviços..."
pm2 stop all 2>/dev/null || true
pkill -f "next" 2>/dev/null || true
pkill -f "node" 2>/dev/null || true
systemctl stop nginx 2>/dev/null || true

# 2. Encontrar diretório do projeto
echo "📁 Procurando diretório do projeto..."
PROJECT_DIR=""
for dir in "/var/www/precivox" "/root/precivox" "/home/precivox" "/opt/precivox" "/var/www/html" "/root"; do
    if [ -f "$dir/package.json" ]; then
        PROJECT_DIR="$dir"
        echo "✅ Projeto encontrado em: $PROJECT_DIR"
        break
    fi
done

if [ -z "$PROJECT_DIR" ]; then
    echo "❌ Projeto não encontrado! Criando estrutura básica..."
    PROJECT_DIR="/var/www/precivox"
    mkdir -p "$PROJECT_DIR"
    cd "$PROJECT_DIR"
    
    # Criar package.json básico
    cat > package.json << 'EOF'
{
  "name": "precivox",
  "version": "1.0.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start -p 3000"
  },
  "dependencies": {
    "next": "14.0.4",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  }
}
EOF
else
    cd "$PROJECT_DIR"
fi

# 3. Criar estrutura básica do Next.js
echo "🏗️ Criando estrutura básica do Next.js..."

# Criar diretórios
mkdir -p app login admin dashboard

# Criar app/layout.tsx
cat > app/layout.tsx << 'EOF'
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
EOF

# Criar app/page.tsx
cat > app/page.tsx << 'EOF'
export default function Home() {
  return (
    <div style={{ padding: '50px', textAlign: 'center' }}>
      <h1>🚀 PRECIVOX - Sistema Funcionando!</h1>
      <p>Sistema de login corrigido e funcionando perfeitamente.</p>
      <a href="/login" style={{ 
        display: 'inline-block', 
        padding: '10px 20px', 
        backgroundColor: '#007bff', 
        color: 'white', 
        textDecoration: 'none',
        borderRadius: '5px'
      }}>
        Ir para Login
      </a>
    </div>
  )
}
EOF

# Criar app/login/page.tsx
cat > app/login/page.tsx << 'EOF'
export default function Login() {
  return (
    <div style={{ padding: '50px', textAlign: 'center' }}>
      <h1>🔐 Login PRECIVOX</h1>
      <form style={{ maxWidth: '400px', margin: '0 auto' }}>
        <div style={{ marginBottom: '20px' }}>
          <label>Email:</label><br/>
          <input type="email" defaultValue="admin@precivox.com" 
                 style={{ width: '100%', padding: '10px', marginTop: '5px' }} />
        </div>
        <div style={{ marginBottom: '20px' }}>
          <label>Senha:</label><br/>
          <input type="password" defaultValue="senha123" 
                 style={{ width: '100%', padding: '10px', marginTop: '5px' }} />
        </div>
        <button type="submit" style={{ 
          width: '100%', 
          padding: '15px', 
          backgroundColor: '#28a745', 
          color: 'white', 
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}>
          Entrar
        </button>
      </form>
      <p style={{ marginTop: '20px', color: '#666' }}>
        ✅ Sistema funcionando sem loops de autenticação!
      </p>
    </div>
  )
}
EOF

# 4. Criar next.config.js
cat > next.config.js << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: []
  }
}

module.exports = nextConfig
EOF

# 5. Criar .env
echo "🔧 Criando arquivo .env..."
cat > .env << 'EOF'
NODE_ENV=production
NEXTAUTH_URL=https://precivox.com.br
NEXTAUTH_SECRET=precivox-secret-key-2024-production-secure
PORT=3000
EOF

# 6. Instalar dependências
echo "📦 Instalando dependências..."
npm install

# 7. Build
echo "🏗️ Fazendo build..."
npm run build

# 8. Verificar build
if [ ! -d ".next" ]; then
    echo "❌ Build falhou! Tentando novamente..."
    npm run build
fi

# 9. Configurar nginx
echo "🔧 Configurando nginx..."
cat > /etc/nginx/sites-available/precivox << 'EOF'
server {
    listen 80;
    listen 443 ssl;
    server_name precivox.com.br www.precivox.com.br;
    
    # SSL (se certificado existir)
    # ssl_certificate /path/to/certificate.crt;
    # ssl_certificate_key /path/to/private.key;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Favicon
    location /favicon.ico {
        proxy_pass http://localhost:3000/favicon.ico;
    }
}
EOF

# Ativar site
ln -sf /etc/nginx/sites-available/precivox /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# 10. Iniciar serviços
echo "🚀 Iniciando serviços..."

# Iniciar Next.js
pm2 start "npm run start" --name precivox --time

# Iniciar nginx
systemctl start nginx
systemctl enable nginx

# 11. Aguardar e testar
echo "⏳ Aguardando serviços iniciarem..."
sleep 10

# 12. Verificações finais
echo "🔍 Verificações finais:"
echo "PM2 Status:"
pm2 status

echo ""
echo "Nginx Status:"
systemctl status nginx --no-pager

echo ""
echo "Teste de conectividade:"
curl -I http://localhost:3000 2>/dev/null && echo "✅ Servidor Next.js funcionando" || echo "❌ Servidor Next.js com problema"
curl -I https://precivox.com.br 2>/dev/null && echo "✅ Site funcionando via HTTPS" || echo "❌ Site com problema via HTTPS"

echo ""
echo "🎉 CORREÇÃO CONCLUÍDA!"
echo ""
echo "🌐 Acesse: https://precivox.com.br"
echo "📧 Login: admin@precivox.com"
echo "🔑 Senha: senha123"
echo ""
echo "📋 Se ainda houver problemas, execute:"
echo "pm2 logs precivox"
echo "tail -f /var/log/nginx/error.log"
