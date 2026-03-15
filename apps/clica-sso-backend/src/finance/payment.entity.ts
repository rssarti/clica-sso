import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Contract } from '../contracts/contract.entity';

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
}

export enum PaymentMethod {
  BOLETO = 'boleto',
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  PIX = 'pix',
  BANK_TRANSFER = 'bank_transfer',
}

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user: User = new User();

  @ManyToOne(() => Contract, { eager: true })
  @JoinColumn({ name: 'contract_id' })
  contract: Contract = new Contract();

  @ManyToOne('Invoice', 'payments', { nullable: true })
  @JoinColumn({ name: 'invoice_id' })
  invoice: any;

  @Column('decimal', { precision: 10, scale: 2 })
  amount!: number;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
    default: PaymentMethod.BOLETO,
  })
  method: PaymentMethod = PaymentMethod.BOLETO;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus = PaymentStatus.PENDING;

  @Column({ type: 'date', name: 'due_date' })
  dueDate!: Date;

  @Column({ type: 'date', nullable: true, name: 'paid_at' })
  paidAt!: Date;

  @Column({ nullable: true, name: 'boleto_url' })
  boletoUrl!: string;

  @Column({ nullable: true, name: 'boleto_barcode' })
  boletoBarcode!: string;

  @Column({ nullable: true, name: 'pix_qr_code' })
  pixQrCode!: string;

  @Column({ nullable: true, name: 'external_id' })
  externalId!: string; // ID do gateway de pagamento

  @Column('text', { nullable: true })
  description!: string;

  @Column({ type: 'json', nullable: true })
  metadata: any;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
