const { exec } = require('child_process');

function callClaude(message, callback) {
  const escapedMessage = message.replace(/"/g, '\\"');
  const curlCommand = `curl -s -X POST https://api.anthropic.com/v1/messages \
    -H "Content-Type: application/json" \
    -H "x-api-key: ${process.env.ANTHROPIC_API_KEY}" \
    -H "anthropic-version: 2023-06-01" \
    -d '{"model":"claude-3-5-sonnet-20241022","max_tokens":1000,"messages":[{"role":"user","content":"${escapedMessage}"}]}'`;
  
  exec(curlCommand, (error, stdout, stderr) => {
    if (error) {
      console.error('❌ Curl erro:', error.message);
      return;
    }
    
    try {
      const result = JSON.parse(stdout);
      if (result.content && result.content[0]) {
        console.log('🤖 Claude:', result.content[0].text);
        if (callback) callback(null, result.content[0].text);
      } else {
        console.error('❌ Resposta inesperada:', stdout);
      }
    } catch (e) {
      console.error('❌ Parse erro:', stdout);
    }
  });
}

// Criar interface interativa
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function chat() {
  rl.question('Você: ', (input) => {
    if (input.toLowerCase() === 'sair') {
      rl.close();
      return;
    }
    
    callClaude(input, () => {
      chat(); // Continuar conversa
    });
  });
}

console.log('🚀 Claude funcionando via curl wrapper!');
console.log('Digite "sair" para encerrar');
chat();
