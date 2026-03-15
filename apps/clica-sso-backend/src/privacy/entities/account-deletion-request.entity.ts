import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/user.entity';

export enum DeletionStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('account_deletion_requests')
@Index(['userId'])
@Index(['status'])
export class AccountDeletionRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('integer')
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({
    type: 'enum',
    enum: DeletionStatus,
    default: DeletionStatus.PENDING,
  })
  status: DeletionStatus;

  @Column('text', { nullable: true })
  reason: string;

  @Column({ nullable: true })
  approvedAt: Date;

  @Column('uuid', { nullable: true })
  approvedBy: string;

  @Column({ nullable: true })
  scheduledDeletionAt: Date;

  @Column('text', { nullable: true })
  rejectionReason: string;

  @CreateDateColumn()
  requestedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
