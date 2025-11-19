import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Observable, Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';
import { SiteService } from '../../../core/services/site.service';
import { SiteSummary, User } from '../../../core/models';

interface Breadcrumb {
  label: string;
  url: string;
}

@Component({
  selector: 'app-main-layout',
  standalone: false,
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  // Application version
  version = '1.0.0';

  // Sidebar state
  sidebarCollapsed = false;

  // User information displayed in the header
  userName = 'User';
  userRole = '';
  userInitials = '?';

  // Notifications
  notificationCount = 3;

  // Breadcrumbs
  breadcrumbs: Breadcrumb[] = [];

  private readonly siteService = inject(SiteService);

  // Site context
  siteOptions$: Observable<SiteSummary[]> = this.siteService.sites$;
  activeSite$: Observable<SiteSummary | null> = this.siteService.activeSite$;
  canSwitchSites$: Observable<boolean> = this.siteService.canSwitchSites$;
  isLoadingSites$: Observable<boolean> = this.siteService.isLoading$;

  private destroy$ = new Subject<void>();

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit(): void {
    this.updateUserDisplay(this.authService.getCurrentUserValue());

    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => this.updateUserDisplay(user));

    // Subscribe to router events to update breadcrumbs
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.updateBreadcrumbs();
      });

    // Initialize breadcrumbs
    this.updateBreadcrumbs();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setActiveSite(siteId: string): void {
    this.siteService.setActiveSite(siteId);
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  openSearch(): void {
    // Implement search functionality
    console.log('Search clicked');
  }

  openNotifications(): void {
    // Implement notifications panel
    console.log('Notifications clicked');
  }

  logout(): void {
    this.authService
      .logout()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.router.navigate(['/auth/login']);
        },
        error: () => {
          this.authService.forceLogout();
        },
      });
  }

  private updateBreadcrumbs(): void {
    // Simple breadcrumb generation based on URL
    const url = this.router.url;
    const segments = url.split('/').filter((segment) => segment);

    this.breadcrumbs = [{ label: 'Home', url: '/dashboard' }];

    let currentUrl = '';
    segments.forEach((segment) => {
      currentUrl += `/${segment}`;
      const label = this.formatBreadcrumbLabel(segment);
      this.breadcrumbs.push({ label, url: currentUrl });
    });
  }

  private formatBreadcrumbLabel(segment: string): string {
    // Convert URL segment to readable label
    return segment
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private updateUserDisplay(user: User | null): void {
    if (!user) {
      this.userName = 'User';
      this.userRole = '';
      this.userInitials = '?';
      return;
    }

    const displayName = this.resolveUserName(user);

    this.userName = displayName;
    this.userRole = user.role?.name ?? user.role?.slug ?? '';
    this.userInitials = this.buildInitials(displayName, user.email);
  }

  private resolveUserName(user: User): string {
    const fullName = user.fullName?.trim();
    if (fullName) {
      return fullName;
    }

    const combinedName = [user.firstName, user.lastName]
      .filter(Boolean)
      .map((part) => part.trim())
      .join(' ')
      .trim();

    if (combinedName) {
      return combinedName;
    }

    return user.email;
  }

  private buildInitials(nameSource: string, fallbackEmail: string): string {
    const source = nameSource || fallbackEmail;
    const segments = source.split(/\s+/).filter(Boolean);

    if (segments.length === 0 && fallbackEmail) {
      return fallbackEmail.substring(0, 2).toUpperCase();
    }

    if (segments.length === 1) {
      return segments[0].substring(0, 2).toUpperCase();
    }

    const first = segments[0]?.charAt(0) ?? '';
    const last = segments[segments.length - 1]?.charAt(0) ?? '';
    const initials = `${first}${last}`.toUpperCase();
    return initials || '?';
  }
}
