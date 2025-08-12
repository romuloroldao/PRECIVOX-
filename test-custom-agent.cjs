const { Anthropic } = require('@anthropic-ai/sdk');
const https = require('https');

// Criar agente HTTP personalizado
const agent = new https.Agent({
  keepAlive: true,
  timeout: 30000,
  rejectUnauthorized: false, // Apenas para debug
});

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  httpAgent: agent,
  timeout: 30000,
});

async function test() {
  try {
    const message = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 50,
      messages: [{role: 'user', content: 'Hello with custom agent'}]
    });
    console.log('✅ Funcionou:', message.content[0].text);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error('❌ Stack:', error.stack);
  }
}

test();
