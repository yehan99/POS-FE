import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProductListComponent } from './product-list/product-list.component';
import { ProductFormComponent } from './product-form/product-form.component';
import { CategoryManagementComponent } from './category-management/category-management.component';

const routes: Routes = [
  {
    path: '',
    component: ProductListComponent,
    title: 'Product Management',
  },
  {
    path: 'new',
    component: ProductFormComponent,
    title: 'Add Product',
  },
  {
    path: 'edit/:id',
    component: ProductFormComponent,
    title: 'Edit Product',
  },
  {
    path: 'categories',
    component: CategoryManagementComponent,
    title: 'Category Management',
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ProductsRoutingModule {}
