/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { PaymentService } from '../finance/payment.service';
import { InvoiceService } from '../invoices/invoice.service';
import { ContractsService } from '../contracts/contracts.service';
import { PaymentStatus } from '../finance/payment.entity';

@Injectable()
export class BillingService {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly invoiceService: InvoiceService,
    private readonly contractsService: ContractsService,
  ) {}

  async getNextPaymentForContract(contractId: number) {
    const contract =
      await this.contractsService.getContractWithLastPayment(contractId);
    const nextPendingPayment =
      await this.paymentService.getNextPendingPaymentByContract(contractId);

    return {
      contract,
      lastPaidPayment: contract.lastPaidPayment,
      nextPendingPayment,
    };
  }

  async generateBoletoForNextPayment(contractId: number) {
    const nextPayment =
      await this.paymentService.getNextPendingPaymentByContract(contractId);

    if (!nextPayment) {
      throw new Error('No pending payment found for this contract');
    }

    return this.paymentService.generateBoleto(nextPayment.id);
  }

  async generatePixForNextPayment(contractId: number) {
    const nextPayment =
      await this.paymentService.getNextPendingPaymentByContract(contractId);

    if (!nextPayment) {
      throw new Error('No pending payment found for this contract');
    }

    return this.paymentService.generatePix(nextPayment.id);
  }

  async sendBoletoByEmail(contractId: number) {
    const nextPayment =
      await this.paymentService.getNextPendingPaymentByContract(contractId);

    if (!nextPayment) {
      throw new Error('No pending payment found for this contract');
    }

    // Gerar boleto se ainda não foi gerado
    if (!nextPayment.boletoUrl) {
      await this.paymentService.generateBoleto(nextPayment.id);
    }

    // Aqui você integraria com um serviço de email real
    // Por enquanto, vamos simular o envio
    const emailData = {
      to: nextPayment.user.email,
      subject: `Boleto - ${nextPayment.contract.name}`,
      template: 'boleto',
      data: {
        userName: nextPayment.user.name,
        contractName: nextPayment.contract.name,
        amount: nextPayment.amount,
        dueDate: nextPayment.dueDate,
        boletoUrl: nextPayment.boletoUrl,
        boletoBarcode: nextPayment.boletoBarcode,
      },
    };

    console.log('Sending boleto email:', emailData);

    return {
      message: 'Boleto sent by email successfully',
      payment: nextPayment,
      emailSent: true,
    };
  }

  async getContractPaymentSummary(contractId: number) {
    const contract =
      await this.contractsService.getContractWithLastPayment(contractId);
    const allPayments = await this.paymentService.findByContractId(contractId);
    const pendingPayments = allPayments.filter(
      (p) => p.status === PaymentStatus.PENDING,
    );
    const paidPayments = allPayments.filter(
      (p) => p.status === PaymentStatus.PAID,
    );
    const overduePayments = allPayments.filter(
      (p) =>
        p.status === PaymentStatus.PENDING && new Date(p.dueDate) < new Date(),
    );

    return {
      contract,
      summary: {
        totalPayments: allPayments.length,
        paidPayments: paidPayments.length,
        pendingPayments: pendingPayments.length,
        overduePayments: overduePayments.length,
        totalPaid: paidPayments.reduce((sum, p) => sum + Number(p.amount), 0),
        totalPending: pendingPayments.reduce(
          (sum, p) => sum + Number(p.amount),
          0,
        ),
      },
      lastPaidPayment: contract.lastPaidPayment,
      nextPendingPayment:
        pendingPayments.sort(
          (a, b) =>
            new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
        )[0] || null,
    };
  }

  async processAutomaticBilling() {
    // Método para processar cobrança automática (pode ser chamado por um cron job)
    console.log('Processing automatic billing...');

    // Atualizar faturas em atraso
    await this.invoiceService.updateOverdueInvoices();

    // Aqui você pode adicionar lógica para:
    // - Gerar faturas mensais automáticas
    // - Enviar lembretes de vencimento
    // - Marcar contratos como suspensos por falta de pagamento

    return { message: 'Automatic billing processed successfully' };
  }
}
