import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand,
  PutBucketPolicyCommand,
} from '@aws-sdk/client-s3';

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;

  constructor(private configService: ConfigService) {
    // Logger para validar variáveis de ambiente do S3
    this.logger.log('=== VALIDAÇÃO DAS VARIÁVEIS DE AMBIENTE DO S3 ===');
    this.logger.log(
      `S3_ENDPOINT: ${this.configService.get('S3_ENDPOINT') || 'undefined'}`,
    );
    this.logger.log(
      `S3_REGION: ${this.configService.get('S3_REGION') || 'undefined'}`,
    );
    this.logger.log(
      `S3_ACCESS_KEY: ${this.configService.get('S3_ACCESS_KEY') ? '***DEFINIDA***' : 'undefined'}`,
    );
    this.logger.log(
      `S3_SECRET_KEY: ${this.configService.get('S3_SECRET_KEY') ? '***DEFINIDA***' : 'undefined'}`,
    );
    this.logger.log(
      `S3_BUCKET_NAME: ${this.configService.get('S3_BUCKET_NAME') || 'undefined'}`,
    );
    this.logger.log('=== FIM DA VALIDAÇÃO S3 ===');

    // Configuração para MinIO (compatível com S3)
    this.s3Client = new S3Client({
      endpoint: this.configService.get('S3_ENDPOINT', 'http://localhost:9000'),
      region: this.configService.get('S3_REGION', 'us-east-1'),
      credentials: {
        accessKeyId: this.configService.get('S3_ACCESS_KEY', 'minioadmin'),
        secretAccessKey: this.configService.get('S3_SECRET_KEY', 'minioadmin'),
      },
      forcePathStyle: true, // Necessário para MinIO
    });

    this.bucketName = this.configService.get('S3_BUCKET_NAME', 'boletos');

    this.logger.log(
      '🚀 S3Client configurado, iniciando verificação do bucket...',
    );

    // Inicializar bucket na inicialização com timeout
    this.initializeBucketWithTimeout().catch((error) => {
      this.logger.error('❌ Erro ao inicializar bucket:', error);
    });
  }

  private async initializeBucketWithTimeout(): Promise<void> {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(
        () => reject(new Error('Timeout na inicialização do S3')),
        5000, // Reduzido para 5 segundos
      );
    });

    try {
      this.logger.log(
        '⏳ Iniciando verificação do bucket com timeout de 5s...',
      );
      await Promise.race([this.initializeBucket(), timeoutPromise]);
      this.logger.log('✅ Inicialização do S3 concluída com sucesso');
    } catch (error) {
      this.logger.error('⏰ Timeout ou erro na inicialização do S3:', error);
      this.logger.warn('⚠️ Continuando sem verificação do bucket...');
      this.logger.warn('📝 A aplicação continuará funcionando normalmente');
    }
  }

  private async initializeBucket(): Promise<void> {
    try {
      this.logger.log('🔍 Verificando se o bucket existe...');
      // Verificar se o bucket existe
      const headCommand = new HeadBucketCommand({
        Bucket: this.bucketName,
      });

      await this.s3Client.send(headCommand);
      this.logger.log(`✅ Bucket '${this.bucketName}' já existe`);
    } catch (error) {
      // Se der erro ao verificar bucket, tentar criar um novo
      this.logger.warn('⚠️ Bucket não encontrado, tentando criar...');
      this.logger.debug('Erro ao verificar bucket:', error);
      await this.createBucket();
    }
  }

  private async createBucket(): Promise<void> {
    try {
      this.logger.log('🛠️ Tentando criar bucket...');
      const createCommand = new CreateBucketCommand({
        Bucket: this.bucketName,
      });

      await this.s3Client.send(createCommand);
      this.logger.log(`✅ Bucket '${this.bucketName}' criado com sucesso`);

      // Configurar política pública para o bucket
      this.logger.log('🔧 Configurando política pública do bucket...');
      await this.setBucketPublicPolicy();
    } catch (error) {
      this.logger.error('❌ Erro ao criar bucket:', error);
      throw error; // Re-throw para o timeout capturar
    }
  }

  private async setBucketPublicPolicy(): Promise<void> {
    try {
      // Política que permite leitura pública de todos os objetos no bucket
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'PublicRead',
            Effect: 'Allow',
            Principal: '*',
            Action: 's3:GetObject',
            Resource: `arn:aws:s3:::${this.bucketName}/*`,
          },
        ],
      };

      const command = new PutBucketPolicyCommand({
        Bucket: this.bucketName,
        Policy: JSON.stringify(policy),
      });

      await this.s3Client.send(command);
      this.logger.log(
        `Política pública configurada para o bucket '${this.bucketName}'`,
      );
    } catch (error) {
      this.logger.warn('Erro ao configurar política pública do bucket:', error);
      this.logger.warn(
        'Os arquivos ainda serão enviados, mas podem não ser publicamente acessíveis',
      );
    }
  }

  async uploadFile(
    key: string,
    buffer: Buffer,
    contentType: string = 'application/pdf',
  ): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        // Remover ACL pois pode não ser suportado pelo MinIO
        // A política do bucket deve cuidar do acesso público
      });

      await this.s3Client.send(command);

      // Construir URL pública do arquivo
      const endpoint = this.configService.get<string>(
        'S3_ENDPOINT',
        'http://localhost:9000',
      );
      const fileUrl = `${endpoint}/${this.bucketName}/${key}`;

      this.logger.log(`Arquivo enviado com sucesso: ${fileUrl}`);
      return fileUrl;
    } catch (error) {
      this.logger.error('Erro ao enviar arquivo para S3/MinIO:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';
      throw new Error(`Falha no upload do arquivo: ${errorMessage}`);
    }
  }

  async downloadFile(key: string): Promise<Buffer> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const response = await this.s3Client.send(command);

      if (!response.Body) {
        throw new Error('Arquivo não encontrado');
      }

      // Converter response body para buffer
      const bodyContents = await response.Body.transformToByteArray();
      return Buffer.from(bodyContents);
    } catch (error) {
      this.logger.error('Erro ao baixar arquivo do S3/MinIO:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';
      throw new Error(`Falha no download do arquivo: ${errorMessage}`);
    }
  }

  generateFileKey(contractId: number, codigoSolicitacao: string): string {
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    return `boletos/${contractId}/${timestamp}/${codigoSolicitacao}.pdf`;
  }
}
