import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PermissionMatrixComponent } from './permission-matrix/permission-matrix.component';

const routes: Routes = [
  {
    path: '',
    component: PermissionMatrixComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RolesRoutingModule {}
