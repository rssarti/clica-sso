import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

export enum ContractStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  EXPIRED = 'expired',
}

export enum ServiceType {
  CLICAZAP = 'clicazap',
  CUSTOM = 'custom',
}

@Entity('contracts')
export class Contract {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne('Plan', 'contracts', { nullable: true })
  @JoinColumn({ name: 'plan_id' })
  plan: any;

  @Column()
  name: string;

  @Column('text', { nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ContractStatus,
    default: ContractStatus.PENDING,
  })
  status: ContractStatus;

  @Column({
    type: 'enum',
    enum: ServiceType,
    name: 'service_type',
  })
  serviceType: ServiceType;

  @Column('decimal', { precision: 10, scale: 2 })
  value: number;

  @Column({ type: 'date', name: 'start_date' })
  startDate: Date;

  @Column({ type: 'date', nullable: true, name: 'end_date' })
  endDate: Date;

  @Column({ type: 'json', nullable: true })
  metadata: any;

  @OneToMany('Payment', 'contract')
  payments: any[];

  @OneToMany('Invoice', 'contract')
  invoices: any[];

  @OneToOne('Payment', { nullable: true })
  @JoinColumn({ name: 'last_paid_payment_id' })
  lastPaidPayment: any; // Último pagamento liquidado

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
