import { RoleSummary, SiteSummary, User } from './auth.model';

export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  roleId: string;
  siteId: string;
  phone?: string;
  metadata?: Record<string, any>;
}

export interface UserListItem extends User {
  site?: SiteSummary;
  status?: string;
  roleId?: string;
  siteId?: string;
  siteCode?: string;
}

export interface RoleOption {
  id: string;
  name: string;
  slug?: string;
}

export interface SiteOption {
  id: string;
  name: string;
  slug?: string;
  description?: string | null;
}

export interface UserOptionsResponse {
  roles: RoleOption[];
  sites: SiteOption[];
}

export interface UserPaginationMeta {
  total: number;
  perPage: number;
  currentPage: number;
  lastPage: number;
  from: number | null;
  to: number | null;
  hasNextPage: boolean;
}

export interface UserListState {
  items: UserListItem[];
  meta: UserPaginationMeta;
}

export interface UserQueryParams {
  page?: number;
  perPage?: number;
  search?: string;
  status?: 'active' | 'inactive' | 'invited';
}
