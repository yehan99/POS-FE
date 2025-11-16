// Stock Adjustment Models
export interface StockAdjustment {
  id: string;
  adjustmentNumber: string;
  productId: string;
  productName: string;
  productSku: string;
  adjustmentType: AdjustmentType;
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  notes?: string;
  cost: number;
  totalValue: number;
  locationId?: string;
  locationName?: string;
  status: AdjustmentStatus;
  createdBy: string;
  approvedBy?: string;
  createdAt: Date;
  approvedAt?: Date;
}

export type AdjustmentType =
  | 'increase'
  | 'decrease'
  | 'damage'
  | 'loss'
  | 'found'
  | 'return'
  | 'correction';
export type AdjustmentStatus = 'pending' | 'approved' | 'rejected';

export interface StockAdjustmentFormData {
  productId: string;
  adjustmentType: AdjustmentType;
  quantity: number;
  reason: string;
  notes?: string;
  locationId?: string;
}

// Stock Transfer Models
export interface StockTransfer {
  id: string;
  transferNumber: string;
  fromLocationId: string;
  fromLocationName: string | null;
  toLocationId: string;
  toLocationName: string | null;
  items: StockTransferItem[];
  status: TransferStatus;
  totalItems: number;
  totalValue: number;
  requestedBy: string | null;
  approvedBy?: string | null;
  shippedBy?: string | null;
  receivedBy?: string | null;
  notes?: string | null;
  cancelReason?: string | null;
  createdAt: string | Date;
  approvedAt?: string | Date;
  shippedAt?: string | Date;
  receivedAt?: string | Date;
  cancelledAt?: string | Date;
}

export interface StockTransferItem {
  id?: string;
  productId: string;
  productName: string;
  productSku: string | null;
  quantity: number;
  receivedQuantity?: number;
  unitCost: number;
  totalCost: number;
}

export type TransferStatus =
  | 'draft'
  | 'pending'
  | 'approved'
  | 'in_transit'
  | 'completed'
  | 'cancelled';

export interface StockTransferFormData {
  fromLocationId: string;
  toLocationId: string;
  items: StockTransferItem[];
  notes?: string;
}

export interface StockTransferDashboardMetrics {
  totalTransfers: number;
  pendingApproval: number;
  inTransit: number;
  completed: number;
  cancelled: number;
  totalItemsMoved: number;
  totalValueMoved: number;
  statusBreakdown: StockTransferStatusBreakdown[];
  trend: StockTransferTrendPoint[];
  topLocations: StockTransferTopLocation[];
}

export interface StockTransferStatusBreakdown {
  status: TransferStatus | string;
  count: number;
  percentage: number;
  totalValue: number;
  totalItems: number;
}

export interface StockTransferTrendPoint {
  label: string | null;
  transfers: number;
  totalValue: number;
  totalItems: number;
}

export interface StockTransferTopLocation {
  locationId: string | null;
  locationName: string | null;
  locationCode?: string | null;
  outboundTransfers: number;
  outboundValue: number;
  outboundItems: number;
}

// Supplier Models
export interface Supplier {
  id: string;
  supplierCode: string;
  code?: string;
  name: string;
  contactPerson?: string | null;
  email?: string | null;
  phone?: string | null;
  category?: string | null;
  status?: string | null;
  isActive: boolean;
  isPreferred?: boolean;
  paymentTerms?: string | null;
  creditLimit?: number | null;
  taxId?: string | null;
  website?: string | null;
  address?: Address | null;
  bankDetails?: BankDetails | null;
  rating?: number | null;
  totalPurchases?: number | null;
  totalSpent?: number | null;
  totalOrders?: number | null;
  spendThisMonth?: number | null;
  spendLastMonth?: number | null;
  onTimeDeliveryRate?: number | null;
  averageLeadTimeDays?: number | null;
  lastPurchaseDate?: Date | null;
  monthlySpendStats?: SupplierMonthlySpend[] | null;
  notes?: string | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export interface Address {
  street?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
}

export interface BankDetails {
  bankName?: string | null;
  accountNumber?: string | null;
  accountName?: string | null;
  branchCode?: string | null;
  swiftCode?: string | null;
}

export interface SupplierFormData {
  supplierCode?: string | null;
  name: string;
  contactPerson?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: Address | null;
  paymentTerms?: string | null;
  creditLimit?: number | null;
  taxId?: string | null;
  website?: string | null;
  bankDetails?: BankDetails | null;
  notes?: string | null;
  isActive?: boolean;
  status?: string | null;
  category?: string | null;
  isPreferred?: boolean;
  rating?: number | null;
  totalPurchases?: number | null;
  totalSpent?: number | null;
  totalOrders?: number | null;
  spendThisMonth?: number | null;
  spendLastMonth?: number | null;
  onTimeDeliveryRate?: number | null;
  averageLeadTimeDays?: number | null;
}

export interface SupplierMonthlySpend {
  period: string;
  totalSpend: number;
  purchaseOrders: number;
  averageLeadTimeDays?: number | null;
}

export interface SupplierDashboardMetrics {
  totalSuppliers: number;
  activeSuppliers: number;
  newSuppliersThisMonth: number;
  preferredSuppliers: number;
  averageLeadTimeDays: number;
  onTimeDeliveryRate: number;
  totalSpend: number;
  spendThisMonth: number;
  spendGrowthPercentage: number;
  categoryBreakdown: SupplierCategoryBreakdown[];
  trend: SupplierTrendPoint[];
  topSuppliers: SupplierPerformanceSummary[];
}

export interface SupplierCategoryBreakdown {
  category: string;
  supplierCount: number;
  percentage: number;
  totalSpend: number;
}

export interface SupplierTrendPoint {
  label: string;
  totalSpend: number;
  purchaseOrders: number;
}

export interface SupplierPerformanceSummary {
  supplierId: string;
  supplierName: string;
  rating?: number;
  totalOrders: number;
  totalSpend: number;
  onTimeDeliveryRate: number;
  averageLeadTimeDays: number;
}

// Purchase Order Models
export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseOrderItem[];
  status: POStatus;
  subtotal: number;
  tax: number;
  discount: number;
  shippingCost: number;
  total: number;
  expectedDeliveryDate?: Date;
  actualDeliveryDate?: Date;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  notes?: string;
  termsAndConditions?: string;
  createdBy: string;
  approvedBy?: string;
  receivedBy?: string;
  createdAt: Date;
  approvedAt?: Date;
  receivedAt?: Date;
}

export interface PurchaseOrderItem {
  id?: string;
  productId: string | null;
  productName: string;
  productSku?: string | null;
  quantity: number;
  receivedQuantity: number;
  unitCost: number;
  tax: number;
  discount: number;
  total: number;
}

export type POStatus =
  | 'draft'
  | 'pending'
  | 'approved'
  | 'ordered'
  | 'partially_received'
  | 'received'
  | 'cancelled';
export type PaymentStatus = 'unpaid' | 'partial' | 'paid' | 'overdue';

export interface PurchaseOrderFormData {
  supplierId: string;
  items: PurchaseOrderItem[];
  status?: POStatus;
  paymentStatus?: PaymentStatus;
  paymentMethod?: string;
  expectedDeliveryDate?: Date;
  actualDeliveryDate?: Date;
  discount: number;
  shippingCost: number;
  notes?: string;
  termsAndConditions?: string;
}

export interface GoodsReceivedNote {
  id: string;
  grnNumber: string;
  purchaseOrderId: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  items: GRNItem[];
  totalItems: number;
  receivedBy: string;
  receivedAt: Date;
  notes?: string;
}

export interface GRNItem {
  productId: string;
  productName: string;
  productSku: string;
  orderedQuantity: number;
  receivedQuantity: number;
  damagedQuantity: number;
  unitCost: number;
  notes?: string;
}

// Stock Alert Models
export interface StockAlert {
  id: string;
  alertType: AlertType;
  productId: string;
  productName: string;
  productSku: string;
  currentStock: number;
  threshold?: number;
  expiryDate?: Date;
  locationId?: string;
  locationName?: string;
  severity: AlertSeverity;
  status: AlertStatus;
  message: string;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  createdAt: Date;
}

export type AlertType =
  | 'low_stock'
  | 'out_of_stock'
  | 'overstock'
  | 'expiring_soon'
  | 'expired';
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type AlertStatus = 'active' | 'acknowledged' | 'resolved';

// Location/Warehouse Models
export interface Location {
  id: string;
  code: string;
  name: string;
  type: LocationType;
  address: Address;
  isActive: boolean;
  capacity?: number;
  currentUtilization?: number;
  manager?: string;
  phone?: string;
  email?: string;
  createdAt: Date;
}

export type LocationType = 'warehouse' | 'store' | 'outlet' | 'storage';

// Inventory Report Models
export interface InventoryReport {
  reportType: ReportType;
  generatedAt: Date;
  dateRange: DateRange;
  data: any;
}

export type ReportType =
  | 'stock_valuation'
  | 'stock_movement'
  | 'aging_analysis'
  | 'variance_report'
  | 'reorder_report';

export interface DateRange {
  from: Date;
  to: Date;
}

export interface StockValuation {
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  unitCost: number;
  totalValue: number;
  locationId?: string;
  locationName?: string;
}

export interface StockMovement {
  productId: string;
  productName: string;
  productSku: string;
  movementType: MovementType;
  quantity: number;
  date: Date;
  reference: string;
  locationId?: string;
}

export type MovementType =
  | 'sale'
  | 'purchase'
  | 'adjustment'
  | 'transfer_in'
  | 'transfer_out'
  | 'return';

export interface AgingAnalysis {
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  lastMovementDate: Date;
  daysInStock: number;
  category: AgingCategory;
  value: number;
}

export type AgingCategory = '0-30' | '31-60' | '61-90' | '91-180' | '180+';

// Filter and Search Models
export interface InventoryFilter {
  search?: string;
  locationId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  status?: string;
  type?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SupplierFilter {
  search?: string;
  status?: string;
  category?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PurchaseOrderFilter {
  search?: string;
  supplierId?: string;
  status?: POStatus;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Purchase Order Dashboard Models
export interface PurchaseOrderDashboardMetrics {
  totalPurchaseOrders: number;
  pendingApproval: number;
  inProgress: number;
  partiallyReceived: number;
  received: number;
  cancelled: number;
  overdue: number;
  totalValue: number;
  outstandingValue: number;
  spendThisMonth: number;
  spendLastMonth: number;
  averageCycleTimeDays: number;
  onTimeFulfillmentRate: number;
  statusBreakdown: PurchaseOrderStatusBreakdown[];
  trend: PurchaseOrderTrendPoint[];
  topSuppliers: PurchaseOrderTopSupplier[];
}

export interface PurchaseOrderStatusBreakdown {
  status: POStatus | string;
  count: number;
  percentage: number;
  totalValue: number;
}

export interface PurchaseOrderTrendPoint {
  label: string;
  totalValue: number;
  purchaseOrders: number;
}

export interface PurchaseOrderTopSupplier {
  supplierId: string;
  supplierName: string;
  totalOrders: number;
  totalValue: number;
  onTimeRate?: number | null;
  averageLeadTimeDays?: number | null;
}

// Statistics Models
export interface InventoryStatistics {
  totalProducts: number;
  totalStockValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  overstockItems: number;
  pendingAdjustments: number;
  pendingTransfers: number;
  pendingPurchaseOrders: number;
  activeAlerts: number;
}

// Paginated Response
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
