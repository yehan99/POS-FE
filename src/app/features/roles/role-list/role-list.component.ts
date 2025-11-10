import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { RoleService } from '../../../core/services/role.service';
import { Role, RoleStatistics } from '../../../core/models/role.model';

@Component({
  selector: 'app-role-list',
  standalone: false,
  templateUrl: './role-list.component.html',
  styleUrl: './role-list.component.scss',
})
export class RoleListComponent implements OnInit, OnDestroy {
  roles: Role[] = [];
  filteredRoles: Role[] = [];
  roleStatistics: RoleStatistics[] = [];
  searchQuery = '';
  filterStatus: 'all' | 'active' | 'inactive' = 'all';
  loading = false;

  // Subscriptions
  private subscriptions: Subscription[] = [];

  constructor(
    private roleService: RoleService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadRoles();
    this.loadStatistics();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  loadRoles(): void {
    this.loading = true;
    this.subscriptions.push(
      this.roleService.getRoles().subscribe((roles) => {
        this.roles = roles;
        this.applyFilters();
        this.loading = false;
      })
    );
  }

  loadStatistics(): void {
    this.subscriptions.push(
      this.roleService.getRoleStatistics().subscribe((stats) => {
        this.roleStatistics = stats;
      })
    );
  }

  applyFilters(): void {
    let filtered = [...this.roles];

    // Filter by status
    if (this.filterStatus !== 'all') {
      const isActive = this.filterStatus === 'active';
      filtered = filtered.filter((role) => role.isActive === isActive);
    }

    // Filter by search query
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (role) =>
          role.name.toLowerCase().includes(query) ||
          role.description.toLowerCase().includes(query)
      );
    }

    // Sort by priority (highest first)
    filtered.sort((a, b) => b.priority - a.priority);

    this.filteredRoles = filtered;
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onFilterStatusChange(): void {
    this.applyFilters();
  }

  createRole(): void {
    this.router.navigate(['/roles/create']);
  }

  editRole(role: Role): void {
    this.router.navigate(['/roles/edit', role.id]);
  }

  viewPermissions(role: Role): void {
    this.router.navigate(['/roles/permissions', role.id]);
  }

  duplicateRole(role: Role): void {
    const duplicated = this.roleService.duplicateRole(role.id);
    if (duplicated) {
      this.showSuccess(`Role "${role.name}" duplicated successfully`);
      this.loadRoles();
    } else {
      this.showError('Failed to duplicate role');
    }
  }

  toggleRoleStatus(role: Role): void {
    const updated = this.roleService.updateRole(role.id, {
      isActive: !role.isActive,
    });
    if (updated) {
      this.showSuccess(
        `Role ${updated.isActive ? 'activated' : 'deactivated'} successfully`
      );
    }
  }

  deleteRole(role: Role): void {
    if (role.isSystemRole) {
      this.showError('Cannot delete system role');
      return;
    }

    const stats = this.roleStatistics.find((s) => s.roleId === role.id);
    if (stats && stats.userCount > 0) {
      this.showError(
        `Cannot delete role assigned to ${stats.userCount} user(s)`
      );
      return;
    }

    const confirmed = confirm(
      `Are you sure you want to delete the role "${role.name}"?`
    );
    if (!confirmed) return;

    const success = this.roleService.deleteRole(role.id);
    if (success) {
      this.showSuccess('Role deleted successfully');
      this.loadRoles();
    } else {
      this.showError('Failed to delete role');
    }
  }

  exportRole(role: Role): void {
    const json = this.roleService.exportRole(role.id);
    if (json) {
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${role.name}.json`;
      a.click();
      URL.revokeObjectURL(url);
      this.showSuccess('Role exported successfully');
    }
  }

  importRole(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      const json = e.target?.result as string;
      const imported = this.roleService.importRole(json);
      if (imported) {
        this.showSuccess('Role imported successfully');
        this.loadRoles();
      } else {
        this.showError('Failed to import role');
      }
    };

    reader.readAsText(file);
    input.value = ''; // Reset input
  }

  getRoleStats(roleId: string): RoleStatistics | undefined {
    return this.roleStatistics.find((s) => s.roleId === roleId);
  }

  getStatusColor(role: Role): string {
    if (!role.isActive) return 'gray';
    if (role.priority >= 90) return 'error';
    if (role.priority >= 70) return 'warn';
    return 'primary';
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: 'success-snackbar',
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: 'error-snackbar',
    });
  }

  // Helper method for template filtering
  filterRolesByProperty(
    roles: Role[],
    property: keyof Role,
    value: any
  ): Role[] {
    return roles.filter((role) => role[property] === value);
  }
}
