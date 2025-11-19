import { User } from './auth.model';

export type ProfileTheme = 'system' | 'light' | 'dark';

export interface ProfileNotifications {
  newOrders: boolean;
  lowStock: boolean;
  productUpdates: boolean;
}

export interface ProfilePreferences {
  timezone: string;
  language: string;
  theme: ProfileTheme;
  digestEmails: boolean;
  notifications: ProfileNotifications;
}

export interface ProfileDetails {
  avatarUrl: string | null;
  jobTitle: string | null;
  department: string | null;
  bio: string | null;
  preferences: ProfilePreferences;
}

export interface UserProfileResponse {
  user: User;
  profile: ProfileDetails;
}

export interface UserProfileState {
  user: User | null;
  profile: ProfileDetails | null;
  loadedAt?: string;
}

export interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  jobTitle?: string | null;
  department?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  preferences?: Partial<ProfilePreferences> & {
    notifications?: Partial<ProfileNotifications>;
  };
}
