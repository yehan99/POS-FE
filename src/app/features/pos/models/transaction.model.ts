import { CartItem } from '../store/cart.state';

export interface Transaction {
  id: string;
  transactionNumber: string;
  date: Date;
  items: CartItem[];
  subtotal: number;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  discountAmount: number;
  taxAmount: number;
  taxRate: number;
  total: number;
  amountPaid: number;
  change: number;
  paymentMethod: 'cash' | 'card' | 'mobile' | 'split';
  paymentDetails: PaymentDetails;
  customerId?: string;
  customerName?: string;
  cashierId: string;
  cashierName: string;
  tenantId: string;
  storeName: string;
  notes?: string;
  status: 'completed' | 'refunded' | 'cancelled';
}

export interface PaymentDetails {
  // Cash payment
  cashReceived?: number;

  // Card payment
  cardType?: string;
  cardLast4?: string;
  cardReference?: string;

  // Mobile payment
  mobileProvider?: string;
  mobileNumber?: string;
  mobileReference?: string;

  // Split payment
  splitPayments?: SplitPayment[];
}

export interface SplitPayment {
  method: 'cash' | 'card' | 'mobile';
  amount: number;
  details: any;
}

export interface TransactionFilter {
  startDate?: Date;
  endDate?: Date;
  paymentMethod?: string;
  cashierId?: string;
  customerId?: string;
  status?: string;
  minAmount?: number;
  maxAmount?: number;
  searchTerm?: string;
}

export interface TransactionSummary {
  totalTransactions: number;
  totalSales: number;
  totalRefunds: number;
  cashSales: number;
  cardSales: number;
  mobileSales: number;
  averageTransactionValue: number;
}

export type TransactionDashboardPeriod =
  | 'today'
  | 'yesterday'
  | 'week'
  | 'month'
  | 'year'
  | 'custom';

export interface TransactionDashboardSummary extends TransactionSummary {
  completedTransactions: number;
  pendingTransactions: number;
  cancelledTransactions: number;
  netSales: number;
}

export interface TransactionTrendPoint {
  date: string;
  totalSales: number;
  transactionCount: number;
}

export interface TransactionPaymentBreakdown {
  method: string;
  amount: number;
  transactionCount: number;
  percentage: number;
}

export interface TransactionStatusBreakdown {
  status: string;
  count: number;
  percentage: number;
}

export interface CashierPerformance {
  cashierId: string;
  cashierName: string;
  transactionCount: number;
  totalSales: number;
  averageSaleValue: number;
}

export interface TransactionSnapshot {
  transactionNumber: string;
  transactionDate: string;
  customerName: string;
  total: number;
  paymentMethod: string;
  status: string;
  itemsCount: number;
}

export interface TransactionDashboardData {
  summary: TransactionDashboardSummary;
  trend: TransactionTrendPoint[];
  paymentBreakdown: TransactionPaymentBreakdown[];
  statusBreakdown: TransactionStatusBreakdown[];
  topCashiers: CashierPerformance[];
  recentTransactions: TransactionSnapshot[];
}
