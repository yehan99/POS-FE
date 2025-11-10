import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { RoleService } from '../../../core/services/role.service';
import {
  Role,
  Permission,
  PermissionCategory,
  getPermissionsByCategory,
  ALL_PERMISSIONS,
} from '../../../core/models/role.model';

interface CategoryPermissionGroup {
  category: PermissionCategory;
  permissions: Permission[];
  allSelected: boolean;
  indeterminate: boolean;
}

@Component({
  selector: 'app-role-editor',
  templateUrl: './role-editor.component.html',
  styleUrls: ['./role-editor.component.scss'],
})
export class RoleEditorComponent implements OnInit, OnDestroy {
  roleForm!: FormGroup;
  permissionGroups: CategoryPermissionGroup[] = [];
  isEditMode = false;
  isSystemRole = false;
  roleId: string | null = null;
  loading = false;
  saving = false;

  // Color options for role
  colorOptions = [
    { value: '#667eea', label: 'Purple' },
    { value: '#4caf50', label: 'Green' },
    { value: '#2196f3', label: 'Blue' },
    { value: '#ff9800', label: 'Orange' },
    { value: '#f44336', label: 'Red' },
    { value: '#9c27b0', label: 'Deep Purple' },
    { value: '#00bcd4', label: 'Cyan' },
    { value: '#009688', label: 'Teal' },
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private roleService: RoleService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.initializePermissionGroups();
    this.checkEditMode();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.roleForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      color: ['#667eea', Validators.required],
      priority: [
        50,
        [Validators.required, Validators.min(0), Validators.max(100)],
      ],
      isActive: [true],
    });
  }

  private initializePermissionGroups(): void {
    // Get permission groups by category from model
    const groupsByCategory = getPermissionsByCategory();

    // Transform to our component structure with selection state
    this.permissionGroups = groupsByCategory.map((group) => ({
      category: group.category,
      permissions: group.permissions.map(
        (p) => ({ ...p, selected: false } as any)
      ),
      allSelected: false,
      indeterminate: false,
    }));
  }

  private checkEditMode(): void {
    this.roleId = this.route.snapshot.paramMap.get('id');

    if (this.roleId) {
      this.isEditMode = true;
      this.loadRole(this.roleId);
    }
  }

  private loadRole(roleId: string): void {
    this.loading = true;

    const role = this.roleService.getRole(roleId);

    if (role) {
      this.populateForm(role);
      this.isSystemRole = role.isSystemRole;

      if (this.isSystemRole) {
        this.roleForm.disable();
      }
    } else {
      this.showError('Role not found');
      this.router.navigate(['/roles']);
    }

    this.loading = false;
  }

  private populateForm(role: Role): void {
    this.roleForm.patchValue({
      name: role.name,
      description: role.description,
      color: role.color || '#667eea',
      priority: role.priority,
      isActive: role.isActive,
    });

    // Set selected permissions
    this.permissionGroups.forEach((group) => {
      group.permissions.forEach((permission) => {
        const isSelected = role.permissions.includes(permission.id);
        (permission as any).selected = isSelected;
      });
      this.updateGroupSelection(group);
    });
  }

  onPermissionChange(
    group: CategoryPermissionGroup,
    permission: Permission
  ): void {
    (permission as any).selected = !(permission as any).selected;
    this.updateGroupSelection(group);
  }

  onGroupSelectAll(group: CategoryPermissionGroup): void {
    const selectAll = !group.allSelected;

    group.permissions.forEach((permission) => {
      (permission as any).selected = selectAll;
    });

    this.updateGroupSelection(group);
  }

  private updateGroupSelection(group: CategoryPermissionGroup): void {
    const selectedCount = group.permissions.filter(
      (p) => (p as any).selected
    ).length;
    const totalCount = group.permissions.length;

    group.allSelected = selectedCount === totalCount;
    group.indeterminate = selectedCount > 0 && selectedCount < totalCount;
  }

  selectAllPermissions(): void {
    this.permissionGroups.forEach((group) => {
      group.permissions.forEach((permission) => {
        (permission as any).selected = true;
      });
      this.updateGroupSelection(group);
    });
    this.showSuccess('All permissions selected');
  }

  deselectAllPermissions(): void {
    this.permissionGroups.forEach((group) => {
      group.permissions.forEach((permission) => {
        (permission as any).selected = false;
      });
      this.updateGroupSelection(group);
    });
    this.showSuccess('All permissions deselected');
  }

  getSelectedPermissions(): string[] {
    const selected: string[] = [];

    this.permissionGroups.forEach((group) => {
      group.permissions.forEach((permission) => {
        if ((permission as any).selected) {
          selected.push(permission.id);
        }
      });
    });

    return selected;
  }

  getSelectedPermissionCount(): number {
    return this.getSelectedPermissions().length;
  }

  onSubmit(): void {
    if (this.roleForm.invalid) {
      this.markFormGroupTouched(this.roleForm);
      this.showError('Please fill all required fields correctly');
      return;
    }

    const selectedPermissions = this.getSelectedPermissions();

    if (selectedPermissions.length === 0) {
      this.showError('Please select at least one permission');
      return;
    }

    this.saving = true;

    const formValue = this.roleForm.value;
    const roleData: Partial<Role> = {
      name: formValue.name,
      description: formValue.description,
      permissions: selectedPermissions,
      color: formValue.color,
      priority: formValue.priority,
      isActive: formValue.isActive,
    };

    if (this.isEditMode && this.roleId) {
      this.updateRole(this.roleId, roleData);
    } else {
      this.createRole(roleData);
    }
  }

  private createRole(roleData: Partial<Role>): void {
    const newRole: Omit<Role, 'id'> = {
      name: roleData.name!,
      description: roleData.description!,
      permissions: roleData.permissions!,
      color: roleData.color,
      priority: roleData.priority!,
      isActive: roleData.isActive!,
      isSystemRole: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const created = this.roleService.createRole(newRole);

    if (created) {
      this.showSuccess('Role created successfully');
      this.router.navigate(['/roles']);
    } else {
      this.showError('Failed to create role');
    }

    this.saving = false;
  }

  private updateRole(roleId: string, roleData: Partial<Role>): void {
    const result = this.roleService.updateRole(roleId, roleData);

    if (result) {
      this.showSuccess('Role updated successfully');
      this.router.navigate(['/roles']);
    } else {
      this.showError('Failed to update role');
    }

    this.saving = false;
  }

  onCancel(): void {
    if (this.roleForm.dirty || this.hasPermissionChanges()) {
      if (
        confirm('You have unsaved changes. Are you sure you want to leave?')
      ) {
        this.router.navigate(['/roles']);
      }
    } else {
      this.router.navigate(['/roles']);
    }
  }

  private hasPermissionChanges(): boolean {
    // Simple check - in production you'd compare with original state
    return this.getSelectedPermissionCount() > 0;
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  getCategoryIcon(category: PermissionCategory): string {
    const icons: Record<PermissionCategory, string> = {
      [PermissionCategory.SALES]: 'shopping_cart',
      [PermissionCategory.INVENTORY]: 'inventory_2',
      [PermissionCategory.CUSTOMERS]: 'people',
      [PermissionCategory.REPORTS]: 'assessment',
      [PermissionCategory.ADMINISTRATION]: 'admin_panel_settings',
      [PermissionCategory.SETTINGS]: 'settings',
    };
    return icons[category];
  }

  getCategoryColor(category: PermissionCategory): string {
    const colors: Record<PermissionCategory, string> = {
      [PermissionCategory.SALES]: '#4caf50',
      [PermissionCategory.INVENTORY]: '#2196f3',
      [PermissionCategory.CUSTOMERS]: '#ff9800',
      [PermissionCategory.REPORTS]: '#9c27b0',
      [PermissionCategory.ADMINISTRATION]: '#f44336',
      [PermissionCategory.SETTINGS]: '#607d8b',
    };
    return colors[category];
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar'],
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar'],
    });
  }
}
