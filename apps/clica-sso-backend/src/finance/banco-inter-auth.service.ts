/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import * as fs from 'fs';
import * as https from 'https';
import { BancoInterRequestBoleto } from './interface/BancoInterBoleto';

interface BancoInterTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

interface BancoInterConfig {
  clientId: string;
  clientSecret: string;
  certificatePath: string;
  privateKeyPath: string;
  baseUrl: string;
  scope: string;
}

@Injectable()
export class BancoInterAuthService {
  private readonly logger = new Logger(BancoInterAuthService.name);
  private axiosInstance: AxiosInstance;
  private accessToken: string | null = null;
  private tokenExpiresAt: Date | null = null;

  private readonly config: BancoInterConfig = {
    clientId: process.env.BANCO_INTER_CLIENT_ID || '',
    clientSecret: process.env.BANCO_INTER_CLIENT_SECRET || '',
    certificatePath: process.env.BANCO_INTER_CERT_PATH || '',
    privateKeyPath: process.env.BANCO_INTER_KEY_PATH || '',
    baseUrl:
      process.env.BANCO_INTER_BASE_URL ||
      'https://cdpj-sandbox.partners.uatinter.co',
    scope:
      process.env.BANCO_INTER_SCOPE || 'cobranca-v3.read cobranca-v3.write',
  };

  constructor() {
    this.initializeAxios();
  }

  private initializeAxios(): void {
    this.axiosInstance = axios.create({
      baseURL: this.config.baseUrl,
      timeout: 30000,
    });

    // Interceptor para adicionar o token automaticamente
    this.axiosInstance.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        await this.ensureValidToken();
        if (this.accessToken && config.headers) {
          config.headers.Authorization = `Bearer ${this.accessToken}`;
        }
        return config;
      },
    );

    // Interceptor para tratar erros de autenticação
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          this.logger.warn('Token expired, refreshing...');
          this.accessToken = null;
          this.tokenExpiresAt = null;

          // Retry the request with new token
          await this.ensureValidToken();
          if (this.accessToken && error.config?.headers) {
            error.config.headers.Authorization = `Bearer ${this.accessToken}`;
            return this.axiosInstance.request(error.config);
          }
        }
        return Promise.reject(new Error(error.message || 'Request failed'));
      },
    );
  }

  private async ensureValidToken(): Promise<void> {
    if (this.isTokenValid()) {
      return;
    }

    try {
      await this.authenticate();
    } catch (error) {
      this.logger.error('Failed to authenticate with Banco Inter:', error);
      throw new Error('Failed to authenticate with Banco Inter');
    }
  }

  private isTokenValid(): boolean {
    return (
      this.accessToken !== null &&
      this.tokenExpiresAt !== null &&
      new Date() < this.tokenExpiresAt
    );
  }

  private async authenticate(): Promise<void> {
    try {
      this.logger.log('Authenticating with Banco Inter...');

      // Verificar se os certificados existem
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

      // Carregar certificados
      const cert = fs.readFileSync(this.config.certificatePath);
      const key = fs.readFileSync(this.config.privateKeyPath);

      console.log(cert, key, 'keyssss');

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
          httpsAgent: new https.Agent({
            cert,
            key,
            rejectUnauthorized: false, // Para sandbox, em produção deve ser true
          }),
        },
      );

      const { access_token, expires_in } = response.data;

      this.accessToken = access_token;
      // Subtrai 5 minutos para renovar antes do vencimento
      this.tokenExpiresAt = new Date(Date.now() + (expires_in - 300) * 1000);

      this.logger.log('Successfully authenticated with Banco Inter');
    } catch (error: any) {
      this.logger.error(
        'Authentication failed:',
        error.response?.data || error.message,
      );
      throw error;
    }
  }

  async criarCobranca(boleto: BancoInterRequestBoleto): Promise<any> {
    try {
      this.logger.log(`Creating cobrança for seuNumero: ${boleto.seuNumero}`);

      const response = await this.axiosInstance.post(
        '/cobranca/v3/cobrancas',
        boleto,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      this.logger.log(
        `Cobrança created successfully: ${response.data.nossoNumero}`,
      );
      return response.data;
    } catch (error: any) {
      this.logger.error(
        'Failed to create cobrança:',
        error.response?.data || error.message,
      );
      throw error;
    }
  }

  async consultarCobranca(nossoNumero: string): Promise<any> {
    try {
      this.logger.log(`Consulting cobrança: ${nossoNumero}`);

      const response = await this.axiosInstance.get(
        `/cobranca/v3/cobrancas/${nossoNumero}`,
      );

      return response.data;
    } catch (error: any) {
      this.logger.error(
        'Failed to consult cobrança:',
        error.response?.data || error.message,
      );
      throw error;
    }
  }

  async baixarCobranca(
    nossoNumero: string,
    motivo: string = 'ACERTOS',
  ): Promise<any> {
    try {
      this.logger.log(`Baixar cobrança: ${nossoNumero}`);

      const response = await this.axiosInstance.post(
        `/cobranca/v3/cobrancas/${nossoNumero}/baixar`,
        { codigoBaixa: motivo },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      this.logger.log(`Cobrança baixada successfully: ${nossoNumero}`);
      return response.data;
    } catch (error: any) {
      this.logger.error(
        'Failed to baixar cobrança:',
        error.response?.data || error.message,
      );
      throw error;
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

      const params = new URLSearchParams({
        dataInicial,
        dataFinal,
        page: page.toString(),
        size: size.toString(),
      });

      const response = await this.axiosInstance.get(
        `/cobranca/v3/cobrancas?${params}`,
      );

      return response.data;
    } catch (error: any) {
      this.logger.error(
        'Failed to list cobranças:',
        error.response?.data || error.message,
      );
      throw error;
    }
  }

  // Método para obter PDF do boleto
  async obterPdfBoleto(nossoNumero: string): Promise<Buffer> {
    try {
      this.logger.log(`Getting PDF for cobrança: ${nossoNumero}`);

      const response = await this.axiosInstance.get(
        `/cobranca/v3/cobrancas/${nossoNumero}/pdf`,
        {
          responseType: 'arraybuffer',
        },
      );

      return Buffer.from(response.data);
    } catch (error: any) {
      this.logger.error(
        'Failed to get PDF:',
        error.response?.data || error.message,
      );
      throw error;
    }
  }

  // Método público para obter o token (para testes)
  async getAccessToken(): Promise<string | null> {
    await this.ensureValidToken();
    return this.accessToken;
  }

  // Método público para verificar se está autenticado
  isAuthenticated(): boolean {
    return this.isTokenValid();
  }
}
