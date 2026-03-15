export interface PrivacySettings {
  id: string;
  userId: string;
  dataProcessing: {
    analytics: boolean;
    marketing: boolean;
    personalization: boolean;
    thirdPartySharing: boolean;
  };
  communications: {
    emailMarketing: boolean;
    smsMarketing: boolean;
    pushNotifications: boolean;
    newsletter: boolean;
    productUpdates: boolean;
    securityAlerts: boolean;
  };
  visibility: {
    profilePublic: boolean;
    showEmail: boolean;
    showPhone: boolean;
    showAddress: boolean;
    activityVisible: boolean;
  };
  dataRetention: {
    keepLoginHistory: boolean;
    keepActivityLogs: boolean;
    autoDeleteAfterInactivity: boolean;
    inactivityPeriodDays: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PrivacyHistoryEntry {
  id: string;
  userId: string;
  action: 'SETTINGS_CHANGED' | 'DATA_EXPORTED' | 'DELETION_REQUESTED' | 'DELETION_CANCELLED' | 'PRIVACY_UPDATED' | 'ACCOUNT_ACCESSED' | 'PASSWORD_CHANGED' | 'LOGIN_SUCCESSFUL' | 'LOGIN_FAILED' | 'LOGOUT';
  description: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

export interface DataExportRequest {
  id: string;
  userId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'expired';
  requestedAt: string;
  completedAt?: string;
  downloadUrl?: string;
  filePath?: string;
  dataTypes: string[];
}

export interface AccountDeletionRequest {
  id: string;
  userId: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
  reason?: string;
  requestedAt: string;
  approvedAt?: string;
  approvedBy?: string;
  scheduledDeletionAt?: string;
  rejectionReason?: string;
  updatedAt: string;
}

export interface UpdatePrivacySettingsDto {
  communicationSettings?: {
    email?: boolean;
    sms?: boolean;
    push?: boolean;
    marketing?: boolean;
    securityAlerts?: boolean;
  };
  dataSharingSettings?: {
    partners?: boolean;
    analytics?: boolean;
    productImprovement?: boolean;
    personalization?: boolean;
  };
  cookieSettings?: {
    necessary?: boolean;
    analytics?: boolean;
    marketing?: boolean;
    functional?: boolean;
  };
  visibilitySettings?: {
    profilePublic?: boolean;
    showEmail?: boolean;
    showPhone?: boolean;
    showAddress?: boolean;
    activityVisible?: boolean;
  };
}
