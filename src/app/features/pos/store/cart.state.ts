import { Product } from '../../../core/models';

export interface CartItem {
  product: Product;
  quantity: number;
  discount: number; // Percentage discount (0-100)
  discountAmount: number; // Calculated discount amount
  subtotal: number; // Price * quantity
  total: number; // Subtotal - discount
  notes?: string;
}

export interface CartState {
  items: CartItem[];
  customerId?: string;
  customerName?: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  discountAmount: number;
  subtotal: number;
  taxAmount: number;
  taxRate: number; // Default tax rate
  total: number;
  notes?: string;
  holdId?: string; // For hold/recall functionality
  isProcessing: boolean;
}

export const initialCartState: CartState = {
  items: [],
  discountType: 'percentage',
  discountValue: 0,
  discountAmount: 0,
  subtotal: 0,
  taxAmount: 0,
  taxRate: 0, // Will be set from environment/settings
  total: 0,
  isProcessing: false,
};
