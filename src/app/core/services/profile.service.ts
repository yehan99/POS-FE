import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap, take } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import {
  ProfileDetails,
  ProfilePreferences,
  UserProfileResponse,
  UserProfileState,
  UpdateProfilePayload,
} from '../models/profile.model';
import { AuthService } from './auth.service';

const DEFAULT_PREFERENCES: ProfilePreferences = {
  timezone: 'Asia/Colombo',
  language: 'en',
  theme: 'system',
  digestEmails: true,
  notifications: {
    newOrders: true,
    lowStock: true,
    productUpdates: true,
  },
};

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly baseUrl = `${environment.apiUrl}/profile`;

  private readonly stateSubject = new BehaviorSubject<UserProfileState>({
    user: this.authService.getCurrentUserValue(),
    profile: null,
  });

  readonly profile$ = this.stateSubject.asObservable();

  loadProfile(): Observable<UserProfileState> {
    return this.http.get<UserProfileResponse>(this.baseUrl).pipe(
      map((response) => this.normalizeState(response)),
      tap((state) => this.persistState(state))
    );
  }

  updateProfile(payload: UpdateProfilePayload): Observable<UserProfileState> {
    return this.http.patch<UserProfileResponse>(this.baseUrl, payload).pipe(
      map((response) => this.normalizeState(response)),
      tap((state) => {
        this.persistState(state);
        this.refreshCachedUser();
      })
    );
  }

  get snapshot(): UserProfileState {
    return this.stateSubject.value;
  }

  private normalizeState(response: UserProfileResponse): UserProfileState {
    return {
      user: response.user,
      profile: this.applyProfileDefaults(response.profile),
      loadedAt: new Date().toISOString(),
    };
  }

  private applyProfileDefaults(
    profile?: ProfileDetails | null
  ): ProfileDetails {
    const safeProfile = profile ?? ({} as ProfileDetails);
    return {
      avatarUrl: safeProfile.avatarUrl ?? null,
      jobTitle: safeProfile.jobTitle ?? null,
      department: safeProfile.department ?? null,
      bio: safeProfile.bio ?? null,
      preferences: this.mergePreferences(safeProfile.preferences),
    };
  }

  private mergePreferences(
    preferences?: ProfilePreferences | null
  ): ProfilePreferences {
    const incoming = preferences ?? ({} as ProfilePreferences);

    return {
      ...DEFAULT_PREFERENCES,
      ...incoming,
      notifications: {
        ...DEFAULT_PREFERENCES.notifications,
        ...(incoming.notifications ?? {}),
      },
    };
  }

  private persistState(state: UserProfileState): void {
    this.stateSubject.next(state);
  }

  private refreshCachedUser(): void {
    this.authService
      .getCurrentUser()
      .pipe(take(1))
      .subscribe({
        next: () => undefined,
        error: () => undefined,
      });
  }
}
