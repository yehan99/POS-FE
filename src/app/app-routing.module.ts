import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { LocalizationDemoComponent } from './shared/components/localization-demo/localization-demo.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: '/pos',
    pathMatch: 'full',
  },
  {
    path: 'localization-demo',
    component: LocalizationDemoComponent,
  },
  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/auth.module').then((m) => m.AuthModule),
  },
  {
    path: 'pos',
    //canActivate: [AuthGuard],
    loadChildren: () =>
      import('./features/pos/pos.module').then((m) => m.PosModule),
  },
  {
    path: 'products',
    //canActivate: [AuthGuard],
    loadChildren: () =>
      import('./features/products/products.module').then(
        (m) => m.ProductsModule
      ),
  },
  {
    path: 'customers',
    //canActivate: [AuthGuard],
    loadChildren: () =>
      import('./features/customers/customers.module').then(
        (m) => m.CustomersModule
      ),
  },
  {
    path: 'inventory',
    //canActivate: [AuthGuard],
    loadChildren: () =>
      import('./features/inventory/inventory.module').then(
        (m) => m.InventoryModule
      ),
  },
  {
    path: 'reports',
    //canActivate: [AuthGuard],
    loadChildren: () =>
      import('./features/reports/reports.module').then((m) => m.ReportsModule),
  },
  {
    path: 'dashboard',
    //canActivate: [AuthGuard],
    loadChildren: () =>
      import('./features/dashboard/dashboard.module').then(
        (m) => m.DashboardModule
      ),
  },
  {
    path: 'hardware',
    //canActivate: [AuthGuard],
    loadChildren: () =>
      import('./features/hardware/hardware.module').then(
        (m) => m.HardwareModule
      ),
  },
  {
    path: '**',
    redirectTo: '/auth/login',
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
