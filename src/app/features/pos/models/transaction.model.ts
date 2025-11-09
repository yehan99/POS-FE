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
