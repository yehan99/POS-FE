import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SharedModule } from '../../shared/shared.module';

import { ReportsRoutingModule } from './reports-routing.module';
import { ReportsDashboardComponent } from './reports-dashboard/reports-dashboard.component';
import { SalesReportsComponent } from './sales-reports/sales-reports.component';
import { InventoryReportsComponent } from './inventory-reports/inventory-reports.component';
import { CustomerReportsComponent } from './customer-reports/customer-reports.component';
import { ProductPerformanceComponent } from './product-performance/product-performance.component';

@NgModule({
  declarations: [
    ReportsDashboardComponent,
    SalesReportsComponent,
    InventoryReportsComponent,
    CustomerReportsComponent,
    ProductPerformanceComponent,
  ],
  imports: [
    CommonModule,
    ReportsRoutingModule,
    SharedModule,
    ReactiveFormsModule,
    FormsModule,
  ],
})
export class ReportsModule {}
