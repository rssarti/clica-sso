/* eslint-disable @typescript-eslint/no-base-to-string */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable, Logger } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentMethod } from './payment.entity';
import { BillingMessage } from '../shared/rabbitmq.service';
import { BancoInterService } from './banco-inter.service';

@Injectable()
export class BillingConsumerService {
  private readonly logger = new Logger(BillingConsumerService.name);

  constructor(
    private readonly paymentService: PaymentService,
    private readonly bancoInterService: BancoInterService,
  ) {}

  async processBillingMessage(message: BillingMessage): Promise<void> {
    this.logger.log(
      `Processing billing message for contract ${message.contractId}`,
    );

    try {
      // Usar dados dinâmicos do BillingMessage
      const boleto = await this.bancoInterService.generateBilling({
        seuNumero: `CONTRACT_${message.contractId}_${Date.now()}`,
        valorNominal: message.amount.toFixed(2),
        dataVencimento: message.dueDate,
        numDiasAgenda: '30',
        pagador: {
          cpfCnpj: message.userDocument || '35935261820', // Fallback para dados mockados
          tipoPessoa: 'FISICA',
          nome: message.userName,
          endereco: message.userAddress?.street || 'Rua São Paulo',
          cidade: message.userAddress?.city || 'Belo Horizonte',
          uf: message.userAddress?.state || 'MG',
          cep: message.userAddress?.cep || '36401042',
          email: message.userEmail,
          ddd: message.userPhone?.substring(0, 2) || '31',
          telefone: message.userPhone?.substring(2) || '999999999',
          numero: message.userAddress?.number || '83',
          complemento: message.userAddress?.complement || 'Casa',
          bairro: message.userAddress?.neighborhood || 'Jardim América',
        },
        // Dados fixos temporariamente como solicitado
        multa: {
          codigo: 'PERCENTUAL',
          taxa: '0.10', // 0.10% ao dia
        },
        mora: {
          codigo: 'TAXAMENSAL',
          taxa: '0.21', // 0.21% ao mês
        },
        desconto: {
          quantidadeDias: 1,
          taxa: 0.3, // 0.3% de desconto
          codigo: 'PERCENTUALDATAINFORMADA',
        },
      });
      this.logger.log(`Billing generated successfully: ${boleto}`);

      // Aqui você pode adicionar lógica adicional:
      // - Enviar email de cobrança
      // - Gerar boleto
      // - Criar invoice
      // - Notificar outros sistemas

      // Exemplo de log estruturado para auditoria

      const createPaymentDto: CreatePaymentDto = {
        contractId: message.contractId,
        amount: message.amount,
        dueDate: message.dueDate,
        description: `Cobrança mensal - ${message.contractName}`,
        method: PaymentMethod.BOLETO, // Método padrão, pode ser ajustado
      };

      // Criar o pagamento
      const payment = await this.paymentService.create(
        createPaymentDto,
        message.userId,
      );

      this.logger.log(
        `Payment created successfully: ID ${payment.id} for contract ${message.contractId}`,
      );

      this.logger.log({
        event: 'payment_created_from_billing',
        paymentId: payment.id,
        contractId: message.contractId,
        userId: message.userId,
        amount: message.amount,
        dueDate: message.dueDate,
        serviceType: message.serviceType,
      });
    } catch (error) {
      this.logger.error(
        `Error processing billing message for contract ${message.contractId}:`,
        error,
      );

      // Aqui você pode implementar lógica de retry ou dead letter queue
      throw error;
    }
  }

  // Método para processar mensagens em batch (se necessário)
  async processBillingMessages(messages: BillingMessage[]): Promise<void> {
    this.logger.log(`Processing ${messages.length} billing messages`);

    const results = await Promise.allSettled(
      messages.map((message) => this.processBillingMessage(message)),
    );

    const successful = results.filter(
      (result) => result.status === 'fulfilled',
    ).length;
    const failed = results.filter(
      (result) => result.status === 'rejected',
    ).length;

    this.logger.log(
      `Batch processing completed: ${successful} successful, ${failed} failed`,
    );

    if (failed > 0) {
      const errors = results
        .filter((result) => result.status === 'rejected')
        .map((result) => {
          if (result.status === 'rejected') {
            return result.reason;
          }
          return null;
        })
        .filter(Boolean);

      this.logger.error('Batch processing errors:', errors);
    }
  }
}
