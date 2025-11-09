import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ReportsDashboardComponent } from './reports-dashboard/reports-dashboard.component';
import { SalesReportsComponent } from './sales-reports/sales-reports.component';
import { InventoryReportsComponent } from './inventory-reports/inventory-reports.component';
import { CustomerReportsComponent } from './customer-reports/customer-reports.component';
import { ProductPerformanceComponent } from './product-performance/product-performance.component';

const routes: Routes = [
  {
    path: '',
    component: ReportsDashboardComponent,
  },
  {
    path: 'sales',
    component: SalesReportsComponent,
  },
  {
    path: 'inventory',
    component: InventoryReportsComponent,
  },
  {
    path: 'customers',
    component: CustomerReportsComponent,
  },
  {
    path: 'products',
    component: ProductPerformanceComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ReportsRoutingModule {}
