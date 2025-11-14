import { Injectable } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';

export interface Breadcrumb {
  label: string;
  url: string;
  icon?: string;
}

export interface NavigationState {
  canGoBack: boolean;
  breadcrumbs: Breadcrumb[];
  currentRoute: string;
}

@Injectable({
  providedIn: 'root',
})
export class NavigationService {
  private navigationStateSubject = new BehaviorSubject<NavigationState>({
    canGoBack: false,
    breadcrumbs: [],
    currentRoute: '',
  });

  public navigationState$ = this.navigationStateSubject.asObservable();

  // Route configuration with labels and icons
  private routeConfig: { [key: string]: { label: string; icon: string } } = {
    '/dashboard': { label: 'Dashboard', icon: 'dashboard' },
    '/pos': { label: 'POS Checkout', icon: 'shopping_cart' },
    '/products': { label: 'Products', icon: 'inventory_2' },
    '/products/list': { label: 'Product List', icon: 'list' },
    '/products/create': { label: 'Add Product', icon: 'add' },
    '/customers': { label: 'Customers', icon: 'people' },
    '/customers/list': { label: 'Customer List', icon: 'list' },
    '/customers/create': { label: 'Add Customer', icon: 'person_add' },
    '/inventory': { label: 'Inventory', icon: 'warehouse' },
    '/inventory/stock': { label: 'Stock Management', icon: 'inventory' },
    '/inventory/transfers': { label: 'Stock Transfers', icon: 'sync_alt' },
    '/reports': { label: 'Reports', icon: 'assessment' },
    '/reports/sales': { label: 'Sales Reports', icon: 'trending_up' },
    '/reports/inventory': { label: 'Inventory Reports', icon: 'storage' },
    '/hardware': { label: 'Hardware', icon: 'devices' },
    '/hardware/status': { label: 'Hardware Status', icon: 'monitor_heart' },
    '/hardware/receipt-designer': {
      label: 'Receipt Designer',
      icon: 'receipt',
    },
    '/roles': { label: 'Role Management', icon: 'admin_panel_settings' },
    '/roles/create': { label: 'Create Role', icon: 'add' },
    '/roles/edit': { label: 'Edit Role', icon: 'edit' },
    '/auth/login': { label: 'Login', icon: 'login' },
    '/users': { label: 'User Management', icon: 'group' },
  };

  constructor(
    private router: Router,
    private location: Location,
    private activatedRoute: ActivatedRoute
  ) {
    this.initializeNavigationTracking();
  }

  private initializeNavigationTracking(): void {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        map((event) => event as NavigationEnd)
      )
      .subscribe((event) => {
        this.updateNavigationState(event.url);
      });
  }

  private updateNavigationState(url: string): void {
    const breadcrumbs = this.generateBreadcrumbs(url);
    const canGoBack = window.history.length > 1;

    this.navigationStateSubject.next({
      canGoBack,
      breadcrumbs,
      currentRoute: url,
    });
  }

  private generateBreadcrumbs(url: string): Breadcrumb[] {
    const breadcrumbs: Breadcrumb[] = [];
    const urlSegments = url.split('/').filter((segment) => segment);

    // Always add home/dashboard as first breadcrumb
    breadcrumbs.push({
      label: 'Home',
      url: '/dashboard',
      icon: 'home',
    });

    let currentPath = '';
    urlSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;

      // Skip if it's an ID (typically UUIDs or numbers)
      if (this.isId(segment)) {
        return;
      }

      const routeInfo = this.routeConfig[currentPath];
      if (routeInfo) {
        breadcrumbs.push({
          label: routeInfo.label,
          url: currentPath,
          icon: routeInfo.icon,
        });
      } else {
        // Fallback: capitalize segment
        breadcrumbs.push({
          label: this.formatLabel(segment),
          url: currentPath,
        });
      }
    });

    return breadcrumbs;
  }

  private isId(segment: string): boolean {
    // Check if segment looks like an ID (UUID pattern or numeric)
    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const numericPattern = /^\d+$/;
    return uuidPattern.test(segment) || numericPattern.test(segment);
  }

  private formatLabel(segment: string): string {
    return segment
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Navigate back to previous page
   */
  goBack(): void {
    this.location.back();
  }

  /**
   * Navigate to a specific route
   */
  navigateTo(path: string): void {
    this.router.navigate([path]);
  }

  /**
   * Navigate with query params
   */
  navigateWithParams(path: string, queryParams: any): void {
    this.router.navigate([path], { queryParams });
  }

  /**
   * Check if we can go back
   */
  canNavigateBack(): boolean {
    return this.navigationStateSubject.value.canGoBack;
  }

  /**
   * Get current breadcrumbs
   */
  getCurrentBreadcrumbs(): Breadcrumb[] {
    return this.navigationStateSubject.value.breadcrumbs;
  }

  /**
   * Register custom route configuration
   */
  registerRoute(path: string, label: string, icon?: string): void {
    this.routeConfig[path] = { label, icon: icon || 'folder' };
  }

  /**
   * Get route label
   */
  getRouteLabel(path: string): string {
    return this.routeConfig[path]?.label || this.formatLabel(path);
  }

  /**
   * Get route icon
   */
  getRouteIcon(path: string): string {
    return this.routeConfig[path]?.icon || 'folder';
  }
}
