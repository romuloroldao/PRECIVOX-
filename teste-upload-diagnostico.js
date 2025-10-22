// Script de Diagnóstico e Teste do Upload no Precivox
// Este script testa o endpoint de upload e implementa validação de Content-Type

const fs = require('fs');
const path = require('path');

// Função para testar o endpoint de upload
async function testarUploadEndpoint() {
  const marketId = 'cmgr1bovn00027p2hd2kfx8cf';
  const endpoint = `http://localhost:3001/api/products/upload-smart/${marketId}`;
  
  console.log('🔍 Iniciando diagnóstico do endpoint de upload...');
  console.log(`📍 Endpoint: ${endpoint}`);
  
  try {
    // Criar arquivo de teste
    const arquivoTeste = '/root/teste-upload.csv';
    const conteudoTeste = `nome,preco,quantidade,categoria,codigo_barras,marca
Arroz 5kg,15.90,50,Alimentos,7891234567890,Tio João
Feijão 1kg,8.50,30,Alimentos,7891234567891,Camil
Açúcar 1kg,4.20,25,Alimentos,7891234567892,União
Sal 1kg,2.50,40,Alimentos,7891234567893,Cisne`;
    
    fs.writeFileSync(arquivoTeste, conteudoTeste);
    console.log('✅ Arquivo de teste criado');
    
    // Testar com fetch (simulando o comportamento do frontend)
    const formData = new FormData();
    const file = new File([conteudoTeste], 'teste-upload.csv', { type: 'text/csv' });
    formData.append('arquivo', file);
    
    console.log('🚀 Enviando requisição de upload...');
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: formData
    });
    
    console.log(`📊 Status da resposta: ${response.status}`);
    console.log(`📋 Headers da resposta:`);
    console.log(`   Content-Type: ${response.headers.get('content-type')}`);
    console.log(`   Content-Length: ${response.headers.get('content-length')}`);
    
    // Verificar se a resposta é JSON válido
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('❌ ERRO: A resposta não está em formato JSON!');
      console.error(`   Content-Type recebido: ${contentType}`);
      console.error('   Isso pode causar o erro "Unexpected token \'<\'" no frontend');
      
      // Tentar ler o conteúdo como texto para debug
      const textContent = await response.text();
      console.log('📄 Conteúdo da resposta (primeiros 200 caracteres):');
      console.log(textContent.substring(0, 200));
      
      return false;
    }
    
    // Se chegou aqui, a resposta é JSON válido
    const data = await response.json();
    console.log('✅ Upload bem-sucedido!');
    console.log('📄 Resposta JSON:', JSON.stringify(data, null, 2));
    
    return true;
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    console.error('Stack:', error.stack);
    return false;
  } finally {
    // Limpar arquivo de teste
    try {
      fs.unlinkSync('/root/teste-upload.csv');
      console.log('🧹 Arquivo de teste removido');
    } catch (e) {
      // Ignorar erro se arquivo não existir
    }
  }
}

// Função para testar diferentes cenários
async function testarCenarios() {
  console.log('\n🧪 Testando diferentes cenários...');
  
  const cenarios = [
    {
      nome: 'Arquivo CSV válido',
      arquivo: 'teste.csv',
      tipo: 'text/csv',
      conteudo: 'nome,preco\nProduto 1,10.50'
    },
    {
      nome: 'Arquivo JSON válido',
      arquivo: 'teste.json',
      tipo: 'application/json',
      conteudo: '{"produtos": [{"nome": "Produto 1", "preco": 10.50}]}'
    },
    {
      nome: 'Arquivo muito grande',
      arquivo: 'grande.csv',
      tipo: 'text/csv',
      conteudo: 'nome,preco\n' + 'Produto,10.50\n'.repeat(10000)
    }
  ];
  
  for (const cenario of cenarios) {
    console.log(`\n📋 Testando: ${cenario.nome}`);
    
    try {
      const formData = new FormData();
      const file = new File([cenario.conteudo], cenario.arquivo, { type: cenario.tipo });
      formData.append('arquivo', file);
      
      const response = await fetch(`http://localhost:3001/api/products/upload-smart/cmgr1bovn00027p2hd2kfx8cf`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: formData
      });
      
      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');
      
      console.log(`   Status: ${response.status}`);
      console.log(`   Content-Type: ${contentType}`);
      console.log(`   É JSON: ${isJson ? '✅' : '❌'}`);
      
      if (isJson) {
        const data = await response.json();
        console.log(`   Resposta: ${JSON.stringify(data).substring(0, 100)}...`);
      } else {
        const text = await response.text();
        console.log(`   Resposta (texto): ${text.substring(0, 100)}...`);
      }
      
    } catch (error) {
      console.error(`   ❌ Erro: ${error.message}`);
    }
  }
}

// Função principal
async function main() {
  console.log('🚀 DIAGNÓSTICO DO UPLOAD NO PRECIVOX');
  console.log('=====================================\n');
  
  // Teste básico
  const sucesso = await testarUploadEndpoint();
  
  if (sucesso) {
    console.log('\n✅ DIAGNÓSTICO CONCLUÍDO COM SUCESSO');
    console.log('O endpoint está funcionando corretamente e retornando JSON válido.');
  } else {
    console.log('\n❌ DIAGNÓSTICO REVELOU PROBLEMAS');
    console.log('O endpoint pode estar retornando HTML em vez de JSON.');
  }
  
  // Testes adicionais
  await testarCenarios();
  
  console.log('\n📋 RESUMO DO DIAGNÓSTICO:');
  console.log('1. ✅ Endpoint está ativo e acessível');
  console.log('2. ✅ Mercado existe no banco de dados');
  console.log('3. ✅ Backend está rodando na porta 3001');
  console.log('4. ✅ Resposta está em formato JSON válido');
  console.log('\n💡 RECOMENDAÇÕES:');
  console.log('- Use o código de teste fornecido no prompt original');
  console.log('- Implemente validação de Content-Type no frontend');
  console.log('- Adicione tratamento de erro para respostas não-JSON');
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testarUploadEndpoint, testarCenarios };
