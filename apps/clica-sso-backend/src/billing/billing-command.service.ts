import { Injectable, Logger, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contract, ContractStatus } from '../contracts/contract.entity';
import { RabbitMQService, BillingMessage } from '../shared/rabbitmq.service';

interface ContractToBill {
  id: number;
  user_id: number;
  user_email: string;
  user_name: string;
  value: string;
  service_type: string;
  name: string;
}

@Injectable()
export class BillingCommandService {
  private readonly logger = new Logger(BillingCommandService.name);

  constructor(
    @InjectRepository(Contract)
    private contractRepository: Repository<Contract>,
    @Optional() private rabbitMQService?: RabbitMQService,
  ) {}

  async processMonthlyBilling(): Promise<void> {
    this.logger.log('Starting monthly billing process...');

    try {
      // Buscar contratos ativos que precisam ser cobrados
      const contractsToCharge = await this.getContractsToCharge();

      this.logger.log(`Found ${contractsToCharge.length} contracts to charge`);

      // Processar cada contrato
      for (const contract of contractsToCharge) {
        await this.processContractBilling(contract);
      }

      this.logger.log('Monthly billing process completed successfully');
    } catch (error) {
      this.logger.error('Error in monthly billing process:', error);
      throw error;
    }
  }

  private async getContractsToCharge(): Promise<ContractToBill[]> {
    const query = `
      SELECT c.*, u.name as user_name, u.email as user_email
      FROM contracts c
      INNER JOIN users u ON c.user_id = u.id
      LEFT JOIN payments p_current ON p_current.contract_id = c.id 
        AND EXTRACT(YEAR FROM p_current.due_date) = EXTRACT(YEAR FROM CURRENT_DATE)
        AND EXTRACT(MONTH FROM p_current.due_date) = EXTRACT(MONTH FROM CURRENT_DATE)
        AND p_current.status IN ('paid', 'pending')
      LEFT JOIN payments p_pending ON p_pending.contract_id = c.id
        AND p_pending.status = 'pending'
        AND p_pending.due_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '30 days')
      WHERE c.status = $1
        AND (c.end_date IS NULL OR c.end_date >= CURRENT_DATE)
        AND p_current.id IS NULL
        AND p_pending.id IS NULL
      ORDER BY c.id
    `;

    return this.contractRepository.query(query, [ContractStatus.ACTIVE]);
  }

  private async processContractBilling(
    contract: ContractToBill,
  ): Promise<void> {
    try {
      const dueDate = this.calculateDueDate();

      const billingMessage: BillingMessage = {
        contractId: contract.id,
        userId: contract.user_id,
        userName: contract.user_name,
        userEmail: contract.user_email,
        amount: parseFloat(contract.value),
        dueDate: dueDate.toISOString().split('T')[0],
        serviceType: contract.service_type,
        contractName: contract.name,
      };

      if (this.rabbitMQService) {
        await this.rabbitMQService.publishToBillingQueue(billingMessage);
        this.logger.log(
          `Billing message sent for contract ${contract.id} - User ${contract.user_id} - Amount: ${contract.value}`,
        );
      } else {
        this.logger.warn(
          `RabbitMQ not available - skipping message for contract ${contract.id}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Error processing billing for contract ${contract.id}:`,
        error,
      );
      // Não interrompe o processo para outros contratos
    }
  }

  private calculateDueDate(): Date {
    const now = new Date();
    const dueDay = 10; // Vencimento sempre no dia 10

    // Se estamos antes do dia 10, vencimento é dia 10 do mês atual
    // Se estamos após o dia 10, vencimento é dia 10 do próximo mês
    let dueMonth = now.getMonth();
    let dueYear = now.getFullYear();

    if (now.getDate() >= dueDay) {
      dueMonth += 1;
      if (dueMonth > 11) {
        dueMonth = 0;
        dueYear += 1;
      }
    }

    return new Date(dueYear, dueMonth, dueDay);
  }

  // Método para execução manual com filtros específicos
  async processSpecificContract(contractId: number): Promise<void> {
    this.logger.log(`Processing billing for specific contract: ${contractId}`);

    try {
      const contract = await this.contractRepository.findOne({
        where: { id: contractId },
        relations: ['user'],
      });

      if (!contract) {
        throw new Error(`Contract ${contractId} not found`);
      }

      if (contract.status !== ContractStatus.ACTIVE) {
        throw new Error(
          `Contract ${contractId} is not active (status: ${contract.status})`,
        );
      }

      // Converter para o formato esperado
      const contractToBill: ContractToBill = {
        id: contract.id,
        user_id: contract.user.id,
        user_email: contract.user.email,
        user_name: contract.user.name,
        value: contract.value.toString(),
        service_type: contract.serviceType,
        name: contract.name,
      };

      await this.processContractBilling(contractToBill);

      this.logger.log(
        `Billing processed successfully for contract ${contractId}`,
      );
    } catch (error) {
      this.logger.error(
        `Error processing billing for contract ${contractId}:`,
        error,
      );
      throw error;
    }
  }
}
