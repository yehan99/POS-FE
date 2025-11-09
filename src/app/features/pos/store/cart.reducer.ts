import { createReducer, on } from '@ngrx/store';
import * as CartActions from './cart.actions';
import { CartState, initialCartState, CartItem } from './cart.state';

export const cartReducer = createReducer(
  initialCartState,

  // Add to Cart
  on(CartActions.addToCart, (state, { product, quantity = 1 }) => {
    const existingItemIndex = state.items.findIndex(
      (item) => item.product.id === product.id
    );

    let updatedItems: CartItem[];

    if (existingItemIndex > -1) {
      // Update existing item quantity
      updatedItems = state.items.map((item, index) =>
        index === existingItemIndex
          ? {
              ...item,
              quantity: item.quantity + quantity,
            }
          : item
      );
    } else {
      // Add new item
      const newItem: CartItem = {
        product,
        quantity,
        discount: 0,
        discountAmount: 0,
        subtotal: 0,
        total: 0,
      };
      updatedItems = [...state.items, newItem];
    }

    return calculateCartTotals({ ...state, items: updatedItems });
  }),

  // Update Cart Item
  on(CartActions.updateCartItem, (state, { productId, quantity }) => {
    const updatedItems = state.items
      .map((item) =>
        item.product.id === productId
          ? { ...item, quantity: Math.max(0, quantity) }
          : item
      )
      .filter((item) => item.quantity > 0); // Remove items with 0 quantity

    return calculateCartTotals({ ...state, items: updatedItems });
  }),

  // Remove from Cart
  on(CartActions.removeFromCart, (state, { productId }) => {
    const updatedItems = state.items.filter(
      (item) => item.product.id !== productId
    );
    return calculateCartTotals({ ...state, items: updatedItems });
  }),

  // Clear Cart
  on(CartActions.clearCart, () => initialCartState),

  // Set Item Discount
  on(CartActions.setItemDiscount, (state, { productId, discount }) => {
    const updatedItems = state.items.map((item) =>
      item.product.id === productId
        ? { ...item, discount: Math.min(100, Math.max(0, discount)) }
        : item
    );
    return calculateCartTotals({ ...state, items: updatedItems });
  }),

  // Remove Item Discount
  on(CartActions.removeItemDiscount, (state, { productId }) => {
    const updatedItems = state.items.map((item) =>
      item.product.id === productId ? { ...item, discount: 0 } : item
    );
    return calculateCartTotals({ ...state, items: updatedItems });
  }),

  // Set Cart Discount
  on(CartActions.setCartDiscount, (state, { discountType, discountValue }) => {
    return calculateCartTotals({
      ...state,
      discountType,
      discountValue: Math.max(0, discountValue),
    });
  }),

  // Remove Cart Discount
  on(CartActions.removeCartDiscount, (state) => {
    return calculateCartTotals({
      ...state,
      discountType: 'percentage',
      discountValue: 0,
    });
  }),

  // Set Customer
  on(CartActions.setCustomer, (state, { customerId, customerName }) => ({
    ...state,
    customerId,
    customerName,
  })),

  // Remove Customer
  on(CartActions.removeCustomer, (state) => {
    const { customerId, customerName, ...rest } = state;
    return rest;
  }),

  // Set Cart Notes
  on(CartActions.setCartNotes, (state, { notes }) => ({
    ...state,
    notes,
  })),

  // Set Item Notes
  on(CartActions.setItemNotes, (state, { productId, notes }) => {
    const updatedItems = state.items.map((item) =>
      item.product.id === productId ? { ...item, notes } : item
    );
    return { ...state, items: updatedItems };
  }),

  // Set Tax Rate
  on(CartActions.setTaxRate, (state, { taxRate }) => {
    return calculateCartTotals({ ...state, taxRate });
  }),

  // Hold Cart
  on(CartActions.holdCart, (state, { holdId }) => ({
    ...state,
    holdId,
  })),

  // Recall Cart
  on(CartActions.recallCart, (state, { cart }) => ({
    ...cart,
    isProcessing: false,
  })),

  // Checkout
  on(CartActions.startCheckout, (state) => ({
    ...state,
    isProcessing: true,
  })),

  on(CartActions.checkoutSuccess, () => initialCartState),

  on(CartActions.checkoutFailure, (state, { error }) => ({
    ...state,
    isProcessing: false,
  })),

  // Recalculate
  on(CartActions.recalculateCart, (state) => calculateCartTotals(state))
);

/**
 * Calculate all cart totals including item subtotals, discounts, tax, and final total
 */
function calculateCartTotals(state: CartState): CartState {
  // Calculate item totals
  const itemsWithTotals = state.items.map((item) => {
    const subtotal = item.product.price * item.quantity;
    const discountAmount = (subtotal * item.discount) / 100;
    const total = subtotal - discountAmount;

    return {
      ...item,
      subtotal,
      discountAmount,
      total,
    };
  });

  // Calculate cart subtotal (sum of all item totals after item discounts)
  const subtotal = itemsWithTotals.reduce((sum, item) => sum + item.total, 0);

  // Calculate cart-level discount
  let cartDiscountAmount = 0;
  if (state.discountType === 'percentage') {
    cartDiscountAmount = (subtotal * state.discountValue) / 100;
  } else {
    cartDiscountAmount = state.discountValue;
  }

  // Subtotal after cart discount
  const subtotalAfterDiscount = subtotal - cartDiscountAmount;

  // Calculate tax
  const taxAmount = (subtotalAfterDiscount * state.taxRate) / 100;

  // Final total
  const total = subtotalAfterDiscount + taxAmount;

  return {
    ...state,
    items: itemsWithTotals,
    subtotal,
    discountAmount: cartDiscountAmount,
    taxAmount,
    total: Math.max(0, total), // Ensure total is never negative
  };
}
