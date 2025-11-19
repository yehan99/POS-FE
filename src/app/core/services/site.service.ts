import { Injectable, OnDestroy, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  BehaviorSubject,
  Subscription,
  combineLatest,
  distinctUntilChanged,
  finalize,
  map,
} from 'rxjs';

import { environment } from '../../../environments/environment';
import { SiteSummary, User } from '../models';
import { AuthService } from './auth.service';

interface ApiSiteResponse {
  id: string;
  name: string;
  slug?: string;
  description?: string | null;
}

interface SiteListResponse {
  data: ApiSiteResponse[];
}

@Injectable({
  providedIn: 'root',
})
export class SiteService implements OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly ACTIVE_SITE_KEY = 'pos_active_site_id';

  private readonly sitesSubject = new BehaviorSubject<SiteSummary[]>([]);
  private readonly activeSiteIdSubject = new BehaviorSubject<string | null>(
    null
  );
  private readonly isLoadingSubject = new BehaviorSubject<boolean>(false);

  readonly sites$ = this.sitesSubject.asObservable();
  readonly isLoading$ = this.isLoadingSubject.asObservable();
  readonly activeSite$ = combineLatest([
    this.sites$,
    this.activeSiteIdSubject.asObservable(),
  ]).pipe(
    map(
      ([sites, activeId]) => sites.find((site) => site.id === activeId) ?? null
    ),
    distinctUntilChanged((prev, curr) => prev?.id === curr?.id)
  );
  readonly canSwitchSites$ = combineLatest([
    this.authService.currentUser$,
    this.sites$,
  ]).pipe(
    map(([user, sites]) => this.isSuperAdmin(user) && sites.length > 1),
    distinctUntilChanged()
  );

  private readonly userSubscription: Subscription;

  constructor() {
    const storedSiteId = localStorage.getItem(this.ACTIVE_SITE_KEY);
    if (storedSiteId) {
      this.activeSiteIdSubject.next(storedSiteId);
    }

    this.userSubscription = this.authService.currentUser$
      .pipe(distinctUntilChanged((a, b) => a?.id === b?.id))
      .subscribe((user) => {
        if (!user) {
          this.resetState();
          return;
        }

        this.syncActiveSiteWithUser(user);
        this.refreshSites();
      });
  }

  ngOnDestroy(): void {
    this.userSubscription.unsubscribe();
    this.sitesSubject.complete();
    this.activeSiteIdSubject.complete();
    this.isLoadingSubject.complete();
  }

  refreshSites(): void {
    this.isLoadingSubject.next(true);

    this.http
      .get<SiteListResponse>(`${environment.apiUrl}/sites`)
      .pipe(
        map((response) => response.data.map((site) => this.mapSite(site))),
        finalize(() => this.isLoadingSubject.next(false))
      )
      .subscribe({
        next: (sites) => {
          this.sitesSubject.next(sites);
          this.ensureActiveSiteConsistency();
        },
        error: (error) => {
          console.error('Failed to load sites', error);
        },
      });
  }

  setActiveSite(siteId: string): void {
    if (!siteId) {
      this.activeSiteIdSubject.next(null);
      localStorage.removeItem(this.ACTIVE_SITE_KEY);
      return;
    }

    const exists = this.sitesSubject.value.some((site) => site.id === siteId);
    if (!exists) {
      return;
    }

    this.activeSiteIdSubject.next(siteId);
    localStorage.setItem(this.ACTIVE_SITE_KEY, siteId);
  }

  getActiveSiteId(): string | null {
    return this.activeSiteIdSubject.value;
  }

  getActiveSiteValue(): SiteSummary | null {
    const activeId = this.activeSiteIdSubject.value;
    return this.sitesSubject.value.find((site) => site.id === activeId) ?? null;
  }

  private ensureActiveSiteConsistency(): void {
    const availableSites = this.sitesSubject.value;
    const currentId = this.activeSiteIdSubject.value;

    if (currentId && availableSites.some((site) => site.id === currentId)) {
      return;
    }

    const fallbackId = this.resolveFallbackSiteId();

    this.activeSiteIdSubject.next(fallbackId);

    if (fallbackId) {
      localStorage.setItem(this.ACTIVE_SITE_KEY, fallbackId);
    } else {
      localStorage.removeItem(this.ACTIVE_SITE_KEY);
    }
  }

  private resolveFallbackSiteId(): string | null {
    if (this.sitesSubject.value.length === 0) {
      return null;
    }

    const userSiteId = this.authService.getCurrentUserValue()?.site?.id;

    if (
      userSiteId &&
      this.sitesSubject.value.some((site) => site.id === userSiteId)
    ) {
      return userSiteId;
    }

    return this.sitesSubject.value[0]?.id ?? null;
  }

  private syncActiveSiteWithUser(user: User): void {
    const storedId = this.activeSiteIdSubject.value;
    if (storedId) {
      return;
    }

    if (user.site?.id) {
      this.activeSiteIdSubject.next(user.site.id);
      localStorage.setItem(this.ACTIVE_SITE_KEY, user.site.id);
    }
  }

  private mapSite(site: ApiSiteResponse): SiteSummary {
    return {
      id: site.id,
      name: site.name,
      code: site.slug ?? site.id,
      slug: site.slug ?? undefined,
      description: site.description ?? undefined,
    };
  }

  private resetState(): void {
    this.sitesSubject.next([]);
    this.activeSiteIdSubject.next(null);
    localStorage.removeItem(this.ACTIVE_SITE_KEY);
  }

  private isSuperAdmin(user: User | null): boolean {
    return user?.role?.slug === 'super_admin';
  }
}
