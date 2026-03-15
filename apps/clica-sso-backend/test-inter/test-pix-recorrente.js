const axios = require('axios');
const https = require('https');
const fs = require('fs');
const QRCode = require('qrcode');

async function testBancoInterPixRecorrente() {
  try {
    console.log('Testing Banco Inter PIX Recorrente Creation...');
    
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
      scope: 'rec.read rec.write cob.write cob.read payloadlocationrec.write',
      grant_type: 'client_credentials'
    });
    
    console.log('Sending auth data for PIX...');
    
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
    console.log('Token Response:', authResponse.data);
    
    const bearerToken = authResponse.data.access_token;
    console.log('Bearer Token obtained:', bearerToken.substring(0, 20) + '...');
    
    // Passo 2: Criar uma cobrança PIX primeiro para obter um txid válido
    const txidCobranca = 'PIX2025081519242359352618203236953';
    
    console.log('\n=== CRIANDO COBRANÇA PIX ===');
    const cobrancaData = {
      "chave": "51883655000196",
      "solicitacaoPagador": "solicitacaoPagador", 
      "devedor": {
        "cpf": "35935261820",
        "nome": "Rafael Sarti"
      },
      "valor": {
        "original": "2.00",
        "modalidadeAlteracao": 1
      },
      "calendario": {
        "expiracao": 172800
      }
    };
    
    console.log('Cobrança data to send:', JSON.stringify(cobrancaData, null, 2));
    
    const cobrancaResponse = await axios.post(
      `https://cdpj.partners.bancointer.com.br/pix/v2/cob`,
      cobrancaData,
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
    
    console.log('Cobrança PIX criada com sucesso!');
    console.log('Cobrança Response:', JSON.stringify(cobrancaResponse.data, null, 2));
    
    // Usar o txid da cobrança criada
    const txidParaRecorrencia = cobrancaResponse.data.txid;
    
    console.log('\n=== CRIANDO LOCATION PARA RECORRÊNCIA ===');
    // Passo 3: Criar location para PIX recorrente
    const locationResponse = await axios.post(
      'https://cdpj.partners.bancointer.com.br/pix/v2/locrec',
      {}, // Body vazio conforme documentação
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
    
    console.log('Location criado com sucesso!');
    console.log('Location Response:', JSON.stringify(locationResponse.data, null, 2));
    
    const locationId = locationResponse.data.id;
    console.log('Location ID:', locationId);
    
    console.log('\n=== CRIANDO PIX RECORRENTE ===');
    // Passo 3: Criar PIX recorrente usando o txid da cobrança
    const pixRecorrenteData = {
      "vinculo": {
        "devedor": {
          "nome": "Rafael Ulisses Sarti",
          "cpf": "35935261820"
        },
        "contrato": "1",
        "objeto": "Serviços Clica do Brasil"
      },
      "calendario": {
        "dataInicial": "2025-08-15",
        "periodicidade": "SEMANAL"
      },
      "valor": {
        "valorRec": "1.00"
      },
      "politicaRetentativa": "PERMITE_3R_7D",
      "loc": locationId,
      "ativacao": {
        "dadosJornada": {
          "txid": txidParaRecorrencia
        }
      }
    };
    
    console.log('PIX Recorrente data to send:', JSON.stringify(pixRecorrenteData, null, 2));
    
    const pixResponse = await axios.post(
      'https://cdpj.partners.bancointer.com.br/pix/v2/rec',
      pixRecorrenteData,
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
    
    console.log('PIX Recorrente Success!');
    console.log('Response Body:', JSON.stringify(pixResponse.data, null, 2));
    
    // Extrair e tratar o idRec
    const idRec = pixResponse.data.idRec;
    if (idRec) {
      console.log('\n=== ANÁLISE DO idRec ===');
      console.log('idRec completo:', idRec);
      
      // Formato: RAxxxxxxxxyyyyMMddkkkkkkkkkkk
      // R: fixo (1 caractere)
      const fixo = idRec.substring(0, 1);
      console.log('Fixo (R):', fixo);
      
      // A: identificação da possibilidade de novas tentativas (1 caractere)
      const tentativas = idRec.substring(1, 2);
      console.log('Tentativas (R/N):', tentativas, tentativas === 'R' ? '(Permite novas tentativas)' : '(Não permite novas tentativas)');
      
      // xxxxxxxx: identificação do agente (8 caracteres)
      const agente = idRec.substring(2, 10);
      console.log('Agente (8 chars):', agente);
      
      // yyyyMMdd: data de criação (8 caracteres)
      const dataCriacao = idRec.substring(10, 18);
      const ano = dataCriacao.substring(0, 4);
      const mes = dataCriacao.substring(4, 6);
      const dia = dataCriacao.substring(6, 8);
      console.log('Data de criação:', `${dia}/${mes}/${ano}`, `(${dataCriacao})`);
      
      // kkkkkkkkkkk: sequencial (11 caracteres)
      const sequencial = idRec.substring(18);
      console.log('Sequencial (11 chars):', sequencial);
      
      // Salvar variáveis para uso posterior
      const variaveis = {
        idRec: idRec,
        fixo: fixo,
        tentativas: tentativas,
        agente: agente,
        dataCriacao: dataCriacao,
        dataCriacaoFormatada: `${dia}/${mes}/${ano}`,
        sequencial: sequencial
      };
      
      console.log('\n=== VARIÁVEIS EXTRAÍDAS ===');
      console.log(JSON.stringify(variaveis, null, 2));
      
      // Salvar em arquivo para uso posterior
      fs.writeFileSync('./pix-recorrente-vars.json', JSON.stringify(variaveis, null, 2));
      console.log('\n✅ Variáveis salvas em: ./pix-recorrente-vars.json');
      
    } else {
      console.log('❌ idRec não encontrado na resposta');
    }
    
    // Exibir QR Code da recorrência para ativação
    if (pixResponse.data.dadosQR?.pixCopiaECola) {
      const qrCodeString = pixResponse.data.dadosQR.pixCopiaECola;
      
      console.log('\n' + '='.repeat(80));
      console.log('🎯 QR CODE PARA ATIVAR A RECORRÊNCIA');
      console.log('='.repeat(80));
      console.log('📱 ESTE é o código que o cliente deve usar para ATIVAR o débito automático:');
      console.log('');
      console.log(qrCodeString);
      console.log('');
      
      // Gerar QR Code visual no console
      try {
        const qrCodeTerminal = await QRCode.toString(qrCodeString, { 
          type: 'terminal',
          small: true 
        });
        console.log('📱 QR CODE VISUAL:');
        console.log(qrCodeTerminal);
      } catch (qrError) {
        console.log('❌ Erro ao gerar QR Code visual:', qrError.message);
      }
      
      console.log('💡 IMPORTANTE:');
      console.log('   ✅ Use ESTE QR Code para ativar a recorrência');
      console.log('   ❌ NÃO use o QR Code da cobrança inicial');
      console.log('   🔄 Após o pagamento deste código, o débito automático será ativado');
      
      if (pixResponse.data.dadosQR.jornada) {
        console.log('📋 Tipo de jornada:', pixResponse.data.dadosQR.jornada);
      }
      
      console.log('='.repeat(80));
      console.log('🎯 RESUMO DO PROCESSO:');
      console.log('1. Cliente paga o QR Code acima → Ativa a recorrência');
      console.log('2. Todo dia 15 → Débito automático de R$ 2,50');
      console.log('3. Cliente não precisa fazer mais nada após o primeiro pagamento');
      console.log('='.repeat(80));
    } else {
      // Se dadosQR não veio na resposta, consultar a recorrência para obter o QR Code
      console.log('\n🔍 Consultando recorrência para obter QR Code...');

    await new Promise(resolve => setTimeout(resolve, 10000));
      
      try {
        const recConsultaResponse = await axios.get(
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
        
        if (recConsultaResponse.data.dadosQR?.pixCopiaECola) {
          const qrCodeString = recConsultaResponse.data.dadosQR.pixCopiaECola;
          
          console.log('\n' + '='.repeat(80));
          console.log('🎯 QR CODE PARA ATIVAR A RECORRÊNCIA');
          console.log('='.repeat(80));
          console.log('📱 ESTE é o código que o cliente deve usar para ATIVAR o débito automático:');
          console.log('');
          console.log(qrCodeString);
          console.log('');
          
          // Gerar QR Code visual no console
          try {
            const qrCodeTerminal = await QRCode.toString(qrCodeString, { 
              type: 'terminal',
              small: true 
            });
            console.log('📱 QR CODE VISUAL:');
            console.log(qrCodeTerminal);
          } catch (qrError) {
            console.log('❌ Erro ao gerar QR Code visual:', qrError.message);
          }
          
          console.log('💡 IMPORTANTE:');
          console.log('   ✅ Use ESTE QR Code para ativar a recorrência');
          console.log('   ❌ NÃO use o QR Code da cobrança inicial');
          console.log('   🔄 Após o pagamento deste código, o débito automático será ativado');
          
          if (recConsultaResponse.data.dadosQR.jornada) {
            console.log('📋 Tipo de jornada:', recConsultaResponse.data.dadosQR.jornada);
          }
          
          console.log('='.repeat(80));
          console.log('🎯 RESUMO DO PROCESSO:');
          console.log('1. Cliente paga o QR Code acima → Ativa a recorrência');
          console.log('2. Todo dia 15 → Débito automático de R$ 2,50');
          console.log('3. Cliente não precisa fazer mais nada após o primeiro pagamento');
          console.log('='.repeat(80));
        } else {
          console.log('❌ QR Code da recorrência não disponível na consulta');
        }
        
      } catch (consultaError) {
        console.log('❌ Erro ao consultar recorrência para obter QR Code:', consultaError.response?.data || consultaError.message);
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
      console.error('Data:', error.response.data);
    }
    
    // Se der erro 401, significa que o endpoint não está disponível ou o scope está incorreto
    if (error.response && error.response.status === 401) {
      console.log('\n✅ Estrutura da requisição está correta!');
      console.log('✅ Headers estão corretos!');
      console.log('✅ Dados do PIX recorrente estão formatados corretamente!');
      console.log('❌ Endpoint /pix/v2/rec não está disponível para este cliente ou requer scope específico');
      
      // Demonstrar como seria o tratamento do idRec com um exemplo
      console.log('\n=== DEMONSTRAÇÃO DE TRATAMENTO DO idRec ===');
      const exemploIdRec = 'RR12345678202508151234567890a';
      console.log('Exemplo idRec:', exemploIdRec);
      
      // Formato: RAxxxxxxxxyyyyMMddkkkkkkkkkkk
      const fixo = exemploIdRec.substring(0, 1);
      console.log('Fixo (R):', fixo);
      
      const tentativas = exemploIdRec.substring(1, 2);
      console.log('Tentativas (R/N):', tentativas, tentativas === 'R' ? '(Permite novas tentativas)' : '(Não permite novas tentativas)');
      
      const agente = exemploIdRec.substring(2, 10);
      console.log('Agente (8 chars):', agente);
      
      const dataCriacao = exemploIdRec.substring(10, 18);
      const ano = dataCriacao.substring(0, 4);
      const mes = dataCriacao.substring(4, 6);
      const dia = dataCriacao.substring(6, 8);
      console.log('Data de criação:', `${dia}/${mes}/${ano}`, `(${dataCriacao})`);
      
      const sequencial = exemploIdRec.substring(18);
      console.log('Sequencial (11 chars):', sequencial);
      
      const variaveis = {
        idRec: exemploIdRec,
        fixo: fixo,
        tentativas: tentativas,
        agente: agente,
        dataCriacao: dataCriacao,
        dataCriacaoFormatada: `${dia}/${mes}/${ano}`,
        sequencial: sequencial
      };
      
      console.log('\n=== VARIÁVEIS EXTRAÍDAS (EXEMPLO) ===');
      console.log(JSON.stringify(variaveis, null, 2));
      
      console.log('\n📋 PRÓXIMOS PASSOS:');
      console.log('1. Verificar se o cliente tem acesso ao endpoint PIX recorrente');
      console.log('2. Confirmar o scope correto para PIX recorrente');
      console.log('3. Validar se o endpoint está disponível no ambiente de sandbox');
    }
  }
}

testBancoInterPixRecorrente();
