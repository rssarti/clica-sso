import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice, InvoiceStatus } from './invoice.entity';
import { Contract } from '../contracts/contract.entity';
import { CreateInvoiceDto, UpdateInvoiceDto } from './dto/invoice.dto';

@Injectable()
export class InvoiceService {
  constructor(
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
    @InjectRepository(Contract)
    private contractRepository: Repository<Contract>,
  ) {}

  async create(
    createInvoiceDto: CreateInvoiceDto,
    userId: number,
  ): Promise<Invoice> {
    const contract = await this.contractRepository.findOne({
      where: { id: createInvoiceDto.contractId },
      relations: ['user'],
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    if (contract.user.id !== userId) {
      throw new NotFoundException('Contract not found for this user');
    }

    const invoice = this.invoiceRepository.create({
      ...createInvoiceDto,
      contract,
      user: contract.user,
      dueDate: new Date(createInvoiceDto.dueDate),
      status: InvoiceStatus.ISSUED,
    });

    return this.invoiceRepository.save(invoice);
  }

  async findAll(): Promise<Invoice[]> {
    return this.invoiceRepository.find({
      relations: ['user', 'contract', 'payments'],
    });
  }

  async findById(id: number): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id },
      relations: ['user', 'contract', 'payments'],
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }

  async findByContractId(contractId: number): Promise<Invoice[]> {
    return this.invoiceRepository.find({
      where: { contract: { id: contractId } },
      relations: ['user', 'contract', 'payments'],
      order: { issuedAt: 'DESC' },
    });
  }

  async findByUserId(userId: number): Promise<Invoice[]> {
    return this.invoiceRepository.find({
      where: { user: { id: userId } },
      relations: ['user', 'contract', 'payments'],
      order: { issuedAt: 'DESC' },
    });
  }

  async findPendingInvoices(userId?: number): Promise<Invoice[]> {
    const queryBuilder = this.invoiceRepository
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.user', 'user')
      .leftJoinAndSelect('invoice.contract', 'contract')
      .leftJoinAndSelect('invoice.payments', 'payments')
      .where('invoice.status IN (:...statuses)', {
        statuses: [InvoiceStatus.ISSUED, InvoiceStatus.OVERDUE],
      })
      .orderBy('invoice.dueDate', 'ASC');

    if (userId) {
      queryBuilder.andWhere('user.id = :userId', { userId });
    }

    return queryBuilder.getMany();
  }

  async findOverdueInvoices(userId?: number): Promise<Invoice[]> {
    const queryBuilder = this.invoiceRepository
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.user', 'user')
      .leftJoinAndSelect('invoice.contract', 'contract')
      .leftJoinAndSelect('invoice.payments', 'payments')
      .where('invoice.dueDate < :now', { now: new Date() })
      .andWhere('invoice.status != :paidStatus', {
        paidStatus: InvoiceStatus.PAID,
      })
      .orderBy('invoice.dueDate', 'ASC');

    if (userId) {
      queryBuilder.andWhere('user.id = :userId', { userId });
    }

    return queryBuilder.getMany();
  }

  async update(
    id: number,
    updateInvoiceDto: UpdateInvoiceDto,
  ): Promise<Invoice> {
    const invoice = await this.findById(id);

    Object.assign(invoice, updateInvoiceDto);

    if (updateInvoiceDto.paidAt) {
      invoice.paidAt = new Date(updateInvoiceDto.paidAt);
    }

    return this.invoiceRepository.save(invoice);
  }

  async markAsPaid(id: number): Promise<Invoice> {
    const invoice = await this.findById(id);
    invoice.status = InvoiceStatus.PAID;
    invoice.paidAt = new Date();

    return this.invoiceRepository.save(invoice);
  }

  async markAsOverdue(id: number): Promise<Invoice> {
    const invoice = await this.findById(id);
    invoice.status = InvoiceStatus.OVERDUE;

    return this.invoiceRepository.save(invoice);
  }

  async cancel(id: number): Promise<Invoice> {
    const invoice = await this.findById(id);
    invoice.status = InvoiceStatus.CANCELLED;

    return this.invoiceRepository.save(invoice);
  }

  async delete(id: number): Promise<void> {
    const invoice = await this.findById(id);
    await this.invoiceRepository.remove(invoice);
  }

  // Método para criar fatura automática baseada no contrato
  async createMonthlyInvoiceForContract(contractId: number): Promise<Invoice> {
    const contract = await this.contractRepository.findOne({
      where: { id: contractId },
      relations: ['user'],
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    const now = new Date();
    const dueDate = new Date(now.getFullYear(), now.getMonth() + 1, 10); // Vencimento dia 10 do próximo mês

    const invoice = this.invoiceRepository.create({
      contract,
      user: contract.user,
      value: contract.value,
      dueDate,
      description: `Fatura mensal - ${contract.name}`,
      status: InvoiceStatus.ISSUED,
      items: [
        {
          description: contract.name,
          value: contract.value,
          quantity: 1,
        },
      ],
    });

    return this.invoiceRepository.save(invoice);
  }

  // Método para verificar faturas em atraso e atualizar status
  async updateOverdueInvoices(): Promise<void> {
    const overdueInvoices = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .where('invoice.dueDate < :now', { now: new Date() })
      .andWhere('invoice.status = :status', { status: InvoiceStatus.ISSUED })
      .getMany();

    for (const invoice of overdueInvoices) {
      invoice.status = InvoiceStatus.OVERDUE;
      await this.invoiceRepository.save(invoice);
    }
  }
}
