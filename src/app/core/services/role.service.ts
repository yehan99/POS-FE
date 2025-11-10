import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  Role,
  Permission,
  UserRole,
  RoleStatistics,
  PermissionCheckResult,
  ALL_PERMISSIONS,
  DEFAULT_ROLE_TEMPLATES,
  SYSTEM_ROLES,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
} from '../models/role.model';

@Injectable({
  providedIn: 'root',
})
export class RoleService {
  private roles$ = new BehaviorSubject<Role[]>([]);
  private userRoles$ = new BehaviorSubject<UserRole[]>([]);
  private currentUserPermissions$ = new BehaviorSubject<string[]>([]);

  private readonly ROLES_STORAGE_KEY = 'pos_roles';
  private readonly USER_ROLES_STORAGE_KEY = 'pos_user_roles';
  private readonly CURRENT_USER_PERMISSIONS_KEY =
    'pos_current_user_permissions';

  constructor() {
    this.initializeService();
  }

  /**
   * Initialize service and load data
   */
  private initializeService(): void {
    this.loadRolesFromStorage();
    this.loadUserRolesFromStorage();
    this.loadCurrentUserPermissions();
  }

  /**
   * Load roles from localStorage
   */
  private loadRolesFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.ROLES_STORAGE_KEY);
      if (stored) {
        const roles = JSON.parse(stored, this.dateReviver);
        this.roles$.next(roles);
      } else {
        // Initialize with default role templates
        this.initializeDefaultRoles();
      }
    } catch (error) {
      console.error('Failed to load roles:', error);
      this.initializeDefaultRoles();
    }
  }

  /**
   * Initialize default roles
   */
  private initializeDefaultRoles(): void {
    const defaultRoles: Role[] = DEFAULT_ROLE_TEMPLATES.map(
      (template, index) => ({
        id: `role-${Date.now()}-${index}`,
        name: template.name,
        description: template.description,
        permissions: template.permissions,
        isSystemRole: index === 0, // Super Admin is system role
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        color: template.color,
        priority: template.priority,
      })
    );

    // Add all permissions to Super Admin
    if (defaultRoles.length > 0) {
      defaultRoles[0].permissions = ALL_PERMISSIONS.map((p) => p.id);
    }

    this.roles$.next(defaultRoles);
    this.saveRolesToStorage();
  }

  /**
   * Save roles to localStorage
   */
  private saveRolesToStorage(): void {
    try {
      const roles = this.roles$.value;
      localStorage.setItem(this.ROLES_STORAGE_KEY, JSON.stringify(roles));
    } catch (error) {
      console.error('Failed to save roles:', error);
    }
  }

  /**
   * Load user roles from localStorage
   */
  private loadUserRolesFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.USER_ROLES_STORAGE_KEY);
      if (stored) {
        const userRoles = JSON.parse(stored, this.dateReviver);
        this.userRoles$.next(userRoles);
      }
    } catch (error) {
      console.error('Failed to load user roles:', error);
    }
  }

  /**
   * Save user roles to localStorage
   */
  private saveUserRolesToStorage(): void {
    try {
      const userRoles = this.userRoles$.value;
      localStorage.setItem(
        this.USER_ROLES_STORAGE_KEY,
        JSON.stringify(userRoles)
      );
    } catch (error) {
      console.error('Failed to save user roles:', error);
    }
  }

  /**
   * Load current user permissions
   */
  private loadCurrentUserPermissions(): void {
    try {
      const stored = localStorage.getItem(this.CURRENT_USER_PERMISSIONS_KEY);
      if (stored) {
        const permissions = JSON.parse(stored);
        this.currentUserPermissions$.next(permissions);
      }
    } catch (error) {
      console.error('Failed to load current user permissions:', error);
    }
  }

  /**
   * Set current user permissions
   */
  setCurrentUserPermissions(permissions: string[]): void {
    this.currentUserPermissions$.next(permissions);
    localStorage.setItem(
      this.CURRENT_USER_PERMISSIONS_KEY,
      JSON.stringify(permissions)
    );
  }

  /**
   * Date reviver for JSON.parse
   */
  private dateReviver(key: string, value: any): any {
    const dateFields = ['createdAt', 'updatedAt', 'assignedAt', 'lastUsed'];
    if (dateFields.includes(key) && typeof value === 'string') {
      return new Date(value);
    }
    return value;
  }

  /**
   * Get all roles
   */
  getRoles(): Observable<Role[]> {
    return this.roles$.asObservable();
  }

  /**
   * Get role by ID
   */
  getRole(id: string): Role | undefined {
    return this.roles$.value.find((r) => r.id === id);
  }

  /**
   * Get active roles only
   */
  getActiveRoles(): Observable<Role[]> {
    return this.roles$.pipe(map((roles) => roles.filter((r) => r.isActive)));
  }

  /**
   * Create new role
   */
  createRole(roleData: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>): Role {
    const newRole: Role = {
      ...roleData,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const roles = this.roles$.value;
    roles.push(newRole);
    this.roles$.next([...roles]);
    this.saveRolesToStorage();

    return newRole;
  }

  /**
   * Update role
   */
  updateRole(id: string, updates: Partial<Role>): Role | null {
    const roles = this.roles$.value;
    const index = roles.findIndex((r) => r.id === id);

    if (index === -1) {
      return null;
    }

    // Prevent modifying system roles
    if (roles[index].isSystemRole && updates.permissions !== undefined) {
      console.warn('Cannot modify system role permissions');
      return null;
    }

    const updatedRole = {
      ...roles[index],
      ...updates,
      id, // Preserve ID
      updatedAt: new Date(),
    };

    roles[index] = updatedRole;
    this.roles$.next([...roles]);
    this.saveRolesToStorage();

    return updatedRole;
  }

  /**
   * Delete role
   */
  deleteRole(id: string): boolean {
    const role = this.getRole(id);
    if (!role) {
      return false;
    }

    // Cannot delete system roles
    if (role.isSystemRole) {
      console.warn('Cannot delete system role');
      return false;
    }

    // Check if role is assigned to users
    const assignedUsers = this.getUsersByRole(id);
    if (assignedUsers.length > 0) {
      console.warn('Cannot delete role assigned to users');
      return false;
    }

    const roles = this.roles$.value.filter((r) => r.id !== id);
    this.roles$.next(roles);
    this.saveRolesToStorage();

    return true;
  }

  /**
   * Duplicate role
   */
  duplicateRole(id: string): Role | null {
    const original = this.getRole(id);
    if (!original) {
      return null;
    }

    const duplicate = this.createRole({
      name: `${original.name} (Copy)`,
      description: original.description,
      permissions: [...original.permissions],
      isSystemRole: false,
      isActive: original.isActive,
      color: original.color,
      priority: original.priority,
    });

    return duplicate;
  }

  /**
   * Get all permissions
   */
  getAllPermissions(): Permission[] {
    return ALL_PERMISSIONS;
  }

  /**
   * Get permissions for a role
   */
  getRolePermissions(roleId: string): Permission[] {
    const role = this.getRole(roleId);
    if (!role) {
      return [];
    }

    return ALL_PERMISSIONS.filter((p) => role.permissions.includes(p.id));
  }

  /**
   * Get user roles
   */
  getUserRoles(): Observable<UserRole[]> {
    return this.userRoles$.asObservable();
  }

  /**
   * Get roles for a specific user
   */
  getUserRolesByUserId(userId: string): UserRole | undefined {
    return this.userRoles$.value.find((ur) => ur.userId === userId);
  }

  /**
   * Assign roles to user
   */
  assignRolesToUser(
    userId: string,
    userName: string,
    userEmail: string,
    roleIds: string[],
    assignedBy: string
  ): UserRole {
    const userRoles = this.userRoles$.value;
    const existingIndex = userRoles.findIndex((ur) => ur.userId === userId);

    const userRole: UserRole = {
      userId,
      userName,
      userEmail,
      roleIds,
      assignedAt: new Date(),
      assignedBy,
    };

    if (existingIndex !== -1) {
      userRoles[existingIndex] = userRole;
    } else {
      userRoles.push(userRole);
    }

    this.userRoles$.next([...userRoles]);
    this.saveUserRolesToStorage();

    // Update user permissions
    this.updateUserPermissions(userId);

    return userRole;
  }

  /**
   * Remove role from user
   */
  removeRoleFromUser(userId: string, roleId: string): boolean {
    const userRoles = this.userRoles$.value;
    const userRole = userRoles.find((ur) => ur.userId === userId);

    if (!userRole) {
      return false;
    }

    userRole.roleIds = userRole.roleIds.filter((id) => id !== roleId);
    this.userRoles$.next([...userRoles]);
    this.saveUserRolesToStorage();

    // Update user permissions
    this.updateUserPermissions(userId);

    return true;
  }

  /**
   * Get users by role
   */
  getUsersByRole(roleId: string): UserRole[] {
    return this.userRoles$.value.filter((ur) => ur.roleIds.includes(roleId));
  }

  /**
   * Get user permissions (combined from all assigned roles)
   */
  getUserPermissions(userId: string): string[] {
    const userRole = this.getUserRolesByUserId(userId);
    if (!userRole) {
      return [];
    }

    const roles = this.roles$.value;
    const permissions = new Set<string>();

    userRole.roleIds.forEach((roleId) => {
      const role = roles.find((r) => r.id === roleId && r.isActive);
      if (role) {
        role.permissions.forEach((p) => permissions.add(p));
      }
    });

    return Array.from(permissions);
  }

  /**
   * Update user permissions in cache
   */
  private updateUserPermissions(userId: string): void {
    const permissions = this.getUserPermissions(userId);
    // In real app, this would update the user's session
    console.log(`Updated permissions for user ${userId}:`, permissions);
  }

  /**
   * Check if current user has permission
   */
  checkPermission(permission: string): Observable<boolean> {
    return this.currentUserPermissions$.pipe(
      map((permissions) => hasPermission(permissions, permission))
    );
  }

  /**
   * Check if current user has any of the permissions
   */
  checkAnyPermission(permissions: string[]): Observable<boolean> {
    return this.currentUserPermissions$.pipe(
      map((userPermissions) => hasAnyPermission(userPermissions, permissions))
    );
  }

  /**
   * Check if current user has all permissions
   */
  checkAllPermissions(permissions: string[]): Observable<boolean> {
    return this.currentUserPermissions$.pipe(
      map((userPermissions) => hasAllPermissions(userPermissions, permissions))
    );
  }

  /**
   * Get current user permissions
   */
  getCurrentUserPermissions(): Observable<string[]> {
    return this.currentUserPermissions$.asObservable();
  }

  /**
   * Get role statistics
   */
  getRoleStatistics(): Observable<RoleStatistics[]> {
    return this.roles$.pipe(
      map((roles) =>
        roles.map((role) => ({
          roleId: role.id,
          roleName: role.name,
          userCount: this.getUsersByRole(role.id).length,
          permissionCount: role.permissions.length,
        }))
      )
    );
  }

  /**
   * Search roles
   */
  searchRoles(query: string): Observable<Role[]> {
    const lowerQuery = query.toLowerCase();
    return this.roles$.pipe(
      map((roles) =>
        roles.filter(
          (role) =>
            role.name.toLowerCase().includes(lowerQuery) ||
            role.description.toLowerCase().includes(lowerQuery)
        )
      )
    );
  }

  /**
   * Export role as JSON
   */
  exportRole(id: string): string | null {
    const role = this.getRole(id);
    if (!role) {
      return null;
    }
    return JSON.stringify(role, null, 2);
  }

  /**
   * Import role from JSON
   */
  importRole(jsonString: string): Role | null {
    try {
      const role = JSON.parse(jsonString, this.dateReviver);
      // Generate new ID to avoid conflicts
      role.id = this.generateId();
      role.createdAt = new Date();
      role.updatedAt = new Date();
      role.isSystemRole = false;

      const roles = this.roles$.value;
      roles.push(role);
      this.roles$.next([...roles]);
      this.saveRolesToStorage();

      return role;
    } catch (error) {
      console.error('Failed to import role:', error);
      return null;
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `role-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Reset to default roles
   */
  resetToDefaults(): void {
    this.initializeDefaultRoles();
  }
}
