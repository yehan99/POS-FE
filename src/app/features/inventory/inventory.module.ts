import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SharedModule } from '../../shared/shared.module';

import { InventoryRoutingModule } from './inventory-routing.module';
import { StockAdjustmentsComponent } from './stock-adjustments/stock-adjustments.component';
import { StockTransfersComponent } from './stock-transfers/stock-transfers.component';
import { SuppliersComponent } from './suppliers/suppliers.component';
import { PurchaseOrdersComponent } from './purchase-orders/purchase-orders.component';
import { StockAlertsComponent } from './stock-alerts/stock-alerts.component';
import { InventoryDashboardComponent } from './inventory-dashboard/inventory-dashboard.component';
import { SupplierFormDialogComponent } from './suppliers/dialogs/supplier-form-dialog/supplier-form-dialog.component';
import { SupplierDetailDialogComponent } from './suppliers/dialogs/supplier-detail-dialog/supplier-detail-dialog.component';
import { PurchaseOrderFormDialogComponent } from './purchase-orders/dialogs/purchase-order-form-dialog/purchase-order-form-dialog.component';
import { ReceivePurchaseOrderDialogComponent } from './purchase-orders/dialogs/receive-purchase-order-dialog/receive-purchase-order-dialog.component';

@NgModule({
  declarations: [
    StockAdjustmentsComponent,
    StockTransfersComponent,
    SuppliersComponent,
    PurchaseOrdersComponent,
    StockAlertsComponent,
    InventoryDashboardComponent,
    SupplierFormDialogComponent,
    SupplierDetailDialogComponent,
    PurchaseOrderFormDialogComponent,
    ReceivePurchaseOrderDialogComponent,
  ],
  imports: [
    CommonModule,
    InventoryRoutingModule,
    SharedModule,
    ReactiveFormsModule,
    FormsModule,
  ],
})
export class InventoryModule {}
