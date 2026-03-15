import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/user.entity';

@Entity('privacy_settings')
@Index(['userId'], { unique: true })
export class PrivacySettings {
  @PrimaryGeneratedColumn()
  id: string;

  @Column('integer')
  userId: number;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  // Processamento de Dados
  @Column('jsonb', {
    default: {
      analytics: true,
      marketing: false,
      personalization: true,
      thirdPartySharing: false,
    },
  })
  dataProcessing: {
    analytics: boolean;
    marketing: boolean;
    personalization: boolean;
    thirdPartySharing: boolean;
  };

  // Comunicações
  @Column('jsonb', {
    default: {
      emailMarketing: false,
      smsMarketing: false,
      pushNotifications: true,
      newsletter: true,
      productUpdates: true,
      securityAlerts: true,
    },
  })
  communications: {
    emailMarketing: boolean;
    smsMarketing: boolean;
    pushNotifications: boolean;
    newsletter: boolean;
    productUpdates: boolean;
    securityAlerts: boolean;
  };

  // Visibilidade
  @Column('jsonb', {
    default: {
      profilePublic: false,
      showEmail: false,
      showPhone: false,
      showAddress: false,
      activityVisible: false,
    },
  })
  visibility: {
    profilePublic: boolean;
    showEmail: boolean;
    showPhone: boolean;
    showAddress: boolean;
    activityVisible: boolean;
  };

  // Retenção de Dados
  @Column('jsonb', {
    default: {
      keepLoginHistory: true,
      keepActivityLogs: true,
      autoDeleteAfterInactivity: false,
      inactivityPeriodDays: 365,
    },
  })
  dataRetention: {
    keepLoginHistory: boolean;
    keepActivityLogs: boolean;
    autoDeleteAfterInactivity: boolean;
    inactivityPeriodDays: number;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
