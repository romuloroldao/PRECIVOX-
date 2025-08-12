const { Anthropic } = require('@anthropic-ai/sdk');
const readline = require('readline');

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function chat() {
  rl.question('Você: ', async (input) => {
    if (input.toLowerCase() === 'sair') {
      rl.close();
      return;
    }
    
    try {
      const message = await client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1000,
        messages: [{ role: 'user', content: input }]
      });
      console.log('\n🤖 Claude:', message.content[0].text, '\n');
      chat();
    } catch (error) {
      console.error('❌ Erro:', error.message);
      chat();
    }
  });
}

console.log('🚀 Claude alternativo iniciado! (digite "sair" para encerrar)');
chat();
