const axios = require('axios');
const https = require('https');
const fs = require('fs');

async function testBancoInterAuth() {
  try {
    console.log('Testing Banco Inter Authentication...');
    
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
      scope: 'boleto-cobranca.write',
      grant_type: 'client_credentials'
    });
    
    console.log('Sending auth data:', authData.toString());
    
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
    
    // Passo 2: Criar cobrança usando o token
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
    
    console.log('Creating billing with data:', JSON.stringify(billingData, null, 2));
    
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
    console.log('Billing Response:', JSON.stringify(billingResponse.data, null, 2));
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
      console.error('Data:', error.response.data);
    }
  }
}

testBancoInterAuth();
