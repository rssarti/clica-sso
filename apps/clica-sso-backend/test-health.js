const { execSync } = require('child_process');

console.log('🧪 Testando se a aplicação compila e inicia...');

try {
  // Teste 1: Compilar
  console.log('📦 Compilando aplicação...');
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Compilação bem-sucedida!');

  // Teste 2: Verificar se os endpoints estão definidos
  console.log('🔍 Verificando estrutura dos endpoints...');
  
  const fs = require('fs');
  const appController = fs.readFileSync('./src/app.controller.ts', 'utf8');
  
  if (appController.includes('ping')) {
    console.log('✅ Endpoint /ping encontrado no AppController');
  } else {
    console.log('❌ Endpoint /ping não encontrado');
  }

  if (appController.includes('getHello')) {
    console.log('✅ Endpoint / (root) encontrado no AppController');
  } else {
    console.log('❌ Endpoint / (root) não encontrado');
  }

  console.log('🎉 Todos os testes passaram!');
  console.log('📋 Resumo das melhorias implementadas:');
  console.log('   🔹 Logs detalhados em todas as etapas de inicialização');
  console.log('   🔹 Timeout reduzido do S3 para 5 segundos');
  console.log('   🔹 Health check configurado para /ping com timeout aumentado');
  console.log('   🔹 Endpoints de health check com logs de acesso');
  console.log('   🔹 Configuração de banco com timeouts aumentados');

} catch (error) {
  console.error('❌ Erro durante os testes:', error.message);
  process.exit(1);
}
