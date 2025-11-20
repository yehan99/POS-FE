export interface PermissionMatrixActionState {
  view: boolean;
  write: boolean;
  delete: boolean;
}

export interface PermissionMatrixModule {
  key: string;
  label: string;
  description?: string;
  icon?: string;
  permissions: {
    view: string[];
    write: string[];
    delete: string[];
  };
  capabilities: PermissionMatrixActionState;
}

export interface RolePermissionMatrixRow extends PermissionMatrixActionState {
  key: string;
}

export interface RoleSummary {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isDefault: boolean;
  permissions: string[];
  matrix: Array<PermissionMatrixModule & { matrix: PermissionMatrixActionState }>;
}

export interface UpdateRolePermissionsRequest {
  matrix: RolePermissionMatrixRow[];
}
