import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { StoreModule } from '@ngrx/store';

import { PosRoutingModule } from './pos-routing.module';
import { SharedModule } from '../../shared/shared.module';
import { CheckoutComponent } from './checkout/checkout.component';
import { ProductSearchComponent } from './product-search/product-search.component';
import { PaymentDialogComponent } from './payment-dialog/payment-dialog.component';
import { cartReducer } from './store/cart.reducer';
import { ReceiptDialogComponent } from './receipt-dialog/receipt-dialog.component';
import { TransactionHistoryComponent } from './transaction-history/transaction-history.component';
import { ProductSearchLookupComponent } from './product-search-lookup/product-search-lookup.component';

@NgModule({
  declarations: [
    CheckoutComponent,
    ProductSearchComponent,
    PaymentDialogComponent,
    ReceiptDialogComponent,
    TransactionHistoryComponent,
    ProductSearchLookupComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    PosRoutingModule,
    StoreModule.forFeature('cart', cartReducer),
  ],
})
export class PosModule {}
