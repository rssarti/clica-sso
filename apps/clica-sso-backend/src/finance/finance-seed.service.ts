/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Payment,
  PaymentMethod,
  PaymentStatus,
} from '../finance/payment.entity';
import { Invoice, InvoiceStatus } from '../invoices/invoice.entity';
import { Contract } from '../contracts/contract.entity';
import { User } from '../users/user.entity';

@Injectable()
export class FinanceSeedService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
    @InjectRepository(Contract)
    private contractRepository: Repository<Contract>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async seedFinanceData() {
    console.log('🌱 Seeding finance data...');

    const contracts = await this.contractRepository.find({
      relations: ['user'],
    });

    if (contracts.length === 0) {
      console.log('No contracts found. Please seed contracts first.');
      return;
    }

    // Criar pagamentos para cada contrato
    for (const contract of contracts) {
      // Criar alguns pagamentos pagos (histórico)
      const paidPayments = await this.createPaidPayments(contract);

      // Criar alguns pagamentos pendentes
      await this.createPendingPayments(contract);

      // Atualizar o último pagamento do contrato
      if (paidPayments.length > 0) {
        const lastPaid = paidPayments[paidPayments.length - 1];
        await this.contractRepository.update(contract.id, {
          lastPaidPayment: { id: lastPaid.id } as any,
        });
      }

      // Criar faturas
      await this.createInvoices(contract);
    }

    console.log('✅ Finance data seeded successfully!');
  }

  private async createPaidPayments(contract: Contract): Promise<Payment[]> {
    const payments: Payment[] = [];
    const currentDate = new Date();

    // Criar 6 pagamentos pagos nos últimos 6 meses
    for (let i = 6; i >= 1; i--) {
      const dueDate = new Date(currentDate);
      dueDate.setMonth(currentDate.getMonth() - i);
      dueDate.setDate(10); // Vencimento dia 10

      const paidDate = new Date(dueDate);
      paidDate.setDate(dueDate.getDate() - Math.floor(Math.random() * 5)); // Pago 0-4 dias antes

      const payment = this.paymentRepository.create({
        contract,
        user: contract.user,
        amount: contract.value,
        method: PaymentMethod.BOLETO,
        status: PaymentStatus.PAID,
        dueDate,
        paidAt: paidDate,
        description: `Pagamento mensal - ${dueDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}`,
        boletoUrl: `https://boleto.example.com/${Date.now()}_${i}`,
        boletoBarcode: `${Date.now()}${i}`.padStart(20, '0'),
      });

      const savedPayment = await this.paymentRepository.save(payment);
      payments.push(savedPayment);
    }

    return payments;
  }

  private async createPendingPayments(contract: Contract): Promise<Payment[]> {
    const payments: Payment[] = [];
    const currentDate = new Date();

    // Criar 3 pagamentos pendentes (este mês e próximos 2 meses)
    for (let i = 0; i < 3; i++) {
      const dueDate = new Date(currentDate);
      dueDate.setMonth(currentDate.getMonth() + i);
      dueDate.setDate(10); // Vencimento dia 10

      const status =
        i === 0 && dueDate < currentDate
          ? PaymentStatus.OVERDUE
          : PaymentStatus.PENDING;

      const payment = this.paymentRepository.create({
        contract,
        user: contract.user,
        amount: contract.value,
        method: PaymentMethod.BOLETO,
        status,
        dueDate,
        description: `Pagamento mensal - ${dueDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}`,
      });

      const savedPayment = await this.paymentRepository.save(payment);
      payments.push(savedPayment);
    }

    return payments;
  }

  private async createInvoices(contract: Contract): Promise<Invoice[]> {
    const invoices: Invoice[] = [];
    const currentDate = new Date();

    // Criar 3 faturas (2 pagas e 1 pendente)
    for (let i = 2; i >= 0; i--) {
      const dueDate = new Date(currentDate);
      dueDate.setMonth(currentDate.getMonth() - i);
      dueDate.setDate(10);

      const status = i === 0 ? InvoiceStatus.ISSUED : InvoiceStatus.PAID;

      const paidAt =
        status === InvoiceStatus.PAID
          ? new Date(
              dueDate.getTime() - Math.random() * 5 * 24 * 60 * 60 * 1000,
            )
          : null;

      const invoice = this.invoiceRepository.create({
        contract,
        user: contract.user,
        value: contract.value,
        status,
        dueDate,
        paidAt: paidAt || undefined,
        description: `Fatura mensal - ${contract.name}`,
        items: [
          {
            description: contract.name,
            value: contract.value,
            quantity: 1,
            period: dueDate.toLocaleString('pt-BR', {
              month: 'long',
              year: 'numeric',
            }),
          },
        ],
      });

      const savedInvoice = await this.invoiceRepository.save(invoice);
      invoices.push(savedInvoice);
    }

    return invoices;
  }

  async clearFinanceData() {
    console.log('🗑️ Clearing finance data...');

    await this.paymentRepository.delete({});
    await this.invoiceRepository.delete({});

    // Limpar referências de lastPaidPayment nos contratos
    await this.contractRepository.update({}, { lastPaidPayment: undefined });

    console.log('✅ Finance data cleared!');
  }
}
