/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contract, ContractStatus, ServiceType } from './contract.entity';
import { CreateContractDto } from './dto/create-contract.dto';
import { CreateContractFromPaymentDto } from './dto/create-contract-from-payment.dto';
import { UsersService } from '../users/users.service';
import { Plan } from 'src/products/plan.entity';

@Injectable()
export class ContractsService {
  constructor(
    @InjectRepository(Contract)
    private readonly contractRepository: Repository<Contract>,
    @InjectRepository(Plan)
    private readonly planRepository: Repository<Plan>,
    private readonly usersService: UsersService,
  ) {}

  async create(createContractDto: CreateContractDto): Promise<Contract> {
    const user = await this.usersService.findById(createContractDto.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const contract = this.contractRepository.create({
      ...createContractDto,
      user,
      startDate: new Date(createContractDto.startDate),
      endDate: createContractDto.endDate
        ? new Date(createContractDto.endDate)
        : undefined,
    });

    return this.contractRepository.save(contract);
  }

  async createFromPayment(
    createDto: CreateContractFromPaymentDto,
    paymentAmount: number,
    userId: number,
  ): Promise<Contract> {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found from payment');
    }

    const contract = this.contractRepository.create({
      user,
      name: createDto.name,
      description: createDto.description,
      value: paymentAmount,
      startDate: new Date(createDto.startDate),
      endDate: new Date(createDto.endDate),
      metadata: {
        ...createDto.metadata,
        paymentId: createDto.paymentId,
        createdFromPayment: true,
        originalAmount: paymentAmount,
      },
      status: ContractStatus.ACTIVE,
    });

    return this.contractRepository.save(contract);
  }

  async findAll(): Promise<Contract[]> {
    return this.contractRepository.find({
      relations: ['user'],
    });
  }

  async findById(id: number): Promise<Contract> {
    const contract = await this.contractRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    return contract;
  }

  async findByUserId(userId: number): Promise<Contract[]> {
    return this.contractRepository.find({
      where: { user: { id: userId } },
      relations: ['user'],
    });
  }

  async findByServiceType(serviceType: string): Promise<Contract[]> {
    return this.contractRepository.find({
      where: { serviceType: serviceType as any },
      relations: ['user'],
    });
  }

  async isActive(id: number): Promise<boolean> {
    const contract = await this.findById(id);
    const now = new Date();

    return (
      contract.status === ContractStatus.ACTIVE &&
      contract.startDate <= now &&
      contract.endDate >= now
    );
  }

  async getMetadata(id: number): Promise<any> {
    const contract = await this.findById(id);
    return contract.metadata || {};
  }

  async updateStatus(id: number, status: ContractStatus): Promise<Contract> {
    const contract = await this.findById(id);
    contract.status = status;
    return this.contractRepository.save(contract);
  }

  async updateMetadata(id: number, metadata: any): Promise<Contract> {
    const contract = await this.findById(id);
    contract.metadata = { ...contract.metadata, ...metadata };
    return this.contractRepository.save(contract);
  }

  async getContractWithLastPayment(id: number): Promise<Contract> {
    const contract = await this.contractRepository.findOne({
      where: { id },
      relations: ['user', 'lastPaidPayment', 'payments', 'invoices'],
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    return contract;
  }

  async getContractsWithPaymentInfo(userId?: number): Promise<Contract[]> {
    const queryBuilder = this.contractRepository
      .createQueryBuilder('contract')
      .leftJoinAndSelect('contract.user', 'user')
      .leftJoinAndSelect('contract.lastPaidPayment', 'lastPaidPayment')
      .leftJoinAndSelect('contract.payments', 'payments')
      .leftJoinAndSelect('contract.invoices', 'invoices');

    if (userId) {
      queryBuilder.andWhere('user.id = :userId', { userId });
    }

    return queryBuilder.getMany();
  }

  async updateLastPaidPayment(
    contractId: number,
    paymentId: number,
  ): Promise<void> {
    await this.contractRepository.update(contractId, {
      lastPaidPayment: { id: paymentId } as any,
    });
  }

  async createFromPlan(
    userId: number,
    planId: number,
    startDate?: Date,
    endDate?: Date,
    metadata?: any,
    status?: ContractStatus,
  ): Promise<Contract> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const planSelected = await this.planRepository.findOne({
      where: { id: planId },
    });

    if (!planSelected) {
      throw new NotFoundException('Plan not found');
    }

    const contract = this.contractRepository.create({
      user,
      plan: planSelected,
      name: `${planSelected.name} #${planId}`,
      description: planSelected.description,
      value: planSelected.price,
      startDate: startDate || new Date(),
      endDate,
      metadata: {
        ...metadata,
        createdFromPlan: true,
        planId,
      },
      status: status || ContractStatus.PENDING,
      serviceType: ServiceType.CLICAZAP,
    });

    return this.contractRepository.save(contract);
  }

  // ============================================
  // MÉTODOS PARA APLICAÇÕES CONECTADAS
  // ============================================

  async getConnectedApps(userId: number) {
    const contracts = await this.contractRepository.find({
      where: { user: { id: userId } },
      relations: ['plan', 'plan.product', 'payments', 'invoices'],
      order: { createdAt: 'DESC' },
    });

    return contracts.map((contract) => ({
      id: contract.id,
      name: contract.name,
      description: contract.description,
      status: contract.status,
      serviceType: contract.serviceType,
      value: contract.value,
      startDate: contract.startDate,
      endDate: contract.endDate,
      metadata: contract.metadata,
      plan: contract.plan,
      lastPayment: contract.lastPaidPayment,
      createdAt: contract.createdAt,
      updatedAt: contract.updatedAt,
    }));
  }

  async createFromPlanDto(createDto: any, userId: number): Promise<Contract> {
    return this.createFromPlan(
      userId,
      createDto.planId,
      createDto.startDate ? new Date(createDto.startDate) : undefined,
      createDto.endDate ? new Date(createDto.endDate) : undefined,
      createDto.metadata,
      createDto.status,
    );
  }

  async verifyContract(contractId: number) {
    const contract = await this.contractRepository.findOne({
      where: { id: contractId },
      relations: ['plan', 'plan.product', 'user'],
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    const isActive = contract.status === ContractStatus.ACTIVE;
    const isExpired = contract.endDate && new Date() > contract.endDate;

    return {
      id: contract.id,
      isValid: isActive && !isExpired,
      status: contract.status,
      user: {
        id: contract.user.id,
        email: contract.user.email,
        name: contract.user.name,
      },
      plan: contract.plan,
      expiresAt: contract.endDate,
      metadata: contract.metadata,
    };
  }

  async getContractFeatures(contractId: number) {
    const contract = await this.contractRepository.findOne({
      where: { id: contractId },
      relations: ['plan'],
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    return {
      contractId,
      features: contract.plan?.features || [],
      limits: contract.plan?.limits || {},
      metadata: contract.metadata || {},
    };
  }

  async getContractUsage(contractId: number) {
    const contract = await this.contractRepository.findOne({
      where: { id: contractId },
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    const usage = contract.metadata?.usage || {};
    const limits = contract.plan?.limits || {};

    return {
      contractId,
      limits,
      currentUsage: usage,
      percentUsed: this.calculateUsagePercentage(usage, limits),
    };
  }

  async updateUsage(contractId: number, usageData: any) {
    const contract = await this.contractRepository.findOne({
      where: { id: contractId },
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    const currentMetadata = contract.metadata || {};
    const currentUsage = currentMetadata.usage || {};

    const updatedUsage = {
      ...currentUsage,
      ...usageData,
      lastUpdated: new Date().toISOString(),
    };

    await this.contractRepository.update(contractId, {
      metadata: {
        ...currentMetadata,
        usage: updatedUsage,
      },
    });

    return {
      contractId,
      usage: updatedUsage,
    };
  }

  async upgradeContract(contractId: number, newPlanId: number, userId: number) {
    const contract = await this.contractRepository.findOne({
      where: { id: contractId, user: { id: userId } },
      relations: ['plan'],
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    await this.contractRepository.update(contractId, {
      plan: { id: newPlanId } as any,
      metadata: {
        ...contract.metadata,
        upgraded: true,
        previousPlanId: contract.plan?.id,
        upgradeDate: new Date().toISOString(),
      },
    });

    return this.findById(contractId);
  }

  async downgradeContract(
    contractId: number,
    newPlanId: number,
    userId: number,
  ) {
    const contract = await this.contractRepository.findOne({
      where: { id: contractId, user: { id: userId } },
      relations: ['plan'],
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    await this.contractRepository.update(contractId, {
      plan: { id: newPlanId } as any,
      metadata: {
        ...contract.metadata,
        downgraded: true,
        previousPlanId: contract.plan?.id,
        downgradeDate: new Date().toISOString(),
      },
    });

    return this.findById(contractId);
  }

  async cancelContract(contractId: number, reason: string, userId: number) {
    const contract = await this.contractRepository.findOne({
      where: { id: contractId, user: { id: userId } },
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    await this.contractRepository.update(contractId, {
      status: ContractStatus.INACTIVE,
      endDate: new Date(),
      metadata: {
        ...contract.metadata,
        cancelled: true,
        cancellationReason: reason,
        cancellationDate: new Date().toISOString(),
      },
    });

    return this.findById(contractId);
  }

  private calculateUsagePercentage(usage: any, limits: any): any {
    const percentages: any = {};

    Object.keys(limits).forEach((key) => {
      const limit = limits[key];
      const used = usage[key] || 0;

      if (typeof limit === 'number' && limit > 0) {
        percentages[key] = Math.min((used / limit) * 100, 100);
      }
    });

    return percentages;
  }
}
