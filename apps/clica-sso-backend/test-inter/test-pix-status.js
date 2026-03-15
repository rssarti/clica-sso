const axios = require('axios');
const https = require('https');
const fs = require('fs');

async function verificarStatusPixRecorrente() {
  try {
    console.log('🔍 Verificando Status do PIX Recorrente...');
    
    // Carregar certificados
    const cert = fs.readFileSync('./cert/banco-inter-cert.crt');
    const key = fs.readFileSync('./cert/banco-inter-cert.key');
    
    console.log('Certificate loaded, length:', cert.length);
    console.log('Key loaded, length:', key.length);
    
    const httpsAgent = new https.Agent({
      cert: cert,
      key: key
    });
    
    // Passo 1: Obter token de acesso
    const authData = new URLSearchParams({
      client_id: 'd4fd78c1-5147-4a3f-b3b8-da8918aa83df',
      client_secret: 'a7739aea-5965-418e-9c30-75142605e5db',
      scope: 'rec.read cob.read',
      grant_type: 'client_credentials'
    });
    
    console.log('Obtendo token de autenticação...');
    
    const authResponse = await axios.post(
      'https://cdpj.partners.bancointer.com.br/oauth/v2/token',
      authData,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        httpsAgent: httpsAgent,
        timeout: 30000
      }
    );
    
    console.log('Auth Success!');
    const bearerToken = authResponse.data.access_token;
    console.log('Bearer Token obtained:', bearerToken.substring(0, 20) + '...');
    
    // Passo 2: Consultar status da recorrência
    // URL da API PIX
const BASE_URL = 'https://cdpj.partners.bancointer.com.br';
const idRec = 'RR0041696820250816H8wAfQ2M6Jp'; // Usar idRec mais recente
    console.log('\n=== CONSULTANDO STATUS DA RECORRÊNCIA ===');
    console.log('idRec:', idRec);
    
    const recResponse = await axios.get(
      `https://cdpj.partners.bancointer.com.br/pix/v2/rec/${idRec}`,
      {
        headers: {
          'Authorization': `Bearer ${bearerToken}`,
          'x-conta-corrente': '312571828',
          'Content-Type': 'application/json'
        },
        httpsAgent: httpsAgent,
        timeout: 30000
      }
    );
    
    console.log('📊 STATUS DA RECORRÊNCIA:');
    console.log('='.repeat(60));
    console.log(JSON.stringify(recResponse.data, null, 2));
    console.log('='.repeat(60));
    
    // Análise do status
    const status = recResponse.data.status;
    const tipoJornada = recResponse.data.ativacao?.tipoJornada;
    
    console.log('\n🎯 ANÁLISE DO STATUS:');
    console.log('Status atual:', status);
    console.log('Tipo de jornada:', tipoJornada);
    
    if (status === 'ATIVA') {
      console.log('✅ RECORRÊNCIA ATIVA - Funcionando corretamente!');
      console.log('💰 Próximos débitos automáticos serão processados.');
    } else if (status === 'CRIADA') {
      console.log('⏳ RECORRÊNCIA CRIADA - Aguardando primeiro pagamento.');
      console.log('💡 Cliente ainda não pagou a primeira cobrança.');
    } else if (status === 'CANCELADA') {
      console.log('❌ RECORRÊNCIA CANCELADA');
    } else {
      console.log('⚠️ Status desconhecido:', status);
    }
    
    // Exibir QR Code da recorrência se disponível
    if (recResponse.data.dadosQR?.pixCopiaECola) {
      console.log('\n🎯 QR CODE DA RECORRÊNCIA:');
      console.log('='.repeat(60));
      console.log('📱 Use este código para ATIVAR a recorrência:');
      console.log(recResponse.data.dadosQR.pixCopiaECola);
      console.log('='.repeat(60));
      console.log('💡 Este é o código correto para ativar o débito automático!');
      console.log('⚠️  NÃO use o QR Code da cobrança inicial!');
      
      if (recResponse.data.dadosQR.jornada) {
        console.log('🔄 Tipo de jornada:', recResponse.data.dadosQR.jornada);
      }
    } else {
      console.log('\n❌ QR Code da recorrência não disponível');
    }
    
    // Passo 3: Verificar também a cobrança original
    const txidOriginal = recResponse.data.ativacao?.dadosJornada?.txid;
    if (txidOriginal) {
      console.log('\n=== CONSULTANDO COBRANÇA ORIGINAL ===');
      console.log('txid original:', txidOriginal);
      
      try {
        const cobResponse = await axios.get(
          `https://cdpj.partners.bancointer.com.br/pix/v2/cob/${txidOriginal}`,
          {
            headers: {
              'Authorization': `Bearer ${bearerToken}`,
              'x-conta-corrente': '312571828',
              'Content-Type': 'application/json'
            },
            httpsAgent: httpsAgent,
            timeout: 30000
          }
        );
        
        console.log('📋 STATUS DA COBRANÇA ORIGINAL:');
        console.log('Status:', cobResponse.data.status);
        console.log('Valor:', cobResponse.data.valor?.original);
        
        if (cobResponse.data.status === 'CONCLUIDA') {
          console.log('✅ COBRANÇA PAGA - Recorrência deveria estar ativa.');
        } else if (cobResponse.data.status === 'ATIVA') {
          console.log('⏳ COBRANÇA AINDA ATIVA - Aguardando pagamento.');
          console.log('📱 QR Code para pagamento:');
          console.log(cobResponse.data.pixCopiaECola);
        }
        
      } catch (cobError) {
        console.log('❌ Erro ao consultar cobrança original:', cobError.response?.data || cobError.message);
      }
    }
    await new Promise(resolve => setTimeout(resolve, 10000));
    console.log('⏳ Esperou 10 segundos antes de continuar...');

    // Passo 4: Listar todas as recorrências (opcional)
    console.log('\n=== LISTANDO TODAS AS RECORRÊNCIAS ===');
    try {
      const allRecResponse = await axios.get(
        `https://cdpj.partners.bancointer.com.br/pix/v2/rec/${txidOriginal}`,
        {
          headers: {
            'Authorization': `Bearer ${bearerToken}`,
            'x-conta-corrente': '312571828',
            'Content-Type': 'application/json'
          },
          httpsAgent: httpsAgent,
          timeout: 30000
        }
      );
      
      console.log('📝 Recorrências encontradas:', allRecResponse.data.length || 0);
      allRecResponse.data.forEach((rec, index) => {
        console.log(`${index + 1}. ID: ${rec.idRec} | Status: ${rec.status} | Valor: R$ ${rec.valor?.valorRec}`);
      });
      
    } catch (listError) {
      console.log('❌ Erro ao listar recorrências:', listError.response?.data || listError.message);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
      console.error('Data:', error.response.data);
    }
  }
}

verificarStatusPixRecorrente();
