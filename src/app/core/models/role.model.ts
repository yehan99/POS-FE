// Role and Permission Management Models

// Permission actions
export enum PermissionAction {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  EXPORT = 'EXPORT',
  IMPORT = 'IMPORT',
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
}

// Permission resources/modules
export enum PermissionResource {
  DASHBOARD = 'DASHBOARD',
  POS = 'POS',
  PRODUCTS = 'PRODUCTS',
  CATEGORIES = 'CATEGORIES',
  INVENTORY = 'INVENTORY',
  CUSTOMERS = 'CUSTOMERS',
  SUPPLIERS = 'SUPPLIERS',
  ORDERS = 'ORDERS',
  SALES = 'SALES',
  PURCHASES = 'PURCHASES',
  REPORTS = 'REPORTS',
  USERS = 'USERS',
  ROLES = 'ROLES',
  SETTINGS = 'SETTINGS',
  HARDWARE = 'HARDWARE',
  PAYMENTS = 'PAYMENTS',
  DISCOUNTS = 'DISCOUNTS',
  TAXES = 'TAXES',
  BRANCHES = 'BRANCHES',
  AUDIT_LOG = 'AUDIT_LOG',
}

// Permission structure
export interface Permission {
  id: string;
  resource: PermissionResource;
  action: PermissionAction;
  description: string;
  category: PermissionCategory;
}

// Permission categories for UI grouping
export enum PermissionCategory {
  SALES = 'SALES',
  INVENTORY = 'INVENTORY',
  CUSTOMERS = 'CUSTOMERS',
  REPORTS = 'REPORTS',
  ADMINISTRATION = 'ADMINISTRATION',
  SETTINGS = 'SETTINGS',
}

// Role structure
export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[]; // Permission IDs
  isSystemRole: boolean; // Cannot be deleted
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  color?: string; // For UI identification
  priority: number; // Higher priority = more access (for hierarchy)
}

// User-Role assignment
export interface UserRole {
  userId: string;
  userName: string;
  userEmail: string;
  roleIds: string[];
  assignedAt: Date;
  assignedBy: string;
}

// Role statistics
export interface RoleStatistics {
  roleId: string;
  roleName: string;
  userCount: number;
  permissionCount: number;
  lastUsed?: Date;
}

// Permission check result
export interface PermissionCheckResult {
  hasPermission: boolean;
  reason?: string;
  requiredRole?: string;
}

// Permission group for UI
export interface PermissionGroup {
  category: PermissionCategory;
  categoryLabel: string;
  permissions: Permission[];
}

// Role template (for quick role creation)
export interface RoleTemplate {
  name: string;
  description: string;
  permissions: string[];
  color: string;
  priority: number;
}

// Predefined system roles
export const SYSTEM_ROLES = {
  SUPER_ADMIN: 'super-admin',
  ADMIN: 'admin',
  MANAGER: 'manager',
  CASHIER: 'cashier',
  SALES_PERSON: 'sales-person',
  INVENTORY_MANAGER: 'inventory-manager',
  ACCOUNTANT: 'accountant',
  VIEWER: 'viewer',
};

// Default role templates
export const DEFAULT_ROLE_TEMPLATES: RoleTemplate[] = [
  {
    name: 'Super Administrator',
    description: 'Full system access with all permissions',
    permissions: [], // Will be populated with all permissions
    color: '#d32f2f',
    priority: 100,
  },
  {
    name: 'Administrator',
    description: 'Administrative access except system settings',
    permissions: [
      'DASHBOARD-READ',
      'POS-CREATE',
      'POS-READ',
      'PRODUCTS-CREATE',
      'PRODUCTS-READ',
      'PRODUCTS-UPDATE',
      'PRODUCTS-DELETE',
      'INVENTORY-CREATE',
      'INVENTORY-READ',
      'INVENTORY-UPDATE',
      'CUSTOMERS-CREATE',
      'CUSTOMERS-READ',
      'CUSTOMERS-UPDATE',
      'CUSTOMERS-DELETE',
      'ORDERS-READ',
      'SALES-READ',
      'REPORTS-READ',
      'REPORTS-EXPORT',
      'USERS-CREATE',
      'USERS-READ',
      'USERS-UPDATE',
      'ROLES-READ',
      'HARDWARE-READ',
    ],
    color: '#f57c00',
    priority: 90,
  },
  {
    name: 'Store Manager',
    description: 'Manage store operations, inventory, and staff',
    permissions: [
      'DASHBOARD-READ',
      'POS-CREATE',
      'POS-READ',
      'PRODUCTS-CREATE',
      'PRODUCTS-READ',
      'PRODUCTS-UPDATE',
      'INVENTORY-CREATE',
      'INVENTORY-READ',
      'INVENTORY-UPDATE',
      'CUSTOMERS-CREATE',
      'CUSTOMERS-READ',
      'CUSTOMERS-UPDATE',
      'ORDERS-READ',
      'SALES-READ',
      'REPORTS-READ',
      'USERS-READ',
      'HARDWARE-READ',
    ],
    color: '#1976d2',
    priority: 70,
  },
  {
    name: 'Cashier',
    description: 'Process sales and handle customer transactions',
    permissions: [
      'POS-CREATE',
      'POS-READ',
      'PRODUCTS-READ',
      'CUSTOMERS-READ',
      'CUSTOMERS-CREATE',
      'ORDERS-READ',
      'SALES-READ',
      'HARDWARE-READ',
    ],
    color: '#388e3c',
    priority: 50,
  },
  {
    name: 'Sales Person',
    description: 'Manage sales, customers, and orders',
    permissions: [
      'DASHBOARD-READ',
      'POS-CREATE',
      'POS-READ',
      'PRODUCTS-READ',
      'CUSTOMERS-CREATE',
      'CUSTOMERS-READ',
      'CUSTOMERS-UPDATE',
      'ORDERS-CREATE',
      'ORDERS-READ',
      'ORDERS-UPDATE',
      'SALES-READ',
      'DISCOUNTS-READ',
    ],
    color: '#7b1fa2',
    priority: 40,
  },
  {
    name: 'Inventory Manager',
    description: 'Manage products, inventory, and suppliers',
    permissions: [
      'DASHBOARD-READ',
      'PRODUCTS-CREATE',
      'PRODUCTS-READ',
      'PRODUCTS-UPDATE',
      'PRODUCTS-DELETE',
      'PRODUCTS-IMPORT',
      'PRODUCTS-EXPORT',
      'INVENTORY-CREATE',
      'INVENTORY-READ',
      'INVENTORY-UPDATE',
      'INVENTORY-IMPORT',
      'INVENTORY-EXPORT',
      'SUPPLIERS-CREATE',
      'SUPPLIERS-READ',
      'SUPPLIERS-UPDATE',
      'PURCHASES-CREATE',
      'PURCHASES-READ',
      'REPORTS-READ',
    ],
    color: '#00796b',
    priority: 60,
  },
  {
    name: 'Accountant',
    description: 'View financial reports and transaction records',
    permissions: [
      'DASHBOARD-READ',
      'ORDERS-READ',
      'SALES-READ',
      'PURCHASES-READ',
      'REPORTS-READ',
      'REPORTS-EXPORT',
      'PAYMENTS-READ',
      'TAXES-READ',
      'AUDIT_LOG-READ',
    ],
    color: '#5d4037',
    priority: 60,
  },
  {
    name: 'Viewer',
    description: 'Read-only access to basic information',
    permissions: [
      'DASHBOARD-READ',
      'PRODUCTS-READ',
      'CUSTOMERS-READ',
      'ORDERS-READ',
      'SALES-READ',
    ],
    color: '#616161',
    priority: 10,
  },
];

// All available permissions
export const ALL_PERMISSIONS: Permission[] = [
  // Dashboard
  {
    id: 'DASHBOARD-READ',
    resource: PermissionResource.DASHBOARD,
    action: PermissionAction.READ,
    description: 'View dashboard',
    category: PermissionCategory.SALES,
  },

  // POS
  {
    id: 'POS-CREATE',
    resource: PermissionResource.POS,
    action: PermissionAction.CREATE,
    description: 'Create POS transactions',
    category: PermissionCategory.SALES,
  },
  {
    id: 'POS-READ',
    resource: PermissionResource.POS,
    action: PermissionAction.READ,
    description: 'View POS transactions',
    category: PermissionCategory.SALES,
  },
  {
    id: 'POS-UPDATE',
    resource: PermissionResource.POS,
    action: PermissionAction.UPDATE,
    description: 'Edit POS transactions',
    category: PermissionCategory.SALES,
  },
  {
    id: 'POS-DELETE',
    resource: PermissionResource.POS,
    action: PermissionAction.DELETE,
    description: 'Cancel POS transactions',
    category: PermissionCategory.SALES,
  },

  // Products
  {
    id: 'PRODUCTS-CREATE',
    resource: PermissionResource.PRODUCTS,
    action: PermissionAction.CREATE,
    description: 'Create products',
    category: PermissionCategory.INVENTORY,
  },
  {
    id: 'PRODUCTS-READ',
    resource: PermissionResource.PRODUCTS,
    action: PermissionAction.READ,
    description: 'View products',
    category: PermissionCategory.INVENTORY,
  },
  {
    id: 'PRODUCTS-UPDATE',
    resource: PermissionResource.PRODUCTS,
    action: PermissionAction.UPDATE,
    description: 'Edit products',
    category: PermissionCategory.INVENTORY,
  },
  {
    id: 'PRODUCTS-DELETE',
    resource: PermissionResource.PRODUCTS,
    action: PermissionAction.DELETE,
    description: 'Delete products',
    category: PermissionCategory.INVENTORY,
  },
  {
    id: 'PRODUCTS-IMPORT',
    resource: PermissionResource.PRODUCTS,
    action: PermissionAction.IMPORT,
    description: 'Import products',
    category: PermissionCategory.INVENTORY,
  },
  {
    id: 'PRODUCTS-EXPORT',
    resource: PermissionResource.PRODUCTS,
    action: PermissionAction.EXPORT,
    description: 'Export products',
    category: PermissionCategory.INVENTORY,
  },

  // Categories
  {
    id: 'CATEGORIES-CREATE',
    resource: PermissionResource.CATEGORIES,
    action: PermissionAction.CREATE,
    description: 'Create categories',
    category: PermissionCategory.INVENTORY,
  },
  {
    id: 'CATEGORIES-READ',
    resource: PermissionResource.CATEGORIES,
    action: PermissionAction.READ,
    description: 'View categories',
    category: PermissionCategory.INVENTORY,
  },
  {
    id: 'CATEGORIES-UPDATE',
    resource: PermissionResource.CATEGORIES,
    action: PermissionAction.UPDATE,
    description: 'Edit categories',
    category: PermissionCategory.INVENTORY,
  },
  {
    id: 'CATEGORIES-DELETE',
    resource: PermissionResource.CATEGORIES,
    action: PermissionAction.DELETE,
    description: 'Delete categories',
    category: PermissionCategory.INVENTORY,
  },

  // Inventory
  {
    id: 'INVENTORY-CREATE',
    resource: PermissionResource.INVENTORY,
    action: PermissionAction.CREATE,
    description: 'Create inventory records',
    category: PermissionCategory.INVENTORY,
  },
  {
    id: 'INVENTORY-READ',
    resource: PermissionResource.INVENTORY,
    action: PermissionAction.READ,
    description: 'View inventory',
    category: PermissionCategory.INVENTORY,
  },
  {
    id: 'INVENTORY-UPDATE',
    resource: PermissionResource.INVENTORY,
    action: PermissionAction.UPDATE,
    description: 'Update inventory',
    category: PermissionCategory.INVENTORY,
  },
  {
    id: 'INVENTORY-DELETE',
    resource: PermissionResource.INVENTORY,
    action: PermissionAction.DELETE,
    description: 'Delete inventory records',
    category: PermissionCategory.INVENTORY,
  },
  {
    id: 'INVENTORY-IMPORT',
    resource: PermissionResource.INVENTORY,
    action: PermissionAction.IMPORT,
    description: 'Import inventory',
    category: PermissionCategory.INVENTORY,
  },
  {
    id: 'INVENTORY-EXPORT',
    resource: PermissionResource.INVENTORY,
    action: PermissionAction.EXPORT,
    description: 'Export inventory',
    category: PermissionCategory.INVENTORY,
  },

  // Customers
  {
    id: 'CUSTOMERS-CREATE',
    resource: PermissionResource.CUSTOMERS,
    action: PermissionAction.CREATE,
    description: 'Create customers',
    category: PermissionCategory.CUSTOMERS,
  },
  {
    id: 'CUSTOMERS-READ',
    resource: PermissionResource.CUSTOMERS,
    action: PermissionAction.READ,
    description: 'View customers',
    category: PermissionCategory.CUSTOMERS,
  },
  {
    id: 'CUSTOMERS-UPDATE',
    resource: PermissionResource.CUSTOMERS,
    action: PermissionAction.UPDATE,
    description: 'Edit customers',
    category: PermissionCategory.CUSTOMERS,
  },
  {
    id: 'CUSTOMERS-DELETE',
    resource: PermissionResource.CUSTOMERS,
    action: PermissionAction.DELETE,
    description: 'Delete customers',
    category: PermissionCategory.CUSTOMERS,
  },
  {
    id: 'CUSTOMERS-IMPORT',
    resource: PermissionResource.CUSTOMERS,
    action: PermissionAction.IMPORT,
    description: 'Import customers',
    category: PermissionCategory.CUSTOMERS,
  },
  {
    id: 'CUSTOMERS-EXPORT',
    resource: PermissionResource.CUSTOMERS,
    action: PermissionAction.EXPORT,
    description: 'Export customers',
    category: PermissionCategory.CUSTOMERS,
  },

  // Suppliers
  {
    id: 'SUPPLIERS-CREATE',
    resource: PermissionResource.SUPPLIERS,
    action: PermissionAction.CREATE,
    description: 'Create suppliers',
    category: PermissionCategory.INVENTORY,
  },
  {
    id: 'SUPPLIERS-READ',
    resource: PermissionResource.SUPPLIERS,
    action: PermissionAction.READ,
    description: 'View suppliers',
    category: PermissionCategory.INVENTORY,
  },
  {
    id: 'SUPPLIERS-UPDATE',
    resource: PermissionResource.SUPPLIERS,
    action: PermissionAction.UPDATE,
    description: 'Edit suppliers',
    category: PermissionCategory.INVENTORY,
  },
  {
    id: 'SUPPLIERS-DELETE',
    resource: PermissionResource.SUPPLIERS,
    action: PermissionAction.DELETE,
    description: 'Delete suppliers',
    category: PermissionCategory.INVENTORY,
  },

  // Orders
  {
    id: 'ORDERS-CREATE',
    resource: PermissionResource.ORDERS,
    action: PermissionAction.CREATE,
    description: 'Create orders',
    category: PermissionCategory.SALES,
  },
  {
    id: 'ORDERS-READ',
    resource: PermissionResource.ORDERS,
    action: PermissionAction.READ,
    description: 'View orders',
    category: PermissionCategory.SALES,
  },
  {
    id: 'ORDERS-UPDATE',
    resource: PermissionResource.ORDERS,
    action: PermissionAction.UPDATE,
    description: 'Edit orders',
    category: PermissionCategory.SALES,
  },
  {
    id: 'ORDERS-DELETE',
    resource: PermissionResource.ORDERS,
    action: PermissionAction.DELETE,
    description: 'Cancel orders',
    category: PermissionCategory.SALES,
  },
  {
    id: 'ORDERS-APPROVE',
    resource: PermissionResource.ORDERS,
    action: PermissionAction.APPROVE,
    description: 'Approve orders',
    category: PermissionCategory.SALES,
  },

  // Sales
  {
    id: 'SALES-CREATE',
    resource: PermissionResource.SALES,
    action: PermissionAction.CREATE,
    description: 'Create sales',
    category: PermissionCategory.SALES,
  },
  {
    id: 'SALES-READ',
    resource: PermissionResource.SALES,
    action: PermissionAction.READ,
    description: 'View sales',
    category: PermissionCategory.SALES,
  },
  {
    id: 'SALES-UPDATE',
    resource: PermissionResource.SALES,
    action: PermissionAction.UPDATE,
    description: 'Edit sales',
    category: PermissionCategory.SALES,
  },
  {
    id: 'SALES-DELETE',
    resource: PermissionResource.SALES,
    action: PermissionAction.DELETE,
    description: 'Delete sales',
    category: PermissionCategory.SALES,
  },

  // Purchases
  {
    id: 'PURCHASES-CREATE',
    resource: PermissionResource.PURCHASES,
    action: PermissionAction.CREATE,
    description: 'Create purchases',
    category: PermissionCategory.INVENTORY,
  },
  {
    id: 'PURCHASES-READ',
    resource: PermissionResource.PURCHASES,
    action: PermissionAction.READ,
    description: 'View purchases',
    category: PermissionCategory.INVENTORY,
  },
  {
    id: 'PURCHASES-UPDATE',
    resource: PermissionResource.PURCHASES,
    action: PermissionAction.UPDATE,
    description: 'Edit purchases',
    category: PermissionCategory.INVENTORY,
  },
  {
    id: 'PURCHASES-DELETE',
    resource: PermissionResource.PURCHASES,
    action: PermissionAction.DELETE,
    description: 'Delete purchases',
    category: PermissionCategory.INVENTORY,
  },
  {
    id: 'PURCHASES-APPROVE',
    resource: PermissionResource.PURCHASES,
    action: PermissionAction.APPROVE,
    description: 'Approve purchases',
    category: PermissionCategory.INVENTORY,
  },

  // Reports
  {
    id: 'REPORTS-READ',
    resource: PermissionResource.REPORTS,
    action: PermissionAction.READ,
    description: 'View reports',
    category: PermissionCategory.REPORTS,
  },
  {
    id: 'REPORTS-EXPORT',
    resource: PermissionResource.REPORTS,
    action: PermissionAction.EXPORT,
    description: 'Export reports',
    category: PermissionCategory.REPORTS,
  },

  // Users
  {
    id: 'USERS-CREATE',
    resource: PermissionResource.USERS,
    action: PermissionAction.CREATE,
    description: 'Create users',
    category: PermissionCategory.ADMINISTRATION,
  },
  {
    id: 'USERS-READ',
    resource: PermissionResource.USERS,
    action: PermissionAction.READ,
    description: 'View users',
    category: PermissionCategory.ADMINISTRATION,
  },
  {
    id: 'USERS-UPDATE',
    resource: PermissionResource.USERS,
    action: PermissionAction.UPDATE,
    description: 'Edit users',
    category: PermissionCategory.ADMINISTRATION,
  },
  {
    id: 'USERS-DELETE',
    resource: PermissionResource.USERS,
    action: PermissionAction.DELETE,
    description: 'Delete users',
    category: PermissionCategory.ADMINISTRATION,
  },

  // Roles
  {
    id: 'ROLES-CREATE',
    resource: PermissionResource.ROLES,
    action: PermissionAction.CREATE,
    description: 'Create roles',
    category: PermissionCategory.ADMINISTRATION,
  },
  {
    id: 'ROLES-READ',
    resource: PermissionResource.ROLES,
    action: PermissionAction.READ,
    description: 'View roles',
    category: PermissionCategory.ADMINISTRATION,
  },
  {
    id: 'ROLES-UPDATE',
    resource: PermissionResource.ROLES,
    action: PermissionAction.UPDATE,
    description: 'Edit roles',
    category: PermissionCategory.ADMINISTRATION,
  },
  {
    id: 'ROLES-DELETE',
    resource: PermissionResource.ROLES,
    action: PermissionAction.DELETE,
    description: 'Delete roles',
    category: PermissionCategory.ADMINISTRATION,
  },

  // Settings
  {
    id: 'SETTINGS-READ',
    resource: PermissionResource.SETTINGS,
    action: PermissionAction.READ,
    description: 'View settings',
    category: PermissionCategory.SETTINGS,
  },
  {
    id: 'SETTINGS-UPDATE',
    resource: PermissionResource.SETTINGS,
    action: PermissionAction.UPDATE,
    description: 'Update settings',
    category: PermissionCategory.SETTINGS,
  },

  // Hardware
  {
    id: 'HARDWARE-READ',
    resource: PermissionResource.HARDWARE,
    action: PermissionAction.READ,
    description: 'View hardware',
    category: PermissionCategory.SETTINGS,
  },
  {
    id: 'HARDWARE-UPDATE',
    resource: PermissionResource.HARDWARE,
    action: PermissionAction.UPDATE,
    description: 'Configure hardware',
    category: PermissionCategory.SETTINGS,
  },

  // Payments
  {
    id: 'PAYMENTS-CREATE',
    resource: PermissionResource.PAYMENTS,
    action: PermissionAction.CREATE,
    description: 'Process payments',
    category: PermissionCategory.SALES,
  },
  {
    id: 'PAYMENTS-READ',
    resource: PermissionResource.PAYMENTS,
    action: PermissionAction.READ,
    description: 'View payments',
    category: PermissionCategory.SALES,
  },
  {
    id: 'PAYMENTS-APPROVE',
    resource: PermissionResource.PAYMENTS,
    action: PermissionAction.APPROVE,
    description: 'Approve refunds',
    category: PermissionCategory.SALES,
  },

  // Discounts
  {
    id: 'DISCOUNTS-CREATE',
    resource: PermissionResource.DISCOUNTS,
    action: PermissionAction.CREATE,
    description: 'Create discounts',
    category: PermissionCategory.SALES,
  },
  {
    id: 'DISCOUNTS-READ',
    resource: PermissionResource.DISCOUNTS,
    action: PermissionAction.READ,
    description: 'View discounts',
    category: PermissionCategory.SALES,
  },
  {
    id: 'DISCOUNTS-UPDATE',
    resource: PermissionResource.DISCOUNTS,
    action: PermissionAction.UPDATE,
    description: 'Edit discounts',
    category: PermissionCategory.SALES,
  },
  {
    id: 'DISCOUNTS-DELETE',
    resource: PermissionResource.DISCOUNTS,
    action: PermissionAction.DELETE,
    description: 'Delete discounts',
    category: PermissionCategory.SALES,
  },
  {
    id: 'DISCOUNTS-APPROVE',
    resource: PermissionResource.DISCOUNTS,
    action: PermissionAction.APPROVE,
    description: 'Approve discounts',
    category: PermissionCategory.SALES,
  },

  // Taxes
  {
    id: 'TAXES-CREATE',
    resource: PermissionResource.TAXES,
    action: PermissionAction.CREATE,
    description: 'Create tax rates',
    category: PermissionCategory.SETTINGS,
  },
  {
    id: 'TAXES-READ',
    resource: PermissionResource.TAXES,
    action: PermissionAction.READ,
    description: 'View tax rates',
    category: PermissionCategory.SETTINGS,
  },
  {
    id: 'TAXES-UPDATE',
    resource: PermissionResource.TAXES,
    action: PermissionAction.UPDATE,
    description: 'Edit tax rates',
    category: PermissionCategory.SETTINGS,
  },
  {
    id: 'TAXES-DELETE',
    resource: PermissionResource.TAXES,
    action: PermissionAction.DELETE,
    description: 'Delete tax rates',
    category: PermissionCategory.SETTINGS,
  },

  // Branches
  {
    id: 'BRANCHES-CREATE',
    resource: PermissionResource.BRANCHES,
    action: PermissionAction.CREATE,
    description: 'Create branches',
    category: PermissionCategory.ADMINISTRATION,
  },
  {
    id: 'BRANCHES-READ',
    resource: PermissionResource.BRANCHES,
    action: PermissionAction.READ,
    description: 'View branches',
    category: PermissionCategory.ADMINISTRATION,
  },
  {
    id: 'BRANCHES-UPDATE',
    resource: PermissionResource.BRANCHES,
    action: PermissionAction.UPDATE,
    description: 'Edit branches',
    category: PermissionCategory.ADMINISTRATION,
  },
  {
    id: 'BRANCHES-DELETE',
    resource: PermissionResource.BRANCHES,
    action: PermissionAction.DELETE,
    description: 'Delete branches',
    category: PermissionCategory.ADMINISTRATION,
  },

  // Audit Log
  {
    id: 'AUDIT_LOG-READ',
    resource: PermissionResource.AUDIT_LOG,
    action: PermissionAction.READ,
    description: 'View audit log',
    category: PermissionCategory.ADMINISTRATION,
  },
  {
    id: 'AUDIT_LOG-EXPORT',
    resource: PermissionResource.AUDIT_LOG,
    action: PermissionAction.EXPORT,
    description: 'Export audit log',
    category: PermissionCategory.ADMINISTRATION,
  },
];

// Helper function to get permissions by category
export function getPermissionsByCategory(): PermissionGroup[] {
  const groups: Map<PermissionCategory, Permission[]> = new Map();

  ALL_PERMISSIONS.forEach((permission) => {
    if (!groups.has(permission.category)) {
      groups.set(permission.category, []);
    }
    groups.get(permission.category)!.push(permission);
  });

  const categoryLabels: Record<PermissionCategory, string> = {
    [PermissionCategory.SALES]: 'Sales & Transactions',
    [PermissionCategory.INVENTORY]: 'Inventory & Products',
    [PermissionCategory.CUSTOMERS]: 'Customer Management',
    [PermissionCategory.REPORTS]: 'Reports & Analytics',
    [PermissionCategory.ADMINISTRATION]: 'Administration',
    [PermissionCategory.SETTINGS]: 'Settings & Configuration',
  };

  return Array.from(groups.entries()).map(([category, permissions]) => ({
    category,
    categoryLabel: categoryLabels[category],
    permissions,
  }));
}

// Helper function to check if permission exists
export function hasPermission(
  userPermissions: string[],
  requiredPermission: string
): boolean {
  return userPermissions.includes(requiredPermission);
}

// Helper function to check multiple permissions (OR logic)
export function hasAnyPermission(
  userPermissions: string[],
  requiredPermissions: string[]
): boolean {
  return requiredPermissions.some((p) => userPermissions.includes(p));
}

// Helper function to check multiple permissions (AND logic)
export function hasAllPermissions(
  userPermissions: string[],
  requiredPermissions: string[]
): boolean {
  return requiredPermissions.every((p) => userPermissions.includes(p));
}
