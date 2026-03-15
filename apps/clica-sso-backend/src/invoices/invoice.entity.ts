/* eslint-disable @typescript-eslint/no-unsafe-return */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Contract } from '../contracts/contract.entity';
import { Payment } from '../finance/payment.entity';

export enum InvoiceStatus {
  DRAFT = 'draft',
  ISSUED = 'issued',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
}

@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Contract, { eager: true })
  @JoinColumn({ name: 'contract_id' })
  contract: Contract;

  @OneToMany(() => Payment, (payment) => payment.invoice, { cascade: true })
  payments: Payment[];

  @Column('decimal', { precision: 10, scale: 2 })
  value: number;

  @Column({
    type: 'enum',
    enum: InvoiceStatus,
    default: InvoiceStatus.DRAFT,
  })
  status: InvoiceStatus;

  @Column({ type: 'date', name: 'due_date' })
  dueDate: Date;

  @Column({ type: 'date', nullable: true, name: 'paid_at' })
  paidAt: Date;

  @Column('text', { nullable: true })
  description: string;

  @Column({ type: 'json', nullable: true })
  items: any[]; // Itens da fatura

  @Column({ type: 'json', nullable: true })
  metadata: any;

  @CreateDateColumn({ name: 'issued_at' })
  issuedAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
