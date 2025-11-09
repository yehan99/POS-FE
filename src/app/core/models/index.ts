// Auth models
export * from './auth.model';

// Product models
export * from './product.model';

// Sale models
export * from './sale.model';

// Import types for internal use
import { User } from './auth.model';
import { TaxClass } from './product.model';

// Common interfaces
export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  statusCode?: number;
}

export interface NotificationConfig {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  label: string;
  action: () => void;
  style?: 'primary' | 'secondary';
}

export interface AppState {
  isLoading: boolean;
  currentUser: User | null;
  isAuthenticated: boolean;
  currentTenant: Tenant | null;
}

export interface Tenant {
  id: string;
  name: string;
  businessType: string;
  settings: TenantSettings;
  subscription: Subscription;
  isActive: boolean;
  createdAt: Date;
}

export interface TenantSettings {
  currency: string;
  timezone: string;
  language: string;
  taxSettings: TaxSettings;
  receiptSettings: ReceiptSettings;
  loyaltySettings: LoyaltySettings;
}

export interface TaxSettings {
  defaultTaxRate: number;
  taxInclusive: boolean;
  taxClasses: TaxClass[];
}

export interface ReceiptSettings {
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  logoUrl?: string;
  footerText?: string;
  showTaxDetails: boolean;
}

export interface LoyaltySettings {
  enabled: boolean;
  pointsPerAmount: number;
  rewardAmount: number;
  pointsValue: number;
}

export interface Subscription {
  id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  trialEndsAt?: Date;
}

export enum SubscriptionPlan {
  BASIC = 'basic',
  STANDARD = 'standard',
  PREMIUM = 'premium',
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  CANCELLED = 'cancelled',
  PAST_DUE = 'past_due',
  TRIAL = 'trial',
}
