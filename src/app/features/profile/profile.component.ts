import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { SharedModule } from '../../shared/shared.module';
import { ProfileDetails, ProfilePreferences, User } from '../../core/models';
import { ProfileService } from '../../core/services/profile.service';

interface SnapshotCard {
  icon: string;
  label: string;
  value: string;
  helper: string;
  accent: 'indigo' | 'teal' | 'amber' | 'rose';
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SharedModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent implements OnInit, OnDestroy {
  private readonly profileService = inject(ProfileService);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroy$ = new Subject<void>();

  user: User | null = null;
  profileDetails: ProfileDetails | null = null;

  isLoading = true;
  isRefreshing = false;
  isSavingPersonal = false;
  isSavingPreferences = false;

  readonly timezoneOptions = [
    { label: 'Asia/Colombo (GMT+5:30)', value: 'Asia/Colombo' },
    { label: 'Asia/Singapore (GMT+8)', value: 'Asia/Singapore' },
    { label: 'Asia/Dubai (GMT+4)', value: 'Asia/Dubai' },
    { label: 'Europe/London (GMT+0)', value: 'Europe/London' },
    { label: 'America/New_York (GMT-5)', value: 'America/New_York' },
  ];

  readonly languageOptions = [
    { label: 'English', value: 'en' },
    { label: 'Sinhala', value: 'si' },
    { label: 'Tamil', value: 'ta' },
  ];

  readonly themeOptions = [
    { label: 'Follow system', value: 'system' },
    { label: 'Light', value: 'light' },
    { label: 'Dark', value: 'dark' },
  ];

  readonly personalForm = this.fb.group({
    firstName: ['', [Validators.required, Validators.maxLength(120)]],
    lastName: ['', [Validators.required, Validators.maxLength(120)]],
    phone: ['', [Validators.maxLength(25)]],
    jobTitle: ['', [Validators.maxLength(120)]],
    department: ['', [Validators.maxLength(120)]],
    bio: ['', [Validators.maxLength(280)]],
  });

  readonly preferencesForm = this.fb.group({
    timezone: ['', Validators.required],
    language: ['', Validators.required],
    theme: ['system', Validators.required],
    digestEmails: [true],
    notifications: this.fb.group({
      newOrders: [true],
      lowStock: [true],
      productUpdates: [true],
    }),
  });

  ngOnInit(): void {
    this.profileService.profile$
      .pipe(takeUntil(this.destroy$))
      .subscribe((state) => {
        if (!state.user || !state.profile) {
          return;
        }

        const nextProfile = state.profile;

        this.user = state.user;
        this.profileDetails = nextProfile;
        this.isLoading = false;

        this.patchForms(state.user, nextProfile);
      });

    this.fetchProfile();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get overviewCards(): SnapshotCard[] {
    if (!this.user || !this.profileDetails) {
      return [];
    }

    return [
      {
        icon: 'verified_user',
        label: 'Role scope',
        value: this.user.role?.name ?? 'Unassigned',
        helper: this.user.permissions?.length
          ? `${this.user.permissions.length} permissions`
          : 'No explicit permissions',
        accent: 'indigo',
      },
      {
        icon: 'storefront',
        label: 'Primary site',
        value: this.user.site?.name ?? 'Site not assigned',
        helper:
          this.user.site?.description ?? 'Switching restricted for members',
        accent: 'teal',
      },
      {
        icon: 'schedule',
        label: 'Last login',
        value: this.formatDate(this.user.lastLoginAt) ?? 'Never logged in',
        helper: 'Tracked from Google sign-in history',
        accent: 'amber',
      },
      {
        icon: 'public',
        label: 'Timezone',
        value: this.profileDetails.preferences.timezone,
        helper: this.profileDetails.preferences.language.toUpperCase(),
        accent: 'rose',
      },
    ];
  }

  get notificationSummary(): string {
    if (!this.profileDetails) {
      return 'Notification coverage unavailable.';
    }

    const notifications = this.profileDetails.preferences.notifications;
    const enabled: string[] = [];

    if (notifications.newOrders) {
      enabled.push('Orders');
    }

    if (notifications.lowStock) {
      enabled.push('Inventory');
    }

    if (notifications.productUpdates) {
      enabled.push('Product updates');
    }

    if (!enabled.length) {
      return 'All alerts muted.';
    }

    return `${enabled.join(', ')} alerts enabled.`;
  }

  get lastSyncedLabel(): string {
    const loadedAt = this.profileService.snapshot.loadedAt;

    if (!loadedAt) {
      return 'Sync pending';
    }

    const date = new Date(loadedAt);
    return `Updated ${date.toLocaleString()}`;
  }

  get userInitials(): string {
    const source =
      this.user?.fullName?.trim() ||
      `${this.user?.firstName ?? ''} ${this.user?.lastName ?? ''}`.trim() ||
      this.user?.email ||
      '';

    if (!source) {
      return '?';
    }

    const segments = source.split(/\s+/).filter(Boolean);

    if (segments.length === 1) {
      return segments[0].substring(0, 2).toUpperCase();
    }

    return (
      (segments[0]?.charAt(0) ?? '') +
      (segments[segments.length - 1]?.charAt(0) ?? '')
    ).toUpperCase();
  }

  refreshProfile(): void {
    this.isRefreshing = true;
    this.fetchProfile(true);
  }

  savePersonalInfo(): void {
    if (this.personalForm.invalid) {
      this.personalForm.markAllAsTouched();
      return;
    }

    const { firstName, lastName, phone, jobTitle, department, bio } =
      this.personalForm.getRawValue();

    this.isSavingPersonal = true;

    this.profileService
      .updateProfile({
        firstName: firstName?.trim(),
        lastName: lastName?.trim(),
        phone: phone?.trim() || null,
        jobTitle: jobTitle?.trim() || null,
        department: department?.trim() || null,
        bio: bio?.trim() || null,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isSavingPersonal = false;
          this.notify('Personal details updated');
        },
        error: (error) => {
          console.error('Failed to save profile', error);
          this.isSavingPersonal = false;
          this.notify('Unable to save profile', true);
        },
      });
  }

  savePreferences(): void {
    if (this.preferencesForm.invalid) {
      this.preferencesForm.markAllAsTouched();
      return;
    }

    const { timezone, language, theme, digestEmails, notifications } =
      this.preferencesForm.getRawValue();

    const payload: Partial<ProfilePreferences> = {
      timezone: timezone || this.profileDetails?.preferences.timezone || 'UTC',
      language: language || 'en',
      theme: (theme ?? 'system') as ProfilePreferences['theme'],
      digestEmails: !!digestEmails,
      notifications: {
        newOrders: notifications?.newOrders ?? true,
        lowStock: notifications?.lowStock ?? true,
        productUpdates: notifications?.productUpdates ?? true,
      },
    };

    this.isSavingPreferences = true;

    this.profileService
      .updateProfile({
        preferences: payload,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isSavingPreferences = false;
          this.notify('Preferences saved');
        },
        error: (error) => {
          console.error('Failed to save preferences', error);
          this.isSavingPreferences = false;
          this.notify('Unable to save preferences', true);
        },
      });
  }

  private fetchProfile(showToast = false): void {
    this.profileService
      .loadProfile()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.isRefreshing = false;

          if (showToast) {
            this.notify('Profile synced');
          }
        },
        error: (error) => {
          console.error('Failed to load profile', error);
          this.isLoading = false;
          this.isRefreshing = false;
          this.notify('Unable to load profile', true);
        },
      });
  }

  private patchForms(user: User, profile: ProfileDetails): void {
    this.patchPersonalForm(user, profile);
    this.patchPreferencesForm(profile);
  }

  resetPersonalForm(): void {
    if (!this.user || !this.profileDetails) {
      return;
    }

    this.patchPersonalForm(this.user, this.profileDetails);
  }

  resetPreferencesForm(): void {
    if (!this.profileDetails) {
      return;
    }

    this.patchPreferencesForm(this.profileDetails);
  }

  private patchPersonalForm(user: User, profile: ProfileDetails): void {
    this.personalForm.patchValue(
      {
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone || '',
        jobTitle: profile.jobTitle || '',
        department: profile.department || '',
        bio: profile.bio || '',
      },
      { emitEvent: false }
    );

    this.personalForm.markAsPristine();
  }

  private patchPreferencesForm(profile: ProfileDetails): void {
    this.preferencesForm.patchValue(
      {
        timezone: profile.preferences.timezone,
        language: profile.preferences.language,
        theme: profile.preferences.theme,
        digestEmails: profile.preferences.digestEmails,
        notifications: {
          newOrders: profile.preferences.notifications.newOrders,
          lowStock: profile.preferences.notifications.lowStock,
          productUpdates: profile.preferences.notifications.productUpdates,
        },
      },
      { emitEvent: false }
    );

    this.preferencesForm.markAsPristine();
  }

  formatDate(dateIso?: string): string | null {
    if (!dateIso) {
      return null;
    }

    const date = new Date(dateIso);

    if (isNaN(date.getTime())) {
      return null;
    }

    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private notify(message: string, isError = false): void {
    this.snackBar.open(message, 'Close', {
      duration: 2500,
      panelClass: isError ? ['snackbar-error'] : ['snackbar-success'],
    });
  }
}
