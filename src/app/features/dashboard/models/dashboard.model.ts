// Dashboard KPI Models
export interface DashboardKPI {
  todaySales: number;
  todaySalesChange: number;
  weekSales: number;
  weekSalesChange: number;
  monthSales: number;
  monthSalesChange: number;
  todayTransactions: number;
  todayTransactionsChange: number;
  averageOrderValue: number;
  averageOrderValueChange: number;
  totalCustomers: number;
  totalCustomersChange: number;
  activeCustomers: number;
  newCustomersToday: number;
  totalProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  stockValue: number;
}

// Sales Chart Data
export interface SalesChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string;
  borderWidth?: number;
  fill?: boolean;
}

// Sales Trend (for line chart)
export interface SalesTrend {
  date: string;
  sales: number;
  transactions: number;
}

// Sales by Category (for pie/doughnut chart)
export interface CategorySales {
  categoryId: string;
  categoryName: string;
  sales: number;
  percentage: number;
  color?: string;
}

// Sales by Payment Method
export interface PaymentMethodSales {
  method: string;
  amount: number;
  count: number;
  percentage: number;
}

// Recent Transaction
export interface RecentTransaction {
  id: string;
  transactionDate: Date;
  customerName: string;
  items: number;
  amount: number;
  paymentMethod: string;
  status: 'completed' | 'pending' | 'cancelled';
}

// Inventory Alert
export interface InventoryAlert {
  productId: string;
  productName: string;
  sku: string;
  currentStock: number;
  minStock: number;
  alertType: 'low_stock' | 'out_of_stock' | 'overstock';
  severity: 'warning' | 'critical' | 'info';
}

// Top Selling Product
export interface TopSellingProduct {
  productId: string;
  productName: string;
  sku: string;
  quantitySold: number;
  revenue: number;
  profit: number;
  profitMargin: number;
  trend: 'up' | 'down' | 'stable';
}

// Top Customer
export interface TopCustomer {
  customerId: string;
  customerName: string;
  email: string;
  phone: string;
  totalPurchases: number;
  totalSpent: number;
  lastPurchaseDate: Date;
  tier: 'platinum' | 'gold' | 'silver' | 'bronze';
}

// Dashboard Summary
export interface DashboardSummary {
  kpis: DashboardKPI;
  salesTrend: SalesTrend[];
  categorySales: CategorySales[];
  paymentMethodSales: PaymentMethodSales[];
  recentTransactions: RecentTransaction[];
  inventoryAlerts: InventoryAlert[];
  topProducts: TopSellingProduct[];
  topCustomers: TopCustomer[];
}

// Quick Action
export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  route: string;
  color: string;
  description: string;
}

// Activity Log
export interface ActivityLog {
  id: string;
  timestamp: Date;
  type: 'sale' | 'inventory' | 'customer' | 'system';
  message: string;
  user: string;
  icon: string;
  color: string;
}

// Period Filter
export type DashboardPeriod = 'today' | 'week' | 'month' | 'year';

export interface DateRange {
  startDate: Date;
  endDate: Date;
}
