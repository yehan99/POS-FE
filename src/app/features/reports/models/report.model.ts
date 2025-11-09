// Report Date Range & Filter Models
export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export type ReportPeriod =
  | 'today'
  | 'yesterday'
  | 'this_week'
  | 'last_week'
  | 'this_month'
  | 'last_month'
  | 'this_year'
  | 'last_year'
  | 'custom';

export interface ReportFilter {
  period: ReportPeriod;
  dateRange?: DateRange;
  productId?: string;
  categoryId?: string;
  customerId?: string;
  locationId?: string;
  paymentMethod?: string;
  status?: string;
}

// Sales Report Models
export interface SalesReport {
  id: string;
  reportDate: Date;
  totalSales: number;
  totalTransactions: number;
  averageTransactionValue: number;
  totalItems: number;
  totalDiscount: number;
  totalTax: number;
  netSales: number;
  grossProfit: number;
  grossProfitMargin: number;
  topSellingProducts: TopProduct[];
  salesByCategory: CategorySales[];
  salesByPaymentMethod: PaymentMethodSales[];
  hourlyBreakdown?: HourlySales[];
  dailyBreakdown?: DailySales[];
}

export interface TopProduct {
  productId: string;
  productName: string;
  sku: string;
  quantitySold: number;
  revenue: number;
  profit: number;
  profitMargin: number;
}

export interface CategorySales {
  categoryId: string;
  categoryName: string;
  totalSales: number;
  totalQuantity: number;
  percentage: number;
}

export interface PaymentMethodSales {
  paymentMethod: string;
  amount: number;
  transactionCount: number;
  percentage: number;
}

export interface HourlySales {
  hour: number;
  sales: number;
  transactions: number;
}

export interface DailySales {
  date: Date;
  sales: number;
  transactions: number;
  averageTransactionValue: number;
}

// Sales Summary for Dashboard
export interface SalesSummary {
  todaySales: number;
  yesterdaySales: number;
  weekSales: number;
  monthSales: number;
  yearSales: number;
  salesGrowth: number; // percentage
  transactionGrowth: number; // percentage
}

// Inventory Report Models
export interface InventoryReport {
  id: string;
  reportDate: Date;
  totalProducts: number;
  totalStockValue: number;
  totalStockQuantity: number;
  lowStockItems: number;
  outOfStockItems: number;
  overstockItems: number;
  stockMovement: StockMovementReport[];
  stockValuation: StockValuationReport[];
  agingAnalysis: AgingAnalysisReport[];
  topMovingProducts: TopMovingProduct[];
  slowMovingProducts: SlowMovingProduct[];
}

export interface StockMovementReport {
  productId: string;
  productName: string;
  sku: string;
  openingStock: number;
  stockIn: number;
  stockOut: number;
  adjustments: number;
  closingStock: number;
  movementRate: number;
}

export interface StockValuationReport {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  costPrice: number;
  sellingPrice: number;
  totalCost: number;
  totalValue: number;
  potentialProfit: number;
}

export interface AgingAnalysisReport {
  ageRange: string; // '0-30', '31-60', '61-90', '90+'
  productCount: number;
  totalValue: number;
  percentage: number;
}

export interface TopMovingProduct {
  productId: string;
  productName: string;
  sku: string;
  turnoverRate: number;
  quantityMoved: number;
  revenue: number;
}

export interface SlowMovingProduct {
  productId: string;
  productName: string;
  sku: string;
  daysInStock: number;
  currentStock: number;
  lastSaleDate?: Date;
  stockValue: number;
}

// Customer Report Models
export interface CustomerReport {
  id: string;
  reportDate: Date;
  totalCustomers: number;
  newCustomers: number;
  activeCustomers: number;
  inactiveCustomers: number;
  topCustomers: TopCustomer[];
  customersByTier: CustomerTierReport[];
  customerRetention: CustomerRetentionReport;
  averageCustomerValue: number;
  customerLifetimeValue: number;
}

export interface TopCustomer {
  customerId: string;
  customerName: string;
  email: string;
  phone: string;
  totalPurchases: number;
  totalSpent: number;
  averageOrderValue: number;
  lastPurchaseDate: Date;
  loyaltyPoints: number;
}

export interface CustomerTierReport {
  tier: string;
  customerCount: number;
  totalSpent: number;
  averageSpent: number;
  percentage: number;
}

export interface CustomerRetentionReport {
  retentionRate: number;
  churnRate: number;
  repeatCustomerRate: number;
  newCustomerRate: number;
}

// Product Performance Models
export interface ProductPerformanceReport {
  id: string;
  reportDate: Date;
  totalProducts: number;
  activeProducts: number;
  topPerformers: ProductPerformance[];
  underperformers: ProductPerformance[];
  profitableProducts: ProductPerformance[];
  revenueByCategory: CategoryRevenue[];
  productTrends: ProductTrend[];
}

export interface ProductPerformance {
  productId: string;
  productName: string;
  sku: string;
  category: string;
  quantitySold: number;
  revenue: number;
  cost: number;
  profit: number;
  profitMargin: number;
  returnRate: number;
  averageRating?: number;
  stockLevel: number;
  performanceScore: number;
}

export interface CategoryRevenue {
  categoryId: string;
  categoryName: string;
  revenue: number;
  profit: number;
  productCount: number;
  growthRate: number;
}

export interface ProductTrend {
  productId: string;
  productName: string;
  weeklyData: TrendData[];
}

export interface TrendData {
  date: Date;
  sales: number;
  quantity: number;
}

// Revenue Analytics Models
export interface RevenueAnalytics {
  totalRevenue: number;
  netRevenue: number;
  grossProfit: number;
  operatingProfit: number;
  revenueByDay: DailyRevenue[];
  revenueByMonth: MonthlyRevenue[];
  revenueGrowth: GrowthMetrics;
  revenueBySource: RevenueSource[];
}

export interface DailyRevenue {
  date: Date;
  revenue: number;
  transactions: number;
  averageOrderValue: number;
}

export interface MonthlyRevenue {
  month: string;
  year: number;
  revenue: number;
  transactions: number;
  growth: number;
}

export interface GrowthMetrics {
  dailyGrowth: number;
  weeklyGrowth: number;
  monthlyGrowth: number;
  yearlyGrowth: number;
}

export interface RevenueSource {
  source: string; // 'online', 'in-store', 'mobile', etc.
  revenue: number;
  percentage: number;
}

// Export Format Models
export type ExportFormat = 'pdf' | 'excel' | 'csv';

export interface ExportOptions {
  format: ExportFormat;
  includeCharts?: boolean;
  includeDetails?: boolean;
  fileName?: string;
}

// Chart Data Models
export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string;
  borderWidth?: number;
}

// Dashboard Summary
export interface ReportsDashboardSummary {
  salesSummary: SalesSummary;
  inventorySummary: {
    totalValue: number;
    lowStockCount: number;
    outOfStockCount: number;
    turnoverRate: number;
  };
  customerSummary: {
    totalCustomers: number;
    activeCustomers: number;
    retentionRate: number;
    averageLifetimeValue: number;
  };
  productSummary: {
    totalProducts: number;
    topPerformers: number;
    underperformers: number;
    averageMargin: number;
  };
}

// Paginated Response
export interface PaginatedReportResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
