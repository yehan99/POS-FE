import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LocalizationDemoComponent } from './shared/components/localization-demo/localization-demo.component';
import { SuperAdminGuard } from './core/guards/super-admin.guard';
import { PermissionGuard } from './core/guards/permission.guard';

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
    canActivate: [PermissionGuard],
    data: { permissionsAny: ['sale.read', 'sale.create'] },
    loadChildren: () =>
      import('./features/pos/pos.module').then((m) => m.PosModule),
  },
  {
    path: 'products',
    canActivate: [PermissionGuard],
    data: { permissionsAny: ['product.read'] },
    loadChildren: () =>
      import('./features/products/products.module').then(
        (m) => m.ProductsModule
      ),
  },
  {
    path: 'customers',
    canActivate: [PermissionGuard],
    data: { permissionsAny: ['customer.read', 'customer.loyalty.read'] },
    loadChildren: () =>
      import('./features/customers/customers.module').then(
        (m) => m.CustomersModule
      ),
  },
  {
    path: 'inventory',
    canActivate: [PermissionGuard],
    data: { permissionsAny: ['inventory.read'] },
    loadChildren: () =>
      import('./features/inventory/inventory.module').then(
        (m) => m.InventoryModule
      ),
  },
  {
    path: 'reports',
    canActivate: [PermissionGuard],
    data: {
      permissionsAny: [
        'report.sales',
        'report.inventory',
        'report.customers',
        'report.financial',
      ],
    },
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
    canActivate: [PermissionGuard],
    data: { permissionsAny: ['settings.read', 'settings.update'] },
    loadChildren: () =>
      import('./features/hardware/hardware.module').then(
        (m) => m.HardwareModule
      ),
  },
  {
    path: 'users',
    canActivate: [PermissionGuard],
    data: { permissionsAny: ['user.management'] },
    loadChildren: () =>
      import('./features/users/users.module').then((m) => m.UsersModule),
  },
  {
    path: 'settings',
    canActivate: [PermissionGuard],
    data: { permissionsAny: ['settings.read', 'settings.update'] },
    loadChildren: () =>
      import('./features/settings/settings.module').then(
        (m) => m.SettingsModule
      ),
  },
  {
    path: 'roles',
    canActivate: [SuperAdminGuard],
    loadChildren: () =>
      import('./features/roles/roles.module').then((m) => m.RolesModule),
  },
  {
    path: 'profile',
    //canActivate: [AuthGuard],
    loadChildren: () =>
      import('./features/profile/profile.module').then((m) => m.ProfileModule),
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
