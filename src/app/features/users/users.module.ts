import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { SharedModule } from '../../shared/shared.module';
import { UsersRoutingModule } from './users-routing.module';
import { UserManagementComponent } from './user-management/user-management.component';

@NgModule({
  declarations: [UserManagementComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SharedModule,
    UsersRoutingModule,
  ],
})
export class UsersModule {}
