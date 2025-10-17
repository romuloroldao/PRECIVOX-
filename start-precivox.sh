#!/bin/bash

echo "🚀 Iniciando PRECIVOX - Sistema Completo"
echo "========================================"

# Parar processos existentes
echo "🧹 Limpando processos antigos..."
lsof -ti:3000 2>/dev/null | xargs kill -9 2>/dev/null
lsof -ti:3001 2>/dev/null | xargs kill -9 2>/dev/null
lsof -ti:30010,30011,30012 2>/dev/null | xargs kill -9 2>/dev/null
sleep 2

# Iniciar Backend na porta 3001
echo ""
echo "🔧 Iniciando Backend (porta 3001)..."
cd /root/backend
PORT=3001 node server.js > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
sleep 3

# Verificar se backend iniciou
if lsof -ti:3001 >/dev/null 2>&1; then
    echo "✅ Backend rodando na porta 3001 (PID: $BACKEND_PID)"
else
    echo "❌ Erro ao iniciar backend"
    cat /tmp/backend.log
    exit 1
fi

# Iniciar Frontend na porta 3000
echo ""
echo "🎨 Iniciando Frontend (porta 3000)..."
cd /root/precivox
npm run start > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
sleep 5

# Verificar se frontend iniciou
if lsof -ti:3000 >/dev/null 2>&1; then
    echo "✅ Frontend rodando na porta 3000 (PID: $FRONTEND_PID)"
else
    echo "❌ Erro ao iniciar frontend"
    cat /tmp/frontend.log
    exit 1
fi

echo ""
echo "🎉 ========================================"
echo "🎉 PRECIVOX INICIADO COM SUCESSO!"
echo "🎉 ========================================"
echo ""
echo "📍 Acesso local:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:3001"
echo ""
echo "🌐 Acesso produção:"
echo "   https://precivox.com.br"
echo ""
echo "📊 Status:"
echo "   Backend PID:  $BACKEND_PID"
echo "   Frontend PID: $FRONTEND_PID"
echo ""
echo "📝 Logs:"
echo "   Backend:  tail -f /tmp/backend.log"
echo "   Frontend: tail -f /tmp/frontend.log"
echo ""
echo "🛑 Para parar:"
echo "   kill $BACKEND_PID $FRONTEND_PID"
echo ""

