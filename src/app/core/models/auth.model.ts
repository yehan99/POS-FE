export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  tenantId: string;
  avatar?: string;
  isActive: boolean;
  permissions: Permission[];
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  tenantId?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  businessName: string;
  businessType: BusinessType;
  country: string;
  phone?: string;
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
