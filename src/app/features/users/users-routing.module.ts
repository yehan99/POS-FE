import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { UserManagementComponent } from './user-management/user-management.component';

const routes: Routes = [
  {
    path: '',
    component: UserManagementComponent,
    title: 'User Management - Paradise POS',
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class UsersRoutingModule {}
