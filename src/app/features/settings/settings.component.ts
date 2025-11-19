import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';

import {
  GeneralSettings,
  NotificationSettings,
  SettingsState,
} from '../../core/models/settings.model';
import { SettingsService } from '../../core/services/settings.service';
import { SiteService } from '../../core/services/site.service';
import { SiteSummary } from '../../core/models';

interface SelectOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-settings',
  // eslint-disable-next-line @angular-eslint/prefer-standalone
  standalone: false,
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent implements OnInit, OnDestroy {
  generalForm!: FormGroup;
  notificationsForm!: FormGroup;

  isLoading = true;
  isSavingGeneral = false;
  isSavingNotifications = false;
  lastUpdatedAt?: string;

  timezoneOptions: SelectOption[] = [
    { label: 'Sri Lanka (GMT+5:30)', value: 'Asia/Colombo' },
    { label: 'India (GMT+5:30)', value: 'Asia/Kolkata' },
    { label: 'Singapore (GMT+8)', value: 'Asia/Singapore' },
    { label: 'London (GMT+0)', value: 'Europe/London' },
    { label: 'New York (GMT-5)', value: 'America/New_York' },
  ];

  currencyOptions: SelectOption[] = [
    { label: 'Sri Lankan Rupee (LKR)', value: 'LKR' },
    { label: 'US Dollar (USD)', value: 'USD' },
    { label: 'Euro (EUR)', value: 'EUR' },
    { label: 'Indian Rupee (INR)', value: 'INR' },
  ];

  localeOptions: SelectOption[] = [
    { label: 'English (United States)', value: 'en-US' },
    { label: 'English (United Kingdom)', value: 'en-GB' },
    { label: 'Sinhala', value: 'si-LK' },
    { label: 'Tamil', value: 'ta-LK' },
  ];

  digestOptions: SelectOption[] = [
    { label: 'Daily Summary', value: 'daily' },
    { label: 'Weekly Digest', value: 'weekly' },
    { label: 'Monthly Digest', value: 'monthly' },
  ];

  siteOptions: SiteSummary[] = [];
  overviewCards: {
    key: string;
    label: string;
    value: string;
    helper: string;
    icon: string;
    accent: 'indigo' | 'teal' | 'amber' | 'rose';
  }[] = [];

  private readonly destroy$ = new Subject<void>();
  private readonly fb = inject(FormBuilder);
  private readonly settingsService = inject(SettingsService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly siteService = inject(SiteService);
  private currentState: SettingsState | null = null;

  ngOnInit(): void {
    this.buildForms();
    this.initFormWatchers();
    this.observeSettings();
    this.observeSites();
    this.settingsService
      .loadSettings()
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  submitGeneral(): void {
    if (this.generalForm.invalid) {
      this.generalForm.markAllAsTouched();
      return;
    }

    const payload = this.generalForm.getRawValue() as GeneralSettings;

    this.isSavingGeneral = true;
    this.cdr.markForCheck();

    this.settingsService
      .updateGeneralSettings(payload)
      .pipe(
        finalize(() => {
          this.isSavingGeneral = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (state) => {
          this.lastUpdatedAt = state.updatedAt;
          this.snackBar.open(
            'General settings updated successfully.',
            'Close',
            {
              duration: 3000,
              horizontalPosition: 'end',
              verticalPosition: 'top',
              panelClass: ['success-snackbar'],
            }
          );
        },
        error: () => {
          this.snackBar.open('Unable to update general settings.', 'Close', {
            duration: 4000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar'],
          });
        },
      });
  }

  submitNotifications(): void {
    if (this.notificationsForm.invalid) {
      this.notificationsForm.markAllAsTouched();
      return;
    }

    const payload = this.notificationsForm.value as NotificationSettings;

    this.isSavingNotifications = true;
    this.cdr.markForCheck();

    this.settingsService
      .updateNotificationSettings(payload)
      .pipe(
        finalize(() => {
          this.isSavingNotifications = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (state) => {
          this.lastUpdatedAt = state.updatedAt;
          this.snackBar.open('Notification settings saved.', 'Close', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar'],
          });
        },
        error: () => {
          this.snackBar.open(
            'Unable to update notification settings.',
            'Close',
            {
              duration: 4000,
              horizontalPosition: 'end',
              verticalPosition: 'top',
              panelClass: ['error-snackbar'],
            }
          );
        },
      });
  }

  get isBusy(): boolean {
    return this.isSavingGeneral || this.isSavingNotifications || this.isLoading;
  }

  get lastUpdatedLabel(): string {
    if (!this.lastUpdatedAt) {
      return 'Not saved yet';
    }

    const formatted = new Date(this.lastUpdatedAt).toLocaleString();
    return `Last updated ${formatted}`;
  }

  trackSiteOption(_: number, site: SiteSummary): string {
    return site.id;
  }

  private buildForms(): void {
    this.generalForm = this.fb.group({
      businessName: ['', [Validators.required, Validators.minLength(3)]],
      businessEmail: ['', [Validators.required, Validators.email]],
      businessPhone: [''],
      timezone: ['', Validators.required],
      currency: ['', Validators.required],
      locale: ['', Validators.required],
      invoicePrefix: ['', [Validators.required, Validators.maxLength(6)]],
      invoiceStartNumber: [1000, [Validators.required, Validators.min(1)]],
      defaultSiteId: [''],
    });

    this.notificationsForm = this.fb.group({
      sendDailySummary: [true],
      lowStockAlerts: [true],
      newOrderAlerts: [true],
      digestFrequency: ['daily', Validators.required],
      escalationEmail: ['', Validators.email],
    });
  }

  private initFormWatchers(): void {
    this.generalForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.refreshOverviewCards());

    this.notificationsForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.refreshOverviewCards());
  }

  private observeSettings(): void {
    this.settingsService.settings$
      .pipe(takeUntil(this.destroy$))
      .subscribe((state) => {
        this.currentState = state;
        this.lastUpdatedAt = state.updatedAt;
        this.patchGeneralForm(state.general);
        this.patchNotificationForm(state.notifications);
        this.refreshOverviewCards();
        this.isLoading = false;
        this.cdr.markForCheck();
      });
  }

  private observeSites(): void {
    this.siteService.sites$
      .pipe(takeUntil(this.destroy$))
      .subscribe((sites) => {
        this.siteOptions = sites;
        this.refreshOverviewCards();
        this.cdr.markForCheck();
      });
  }

  private patchGeneralForm(settings: GeneralSettings): void {
    this.generalForm.patchValue(
      {
        businessName: settings.businessName,
        businessEmail: settings.businessEmail,
        businessPhone: settings.businessPhone ?? '',
        timezone: settings.timezone,
        currency: settings.currency,
        locale: settings.locale,
        invoicePrefix: settings.invoicePrefix,
        invoiceStartNumber: settings.invoiceStartNumber,
        defaultSiteId: settings.defaultSiteId ?? '',
      },
      { emitEvent: false }
    );
  }

  private patchNotificationForm(settings: NotificationSettings): void {
    this.notificationsForm.patchValue(
      {
        sendDailySummary: settings.sendDailySummary,
        lowStockAlerts: settings.lowStockAlerts,
        newOrderAlerts: settings.newOrderAlerts,
        digestFrequency: settings.digestFrequency,
        escalationEmail: settings.escalationEmail ?? '',
      },
      { emitEvent: false }
    );
  }

  private refreshOverviewCards(): void {
    if (!this.currentState || !this.generalForm || !this.notificationsForm) {
      return;
    }

    const general = {
      ...this.currentState.general,
      ...this.generalForm.getRawValue(),
    } as GeneralSettings;

    const notifications = {
      ...this.currentState.notifications,
      ...this.notificationsForm.getRawValue(),
    } as NotificationSettings;

    this.buildOverviewCards(general, notifications);
  }

  private buildOverviewCards(
    general: GeneralSettings,
    notifications: NotificationSettings
  ): void {
    const enabledAlerts = [
      notifications.sendDailySummary,
      notifications.lowStockAlerts,
      notifications.newOrderAlerts,
    ].filter(Boolean).length;
    const digestLabel =
      this.digestOptions.find(
        (option) => option.value === notifications.digestFrequency
      )?.label ?? notifications.digestFrequency;

    this.overviewCards = [
      {
        key: 'identity',
        label: 'Business Identity',
        value: general.businessName || 'Not configured',
        helper: general.businessEmail || 'No email on file',
        icon: 'badge',
        accent: 'indigo',
      },
      {
        key: 'localization',
        label: 'Localization',
        value: this.buildLocaleLabel(general.locale),
        helper: `${general.currency} • ${this.resolveLabel(
          this.timezoneOptions,
          general.timezone
        )}`,
        icon: 'public',
        accent: 'teal',
      },
      {
        key: 'notifications',
        label: 'Alert Coverage',
        value: `${enabledAlerts}/3 channels`,
        helper: `Digest sent ${digestLabel?.toLowerCase()}`,
        icon: 'notifications_active',
        accent: 'amber',
      },
      {
        key: 'site',
        label: 'Default Site',
        value: this.getDefaultSiteName(general.defaultSiteId),
        helper: this.siteOptions.length
          ? `${this.siteOptions.length} synced sites`
          : 'Awaiting site sync',
        icon: 'storefront',
        accent: 'rose',
      },
    ];
  }

  private resolveLabel(options: SelectOption[], value: string): string {
    return options.find((option) => option.value === value)?.label ?? value;
  }

  private buildLocaleLabel(locale: string): string {
    try {
      const parts = new Intl.DisplayNames([locale], { type: 'language' });
      const language = parts.of(locale.split('-')[0]) ?? locale;
      return `${language} (${locale})`;
    } catch {
      return locale;
    }
  }

  private getDefaultSiteName(siteId?: string | null): string {
    if (!siteId) {
      return 'All sites';
    }

    return (
      this.siteOptions.find((site) => site.id === siteId)?.name ??
      'Site not accessible'
    );
  }
}
