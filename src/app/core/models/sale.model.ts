import { User } from './auth.model';
import { Product, ProductVariant } from './product.model';

export interface Sale {
  id: string;
  saleNumber: string;
  customerId?: string;
  customer?: Customer;
  cashierId: string;
  cashier: User;
  registerId: string;
  items: SaleItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  paymentMethods: PaymentMethod[];
  status: SaleStatus;
  notes?: string;
  refundedAmount: number;
  voidReason?: string;
  receiptPrinted: boolean;
  receiptEmailed: boolean;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  variantId?: string;
  product: Product;
  variant?: ProductVariant;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  notes?: string;
}

export interface PaymentMethod {
  id: string;
  saleId: string;
  type: PaymentType;
  amount: number;
  reference?: string;
  cardLast4?: string;
  cardBrand?: string;
  status: PaymentStatus;
  processedAt: Date;
}

export interface Customer {
  id: string;
  customerNumber: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  address?: CustomerAddress;
  loyaltyPoints: number;
  storeCredit: number;
  totalSpent: number;
  totalVisits: number;
  lastVisit?: Date;
  isActive: boolean;
  notes?: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerAddress {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface Cart {
  items: CartItem[];
  customerId?: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  notes?: string;
}

export interface CartItem {
  productId: string;
  variantId?: string;
  product: Product;
  variant?: ProductVariant;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  totalAmount: number;
  notes?: string;
}

export interface Discount {
  id: string;
  type: DiscountType;
  name: string;
  value: number;
  minAmount?: number;
  maxAmount?: number;
  validFrom: Date;
  validTo: Date;
  usageLimit?: number;
  usedCount: number;
  isActive: boolean;
  applicableProducts?: string[];
  applicableCategories?: string[];
}

export enum SaleStatus {
  DRAFT = 'draft',
  COMPLETED = 'completed',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
  VOIDED = 'voided',
}

export enum PaymentType {
  CASH = 'cash',
  CARD = 'card',
  MOBILE_PAYMENT = 'mobile_payment',
  BANK_TRANSFER = 'bank_transfer',
  STORE_CREDIT = 'store_credit',
  LOYALTY_POINTS = 'loyalty_points',
  CHEQUE = 'cheque',
}

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum DiscountType {
  PERCENTAGE = 'percentage',
  FIXED_AMOUNT = 'fixed_amount',
  BUY_X_GET_Y = 'buy_x_get_y',
}

export interface Register {
  id: string;
  name: string;
  location: string;
  isActive: boolean;
  currentCashAmount: number;
  openingTime?: Date;
  closingTime?: Date;
  lastSaleId?: string;
}
