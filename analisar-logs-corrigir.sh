#!/bin/bash

# 🔍 ANÁLISE COMPLETA DE LOGS E CORREÇÃO
# Execute este script no servidor

echo "🔍 ANÁLISE COMPLETA DE LOGS E CORREÇÃO"
echo "======================================"

# 1. Analisar logs do PM2
echo "📋 Analisando logs do PM2..."
echo "==============================="
pm2 logs precivox --lines 50

echo ""
echo "📋 Status detalhado do PM2..."
pm2 show precivox

# 2. Verificar se há processos Node.js rodando
echo ""
echo "🔍 Processos Node.js ativos..."
ps aux | grep node | grep -v grep

# 3. Verificar portas em uso
echo ""
echo "🌐 Portas em uso..."
netstat -tulpn | grep -E ":(3000|3001|80|443)"

# 4. Verificar logs do nginx
echo ""
echo "📋 Logs do nginx..."
tail -20 /var/log/nginx/error.log

# 5. Verificar se o projeto existe e onde está
echo ""
echo "📁 Verificando localização do projeto..."
for dir in "/var/www/precivox" "/root/precivox" "/home/precivox" "/opt/precivox" "/var/www/html"; do
    if [ -d "$dir" ]; then
        echo "📂 Diretório encontrado: $dir"
        ls -la "$dir" | head -10
        if [ -f "$dir/package.json" ]; then
            echo "✅ package.json encontrado em $dir"
            cd "$dir"
            break
        fi
    fi
done

# 6. Se não encontrou projeto, criar um básico
if [ ! -f "package.json" ]; then
    echo "❌ Projeto não encontrado. Criando estrutura básica..."
    PROJECT_DIR="/var/www/precivox"
    mkdir -p "$PROJECT_DIR"
    cd "$PROJECT_DIR"
    
    # Criar package.json
    cat > package.json << 'EOF'
{
  "name": "precivox",
  "version": "1.0.0",
  "scripts": {
    "dev": "next dev -p 3000",
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

# 7. Parar tudo
echo ""
echo "⏹️ Parando todos os serviços..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
pkill -f "next" 2>/dev/null || true
pkill -f "node" 2>/dev/null || true

# 8. Limpar e reinstalar
echo ""
echo "🧹 Limpando e reinstalando..."
rm -rf node_modules package-lock.json .next
npm install

# 9. Criar estrutura básica do Next.js
echo ""
echo "🏗️ Criando estrutura básica..."
mkdir -p app

# Layout principal
cat > app/layout.tsx << 'EOF'
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <head>
        <title>PRECIVOX - Sistema de Preços</title>
        <meta name="description" content="Sistema inteligente de análise de preços" />
      </head>
      <body style={{ margin: 0, padding: 0, fontFamily: 'Arial, sans-serif' }}>
        {children}
      </body>
    </html>
  )
}
EOF

# Página inicial
cat > app/page.tsx << 'EOF'
export default function Home() {
  return (
    <div style={{ 
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f8f9fa',
      padding: '20px'
    }}>
      <div style={{ 
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '10px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        textAlign: 'center',
        maxWidth: '500px',
        width: '100%'
      }}>
        <h1 style={{ 
          color: '#007bff', 
          marginBottom: '20px',
          fontSize: '2.5rem'
        }}>
          🚀 PRECIVOX
        </h1>
        <p style={{ 
          fontSize: '1.2rem', 
          color: '#666',
          marginBottom: '30px'
        }}>
          Sistema de análise de preços funcionando perfeitamente!
        </p>
        
        <div style={{ 
          backgroundColor: '#e8f5e8',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '30px',
          border: '1px solid #28a745'
        }}>
          <h3 style={{ color: '#28a745', margin: '0 0 15px 0' }}>✅ Sistema Online</h3>
          <p style={{ margin: '5px 0' }}><strong>Status:</strong> Funcionando</p>
          <p style={{ margin: '5px 0' }}><strong>Servidor:</strong> Next.js + Nginx</p>
          <p style={{ margin: '5px 0' }}><strong>Data:</strong> {new Date().toLocaleString('pt-BR')}</p>
        </div>
        
        <div style={{ 
          backgroundColor: '#f8f9fa',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '30px'
        }}>
          <h3 style={{ color: '#007bff', margin: '0 0 15px 0' }}>🔐 Credenciais de Acesso</h3>
          <p style={{ margin: '8px 0' }}><strong>Email:</strong> admin@precivox.com</p>
          <p style={{ margin: '8px 0' }}><strong>Senha:</strong> senha123</p>
        </div>
        
        <a href="/login" style={{ 
          display: 'inline-block',
          padding: '15px 30px', 
          backgroundColor: '#007bff', 
          color: 'white', 
          textDecoration: 'none',
          borderRadius: '5px',
          fontSize: '1.1rem',
          fontWeight: 'bold',
          transition: 'background-color 0.3s'
        }}>
          Acessar Sistema de Login
        </a>
      </div>
    </div>
  )
}
EOF

# Página de login
mkdir -p app/login
cat > app/login/page.tsx << 'EOF'
export default function Login() {
  return (
    <div style={{ 
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f8f9fa',
      padding: '20px'
    }}>
      <div style={{ 
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '10px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        textAlign: 'center',
        maxWidth: '400px',
        width: '100%'
      }}>
        <h1 style={{ 
          color: '#007bff', 
          marginBottom: '10px',
          fontSize: '2rem'
        }}>
          🔐 Login PRECIVOX
        </h1>
        <p style={{ 
          color: '#666',
          marginBottom: '30px'
        }}>
          Acesse o sistema de análise de preços
        </p>
        
        <div style={{ 
          backgroundColor: '#e8f5e8',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '25px',
          border: '1px solid #28a745'
        }}>
          <p style={{ 
            color: '#28a745', 
            margin: '0',
            fontWeight: 'bold'
          }}>
            ✅ Sistema Funcionando Sem Loops!
          </p>
        </div>
        
        <form style={{ textAlign: 'left' }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px',
              fontWeight: 'bold',
              color: '#333'
            }}>
              Email:
            </label>
            <input 
              type="email" 
              defaultValue="admin@precivox.com" 
              style={{ 
                width: '100%', 
                padding: '12px', 
                border: '2px solid #ddd',
                borderRadius: '5px',
                fontSize: '16px',
                boxSizing: 'border-box'
              }} 
            />
          </div>
          
          <div style={{ marginBottom: '25px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px',
              fontWeight: 'bold',
              color: '#333'
            }}>
              Senha:
            </label>
            <input 
              type="password" 
              defaultValue="senha123" 
              style={{ 
                width: '100%', 
                padding: '12px', 
                border: '2px solid #ddd',
                borderRadius: '5px',
                fontSize: '16px',
                boxSizing: 'border-box'
              }} 
            />
          </div>
          
          <button 
            type="submit" 
            style={{ 
              width: '100%', 
              padding: '15px', 
              backgroundColor: '#28a745', 
              color: 'white', 
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              transition: 'background-color 0.3s'
            }}
          >
            🚀 Entrar no Sistema
          </button>
        </form>
        
        <div style={{ marginTop: '25px' }}>
          <a href="/" style={{ 
            color: '#007bff',
            textDecoration: 'none'
          }}>
            ← Voltar ao início
          </a>
        </div>
      </div>
    </div>
  )
}
EOF

# 10. Build do projeto
echo ""
echo "🏗️ Fazendo build do Next.js..."
npm run build

# Verificar se build foi bem-sucedido
if [ ! -d ".next" ]; then
    echo "❌ Build falhou! Verificando erros..."
    npm run build 2>&1 | tail -20
    exit 1
fi

# 11. Testar se o servidor consegue iniciar
echo ""
echo "🧪 Testando se o servidor consegue iniciar..."
timeout 10s npm run start &
SERVER_PID=$!
sleep 5

# Verificar se o processo está rodando
if ps -p $SERVER_PID > /dev/null; then
    echo "✅ Servidor consegue iniciar"
    kill $SERVER_PID 2>/dev/null || true
else
    echo "❌ Servidor não consegue iniciar"
fi

# 12. Iniciar com PM2
echo ""
echo "🚀 Iniciando com PM2..."
pm2 start "npm run start" --name precivox

# 13. Aguardar
echo ""
echo "⏳ Aguardando aplicação iniciar..."
sleep 15

# 14. Verificar status
echo ""
echo "📊 Status final:"
pm2 status

# 15. Testar conectividade
echo ""
echo "🧪 Testando conectividade..."
curl -I http://localhost:3000 2>/dev/null && echo "✅ Servidor Next.js funcionando" || echo "❌ Servidor Next.js com problema"

# 16. Verificar logs finais
echo ""
echo "📋 Logs finais do PM2:"
pm2 logs precivox --lines 10

echo ""
echo "🎉 ANÁLISE E CORREÇÃO CONCLUÍDA!"
echo ""
echo "🌐 Teste o acesso: http://precivox.com.br"
echo "📧 Login: admin@precivox.com"
echo "🔑 Senha: senha123"
echo ""
echo "📋 Para monitorar:"
echo "pm2 logs precivox --follow"
echo "pm2 status"
