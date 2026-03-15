/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as fs from 'fs';
import * as https from 'https';
import { BancoInterRequestBoleto } from './interface/BancoInterBoleto';
import { EventsGateway } from '../events/events.gateway';

interface BancoInterTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

interface PixCobrancaRequest {
  chave: string;
  solicitacaoPagador?: string;
  devedor: {
    cpf: string;
    nome: string;
  };
  valor: {
    original: string;
    modalidadeAlteracao?: number;
  };
  calendario: {
    expiracao: number;
  };
}

interface PixCobrancaResponse {
  txid: string;
  loc: {
    id: number;
    location: string;
    tipoCob: string;
  };
  status: string;
  devedor: {
    cpf: string;
    nome: string;
  };
  valor: {
    original: string;
  };
  chave: string;
  solicitacaoPagador: string;
  pixCopiaECola: string;
}

@Injectable()
export class BancoInterService {
  private readonly logger = new Logger(BancoInterService.name);
  private accessToken: string | null = null;
  private tokenExpiresAt: Date | null = null;

  private readonly config;

  constructor(
    private configService: ConfigService,
    private eventsGateway: EventsGateway,
  ) {
    this.config = {
      clientId: this.configService.get<string>('BANCO_INTER_CLIENT_ID', ''),
      clientSecret: this.configService.get<string>(
        'BANCO_INTER_CLIENT_SECRET',
        '',
      ),
      certificatePath: this.configService.get<string>(
        'BANCO_INTER_CERT_PATH',
        '',
      ),
      privateKeyPath: this.configService.get<string>(
        'BANCO_INTER_KEY_PATH',
        '',
      ),
      baseUrl: this.configService.get<string>(
        'BANCO_INTER_BASE_URL',
        'https://cdpj-sandbox.partners.uatinter.co',
      ),
      scope: this.configService.get<string>(
        'BANCO_INTER_SCOPE',
        'rec.read rec.write cob.write cob.read payloadlocationrec.write boleto-cobranca.read boleto-cobranca.write',
      ),
    };

    // Log configuration for debugging
    this.logger.log(`Banco Inter Config - Base URL: ${this.config.baseUrl}`);
    this.logger.log(`Banco Inter Config - Scope: ${this.config.scope}`);
    this.logger.log(
      `Banco Inter Config - Client ID: ${this.config.clientId ? 'SET' : 'NOT SET'}`,
    );

    // Configuration successfully loaded
    this.logger.log('Banco Inter service initialized successfully');
  }

  private async getAccessToken(): Promise<string> {
    if (this.isTokenValid()) {
      return this.accessToken!;
    }

    await this.authenticate();
    return this.accessToken!;
  }

  private isTokenValid(): boolean {
    return (
      this.accessToken !== null &&
      this.tokenExpiresAt !== null &&
      new Date() < this.tokenExpiresAt
    );
  }

  private createHttpsAgent(): https.Agent | undefined {
    if (this.config.certificatePath && this.config.privateKeyPath) {
      if (!fs.existsSync(this.config.certificatePath)) {
        throw new Error(
          `Certificate file not found: ${this.config.certificatePath}`,
        );
      }

      if (!fs.existsSync(this.config.privateKeyPath)) {
        throw new Error(
          `Private key file not found: ${this.config.privateKeyPath}`,
        );
      }

      const cert = fs.readFileSync(this.config.certificatePath);
      const key = fs.readFileSync(this.config.privateKeyPath);

      return new https.Agent({
        cert,
        key,
        rejectUnauthorized: false, // Para sandbox
      });
    }
    return undefined;
  }

  private async authenticate(): Promise<void> {
    try {
      this.logger.log('Authenticating with Banco Inter...');

      // Verificar configuração
      if (!this.config.clientId || !this.config.clientSecret) {
        throw new Error('Banco Inter credentials not configured');
      }

      const httpsAgent = this.createHttpsAgent();

      this.logger.log(`Auth URL: ${this.config.baseUrl}/oauth/v2/token`);
      this.logger.log(`Client ID: ${this.config.clientId}`);
      this.logger.log(`Scope: ${this.config.scope}`);
      this.logger.log(`Has HTTPS Agent: ${httpsAgent ? 'YES' : 'NO'}`);

      const response = await axios.post<BancoInterTokenResponse>(
        `${this.config.baseUrl}/oauth/v2/token`,
        new URLSearchParams({
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          scope: this.config.scope,
          grant_type: 'client_credentials',
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          httpsAgent,
        },
      );

      const { access_token, expires_in } = response.data;

      this.accessToken = access_token;
      // Subtrai 5 minutos para renovar antes do vencimento
      this.tokenExpiresAt = new Date(Date.now() + (expires_in - 300) * 1000);

      this.logger.log('Successfully authenticated with Banco Inter');
      this.logger.log(`Token expires at: ${this.tokenExpiresAt.toISOString()}`);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Authentication failed:', error);
      throw new Error(`Banco Inter authentication failed: ${errorMessage}`);
    }
  }

  async generateBilling(boleto: BancoInterRequestBoleto): Promise<{
    codigoSolicitacao: string;
    boletoDetails: any;
  }> {
    try {
      this.logger.log(`Creating billing for number: ${boleto.seuNumero}`);

      const token = await this.getAccessToken();
      const httpsAgent = this.createHttpsAgent();

      const response = await axios.post<{ codigoSolicitacao: string }>(
        `${this.config.baseUrl}/cobranca/v3/cobrancas`,
        boleto,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'x-conta-corrente': '312571828',
            'Content-Type': 'application/json',
          },
          httpsAgent,
          timeout: 30000,
        },
      );

      this.logger.log(`Billing created successfully`);
      const codigoSolicitacao = response.data?.codigoSolicitacao;

      if (!codigoSolicitacao) {
        throw new Error('codigoSolicitacao not received from Banco Inter');
      }

      // Aguardar um pouco para o boleto ser processado
      await new Promise((resolve) => setTimeout(resolve, 5000)); // Aumentar para 5 segundos

      // Consultar detalhes do boleto
      const boletoDetails =
        await this.consultarCobrancaPorCodigo(codigoSolicitacao);

      return {
        codigoSolicitacao,
        boletoDetails,
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to create billing:', error);
      throw new Error(`Failed to create billing: ${errorMessage}`);
    }
  }

  async consultarCobrancaPorCodigo(codigoSolicitacao: string): Promise<any> {
    try {
      this.logger.log(`Consulting cobrança by código: ${codigoSolicitacao}`);

      const token = await this.getAccessToken();
      const httpsAgent = this.createHttpsAgent();

      const response = await axios.get(
        `${this.config.baseUrl}/cobranca/v3/cobrancas/${codigoSolicitacao}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'x-conta-corrente': '312571828',
            'Content-Type': 'application/json',
          },
          httpsAgent,
          timeout: 30000,
        },
      );

      this.logger.log(`Cobrança consulted successfully: ${codigoSolicitacao}`);
      return response.data;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to consult cobrança by código:', errorMessage);
      throw new Error(`Failed to consult cobrança: ${errorMessage}`);
    }
  }

  async consultarCobranca(nossoNumero: string): Promise<any> {
    try {
      this.logger.log(`Consulting cobrança: ${nossoNumero}`);

      const token = await this.getAccessToken();

      const response = await axios.get(
        `${this.config.baseUrl}/cobranca/v3/cobrancas/${nossoNumero}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      return response.data;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to consult cobrança:', errorMessage);
      throw new Error(`Failed to consult cobrança: ${errorMessage}`);
    }
  }

  async baixarCobranca(
    nossoNumero: string,
    motivo: string = 'ACERTOS',
  ): Promise<any> {
    try {
      this.logger.log(`Baixar cobrança: ${nossoNumero}`);

      const token = await this.getAccessToken();

      const response = await axios.post(
        `${this.config.baseUrl}/cobranca/v3/cobrancas/${nossoNumero}/baixar`,
        { codigoBaixa: motivo },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      );

      this.logger.log(`Cobrança baixada successfully: ${nossoNumero}`);
      return response.data;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to baixar cobrança:', errorMessage);
      throw new Error(`Failed to baixar cobrança: ${errorMessage}`);
    }
  }

  async listarCobrancas(
    dataInicial: string,
    dataFinal: string,
    page: number = 0,
    size: number = 100,
  ): Promise<any> {
    try {
      this.logger.log(`Listing cobranças from ${dataInicial} to ${dataFinal}`);

      const token = await this.getAccessToken();

      const params = new URLSearchParams({
        dataInicial,
        dataFinal,
        page: page.toString(),
        size: size.toString(),
      });

      const response = await axios.get(
        `${this.config.baseUrl}/cobranca/v3/cobrancas?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      return response.data;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to list cobranças:', errorMessage);
      throw new Error(`Failed to list cobranças: ${errorMessage}`);
    }
  }

  async generatePixQRCode(
    contractId: number,
    userId: number,
    amount: number,
    userName: string,
    userDocument: string,
  ): Promise<{ qrCode: string; txid: string }> {
    try {
      this.logger.log(`Generating PIX QR Code for contract ${contractId}`);

      // Enviar notificação via socket de que está processando
      this.eventsGateway.server
        .to(`user_${userId}`)
        .emit('pix_generation_status', {
          status: 'processing',
          message: 'Gerando QR Code PIX, aguarde...',
          contractId,
        });

      const token = await this.getAccessToken();
      const httpsAgent = this.createHttpsAgent();

      // Passo 1: Criar location para PIX recorrente
      this.logger.log('Creating location for PIX recorrente...');
      const locationResponse = await axios.post(
        `${this.config.baseUrl}/pix/v2/locrec`,
        {}, // Body vazio conforme documentação
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'x-conta-corrente': '312571828',
            'Content-Type': 'application/json',
          },
          httpsAgent,
          timeout: 30000,
        },
      );

      const locationId = locationResponse.data.id;
      this.logger.log(`Location created successfully: ${locationId}`);

      // Passo 2: Gerar TXID único para cobrança inicial
      const txidCobranca = `PIX${new Date()
        .toISOString()
        .replace(/[-:T.]/g, '')
        .substring(
          0,
          14,
        )}${contractId.toString().padStart(6, '0')}${userDocument.replace(/\D/g, '').substring(0, 8)}`;

      // Passo 3: Criar cobrança PIX inicial
      const cobrancaData: PixCobrancaRequest = {
        chave: '51883655000196', // Chave PIX da empresa
        solicitacaoPagador: `Pagamento contrato ${contractId}`,
        devedor: {
          cpf: userDocument.replace(/\D/g, ''),
          nome: userName,
        },
        valor: {
          original: amount.toFixed(2),
          modalidadeAlteracao: 1,
        },
        calendario: {
          expiracao: 172800, // 48 horas
        },
      };

      this.logger.log(`Creating PIX cobrança with txid: ${txidCobranca}`);

      const cobrancaResponse = await axios.post<PixCobrancaResponse>(
        `${this.config.baseUrl}/pix/v2/cob`,
        cobrancaData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'x-conta-corrente': '312571828',
            'Content-Type': 'application/json',
          },
          httpsAgent,
          timeout: 30000,
        },
      );

      const txidParaRecorrencia = cobrancaResponse.data.txid;
      this.logger.log('PIX cobrança created successfully');

      // Passo 4: Criar PIX recorrente
      const pixRecorrenteData = {
        vinculo: {
          devedor: {
            nome: userName,
            cpf: userDocument.replace(/\D/g, ''),
          },
          contrato: contractId.toString(),
          objeto: 'Serviços Clica do Brasil',
        },
        calendario: {
          dataInicial: new Date().toISOString().split('T')[0], // Data atual no formato YYYY-MM-DD
          periodicidade: 'MENSAL', // Pode ser SEMANAL, MENSAL, etc.
        },
        valor: {
          valorRec: amount.toFixed(2),
        },
        politicaRetentativa: 'PERMITE_3R_7D',
        loc: locationId,
        ativacao: {
          dadosJornada: {
            txid: txidParaRecorrencia,
          },
        },
      };

      this.logger.log('Creating PIX recorrente...');

      const pixResponse = await axios.post(
        `${this.config.baseUrl}/pix/v2/rec`,
        pixRecorrenteData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'x-conta-corrente': '312571828',
            'Content-Type': 'application/json',
          },
          httpsAgent,
          timeout: 30000,
        },
      );

      const idRec = pixResponse.data.idRec;
      this.logger.log(`PIX recorrente created successfully: ${idRec}`);

      // Passo 5: Aguardar 2 segundos para o banco processar
      this.logger.log('Waiting 2 seconds for bank processing...');
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Passo 6: Consultar a recorrência para obter o QR Code de ativação
      this.logger.log('Consulting PIX recorrente to get activation QR Code...');
      const recConsultaResponse = await axios.get(
        `${this.config.baseUrl}/pix/v2/rec/${idRec}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'x-conta-corrente': '312571828',
            'Content-Type': 'application/json',
          },
          httpsAgent,
          timeout: 30000,
        },
      );

      // Pegar o QR Code da recorrência (para ativação do débito automático)
      const qrCode = recConsultaResponse.data.dadosQR?.pixCopiaECola;
      const jornada = recConsultaResponse.data.dadosQR?.jornada;

      if (!qrCode) {
        throw new Error('QR Code not found in recorrência response');
      }

      this.logger.log(
        `PIX recorrente QR Code generated successfully. Jornada: ${jornada}`,
      );

      // Enviar QR Code via socket
      this.eventsGateway.server
        .to(`user_${userId}`)
        .emit('pix_generation_status', {
          status: 'success',
          message: 'QR Code PIX recorrente gerado com sucesso!',
          contractId,
          qrCode,
          txid: idRec, // Usar o idRec como identificador
          amount,
          jornada,
          expiresIn: 172800, // 48 horas em segundos
          type: 'recorrente', // Indicar que é recorrência
        });

      return {
        qrCode,
        txid: idRec, // Retornar o idRec como txid
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to generate PIX QR Code:', error);

      // Enviar erro via socket
      this.eventsGateway.server
        .to(`user_${userId}`)
        .emit('pix_generation_status', {
          status: 'error',
          message: `Erro ao gerar QR Code PIX: ${errorMessage}`,
          contractId,
        });

      throw new Error(`Failed to generate PIX QR Code: ${errorMessage}`);
    }
  }

  async checkPixPaymentStatus(txid: string): Promise<any> {
    try {
      this.logger.log(`Checking PIX payment status for txid: ${txid}`);

      const token = await this.getAccessToken();
      const httpsAgent = this.createHttpsAgent();

      const response = await axios.get(
        `https://cdpj.partners.bancointer.com.br/pix/v2/cob/${txid}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'x-conta-corrente': '312571828',
          },
          httpsAgent,
          timeout: 30000,
        },
      );

      return response.data;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to check PIX payment status:', errorMessage);
      throw new Error(`Failed to check PIX payment status: ${errorMessage}`);
    }
  }

  async obterPdfBoletoEUpload(
    codigoSolicitacao: string,
    contractId: number,
    s3Service: any,
  ): Promise<{ buffer: Buffer; minioUrl?: string }> {
    try {
      this.logger.log(
        `Getting PDF for cobrança and uploading: ${codigoSolicitacao}`,
      );

      // Primeiro verificar se o boleto existe e está no status correto
      const boletoStatus =
        await this.consultarCobrancaPorCodigo(codigoSolicitacao);
      this.logger.log(`Boleto status: ${JSON.stringify(boletoStatus)}`);

      if (!boletoStatus || boletoStatus.situacao === 'CANCELADA') {
        throw new Error(
          `Boleto não encontrado ou cancelado. Status: ${boletoStatus?.situacao}`,
        );
      }

      const token = await this.getAccessToken();
      const httpsAgent = this.createHttpsAgent();

      const response = await axios.get(
        `${this.config.baseUrl}/cobranca/v3/cobrancas/${codigoSolicitacao}/pdf`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'x-conta-corrente': '312571828',
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          httpsAgent,
          timeout: 60000, // Aumentar timeout para 60 segundos
        },
      );

      this.logger.log(
        `PDF Response - Status: ${response.status}, Content-Type: ${response.headers['content-type']}`,
      );

      // Verificar se os dados estão corretos
      if (!response.data || !response.data.pdf) {
        throw new Error('PDF data not found in response');
      }

      // O Banco Inter retorna o PDF como base64 string
      const pdfBase64 = response.data.pdf as string;
      const pdfBuffer = Buffer.from(pdfBase64, 'base64');

      // Verificar se o buffer é válido (deve começar com %PDF)
      const pdfSignature = pdfBuffer.slice(0, 4).toString();

      this.logger.log(
        `PDF Analysis - Signature: "${pdfSignature}", Buffer size: ${pdfBuffer.length} bytes`,
      );

      if (pdfSignature !== '%PDF') {
        this.logger.error(
          `Invalid PDF signature: ${pdfSignature}. Response: ${JSON.stringify(response.data)}`,
        );
        throw new Error(
          `Invalid PDF received from Banco Inter. Signature: ${pdfSignature}`,
        );
      }

      this.logger.log(`Valid PDF received. Size: ${pdfBuffer.length} bytes`);

      let minioUrl: string | undefined;

      // Fazer upload para MinIO
      try {
        const fileKey = s3Service.generateFileKey(
          contractId,
          codigoSolicitacao,
        );
        minioUrl = await s3Service.uploadFile(
          fileKey,
          pdfBuffer,
          'application/pdf',
        );
        this.logger.log(`PDF uploaded to MinIO: ${minioUrl}`);
      } catch (uploadError) {
        this.logger.warn('Failed to upload PDF to MinIO:', uploadError);
        // Continua sem falhar
      }

      return {
        buffer: pdfBuffer,
        minioUrl,
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to get PDF and upload:', errorMessage);
      throw new Error(`Failed to get PDF and upload: ${errorMessage}`);
    }
  }

  async obterPdfBoleto(codigoSolicitacao: string): Promise<Buffer> {
    try {
      this.logger.log(`Getting PDF for cobrança: ${codigoSolicitacao}`);

      // Primeiro verificar se o boleto existe e está no status correto
      const boletoStatus =
        await this.consultarCobrancaPorCodigo(codigoSolicitacao);
      this.logger.log(`Boleto status: ${JSON.stringify(boletoStatus)}`);

      if (!boletoStatus || boletoStatus.situacao === 'CANCELADA') {
        throw new Error(
          `Boleto não encontrado ou cancelado. Status: ${boletoStatus?.situacao}`,
        );
      }

      const token = await this.getAccessToken();
      const httpsAgent = this.createHttpsAgent();

      const response = await axios.get(
        `${this.config.baseUrl}/cobranca/v3/cobrancas/${codigoSolicitacao}/pdf`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'x-conta-corrente': '312571828',
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          httpsAgent,
          timeout: 60000, // Aumentar timeout para 60 segundos
        },
      );

      this.logger.log(
        `PDF Response - Status: ${response.status}, Content-Type: ${response.headers['content-type']}`,
      );

      // Verificar se os dados estão corretos
      if (!response.data || !response.data.pdf) {
        throw new Error('PDF data not found in response');
      }

      // O Banco Inter retorna o PDF como base64 string
      const pdfBase64 = response.data.pdf as string;
      const pdfBuffer = Buffer.from(pdfBase64, 'base64');

      // Verificar se o buffer é válido (deve começar com %PDF)
      const pdfSignature = pdfBuffer.slice(0, 4).toString();

      this.logger.log(
        `PDF Analysis - Signature: "${pdfSignature}", Buffer size: ${pdfBuffer.length} bytes`,
      );

      if (pdfSignature !== '%PDF') {
        this.logger.error(
          `Invalid PDF signature: ${pdfSignature}. Response: ${JSON.stringify(response.data)}`,
        );
        throw new Error(
          `Invalid PDF received from Banco Inter. Signature: ${pdfSignature}`,
        );
      }

      this.logger.log(`Valid PDF received. Size: ${pdfBuffer.length} bytes`);
      return pdfBuffer;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to get PDF:', errorMessage);
      throw new Error(`Failed to get PDF: ${errorMessage}`);
    }
  }

  // Método público para verificar se está autenticado
  isAuthenticated(): boolean {
    return this.isTokenValid();
  }

  // Método para testar a conexão
  async testConnection(): Promise<boolean> {
    try {
      await this.getAccessToken();
      return true;
    } catch {
      return false;
    }
  }
}
