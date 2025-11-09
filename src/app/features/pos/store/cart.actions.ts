import { createAction, props } from '@ngrx/store';
import { Product } from '../../../core/models';
import { CartItem } from './cart.state';

// Add/Update Items
export const addToCart = createAction(
  '[Cart] Add To Cart',
  props<{ product: Product; quantity?: number }>()
);

export const updateCartItem = createAction(
  '[Cart] Update Cart Item',
  props<{ productId: string; quantity: number }>()
);

export const removeFromCart = createAction(
  '[Cart] Remove From Cart',
  props<{ productId: string }>()
);

export const clearCart = createAction('[Cart] Clear Cart');

// Item Discount
export const setItemDiscount = createAction(
  '[Cart] Set Item Discount',
  props<{ productId: string; discount: number }>()
);

export const removeItemDiscount = createAction(
  '[Cart] Remove Item Discount',
  props<{ productId: string }>()
);

// Cart Discount
export const setCartDiscount = createAction(
  '[Cart] Set Cart Discount',
  props<{ discountType: 'percentage' | 'fixed'; discountValue: number }>()
);

export const removeCartDiscount = createAction('[Cart] Remove Cart Discount');

// Customer
export const setCustomer = createAction(
  '[Cart] Set Customer',
  props<{ customerId: string; customerName: string }>()
);

export const removeCustomer = createAction('[Cart] Remove Customer');

// Notes
export const setCartNotes = createAction(
  '[Cart] Set Cart Notes',
  props<{ notes: string }>()
);

export const setItemNotes = createAction(
  '[Cart] Set Item Notes',
  props<{ productId: string; notes: string }>()
);

// Tax
export const setTaxRate = createAction(
  '[Cart] Set Tax Rate',
  props<{ taxRate: number }>()
);

// Hold/Recall
export const holdCart = createAction(
  '[Cart] Hold Cart',
  props<{ holdId: string }>()
);

export const recallCart = createAction(
  '[Cart] Recall Cart',
  props<{ cart: any }>() // Will be CartState
);

// Checkout
export const startCheckout = createAction('[Cart] Start Checkout');

export const checkoutSuccess = createAction(
  '[Cart] Checkout Success',
  props<{ transactionId: string }>()
);

export const checkoutFailure = createAction(
  '[Cart] Checkout Failure',
  props<{ error: string }>()
);

// Calculations
export const recalculateCart = createAction('[Cart] Recalculate Cart');
