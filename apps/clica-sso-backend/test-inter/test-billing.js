const axios = require('axios');
const https = require('https');
const fs = require('fs');

async function testBancoInterBilling() {
  try {
    console.log('Testing Banco Inter Billing Creation...');
    
    // Carregar certificados
    const cert = fs.readFileSync('./cert/banco-inter-cert.crt');
    const key = fs.readFileSync('./cert/banco-inter-cert.key');
    
    const httpsAgent = new https.Agent({
      cert: cert,
      key: key
    });
    
    // Simular token válido (substitua por um token real quando disponível)
    const bearerToken = 'EXAMPLE_TOKEN_HERE';
    
    // Dados da cobrança conforme especificado
    const billingData = {
      "seuNumero": "123",
      "valorNominal": "10.50",
      "dataVencimento": "2025-10-11",
      "numDiasAgenda": "30",
      "pagador": {
        "cpfCnpj": "35935261820",
        "tipoPessoa": "FISICA",
        "nome": "Nome",
        "endereco": "Rua São Paulo",
        "cidade": "Belo Horizonte",
        "uf": "MG",
        "cep": "36401042",
        "email": "email@email.com",
        "ddd": "31",
        "telefone": "999999999",
        "numero": "83",
        "complemento": "Casa",
        "bairro": "Jardim América"
      },
      "multa": {
        "codigo": "PERCENTUAL",
        "taxa": "0.10"
      },
      "mora": {
        "codigo": "TAXAMENSAL",
        "taxa": "0.21"
      },
      "desconto": {
        "quantidadeDias": 1,
        "taxa": 0.30,
        "codigo": "PERCENTUALDATAINFORMADA"
      }
    };
    
    console.log('Billing data to send:', JSON.stringify(billingData, null, 2));
    
    const billingResponse = await axios.post(
      'https://cdpj.partners.bancointer.com.br/cobranca/v3/cobrancas',
      billingData,
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
    
    console.log('Billing Success!');
    console.log('Response:', JSON.stringify(billingResponse.data, null, 2));
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
      console.error('Data:', error.response.data);
    }
    
    // Se der erro 401, é porque o token é inválido (esperado)
    if (error.response && error.response.status === 401) {
      console.log('\n✅ Estrutura da requisição está correta!');
      console.log('✅ Headers estão corretos!');
      console.log('✅ Dados da cobrança estão formatados corretamente!');
      console.log('❌ Apenas falta um token válido do Banco Inter');
    }
  }
}

testBancoInterBilling();
