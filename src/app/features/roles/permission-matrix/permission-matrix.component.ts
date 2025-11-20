import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription, forkJoin } from 'rxjs';
import {
  PermissionMatrixActionState,
  PermissionMatrixModule,
  RolePermissionMatrixRow,
  RoleSummary,
} from '../../../core/models/role-management.model';
import { RoleManagementService } from '../../../core/services/role-management.service';

interface SnapshotCard {
  label: string;
  value: string;
  helper: string;
  icon: string;
  accent: 'indigo' | 'teal' | 'amber' | 'rose';
}

@Component({
  selector: 'app-permission-matrix',
  standalone: false,
  templateUrl: './permission-matrix.component.html',
  styleUrl: './permission-matrix.component.scss',
})
export class PermissionMatrixComponent implements OnInit, OnDestroy {
  roles: RoleSummary[] = [];
  modules: PermissionMatrixModule[] = [];
  matrixState: Record<string, PermissionMatrixActionState> = {};

  selectedRoleId: string | null = null;
  isLoading = false;
  isSaving = false;
  error?: string;

  private subscriptions: Subscription[] = [];

  constructor(
    private readonly roleService: RoleManagementService,
    private readonly snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.fetchInitialData();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  get selectedRole(): RoleSummary | undefined {
    return this.roles.find((role) => role.id === this.selectedRoleId);
  }

  get snapshotCards(): SnapshotCard[] {
    const totalModules = this.modules.length;
    const viewCount = this.countAction('view');
    const writeCount = this.countAction('write');
    const deleteCount = this.countAction('delete');
    const permissionCount = this.selectedRole?.permissions.length ?? 0;

    return [
      {
        label: 'Modules with view',
        value: totalModules ? `${viewCount}/${totalModules}` : '0',
        helper: 'Read-only coverage',
        icon: 'visibility',
        accent: 'indigo',
      },
      {
        label: 'Editable modules',
        value: writeCount.toString(),
        helper: 'Write access enabled',
        icon: 'edit_square',
        accent: 'teal',
      },
      {
        label: 'Delete capable',
        value: deleteCount.toString(),
        helper: 'Can archive/remove',
        icon: 'delete',
        accent: 'amber',
      },
      {
        label: 'Permission slugs',
        value: permissionCount.toString(),
        helper: 'Mapped API abilities',
        icon: 'key',
        accent: 'rose',
      },
    ];
  }

  get matrixLegend(): Array<{ label: string; count: number; icon: string }> {
    return [
      { label: 'View', count: this.countAction('view'), icon: 'visibility' },
      { label: 'Write', count: this.countAction('write'), icon: 'edit' },
      { label: 'Delete', count: this.countAction('delete'), icon: 'delete' },
    ];
  }

  onRoleChange(roleId: string): void {
    this.selectedRoleId = roleId;
    const role = this.selectedRole;
    if (role) {
      this.matrixState = this.buildMatrixFromRole(role);
    }
  }

  togglePermission(
    key: string,
    action: keyof PermissionMatrixActionState,
    value: boolean
  ): void {
    const moduleState = { ...this.matrixState[key] };
    moduleState[action] = value;

    if (action === 'write' && value) {
      moduleState.view = true;
    }

    if (action === 'delete') {
      if (value) {
        moduleState.write = true;
        moduleState.view = true;
      }
    } else if (action === 'write' && !value) {
      moduleState.delete = false;
    } else if (action === 'view' && !value) {
      moduleState.write = false;
      moduleState.delete = false;
    }

    this.matrixState = {
      ...this.matrixState,
      [key]: moduleState,
    };
  }

  isActionDisabled(
    module: PermissionMatrixModule,
    action: keyof PermissionMatrixActionState
  ): boolean {
    return !module.capabilities[action];
  }

  resetMatrix(): void {
    if (!this.selectedRole) {
      return;
    }

    this.matrixState = this.buildMatrixFromRole(this.selectedRole);
  }

  save(): void {
    if (!this.selectedRoleId) {
      return;
    }

    this.isSaving = true;
    const matrixPayload: RolePermissionMatrixRow[] = this.modules.map(
      (module) => ({
        key: module.key,
        view: this.matrixState[module.key]?.view ?? false,
        write: this.matrixState[module.key]?.write ?? false,
        delete: this.matrixState[module.key]?.delete ?? false,
      })
    );

    const sub = this.roleService
      .updateRolePermissions(this.selectedRoleId, matrixPayload)
      .subscribe({
        next: (updatedRole) => {
          this.isSaving = false;
          this.error = undefined;
          this.roles = this.roles.map((role) =>
            role.id === updatedRole.id ? updatedRole : role
          );
          this.matrixState = this.buildMatrixFromRole(updatedRole);
          this.snackBar.open('Role permissions updated.', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar'],
          });
        },
        error: (err) => {
          this.isSaving = false;
          this.error = err?.error?.message || 'Unable to update permissions.';
          this.snackBar.open(
            this.error ?? 'Unable to update permissions.',
            'Close',
            {
              duration: 4000,
              panelClass: ['error-snackbar'],
            }
          );
        },
      });

    this.subscriptions.push(sub);
  }

  trackByModule = (_: number, module: PermissionMatrixModule): string =>
    module.key;

  private fetchInitialData(): void {
    this.isLoading = true;
    const sub = forkJoin({
      roles: this.roleService.getRoles(),
      modules: this.roleService.getPermissionModules(),
    }).subscribe({
      next: ({ roles, modules }) => {
        this.roles = roles;
        this.modules = modules.modules;
        this.selectedRoleId = roles[0]?.id ?? null;

        if (this.selectedRoleId) {
          this.matrixState = this.buildMatrixFromRole(roles[0]);
        }

        this.isLoading = false;
      },
      error: (error) => {
        this.error = error?.error?.message || 'Failed to load role data.';
        this.isLoading = false;
        this.snackBar.open(this.error ?? 'Failed to load role data.', 'Close', {
          duration: 4000,
          panelClass: ['error-snackbar'],
        });
      },
    });

    this.subscriptions.push(sub);
  }

  private buildMatrixFromRole(
    role: RoleSummary
  ): Record<string, PermissionMatrixActionState> {
    const matrix: Record<string, PermissionMatrixActionState> = {};

    role.matrix.forEach((module) => {
      matrix[module.key] = {
        view: module.matrix.view,
        write: module.matrix.write,
        delete: module.matrix.delete,
      };
    });

    // Ensure modules without entries still have defaults
    this.modules.forEach((module) => {
      if (!matrix[module.key]) {
        matrix[module.key] = { view: false, write: false, delete: false };
      }
    });

    return matrix;
  }

  private countAction(action: keyof PermissionMatrixActionState): number {
    if (!this.modules.length) {
      return 0;
    }

    return this.modules.reduce((total, module) => {
      return total + (this.matrixState[module.key]?.[action] ? 1 : 0);
    }, 0);
  }
}
