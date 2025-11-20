import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { distinctUntilChanged, map, takeUntil } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import * as CartActions from '../store/cart.actions';
import * as CartSelectors from '../store/cart.selectors';
import { CartItem } from '../store/cart.state';
import { Product } from '../../../core/models';
import { ProductService } from '../services/product.service';
import { BarcodeScannerService } from '../services/barcode-scanner.service';
import { TransactionService } from '../services/transaction.service';
import {
  PaymentDialogComponent,
  PaymentDialogData,
  PaymentResult,
} from '../payment-dialog/payment-dialog.component';
import {
  ReceiptDialogComponent,
  ReceiptDialogData,
} from '../receipt-dialog/receipt-dialog.component';
import {
  CustomerDialogComponent,
  CustomerDialogResult,
} from '../customer-dialog/customer-dialog.component';
import { Transaction } from '../models/transaction.model';
import { SettingsService } from '../../../core/services/settings.service';

@Component({
  selector: 'app-checkout',
  standalone: false,
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss',
})
export class CheckoutComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Cart observables
  cartItems$: Observable<CartItem[]>;
  cartTotal$: Observable<number>;
  cartSubtotal$: Observable<number>;
  cartDiscount$: Observable<number>;
  cartTax$: Observable<number>;
  itemCount$: Observable<number>;
  canCheckout$: Observable<boolean>;
  cartSummary$: Observable<any>;
  selectedCustomer$: Observable<{ id?: string; name?: string } | null>;
  loyaltyPricingActive$: Observable<boolean>;

  constructor(
    private store: Store,
    private productService: ProductService,
    private barcodeScanner: BarcodeScannerService,
    private transactionService: TransactionService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router,
    private location: Location,
    private settingsService: SettingsService
  ) {
    // Initialize cart observables
    this.cartItems$ = this.store.select(CartSelectors.selectCartItems);
    this.cartTotal$ = this.store.select(CartSelectors.selectCartTotal);
    this.cartSubtotal$ = this.store.select(CartSelectors.selectCartSubtotal);
    this.cartDiscount$ = this.store.select(
      CartSelectors.selectCartDiscountAmount
    );
    this.cartTax$ = this.store.select(CartSelectors.selectCartTaxAmount);
    this.itemCount$ = this.store.select(CartSelectors.selectCartItemCount);
    this.canCheckout$ = this.store.select(CartSelectors.selectCanCheckout);
    this.cartSummary$ = this.store.select(CartSelectors.selectCartSummary);
    this.selectedCustomer$ = this.store.select(
      CartSelectors.selectCartCustomer
    );
    this.loyaltyPricingActive$ = this.store.select(
      CartSelectors.selectIsLoyaltyPricingActive
    );
  }

  ngOnInit(): void {
    this.settingsService.settings$
      .pipe(
        takeUntil(this.destroy$),
        map((state) => state.general.taxRate ?? 0),
        distinctUntilChanged()
      )
      .subscribe((taxRate) => {
        this.store.dispatch(CartActions.setTaxRate({ taxRate }));
      });

    this.settingsService
      .loadSettings()
      .pipe(takeUntil(this.destroy$))
      .subscribe();

    // Listen for barcode scans
    this.barcodeScanner.barcode$
      .pipe(takeUntil(this.destroy$))
      .subscribe((barcode) => {
        this.handleBarcodeScanned(barcode);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Navigation
  goBack(): void {
    this.location.back();
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  // Cart Operations
  addProductToCart(product: Product, quantity: number = 1): void {
    this.store.dispatch(CartActions.addToCart({ product, quantity }));
    this.showSnackBar(`${product.name} added to cart`, 'success');
  }

  updateQuantity(productId: string, quantity: number): void {
    if (quantity <= 0) {
      this.removeItem(productId);
    } else {
      this.store.dispatch(CartActions.updateCartItem({ productId, quantity }));
    }
  }

  increaseQuantity(productId: string, currentQuantity: number): void {
    this.updateQuantity(productId, currentQuantity + 1);
  }

  decreaseQuantity(productId: string, currentQuantity: number): void {
    this.updateQuantity(productId, currentQuantity - 1);
  }

  removeItem(productId: string): void {
    this.store.dispatch(CartActions.removeFromCart({ productId }));
    this.showSnackBar('Item removed from cart', 'info');
  }

  clearCart(): void {
    if (confirm('Are you sure you want to clear the cart?')) {
      this.store.dispatch(CartActions.clearCart());
      this.showSnackBar('Cart cleared', 'info');
    }
  }

  // Barcode Scanner
  handleBarcodeScanned(barcode: string): void {
    this.productService.getProductByBarcode(barcode).subscribe((product) => {
      if (product) {
        this.addProductToCart(product);
        this.showSnackBar(`Scanned: ${product.name}`, 'success');
      } else {
        this.showSnackBar(`Product not found for barcode: ${barcode}`, 'error');
      }
    });
  }

  // Checkout
  proceedToCheckout(): void {
    // Get current cart summary
    this.store
      .select(CartSelectors.selectCartSummary)
      .pipe(takeUntil(this.destroy$))
      .subscribe((summary) => {
        const dialogData: PaymentDialogData = {
          total: summary.total,
          subtotal: summary.subtotal,
          tax: summary.taxAmount,
          discount: summary.discountAmount,
        };

        const dialogRef = this.dialog.open(PaymentDialogComponent, {
          width: '600px',
          maxWidth: '95vw',
          data: dialogData,
          disableClose: true,
        });

        dialogRef.afterClosed().subscribe((result: PaymentResult | null) => {
          if (result) {
            this.processPayment(result);
          } else {
            // Payment cancelled
            this.store.dispatch(
              CartActions.checkoutFailure({ error: 'Payment cancelled' })
            );
          }
        });
      });
  }

  processPayment(paymentResult: PaymentResult): void {
    // Get current cart state
    let currentCartItems: CartItem[] = [];
    let currentCartState: any = {};

    this.store
      .select(CartSelectors.selectCartSummary)
      .pipe(takeUntil(this.destroy$))
      .subscribe((summary) => {
        currentCartState = summary;
      });

    this.store
      .select(CartSelectors.selectCartItems)
      .pipe(takeUntil(this.destroy$))
      .subscribe((items) => {
        currentCartItems = items;
      });

    // Create transaction object
    const transactionId = `TXN${Date.now()}`;
    const transaction: Transaction = {
      id: transactionId,
      transactionNumber: transactionId,
      date: new Date(),
      items: currentCartItems,
      subtotal: currentCartState.subtotal || 0,
      discountType: currentCartState.discountType || 'percentage',
      discountValue: currentCartState.discountValue || 0,
      discountAmount: currentCartState.discountAmount || 0,
      taxAmount: currentCartState.taxAmount || 0,
      taxRate: currentCartState.taxRate || 0,
      total: currentCartState.total || 0,
      amountPaid: paymentResult.amountPaid,
      change: paymentResult.change || 0,
      paymentMethod:
        paymentResult.paymentMethod === 'multiple'
          ? 'split'
          : paymentResult.paymentMethod,
      paymentDetails: {
        cashReceived: paymentResult.cashAmount,
        cardType: paymentResult.cardType,
        cardLast4: paymentResult.cardLastFour,
        cardReference: paymentResult.reference,
        mobileProvider: paymentResult.mobileProvider,
        mobileNumber: paymentResult.mobileNumber,
        mobileReference: paymentResult.reference,
        splitPayments:
          paymentResult.paymentMethod === 'multiple'
            ? [
                ...(paymentResult.cashAmount
                  ? [
                      {
                        method: 'cash' as const,
                        amount: paymentResult.cashAmount,
                        details: {},
                      },
                    ]
                  : []),
                ...(paymentResult.cardAmount
                  ? [
                      {
                        method: 'card' as const,
                        amount: paymentResult.cardAmount,
                        details: {
                          cardType: paymentResult.cardType,
                          cardLast4: paymentResult.cardLastFour,
                        },
                      },
                    ]
                  : []),
                ...(paymentResult.mobileAmount
                  ? [
                      {
                        method: 'mobile' as const,
                        amount: paymentResult.mobileAmount,
                        details: {
                          provider: paymentResult.mobileProvider,
                          number: paymentResult.mobileNumber,
                        },
                      },
                    ]
                  : []),
              ]
            : undefined,
      },
      customerId: currentCartState.customerId,
      customerName: currentCartState.customerName,
      cashierId: 'CASH001', // TODO: Get from auth service
      cashierName: 'Current User', // TODO: Get from auth service
      tenantId: 'TENANT001', // TODO: Get from auth service
      storeName: 'Paradise POS',
      status: 'completed',
    };

    // Save transaction to backend
    this.transactionService.saveTransaction(transaction).subscribe({
      next: (savedTransaction) => {
        console.log('Transaction saved:', savedTransaction);

        // Dispatch checkout success
        this.store.dispatch(
          CartActions.checkoutSuccess({ transactionId: savedTransaction.id })
        );

        // Show success message
        this.showSnackBar(
          `Payment successful! Transaction: ${savedTransaction.transactionNumber}`,
          'success'
        );

        // Open receipt dialog
        this.openReceiptDialog(savedTransaction);
      },
      error: (error) => {
        console.error('Error saving transaction:', error);
        this.showSnackBar(
          'Payment processed but failed to save transaction',
          'warning'
        );

        // Still open receipt dialog with local transaction
        this.openReceiptDialog(transaction);
      },
    });
  }

  openReceiptDialog(transaction: Transaction): void {
    const dialogData: ReceiptDialogData = {
      transaction: transaction,
    };

    const dialogRef = this.dialog.open(ReceiptDialogComponent, {
      width: '1000px',
      maxWidth: '95vw',
      data: dialogData,
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'printed') {
        this.showSnackBar('Receipt printed successfully', 'success');
      }
    });
  }

  // Utility
  private showSnackBar(
    message: string,
    type: 'success' | 'error' | 'info' | 'warning'
  ): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: `${type}-snackbar`,
    });
  }

  // Format currency
  formatCurrency(amount: number): string {
    return `LKR ${amount.toFixed(2)}`;
  }

  getPricingLabel(item: CartItem): string {
    return item.pricingType === 'loyalty' ? 'Loyalty price' : 'Retail price';
  }

  // Quick Actions
  holdSale(): void {
    // Save current cart state to local storage or backend
    this.store
      .select(CartSelectors.selectCartSummary)
      .pipe(takeUntil(this.destroy$))
      .subscribe((summary) => {
        const heldSale = {
          id: `HELD-${Date.now()}`,
          timestamp: new Date(),
          summary: summary,
        };

        // Save to local storage
        const heldSales = JSON.parse(localStorage.getItem('heldSales') || '[]');
        heldSales.push(heldSale);
        localStorage.setItem('heldSales', JSON.stringify(heldSales));

        this.showSnackBar('Sale held successfully', 'success');
        this.store.dispatch(CartActions.clearCart());
      });
  }

  recallCart(): void {
    // Retrieve held sales from local storage
    const heldSales = JSON.parse(localStorage.getItem('heldSales') || '[]');

    if (heldSales.length === 0) {
      this.showSnackBar('No held sales available', 'info');
      return;
    }

    // For now, recall the most recent one
    // TODO: Show dialog with list of held sales to choose from
    const lastHeldSale = heldSales[heldSales.length - 1];

    // Restore cart items
    if (lastHeldSale.summary && lastHeldSale.summary.items) {
      lastHeldSale.summary.items.forEach((item: CartItem) => {
        this.store.dispatch(
          CartActions.addToCart({
            product: item.product,
            quantity: item.quantity,
          })
        );
      });

      // Remove from held sales
      heldSales.pop();
      localStorage.setItem('heldSales', JSON.stringify(heldSales));

      this.showSnackBar('Cart recalled successfully', 'success');
    }
  }

  attachCustomer(): void {
    const dialogRef = this.dialog.open(CustomerDialogComponent, {
      width: '560px',
      maxWidth: '95vw',
      disableClose: false,
    });

    dialogRef.afterClosed().subscribe((result: CustomerDialogResult) => {
      if (result?.customer) {
        const customerName =
          `${result.customer.firstName || ''} ${
            result.customer.lastName || ''
          }`.trim() ||
          result.customer.phone ||
          'Customer';

        // Dispatch action to attach customer to cart
        this.store.dispatch(
          CartActions.setCustomer({
            customerId: result.customer.id || '',
            customerName: customerName,
          })
        );

        this.showSnackBar(`${customerName} attached to order`, 'success');
      }
    });
  }

  removeCustomer(): void {
    this.store.dispatch(CartActions.removeCustomer());
    this.showSnackBar('Customer removed from order', 'info');
  }

  applyDiscount(): void {
    // TODO: Open discount dialog
    const discountPercentage = prompt('Enter discount percentage (0-100):');

    if (discountPercentage) {
      const discount = parseFloat(discountPercentage);
      if (!isNaN(discount) && discount >= 0 && discount <= 100) {
        this.store.dispatch(
          CartActions.applyDiscount({
            discountType: 'percentage',
            discountValue: discount,
          })
        );
        this.showSnackBar(`${discount}% discount applied`, 'success');
      } else {
        this.showSnackBar('Invalid discount value', 'error');
      }
    }
  }

  addNotes(): void {
    // TODO: Open notes dialog
    const notes = prompt('Add notes for this transaction:');

    if (notes) {
      // TODO: Store notes in cart state
      this.showSnackBar('Notes added successfully', 'success');
    }
  }

  printQuote(): void {
    // Generate quote from current cart
    this.store
      .select(CartSelectors.selectCartSummary)
      .pipe(takeUntil(this.destroy$))
      .subscribe((summary) => {
        // TODO: Open quote print dialog
        this.showSnackBar('Quote printing coming soon', 'info');
        console.log('Quote data:', summary);
      });
  }
}
