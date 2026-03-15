/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentStatus } from './payment.entity';
import { Contract } from '../contracts/contract.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(Contract)
    private contractRepository: Repository<Contract>,
  ) {}

  async create(
    createPaymentDto: CreatePaymentDto,
    userId: number,
  ): Promise<Payment> {
    const contract = await this.contractRepository.findOne({
      where: { id: createPaymentDto.contractId },
      relations: ['user'],
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    if (contract.user.id !== userId) {
      throw new NotFoundException('Contract not found for this user');
    }

    const payment = this.paymentRepository.create({
      ...createPaymentDto,
      contract,
      user: contract.user,
      dueDate: new Date(createPaymentDto.dueDate),
    });

    return this.paymentRepository.save(payment);
  }

  async findAll(): Promise<Payment[]> {
    return this.paymentRepository.find({
      relations: ['user', 'contract'],
    });
  }

  async findById(id: number): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: ['user', 'contract'],
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  async findByContractId(contractId: number): Promise<Payment[]> {
    return this.paymentRepository.find({
      where: { contract: { id: contractId } },
      relations: ['user', 'contract'],
      order: { dueDate: 'DESC' },
    });
  }

  async findPendingByContractId(contractId: number): Promise<Payment[]> {
    return this.paymentRepository.find({
      where: {
        contract: { id: contractId },
        status: PaymentStatus.PENDING,
      },
      relations: ['user', 'contract'],
      order: { createdAt: 'ASC' }, // Mais antigo primeiro
    });
  }

  async findByUserId(userId: number): Promise<Payment[]> {
    return this.paymentRepository.find({
      where: { user: { id: userId } },
      relations: ['user', 'contract'],
      order: { dueDate: 'DESC' },
    });
  }

  async findPendingPayments(userId?: number): Promise<Payment[]> {
    const queryBuilder = this.paymentRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.user', 'user')
      .leftJoinAndSelect('payment.contract', 'contract')
      .where('payment.status = :status', { status: PaymentStatus.PENDING })
      .orderBy('payment.dueDate', 'ASC');

    if (userId) {
      queryBuilder.andWhere('user.id = :userId', { userId });
    }

    return queryBuilder.getMany();
  }

  async findOverduePayments(userId?: number): Promise<Payment[]> {
    const queryBuilder = this.paymentRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.user', 'user')
      .leftJoinAndSelect('payment.contract', 'contract')
      .where('payment.status = :status', { status: PaymentStatus.PENDING })
      .andWhere('payment.dueDate < :now', { now: new Date() })
      .orderBy('payment.dueDate', 'ASC');

    if (userId) {
      queryBuilder.andWhere('user.id = :userId', { userId });
    }

    return queryBuilder.getMany();
  }

  async getLastPaidPaymentByContract(
    contractId: number,
  ): Promise<Payment | null> {
    return this.paymentRepository.findOne({
      where: {
        contract: { id: contractId },
        status: PaymentStatus.PAID,
      },
      relations: ['user', 'contract'],
      order: { paidAt: 'DESC' },
    });
  }

  async getNextPendingPaymentByContract(
    contractId: number,
  ): Promise<Payment | null> {
    return this.paymentRepository.findOne({
      where: {
        contract: { id: contractId },
        status: PaymentStatus.PENDING,
      },
      relations: ['user', 'contract'],
      order: { dueDate: 'ASC' },
    });
  }

  async update(
    id: number,
    updatePaymentDto: UpdatePaymentDto,
  ): Promise<Payment> {
    const payment = await this.findById(id);

    Object.assign(payment, updatePaymentDto);

    if (updatePaymentDto.paidAt) {
      payment.paidAt = new Date(updatePaymentDto.paidAt);
    }

    // Se o pagamento foi marcado como pago, atualizar o último pagamento no contrato
    if (updatePaymentDto.status === PaymentStatus.PAID && !payment.paidAt) {
      payment.paidAt = new Date();
      await this.updateLastPaidPaymentInContract(payment.contract.id, payment);
    }

    return this.paymentRepository.save(payment);
  }

  async markAsPaid(id: number): Promise<Payment> {
    const payment = await this.findById(id);
    payment.status = PaymentStatus.PAID;
    payment.paidAt = new Date();

    await this.updateLastPaidPaymentInContract(payment.contract.id, payment);

    return this.paymentRepository.save(payment);
  }

  private async updateLastPaidPaymentInContract(
    contractId: number,
    payment: Payment,
  ): Promise<void> {
    await this.contractRepository.update(contractId, {
      lastPaidPayment: { id: payment.id } as any,
    });
  }

  async delete(id: number): Promise<void> {
    const payment = await this.findById(id);
    await this.paymentRepository.remove(payment);
  }

  async updateMetadata(id: number, metadata: any): Promise<Payment> {
    const payment = await this.findById(id);
    payment.metadata = { ...payment.metadata, ...metadata };
    return this.paymentRepository.save(payment);
  }

  async findByExternalId(externalId: string): Promise<Payment | null> {
    return this.paymentRepository.findOne({
      where: { externalId },
      relations: ['user', 'contract'],
    });
  }

  async generateBoleto(paymentId: number): Promise<Payment> {
    const payment = await this.findById(paymentId);

    // Aqui você integraria com um gateway de pagamento real
    // Por enquanto, vamos simular a geração do boleto
    payment.boletoUrl = `https://boleto.example.com/${paymentId}`;
    payment.boletoBarcode = `${paymentId}${Date.now()}`;

    return this.paymentRepository.save(payment);
  }

  async generatePix(paymentId: number): Promise<Payment> {
    const payment = await this.findById(paymentId);

    // Aqui você integraria com um gateway de pagamento real
    // Por enquanto, vamos simular a geração do PIX
    payment.pixQrCode = `PIX_QR_CODE_${paymentId}_${Date.now()}`;

    return this.paymentRepository.save(payment);
  }
}
