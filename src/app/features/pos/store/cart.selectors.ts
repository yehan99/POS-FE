import { createFeatureSelector, createSelector } from '@ngrx/store';
import { CartState } from './cart.state';

export const selectCartState = createFeatureSelector<CartState>('cart');

// Basic Selectors
export const selectCartItems = createSelector(
  selectCartState,
  (state) => state.items
);

export const selectCartItemCount = createSelector(selectCartItems, (items) =>
  items.reduce((count, item) => count + item.quantity, 0)
);

export const selectCartSubtotal = createSelector(
  selectCartState,
  (state) => state.subtotal
);

export const selectCartDiscountAmount = createSelector(
  selectCartState,
  (state) => state.discountAmount
);

export const selectCartTaxAmount = createSelector(
  selectCartState,
  (state) => state.taxAmount
);

export const selectCartTotal = createSelector(
  selectCartState,
  (state) => state.total
);

export const selectCartCustomer = createSelector(selectCartState, (state) => ({
  customerId: state.customerId,
  customerName: state.customerName,
}));

export const selectCartNotes = createSelector(
  selectCartState,
  (state) => state.notes
);

export const selectIsCartEmpty = createSelector(
  selectCartItems,
  (items) => items.length === 0
);

export const selectIsProcessing = createSelector(
  selectCartState,
  (state) => state.isProcessing
);

export const selectCartDiscount = createSelector(selectCartState, (state) => ({
  discountType: state.discountType,
  discountValue: state.discountValue,
  discountAmount: state.discountAmount,
}));

export const selectTaxRate = createSelector(
  selectCartState,
  (state) => state.taxRate
);

// Item-specific selectors
export const selectCartItemByProductId = (productId: string) =>
  createSelector(selectCartItems, (items) =>
    items.find((item) => item.product.id === productId)
  );

export const selectCartItemQuantity = (productId: string) =>
  createSelector(
    selectCartItemByProductId(productId),
    (item) => item?.quantity ?? 0
  );

// Derived selectors
export const selectCartSummary = createSelector(
  selectCartItemCount,
  selectCartSubtotal,
  selectCartDiscountAmount,
  selectCartTaxAmount,
  selectCartTotal,
  (itemCount, subtotal, discountAmount, taxAmount, total) => ({
    itemCount,
    subtotal,
    discountAmount,
    taxAmount,
    total,
  })
);

export const selectCanCheckout = createSelector(
  selectIsCartEmpty,
  selectIsProcessing,
  (isEmpty, isProcessing) => !isEmpty && !isProcessing
);
