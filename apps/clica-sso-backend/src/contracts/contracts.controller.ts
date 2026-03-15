/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Request,
  UseGuards,
  Logger,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ContractsService } from './contracts.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { CreateContractFromPaymentDto } from './dto/create-contract-from-payment.dto';
import { PaymentService } from '../finance/payment.service';
import { BancoInterService } from '../finance/banco-inter.service';
import { EventsGateway } from '../events/events.gateway';
import { S3Service } from '../shared/s3.service';
import { PaymentMethod } from '../finance/payment.entity';
import { UsersService } from '../users/users.service';

enum ContractStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  EXPIRED = 'expired',
}

@Controller('contracts')
@UseGuards(JwtAuthGuard)
export class ContractsController {
  private readonly logger = new Logger(ContractsController.name);

  constructor(
    private readonly contractsService: ContractsService,
    private readonly bancoInterService: BancoInterService,
    private readonly usersService: UsersService,
    private readonly paymentService: PaymentService,
    private readonly eventsGateway: EventsGateway,
    private readonly s3Service: S3Service,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createContractDto: CreateContractDto) {
    return this.contractsService.create(createContractDto);
  }

  @Post('from-payment')
  @HttpCode(HttpStatus.CREATED)
  async createFromPayment(
    @Body() createDto: CreateContractFromPaymentDto,
    @Request() req: { user: any },
  ) {
    // Por enquanto, usando valores fixos - você deve buscar do payment real
    const paymentAmount = 100.0; // Buscar do payment
    const userId = req.user.id; // Pegar do usuário autenticado

    return this.contractsService.createFromPayment(
      createDto,
      paymentAmount,
      userId,
    );
  }

  @Post('from-plan')
  @HttpCode(HttpStatus.CREATED)
  async createFromPlan(@Body() createDto: any, @Request() req: { user: any }) {
    const userId = parseInt(req.user.id, 10);
    return this.contractsService.createFromPlanDto(createDto, userId);
  }

  @Get()
  async findAll() {
    return this.contractsService.findAll();
  }

  @Get('my-contracts')
  async findMyContracts(@Request() req: { user: any }) {
    return this.contractsService.findByUserId(req.user.id);
  }

  @Get('my-contracts-with-payments')
  async findMyContractsWithPayments(@Request() req: { user: any }) {
    return this.contractsService.getContractsWithPaymentInfo(req.user.id);
  }

  @Get(':id')
  async findById(@Param('id', ParseIntPipe) id: number) {
    return this.contractsService.findById(id);
  }

  @Get(':id/with-payments')
  async findByIdWithPayments(@Param('id', ParseIntPipe) id: number) {
    return this.contractsService.getContractWithLastPayment(id);
  }

  @Get(':id/pending-payments')
  async findPendingPayments(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: { user: any },
  ) {
    const userId = parseInt(req.user.id, 10);

    // Verificar se o usuário tem acesso ao contrato
    const contract = await this.contractsService.findById(id);
    if (!contract || contract.user.id !== userId) {
      return {
        success: false,
        message: 'Contrato não encontrado ou sem permissão',
      };
    }

    const pendingPayments =
      await this.paymentService.findPendingByContractId(id);

    this.logger.log(
      `🔍 Pagamentos pendentes encontrados para contrato ${id}: ${pendingPayments.length}`,
    );

    if (pendingPayments.length > 0) {
      this.logger.log('📄 Primeiro pagamento:', {
        id: pendingPayments[0].id,
        method: pendingPayments[0].method,
        amount: pendingPayments[0].amount,
        pixQrCode: pendingPayments[0].pixQrCode ? 'PRESENTE' : 'AUSENTE',
        boletoBarcode: pendingPayments[0].boletoBarcode
          ? 'PRESENTE'
          : 'AUSENTE',
        boletoUrl: pendingPayments[0].boletoUrl ? 'PRESENTE' : 'AUSENTE',
        metadata: pendingPayments[0].metadata,
      });
    }

    return {
      success: true,
      data: pendingPayments,
      hasPendingPayments: pendingPayments.length > 0,
      oldestPayment: pendingPayments.length > 0 ? pendingPayments[0] : null,
    };
  }

  @Get('user/connected-apps')
  async getConnectedApps(@Request() req: { user: any }) {
    const userId = parseInt(req.user.id, 10);
    return this.contractsService.getConnectedApps(userId);
  }

  @Get('user/:userId')
  async findByUserId(@Param('userId', ParseIntPipe) userId: number) {
    return this.contractsService.findByUserId(userId);
  }

  @Get('service/:serviceType')
  async findByServiceType(@Param('serviceType') serviceType: string) {
    return await this.contractsService.findByServiceType(serviceType);
  }

  @Get(':id/active')
  async isActive(@Param('id', ParseIntPipe) id: number) {
    const isActive = await this.contractsService.isActive(id);
    return { id, isActive };
  }

  @Get(':id/metadata')
  async getMetadata(@Param('id', ParseIntPipe) id: number) {
    const metadata = await this.contractsService.getMetadata(id);
    return { id, metadata };
  }

  @Get(':id/features')
  async getContractFeatures(@Param('id', ParseIntPipe) id: number) {
    return this.contractsService.getContractFeatures(id);
  }

  @Get(':id/usage')
  async getContractUsage(@Param('id', ParseIntPipe) id: number) {
    return this.contractsService.getContractUsage(id);
  }

  @Get(':id/verify')
  async verifyContract(@Param('id', ParseIntPipe) id: number) {
    return this.contractsService.verifyContract(id);
  }

  @Put(':id/usage')
  async updateUsage(
    @Param('id', ParseIntPipe) id: number,
    @Body() usageData: any,
  ) {
    return this.contractsService.updateUsage(id, usageData);
  }

  @Put(':id/status')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: ContractStatus,
  ) {
    return this.contractsService.updateStatus(id, status);
  }

  @Put(':id/metadata')
  async updateMetadata(
    @Param('id', ParseIntPipe) id: number,
    @Body('metadata') metadata: any,
  ) {
    return this.contractsService.updateMetadata(id, metadata);
  }

  @Put(':id/cancel')
  async cancelContract(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { reason: string },
    @Request() req: { user: any },
  ) {
    const userId = parseInt(req.user.id, 10);
    return this.contractsService.cancelContract(id, body.reason, userId);
  }

  @Put(':id/upgrade')
  async upgradeContract(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { newPlanId: number },
    @Request() req: { user: any },
  ) {
    const userId = parseInt(req.user.id, 10);
    return this.contractsService.upgradeContract(id, body.newPlanId, userId);
  }

  @Put(':id/downgrade')
  async downgradeContract(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { newPlanId: number },
    @Request() req: { user: any },
  ) {
    const userId = parseInt(req.user.id, 10);
    return this.contractsService.downgradeContract(id, body.newPlanId, userId);
  }

  @Post(':id/payment-method')
  updatePaymentMethod(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { paymentMethod: string },
  ) {
    // Por enquanto, apenas retornando sucesso
    // Este endpoint pode ser implementado quando necessário
    return {
      success: true,
      message: 'Método de pagamento atualizado',
      contractId: id,
      paymentMethod: body.paymentMethod,
    };
  }

  @Post(':id/generate-payment')
  @HttpCode(HttpStatus.OK)
  async generatePayment(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: { user: any },
  ) {
    const userId = parseInt(req.user.id, 10);

    try {
      // Buscar o contrato e os dados do usuário
      const contract = await this.contractsService.findById(id);
      if (!contract || contract.user.id !== userId) {
        return {
          success: false,
          message: 'Contrato não encontrado ou sem permissão',
        };
      }

      const user = await this.usersService.findById(userId);
      if (!user || !user.document) {
        return {
          success: false,
          message: 'Dados do usuário incompletos. Documento necessário.',
        };
      }

      this.logger.log(`Gerando QR Code PIX para o contrato ${id}`);

      // Primeiro verificar se já existe um pagamento PIX pendente
      const pendingPayments =
        await this.paymentService.findPendingByContractId(id);
      const existingPixPayment = pendingPayments.find(
        (p) => p.method === PaymentMethod.PIX,
      );

      if (existingPixPayment) {
        this.logger.log(
          `Pagamento PIX pendente encontrado: ${existingPixPayment.id}`,
        );

        // Calcular tempo restante de expiração
        const now = new Date();
        const dueDate = new Date(existingPixPayment.dueDate);
        const remainingTimeMs = dueDate.getTime() - now.getTime();
        const remainingTimeSeconds = Math.max(
          0,
          Math.floor(remainingTimeMs / 1000),
        );

        return {
          success: true,
          message: 'Pagamento PIX pendente carregado',
          contractId: id,
          isExisting: true,
          paymentData: {
            paymentId: existingPixPayment.id,
            qrCode: existingPixPayment.pixQrCode || '',
            txid: existingPixPayment.externalId || '',
            amount: Number(existingPixPayment.amount),
            expiresIn: remainingTimeSeconds,
            paymentMethod: 'pix',
            dueDate: existingPixPayment.dueDate,
            createdAt: existingPixPayment.createdAt,
          },
        };
      }

      // Converter valor para número (vem como string/decimal do banco)
      const amount = Number(contract.value);

      if (isNaN(amount) || amount <= 0) {
        return {
          success: false,
          message: 'Valor do contrato inválido',
        };
      }

      // Gerar PIX QR Code
      const pixResult = await this.bancoInterService.generatePixQRCode(
        id,
        userId,
        amount,
        user.name,
        user.document,
      );

      // Criar registro de pagamento PIX
      const paymentData = {
        contractId: id,
        amount,
        method: PaymentMethod.PIX,
        dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0], // 48 horas
        description: `Pagamento PIX do plano ${contract.plan?.name || 'Contratado'}`,
        externalId: pixResult.txid,
        pixQrCode: pixResult.qrCode,
        metadata: {
          banco_inter: {
            txid: pixResult.txid,
            qrCode: pixResult.qrCode,
            expiresIn: 172800,
          },
        },
      };

      const payment = await this.paymentService.create(paymentData, userId);

      return {
        success: true,
        message: 'QR Code PIX gerado com sucesso',
        contractId: id,
        isExisting: false,
        paymentData: {
          paymentId: payment.id,
          qrCode: pixResult.qrCode,
          txid: pixResult.txid,
          amount: amount,
          expiresIn: 172800, // 48 horas
          paymentMethod: 'pix',
          dueDate: payment.dueDate,
          createdAt: payment.createdAt,
        },
      };
    } catch (error) {
      this.logger.error('Erro ao gerar pagamento PIX:', error);
      return {
        success: false,
        message: 'Erro ao gerar pagamento PIX',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }

  @Post(':id/generate-boleto')
  @HttpCode(HttpStatus.OK)
  async generateBoleto(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: { user: any },
  ) {
    const userId = parseInt(req.user.id, 10);

    try {
      // Buscar o contrato e os dados do usuário
      const contract = await this.contractsService.findById(id);
      if (!contract || contract.user.id !== userId) {
        return {
          success: false,
          message: 'Contrato não encontrado ou sem permissão',
        };
      }

      const user = await this.usersService.findById(userId);
      if (!user || !user.document || !user.address_json) {
        return {
          success: false,
          message:
            'Dados do usuário incompletos. Documento e endereço necessários.',
        };
      }

      this.logger.log(`Gerando boleto para o contrato ${id}`);

      // Primeiro verificar se já existe um pagamento de boleto pendente
      const pendingPayments =
        await this.paymentService.findPendingByContractId(id);
      const existingBoletoPayment = pendingPayments.find(
        (p) => p.method === PaymentMethod.BOLETO,
      );

      if (existingBoletoPayment) {
        this.logger.log(
          `Pagamento boleto pendente encontrado: ${existingBoletoPayment.id}`,
        );

        return {
          success: true,
          message: 'Boleto pendente carregado',
          isExisting: true,
          data: {
            paymentId: existingBoletoPayment.id,
            nossoNumero:
              existingBoletoPayment.metadata?.banco_inter?.seuNumero || '',
            seuNumero:
              existingBoletoPayment.metadata?.banco_inter?.seuNumero || '',
            amount: Number(existingBoletoPayment.amount),
            dueDate: existingBoletoPayment.dueDate,
            boletoCode: existingBoletoPayment.boletoBarcode || '',
            boletoBarCode: existingBoletoPayment.boletoBarcode || '',
            boletoUrl: existingBoletoPayment.boletoUrl || '',
            pixQrCode: existingBoletoPayment.pixQrCode || '', // PIX para pagamento instantâneo
            paymentMethod: 'boleto',
            createdAt: existingBoletoPayment.createdAt,
          },
        };
      }

      // Converter valor para número
      const amount = Number(contract.value);
      if (isNaN(amount) || amount <= 0) {
        return {
          success: false,
          message: 'Valor do contrato inválido',
        };
      }

      // Parse do endereço JSON
      let addressData;
      try {
        addressData =
          typeof user.address_json === 'string'
            ? JSON.parse(user.address_json)
            : user.address_json;
      } catch {
        return {
          success: false,
          message: 'Endereço do usuário inválido',
        };
      }

      // Validar campos obrigatórios do endereço
      if (
        !addressData.cep ||
        !addressData.street ||
        !addressData.city ||
        !addressData.state
      ) {
        return {
          success: false,
          message:
            'Endereço incompleto. CEP, rua, cidade e estado são obrigatórios.',
        };
      }

      // Gerar número único para o boleto (máximo 15 caracteres)
      const timestamp = Date.now().toString().slice(-8); // Últimos 8 dígitos
      const seuNumero = `BOL${timestamp}${id}`.substring(0, 15);
      const nossoNumero = `${seuNumero}`;

      // Data de vencimento (7 dias)
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 7);

      // Montar dados do boleto para o Banco Inter
      const boletoData = {
        seuNumero,
        valorNominal: amount.toFixed(2), // String com 2 casas decimais
        dataVencimento: dueDate.toISOString().split('T')[0], // YYYY-MM-DD
        numDiasAgenda: '0',
        pagador: {
          cpfCnpj: user.document.replace(/\D/g, ''), // Remove formatação
          tipoPessoa: 'FISICA' as const,
          nome: user.name,
          endereco: addressData.street,
          numero: addressData.number || 'S/N',
          complemento: addressData.complement || '',
          bairro: addressData.neighborhood || '',
          cidade: addressData.city,
          uf: addressData.state,
          cep: addressData.cep.replace(/\D/g, ''), // Remove formatação
          email: user.email || '',
          ddd: '11', // TODO: extrair do telefone do usuário
          telefone: '999999999', // TODO: usar telefone real do usuário
        },
        mensagem: {
          linha1: `Pagamento do plano ${contract.plan?.name || 'Contratado'}`,
          linha2: `Contrato ${id} - ${user.name}`,
        },
      };

      // Gerar boleto no Banco Inter
      const boletoResult =
        await this.bancoInterService.generateBilling(boletoData);

      // Criar registro de pagamento
      const paymentData = {
        contractId: id,
        amount,
        method: PaymentMethod.BOLETO,
        dueDate: dueDate.toISOString().split('T')[0],
        description: `Pagamento do plano ${contract.plan?.name || 'Contratado'}`,
        externalId: boletoResult.codigoSolicitacao,
        boletoBarcode: boletoResult.boletoDetails?.boleto?.codigoBarras || '',
        pixQrCode: boletoResult.boletoDetails?.pix?.pixCopiaECola || '',
        metadata: {
          banco_inter: {
            codigoSolicitacao: boletoResult.codigoSolicitacao,
            seuNumero,
            boletoDetails: boletoResult.boletoDetails,
          },
        },
      };

      const payment = await this.paymentService.create(paymentData, userId);

      // Fazer upload do PDF do boleto para o MinIO
      let boletoUrl = `/api/contracts/${id}/boleto/${boletoResult.codigoSolicitacao}/pdf`; // URL padrão

      try {
        // Baixar o PDF do Banco Inter e fazer upload para MinIO
        const result = await this.bancoInterService.obterPdfBoletoEUpload(
          boletoResult.codigoSolicitacao,
          id,
          this.s3Service,
        );

        // Se o upload foi bem-sucedido, usar a URL do MinIO
        if (result.minioUrl) {
          boletoUrl = result.minioUrl;

          // Atualizar o payment com a URL do MinIO e dados do boleto
          await this.paymentService.update(payment.id, {
            boletoUrl: result.minioUrl,
            boletoBarcode:
              boletoResult.boletoDetails?.boleto?.codigoBarras || '',
            pixQrCode: boletoResult.boletoDetails?.pix?.pixCopiaECola || '',
          });

          this.logger.log(`PDF do boleto salvo no MinIO: ${result.minioUrl}`);
        }
      } catch (uploadError) {
        this.logger.warn(
          'Erro ao fazer upload do PDF para MinIO, usando URL padrão:',
          uploadError,
        );
        // Continua com a URL padrão se o upload falhar
      }

      // Enviar dados do boleto via Socket.IO
      const socketData = {
        contractId: id,
        paymentId: payment.id,
        boleto: {
          nossoNumero:
            boletoResult.boletoDetails?.boleto?.nossoNumero || nossoNumero,
          codigoBarras: boletoResult.boletoDetails?.boleto?.codigoBarras || '',
          linhaDigitavel:
            boletoResult.boletoDetails?.boleto?.linhaDigitavel || '',
          pixCopiaECola: boletoResult.boletoDetails?.pix?.pixCopiaECola || '',
          codigoSolicitacao: boletoResult.codigoSolicitacao,
          boletoUrl: boletoUrl, // Usar a URL atualizada (MinIO ou padrão)
        },
      };

      this.eventsGateway.sendToUser(userId, 'boleto-generated', socketData);

      this.logger.log(`Boleto gerado com sucesso: ${nossoNumero}`);

      return {
        success: true,
        isExisting: false,
        data: {
          paymentId: payment.id,
          nossoNumero:
            boletoResult.boletoDetails?.boleto?.nossoNumero || nossoNumero,
          seuNumero,
          amount,
          dueDate: dueDate.toISOString(),
          boletoCode: boletoResult.boletoDetails?.boleto?.linhaDigitavel || '',
          boletoBarCode: boletoResult.boletoDetails?.boleto?.codigoBarras || '',
          boletoUrl: boletoUrl, // Usar a URL atualizada (MinIO ou padrão)
          pixQrCode: boletoResult.boletoDetails?.pix?.pixCopiaECola || '', // PIX para pagamento instantâneo
          paymentMethod: 'boleto',
          createdAt: payment.createdAt,
        },
      };
    } catch (error) {
      this.logger.error('Erro ao gerar boleto:', error);
      return {
        success: false,
        message: 'Erro ao gerar boleto',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }

  @Get(':id/boleto/:codigoSolicitacao/pdf')
  async downloadBoletoPdf(
    @Param('id', ParseIntPipe) id: number,
    @Param('codigoSolicitacao') codigoSolicitacao: string,
    @Request() req: { user: any },
    @Res() res: Response,
  ) {
    const userId = parseInt(req.user.id, 10);

    try {
      // Verificar se o usuário tem acesso ao contrato
      const contract = await this.contractsService.findById(id);
      if (!contract || contract.user.id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Contrato não encontrado ou sem permissão',
        });
      }

      // Buscar PDF do boleto no Banco Inter
      const pdfBuffer =
        await this.bancoInterService.obterPdfBoleto(codigoSolicitacao);

      // Configurar headers para download do PDF
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="boleto-${codigoSolicitacao}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      });

      // Enviar o buffer diretamente
      res.send(pdfBuffer);
    } catch (error) {
      this.logger.error('Erro ao buscar PDF do boleto:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar PDF do boleto',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  }
}
