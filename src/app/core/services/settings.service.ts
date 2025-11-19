import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import {
  GeneralSettings,
  NotificationSettings,
  SettingsState,
} from '../models/settings.model';

interface SettingsApiResponse {
  general?: Partial<GeneralSettings>;
  notifications?: Partial<NotificationSettings>;
  updatedAt?: string;
}

const DEFAULT_GENERAL_SETTINGS: GeneralSettings = {
  businessName: 'Paradise POS',
  businessEmail: 'admin@paradisepos.com',
  businessPhone: '+94 11 555 1234',
  timezone: 'Asia/Colombo',
  currency: 'LKR',
  locale: 'en-US',
  invoicePrefix: 'INV',
  invoiceStartNumber: 1000,
  defaultSiteId: null,
};

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  sendDailySummary: true,
  lowStockAlerts: true,
  newOrderAlerts: true,
  digestFrequency: 'daily',
  escalationEmail: 'ops@paradisepos.com',
};

const DEFAULT_STATE: SettingsState = {
  general: DEFAULT_GENERAL_SETTINGS,
  notifications: DEFAULT_NOTIFICATION_SETTINGS,
  updatedAt: new Date().toISOString(),
};

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly baseUrl = `${environment.apiUrl}/settings`;
  private readonly http = inject(HttpClient);
  private readonly stateSubject = new BehaviorSubject<SettingsState>(
    DEFAULT_STATE
  );

  readonly settings$ = this.stateSubject.asObservable();

  loadSettings(): Observable<SettingsState> {
    return this.http.get<SettingsApiResponse>(this.baseUrl).pipe(
      map((response) => this.buildStateFromResponse(response)),
      tap((state) => this.stateSubject.next(state))
    );
  }

  updateGeneralSettings(
    patch: Partial<GeneralSettings>
  ): Observable<SettingsState> {
    return this.http
      .patch<SettingsApiResponse>(`${this.baseUrl}/general`, patch)
      .pipe(
        map((response) =>
          this.buildStateFromResponse(response ?? { general: patch })
        ),
        tap((state) => this.stateSubject.next(state))
      );
  }

  updateNotificationSettings(
    patch: Partial<NotificationSettings>
  ): Observable<SettingsState> {
    return this.http
      .patch<SettingsApiResponse>(`${this.baseUrl}/notifications`, patch)
      .pipe(
        map((response) =>
          this.buildStateFromResponse(response ?? { notifications: patch })
        ),
        tap((state) => this.stateSubject.next(state))
      );
  }

  private buildStateFromResponse(
    response?: SettingsApiResponse
  ): SettingsState {
    const fallbackTimestamp =
      response?.updatedAt ??
      this.stateSubject.value.updatedAt ??
      new Date().toISOString();

    return {
      general: {
        ...DEFAULT_GENERAL_SETTINGS,
        ...(response?.general ?? {}),
      },
      notifications: {
        ...DEFAULT_NOTIFICATION_SETTINGS,
        ...(response?.notifications ?? {}),
      },
      updatedAt: fallbackTimestamp,
    };
  }
}
