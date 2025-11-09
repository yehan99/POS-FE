import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { InventoryDashboardComponent } from './inventory-dashboard/inventory-dashboard.component';
import { StockAdjustmentsComponent } from './stock-adjustments/stock-adjustments.component';
import { StockTransfersComponent } from './stock-transfers/stock-transfers.component';
import { SuppliersComponent } from './suppliers/suppliers.component';
import { PurchaseOrdersComponent } from './purchase-orders/purchase-orders.component';
import { StockAlertsComponent } from './stock-alerts/stock-alerts.component';

const routes: Routes = [
  {
    path: '',
    component: InventoryDashboardComponent,
  },
  {
    path: 'adjustments',
    component: StockAdjustmentsComponent,
  },
  {
    path: 'transfers',
    component: StockTransfersComponent,
  },
  {
    path: 'suppliers',
    component: SuppliersComponent,
  },
  {
    path: 'purchase-orders',
    component: PurchaseOrdersComponent,
  },
  {
    path: 'alerts',
    component: StockAlertsComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class InventoryRoutingModule {}
