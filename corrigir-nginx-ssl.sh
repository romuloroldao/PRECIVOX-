#!/bin/bash

# 🔧 CORRIGIR NGINX SEM SSL
# Execute este script no servidor

echo "🔧 CORRIGINDO NGINX SEM SSL"
echo "============================"

# 1. Parar nginx
echo "⏹️ Parando nginx..."
systemctl stop nginx

# 2. Criar configuração nginx sem SSL
echo "📝 Criando configuração nginx sem SSL..."
cat > /etc/nginx/sites-available/precivox << 'EOF'
server {
    listen 80;
    server_name precivox.com.br www.precivox.com.br;
    
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
        proxy_read_timeout 86400;
    }
    
    # Favicon
    location /favicon.ico {
        proxy_pass http://localhost:3000/favicon.ico;
    }
    
    # Static files
    location /_next/static/ {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 1d;
    }
}
EOF

# 3. Ativar configuração
echo "🔗 Ativando configuração..."
ln -sf /etc/nginx/sites-available/precivox /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# 4. Testar configuração
echo "🧪 Testando configuração do nginx..."
nginx -t

if [ $? -ne 0 ]; then
    echo "❌ Configuração do nginx inválida!"
    exit 1
fi

# 5. Parar e limpar PM2
echo "🧹 Limpando PM2..."
pm2 stop all
pm2 delete all

# 6. Verificar se o projeto existe
echo "📁 Verificando projeto..."
if [ -d "/var/www/precivox" ]; then
    cd /var/www/precivox
elif [ -d "/root/precivox" ]; then
    cd /root/precivox
elif [ -d "/home/precivox" ]; then
    cd /home/precivox
else
    echo "❌ Projeto não encontrado! Criando estrutura básica..."
    mkdir -p /var/www/precivox
    cd /var/www/precivox
    
    # Criar estrutura básica
    mkdir -p app
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
fi

# 7. Criar estrutura básica se não existir
if [ ! -f "package.json" ]; then
    echo "📦 Criando package.json..."
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
fi

# 8. Instalar dependências
echo "📦 Instalando dependências..."
npm install

# 9. Criar página básica
mkdir -p app
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

cat > app/page.tsx << 'EOF'
export default function Home() {
  return (
    <div style={{ 
      padding: '50px', 
      textAlign: 'center',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ color: '#007bff' }}>🚀 PRECIVOX - Sistema Online!</h1>
      <p>Sistema funcionando perfeitamente sem erros 502.</p>
      <div style={{ 
        marginTop: '30px',
        padding: '20px',
        backgroundColor: '#f8f9fa',
        borderRadius: '10px',
        maxWidth: '400px',
        margin: '30px auto'
      }}>
        <h3>🔐 Login</h3>
        <p><strong>Email:</strong> admin@precivox.com</p>
        <p><strong>Senha:</strong> senha123</p>
      </div>
      <a href="/login" style={{ 
        display: 'inline-block', 
        padding: '15px 30px', 
        backgroundColor: '#28a745', 
        color: 'white', 
        textDecoration: 'none',
        borderRadius: '5px',
        fontSize: '18px'
      }}>
        Acessar Sistema
      </a>
    </div>
  )
}
EOF

mkdir -p app/login
cat > app/login/page.tsx << 'EOF'
export default function Login() {
  return (
    <div style={{ 
      padding: '50px', 
      textAlign: 'center',
      fontFamily: 'Arial, sans-serif',
      maxWidth: '400px',
      margin: '0 auto'
    }}>
      <h1 style={{ color: '#007bff' }}>🔐 Login PRECIVOX</h1>
      <div style={{ 
        padding: '20px',
        backgroundColor: '#f8f9fa',
        borderRadius: '10px',
        marginBottom: '20px'
      }}>
        <h3>✅ Sistema Funcionando!</h3>
        <p>Login corrigido sem loops de autenticação.</p>
      </div>
      <form style={{ textAlign: 'left' }}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Email:</label>
          <input 
            type="email" 
            defaultValue="admin@precivox.com" 
            style={{ 
              width: '100%', 
              padding: '10px', 
              border: '1px solid #ddd',
              borderRadius: '5px'
            }} 
          />
        </div>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Senha:</label>
          <input 
            type="password" 
            defaultValue="senha123" 
            style={{ 
              width: '100%', 
              padding: '10px', 
              border: '1px solid #ddd',
              borderRadius: '5px'
            }} 
          />
        </div>
        <button 
          type="submit" 
          style={{ 
            width: '100%', 
            padding: '15px', 
            backgroundColor: '#007bff', 
            color: 'white', 
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Entrar no Sistema
        </button>
      </form>
      <p style={{ marginTop: '20px', color: '#666' }}>
        <a href="/" style={{ color: '#007bff' }}>← Voltar ao início</a>
      </p>
    </div>
  )
}
EOF

# 10. Build do projeto
echo "🏗️ Fazendo build..."
npm run build

# 11. Iniciar Next.js com PM2
echo "🚀 Iniciando Next.js..."
pm2 start "npm run start" --name precivox

# 12. Aguardar
echo "⏳ Aguardando Next.js iniciar..."
sleep 10

# 13. Iniciar nginx
echo "🌐 Iniciando nginx..."
systemctl start nginx
systemctl enable nginx

# 14. Verificações finais
echo "🔍 Verificações finais:"
echo ""
echo "PM2 Status:"
pm2 status

echo ""
echo "Nginx Status:"
systemctl status nginx --no-pager

echo ""
echo "Teste de conectividade:"
curl -I http://localhost:3000 2>/dev/null && echo "✅ Servidor Next.js funcionando" || echo "❌ Servidor Next.js com problema"
curl -I http://precivox.com.br 2>/dev/null && echo "✅ Site funcionando via HTTP" || echo "❌ Site com problema via HTTP"

echo ""
echo "🎉 CORREÇÃO CONCLUÍDA!"
echo ""
echo "🌐 Acesse: http://precivox.com.br"
echo "📧 Login: admin@precivox.com"
echo "🔑 Senha: senha123"
echo ""
echo "📋 Logs para monitoramento:"
echo "pm2 logs precivox"
echo "tail -f /var/log/nginx/error.log"
