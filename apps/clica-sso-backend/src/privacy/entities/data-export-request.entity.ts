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

export enum ExportStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  EXPIRED = 'expired',
}

@Entity('data_export_requests')
@Index(['userId'])
@Index(['status'])
export class DataExportRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('integer')
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({
    type: 'enum',
    enum: ExportStatus,
    default: ExportStatus.PENDING,
  })
  status: ExportStatus;

  @Column('simple-array')
  dataTypes: string[];

  @Column({ nullable: true })
  downloadUrl: string;

  @Column({ nullable: true })
  filePath: string;

  @Column({ nullable: true })
  completedAt: Date;

  @Column({ nullable: true })
  expiresAt: Date;

  @Column('text', { nullable: true })
  errorMessage: string;

  @CreateDateColumn()
  requestedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
