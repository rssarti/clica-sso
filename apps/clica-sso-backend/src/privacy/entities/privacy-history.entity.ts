import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/user.entity';

export enum PrivacyAction {
  SETTINGS_CHANGED = 'settings_changed',
  DATA_EXPORTED = 'data_exported',
  DELETION_REQUESTED = 'deletion_requested',
  DELETION_CANCELLED = 'deletion_cancelled',
  PRIVACY_UPDATED = 'privacy_updated',
  ACCOUNT_ACCESSED = 'account_accessed',
  PASSWORD_CHANGED = 'password_changed',
  LOGIN_SUCCESSFUL = 'login_successful',
  LOGIN_FAILED = 'login_failed',
  LOGOUT = 'logout',
}

@Entity('privacy_history')
@Index(['userId', 'timestamp'])
@Index(['action'])
export class PrivacyHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('integer')
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({
    type: 'enum',
    enum: PrivacyAction,
  })
  action: PrivacyAction;

  @Column('text')
  description: string;

  @Column('jsonb', { nullable: true })
  metadata: Record<string, any>;

  @Column({ length: 45, nullable: true })
  ipAddress: string;

  @Column('text', { nullable: true })
  userAgent: string;

  @CreateDateColumn()
  timestamp: Date;
}
