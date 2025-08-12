import React, { useState, useRef, useEffect } from 'react';
import { useApiServices } from '../../hooks/useApiServices';
import { Product } from '../../types';

interface LocationData {
  city: string;
  lat: number;
  lng: number;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  typing?: boolean;
}

interface ChatIAProps {
  products: Product[];
  location: LocationData | null;
  userPreferences: any;
  className?: string;
}

export const ChatIA: React.FC<ChatIAProps> = ({
  products,
  location,
  userPreferences,
  className = ''
}) => {
  const { searchWithAI, loading: isLoading, isConnected } = useApiServices();
  
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: `🏪 **Olá, Gestora!** Sou a IA de Inteligência Comercial do PRECIVOX.

Estou analisando **${products.length} produtos** em ${location?.city || 'Franco da Rocha'} para otimizar sua loja.

**Como posso ajudar seu negócio hoje?**
• 📊 **Análise competitiva** - preços da concorrência
• 💰 **Otimização de margem** - onde aumentar/reduzir preços
• 📈 **Tendências de demanda** - produtos em alta/baixa
• 🎯 **Estratégias de precificação** - horários e promoções
• 🏆 **Posicionamento no mercado** - vs. concorrentes
• 📋 **Gestão de mix** - quais produtos priorizar

**Exemplo:** "Como posso melhorar minha margem em laticínios?" ou "Qual estratégia para enfrentar o concorrente X?"`,
      timestamp: new Date()
    }
  ]);
  
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll automático para última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Sugestões de perguntas rápidas para gestores
  const quickQuestions = [
    '📊 Como minha concorrência está precificando?',
    '💰 Onde posso aumentar minha margem sem perder clientes?',
    '📈 Quais produtos estão em alta demanda na região?',
    '🎯 Melhor estratégia promocional para esta semana?',
    '⏰ Horários de pico: como otimizar preços?',
    '🏆 Como me posicionar contra o concorrente líder?'
  ];

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputMessage;
    setInputMessage('');
    setIsTyping(true);

    try {
      console.log('💬 Enviando para IA:', currentInput);

      // Contextualizar para gestora de supermercado
      const contextualizedQuery = `
CONTEXTO - GESTÃO DE SUPERMERCADO:
Você está assessorando uma gestora/dona de supermercado em ${location?.city || 'Franco da Rocha'}, São Paulo.

DADOS DO MERCADO LOCAL:
- Produtos monitorados: ${products.length} SKUs
- Categorias principais: ${[...new Set(products.map(p => p.categoria))].slice(0, 5).join(', ')}
- Concorrentes na região: Atacadão, Extra, Carrefour, Pão de Açúcar
- Perfil dos clientes: Classe média, foco em valor e conveniência

OBJETIVO DA CONSULTA:
Fornecer insights estratégicos para OTIMIZAR O DESEMPENHO COMERCIAL da loja, incluindo:
- Estratégias de precificação competitiva
- Otimização de mix de produtos  
- Análise de margens e rentabilidade
- Posicionamento vs. concorrência
- Oportunidades de crescimento de receita

PERGUNTA DA GESTORA: ${currentInput}

INSTRUÇÕES DE RESPOSTA:
- Seja prático e acionável
- Foque em resultados financeiros
- Use dados de mercado quando possível
- Sugira implementações específicas
- Considere o perfil da clientela local
      `;

      const aiResponse = await searchWithAI(contextualizedQuery);
      
      // Simular delay de digitação para melhor UX
      setTimeout(() => {
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: aiResponse || 'Desculpe, não consegui processar sua solicitação. Tente reformular a pergunta.',
          timestamp: new Date()
        };

        setMessages(prev => [...prev, assistantMessage]);
        setIsTyping(false);
      }, 1000);

    } catch (error) {
      console.error('❌ Erro no chat:', error);
      setIsTyping(false);
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `🏪 **Sistema em Manutenção** - Análise Offline Ativada

**📊 Relatório Rápido do Seu Negócio:**
• **Produtos monitorados**: ${products.length} SKUs em ${location?.city || 'Franco da Rocha'}
• **Categorias ativas**: ${[...new Set(products.map(p => p.categoria))].slice(0, 3).join(', ')}
• **Status**: ${isConnected ? 'Sistema online' : 'Modo offline - dados locais'}

**💡 Dica Estratégica Rápida:**
Enquanto os sistemas voltam, revise seus produtos de maior giro e compare com a concorrência local. Foque em otimizar margens nos itens de compra por impulso.

**🔄 Reformule sua pergunta** que vou analisar com base nos dados disponíveis!`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleQuickQuestion = (question: string) => {
    const cleanQuestion = question.replace(/[📊💰📈🎯⏰🏆] /, '');
    setInputMessage(cleanQuestion);
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    setMessages([{
      id: '1',
      role: 'assistant',
      content: `🔄 **Chat Reiniciado - Central de Inteligência Comercial**

**Olá novamente, Gestora!** Como posso otimizar seu negócio agora?

**📊 Análises Disponíveis:**
• Benchmarking competitivo
• Otimização de preços e margens  
• Estratégias promocionais
• Análise de mix de produtos
• Insights de demanda local

**Exemplo de consulta:** *"Como aumentar minha margem em bebidas mantendo competitividade?"*`,
      timestamp: new Date()
    }]);
  };

  return (
    <div 
      className={`chat-ia-container ${className}`}
      style={{
        background: 'linear-gradient(135deg, #fff 0%, #f8fafc 100%)',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        height: '600px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
      }}
    >
      {/* Header Premium do Chat */}
      <div 
        className="chat-header"
        style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e2e8f0',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '16px 16px 0 0',
          color: 'white'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div 
              className="ai-avatar"
              style={{
                width: '40px',
                height: '40px',
                background: 'linear-gradient(45deg, #4ade80, #22c55e)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)'
              }}
            >
              🤖
            </div>
            <div>
              <h4 style={{ margin: '0', fontSize: '16px', fontWeight: '600' }}>
                PRECIVOX Business Intelligence
              </h4>
              <p style={{ margin: '0', fontSize: '13px', opacity: '0.9' }}>
                {isTyping ? '🧠 Analisando dados comerciais...' : isConnected ? '🟢 Consultoria Online' : '📊 Análise Offline'}
              </p>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div 
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: '500'
              }}
            >
              {products.length} produtos
            </div>
            <button
              onClick={handleClearChat}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 8px',
                color: 'white',
                cursor: 'pointer',
                fontSize: '12px'
              }}
              title="Limpar conversa"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>

      {/* Área de Mensagens */}
      <div 
        className="chat-messages"
        style={{
          flex: '1',
          padding: '20px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          background: 'linear-gradient(to bottom, #f8fafc, #ffffff)'
        }}
      >
        {messages.map(message => (
          <div 
            key={message.id}
            className={`message ${message.role}`}
            style={{
              display: 'flex',
              justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
              animation: 'slideIn 0.3s ease-out'
            }}
          >
            <div 
              style={{
                maxWidth: '85%',
                padding: '16px 20px',
                borderRadius: message.role === 'user' 
                  ? '20px 20px 6px 20px' 
                  : '20px 20px 20px 6px',
                background: message.role === 'user' 
                  ? 'linear-gradient(135deg, #667eea, #764ba2)' 
                  : 'linear-gradient(135deg, #f1f5f9, #e2e8f0)',
                color: message.role === 'user' ? '#fff' : '#334155',
                fontSize: '14px',
                lineHeight: '1.5',
                boxShadow: message.role === 'user' 
                  ? '0 4px 12px rgba(102, 126, 234, 0.3)' 
                  : '0 2px 8px rgba(0, 0, 0, 0.1)',
                whiteSpace: 'pre-wrap'
              }}
            >
              {message.content}
              <div 
                style={{
                  fontSize: '11px',
                  opacity: '0.7',
                  marginTop: '8px',
                  textAlign: message.role === 'user' ? 'right' : 'left'
                }}
              >
                {message.timestamp.toLocaleTimeString('pt-BR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            </div>
          </div>
        ))}

        {/* Indicador de digitação melhorado */}
        {isTyping && (
          <div 
            className="typing-indicator" 
            style={{ display: 'flex', justifyContent: 'flex-start' }}
          >
            <div 
              style={{
                padding: '16px 20px',
                borderRadius: '20px 20px 20px 6px',
                background: 'linear-gradient(135deg, #e2e8f0, #cbd5e1)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
              }}
            >
              <div className="typing-animation" style={{ display: 'flex', gap: '4px' }}>
                <span style={{ 
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '50%', 
                  background: '#64748b',
                  animation: 'bounce 1.4s infinite ease-in-out'
                }}></span>
                <span style={{ 
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '50%', 
                  background: '#64748b',
                  animation: 'bounce 1.4s infinite ease-in-out 0.2s'
                }}></span>
                <span style={{ 
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '50%', 
                  background: '#64748b',
                  animation: 'bounce 1.4s infinite ease-in-out 0.4s'
                }}></span>
              </div>
              <span style={{ fontSize: '13px', color: '#64748b' }}>
                IA processando...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Sugestões Rápidas */}
      {messages.length <= 2 && !isTyping && (
        <div 
          className="quick-questions"
          style={{
            padding: '0 20px 16px',
            borderTop: '1px solid #f1f5f9'
          }}
        >
          <div style={{ marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: '500', color: '#64748b' }}>
              💡 Sugestões rápidas:
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {quickQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => handleQuickQuestion(question)}
                style={{
                  padding: '8px 14px',
                  background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
                  border: '1px solid #e2e8f0',
                  borderRadius: '20px',
                  fontSize: '12px',
                  color: '#475569',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontWeight: '500'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #e2e8f0, #cbd5e1)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #f8fafc, #f1f5f9)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input de Mensagem Premium */}
      <div 
        className="chat-input"
        style={{
          padding: '20px',
          borderTop: '1px solid #e2e8f0',
          background: 'linear-gradient(135deg, #ffffff, #f8fafc)',
          borderRadius: '0 0 16px 16px'
        }}
      >
        <div 
          style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-end'
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Pergunte sobre estratégias de margem, concorrência, promoções..."
            disabled={isLoading}
            style={{
              flex: '1',
              padding: '14px 18px',
              border: '1px solid #cbd5e1',
              borderRadius: '25px',
              fontSize: '14px',
              outline: 'none',
              background: 'linear-gradient(135deg, #ffffff, #f8fafc)',
              transition: 'all 0.2s ease'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#667eea';
              e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#cbd5e1';
              e.target.style.boxShadow = 'none';
            }}
          />
          
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            style={{
              padding: '14px 20px',
              background: inputMessage.trim() && !isLoading 
                ? 'linear-gradient(135deg, #667eea, #764ba2)' 
                : 'linear-gradient(135deg, #cbd5e1, #94a3b8)',
              color: '#fff',
              border: 'none',
              borderRadius: '25px',
              cursor: inputMessage.trim() && !isLoading ? 'pointer' : 'not-allowed',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.2s ease',
              minWidth: '80px',
              boxShadow: inputMessage.trim() && !isLoading 
                ? '0 4px 12px rgba(102, 126, 234, 0.3)' 
                : 'none'
            }}
            onMouseEnter={(e) => {
              if (inputMessage.trim() && !isLoading) {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = inputMessage.trim() && !isLoading 
                ? '0 4px 12px rgba(102, 126, 234, 0.3)' 
                : 'none';
            }}
          >
            {isLoading ? '⏳' : '🚀'}
          </button>
        </div>

        {/* Indicadores de status premium */}
        <div 
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '12px',
            fontSize: '11px',
            color: '#64748b'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              🏪 <strong>Business Intelligence</strong> • {products.length} SKUs
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              📍 {location?.city || 'Franco da Rocha'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              padding: '2px 8px',
              borderRadius: '10px',
              background: isConnected 
                ? 'linear-gradient(135deg, #10b981, #059669)' 
                : 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: 'white',
              fontSize: '10px',
              fontWeight: '600'
            }}>
              {isConnected ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>
        </div>
      </div>

      {/* CSS Premium com animações */}
      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(15px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes bounce {
          0%, 80%, 100% {
            transform: scale(0);
            opacity: 0.5;
          }
          40% {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        .chat-messages::-webkit-scrollbar {
          width: 8px;
        }
        
        .chat-messages::-webkit-scrollbar-track {
          background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
          border-radius: 4px;
        }
        
        .chat-messages::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #667eea, #764ba2);
          border-radius: 4px;
          transition: all 0.2s ease;
        }
        
        .chat-messages::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #5a67d8, #6b46c1);
        }
        
        .typing-animation span {
          display: inline-block;
          animation: bounce 1.4s infinite ease-in-out both;
        }
        
        .chat-ia-container {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
        }
        
        @media (max-width: 768px) {
          .chat-ia-container {
            height: 500px;
            border-radius: 12px;
          }
          
          .chat-header {
            padding: 16px 20px;
          }
          
          .chat-messages {
            padding: 16px;
          }
          
          .chat-input {
            padding: 16px;
          }
          
          .quick-questions {
            padding: 0 16px 12px;
          }
        }
        
        .message {
          animation: slideIn 0.3s ease-out;
        }
        
        .quick-questions button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
        }
        
        .typing-indicator {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ChatIA;