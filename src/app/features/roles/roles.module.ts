import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { RolesRoutingModule } from './roles-routing.module';
import { SharedModule } from '../../shared/shared.module';
import { RoleListComponent } from './role-list/role-list.component';
import { RoleEditorComponent } from './role-editor/role-editor.component';
import { PermissionMatrixComponent } from './permission-matrix/permission-matrix.component';

@NgModule({
  declarations: [RoleListComponent, PermissionMatrixComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RolesRoutingModule,
    SharedModule,
    RoleEditorComponent,
  ],
})
export class RolesModule {}
