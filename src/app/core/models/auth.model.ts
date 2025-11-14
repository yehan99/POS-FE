export interface TenantSummary {
  id: string;
  name: string;
  businessType: string;
  country: string;
  phone?: string;
  settings?: Record<string, any>;
}

export interface RoleSummary {
  id: string;
  name: string;
  slug: string;
}

export interface SiteSummary {
  id: string;
  name: string;
  code: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  phone?: string;
  avatar?: string;
  isActive: boolean;
  permissions: string[];
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
  tenant?: TenantSummary;
  role?: RoleSummary;
  site?: SiteSummary;
  status?: string;
  metadata?: Record<string, any>;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  refreshExpiresIn?: number;
}

export interface AuthResponse extends AuthTokens {
  user?: User;
}

export interface LoginRequest {
  email: string;
  password: string;
  deviceName?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  deviceName?: string;
  roleSlug?: string;
  tenant: {
    name: string;
    businessType: BusinessType;
    country: string;
    phone?: string;
    settings?: Record<string, any>;
  };
}

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  MANAGER = 'manager',
  CASHIER = 'cashier',
  VIEWER = 'viewer',
}

export enum Permission {
  // Product management
  PRODUCT_CREATE = 'product.create',
  PRODUCT_READ = 'product.read',
  PRODUCT_UPDATE = 'product.update',
  PRODUCT_DELETE = 'product.delete',

  // Sales
  SALE_CREATE = 'sale.create',
  SALE_READ = 'sale.read',
  SALE_REFUND = 'sale.refund',
  SALE_VOID = 'sale.void',

  // Inventory
  INVENTORY_CREATE = 'inventory.create',
  INVENTORY_READ = 'inventory.read',
  INVENTORY_UPDATE = 'inventory.update',
  INVENTORY_ADJUST = 'inventory.adjust',

  // Customers
  CUSTOMER_CREATE = 'customer.create',
  CUSTOMER_READ = 'customer.read',
  CUSTOMER_UPDATE = 'customer.update',
  CUSTOMER_DELETE = 'customer.delete',

  // Reports
  REPORT_SALES = 'report.sales',
  REPORT_INVENTORY = 'report.inventory',
  REPORT_CUSTOMERS = 'report.customers',
  REPORT_FINANCIAL = 'report.financial',

  // Settings
  SETTINGS_READ = 'settings.read',
  SETTINGS_UPDATE = 'settings.update',
  USER_MANAGEMENT = 'user.management',
}

export enum BusinessType {
  RETAIL = 'retail',
  RESTAURANT = 'restaurant',
  SALON = 'salon',
  GROCERY = 'grocery',
  PHARMACY = 'pharmacy',
  ELECTRONICS = 'electronics',
  CLOTHING = 'clothing',
  OTHER = 'other',
}
