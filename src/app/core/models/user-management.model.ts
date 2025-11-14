import { SiteSummary, User } from './auth.model';

export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  roleId: string;
  siteCode: string;
  phone?: string;
}

export interface UserListItem extends User {
  site?: SiteSummary;
  status?: string;
  roleId?: string;
  siteCode?: string;
}

export interface SiteOption {
  code: string;
  name: string;
}

export const DEFAULT_SITE_OPTIONS: SiteOption[] = [
  { code: 'colombo', name: 'Colombo' },
  { code: 'piliyandala', name: 'Piliyandala' },
  { code: 'kandy', name: 'Kandy' },
  { code: 'galle', name: 'Galle' },
];
