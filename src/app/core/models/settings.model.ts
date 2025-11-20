export type DigestFrequency = 'daily' | 'weekly' | 'monthly';

export interface GeneralSettings {
  businessName: string;
  businessEmail: string;
  businessPhone?: string;
  timezone: string;
  currency: string;
  locale: string;
  invoicePrefix: string;
  invoiceStartNumber: number;
  defaultSiteId?: string | null;
  taxRate: number;
}

export interface NotificationSettings {
  sendDailySummary: boolean;
  lowStockAlerts: boolean;
  newOrderAlerts: boolean;
  digestFrequency: DigestFrequency;
  escalationEmail?: string;
}

export interface SettingsState {
  general: GeneralSettings;
  notifications: NotificationSettings;
  updatedAt?: string;
}
