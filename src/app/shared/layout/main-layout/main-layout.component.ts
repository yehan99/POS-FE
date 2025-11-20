import {
  Component,
  HostListener,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Observable, Subject, forkJoin } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';
import { SiteService } from '../../../core/services/site.service';
import { NotificationService } from '../../../core/services/notification.service';
import { SiteSummary, User, UserNotification } from '../../../core/models';

interface Breadcrumb {
  label: string;
  url: string;
}

type NotificationTone = 'info' | 'success' | 'warning' | 'danger';
type NotificationCategory =
  | 'stock'
  | 'supplier'
  | 'product'
  | 'system'
  | 'general'
  | 'sales';

interface NotificationActionButton {
  label: string;
  route?: string;
  variant?: 'primary' | 'secondary';
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timeAgo: string;
  category: NotificationCategory;
  isRead: boolean;
  link?: string;
  metadata?: string;
  fileName?: string;
  fileSize?: string;
  actor?: {
    name: string;
    role?: string;
    avatarUrl?: string;
  };
  chip?: {
    label: string;
    tone: NotificationTone;
  };
  actions?: NotificationActionButton[];
}

interface NotificationGroup {
  title: string;
  subtitle: string;
  accentIcon: string;
  items: NotificationItem[];
}

interface SidebarLinkConfig {
  label: string;
  icon: string;
  route: string;
  title: string;
  exact?: boolean;
  permissionsAny?: string[];
  permissionsAll?: string[];
  roles?: string[];
  excludeRoles?: string[];
}

interface SidebarSectionConfig {
  label: string;
  links: SidebarLinkConfig[];
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
  notificationsOpen = false;
  notificationsLoading = false;
  notificationsError: string | null = null;
  lastNotificationsRefresh: Date | null = null;
  notificationGroups: NotificationGroup[] = [];
  notificationUnreadCount = 0;

  get notificationCount(): number {
    return this.notificationUnreadCount;
  }

  // Breadcrumbs
  breadcrumbs: Breadcrumb[] = [];

  visiblePrimaryLinks: SidebarLinkConfig[] = [];
  visibleSidebarSections: SidebarSectionConfig[] = [];

  private readonly siteService = inject(SiteService);
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  // Site context
  siteOptions$: Observable<SiteSummary[]> = this.siteService.sites$;
  activeSite$: Observable<SiteSummary | null> = this.siteService.activeSite$;
  canSwitchSites$: Observable<boolean> = this.siteService.canSwitchSites$;
  isLoadingSites$: Observable<boolean> = this.siteService.isLoading$;

  private destroy$ = new Subject<void>();
  private permissionSet = new Set<string>();
  private currentRoleSlug: string | null = null;
  private readonly dashboardLinks: SidebarLinkConfig[] = [
    {
      label: 'Dashboard Overview',
      icon: 'dashboard',
      route: '/dashboard',
      title: 'Dashboard Overview',
      exact: true,
      excludeRoles: ['cashier'],
    },
  ];

  private readonly sidebarSections: SidebarSectionConfig[] = [
    {
      label: 'Sales & CRM',
      links: [
        {
          label: 'POS Checkout',
          icon: 'point_of_sale',
          route: '/pos',
          title: 'POS Checkout',
          permissionsAny: ['sale.read', 'sale.create'],
        },
        {
          label: 'Transactions',
          icon: 'receipt_long',
          route: '/pos/transactions',
          title: 'Transactions',
          permissionsAny: ['sale.read'],
          excludeRoles: ['cashier'],
        },
        {
          label: 'Customers',
          icon: 'people',
          route: '/customers',
          title: 'Customer Directory',
          permissionsAny: ['customer.read', 'customer.loyalty.read'],
        },
      ],
    },
    {
      label: 'Catalog',
      links: [
        {
          label: 'Products',
          icon: 'inventory_2',
          route: '/products',
          title: 'Products',
          permissionsAny: ['product.read'],
        },
        {
          label: 'Categories',
          icon: 'category',
          route: '/products/categories',
          title: 'Categories',
          permissionsAny: ['product.read'],
        },
      ],
    },
    {
      label: 'Inventory',
      links: [
        {
          label: 'Inventory Dashboard',
          icon: 'inventory',
          route: '/inventory',
          title: 'Inventory Dashboard',
          permissionsAny: ['inventory.read'],
        },
        {
          label: 'Stock Adjustments',
          icon: 'tune',
          route: '/inventory/adjustments',
          title: 'Stock Adjustments',
          permissionsAny: ['inventory.adjust', 'inventory.update'],
        },
        {
          label: 'Stock Transfers',
          icon: 'compare_arrows',
          route: '/inventory/transfers',
          title: 'Stock Transfers',
          permissionsAny: ['inventory.update'],
        },
        {
          label: 'Suppliers',
          icon: 'local_shipping',
          route: '/inventory/suppliers',
          title: 'Suppliers',
          permissionsAny: ['inventory.read'],
        },
        {
          label: 'Purchase Orders',
          icon: 'assignment',
          route: '/inventory/purchase-orders',
          title: 'Purchase Orders',
          permissionsAny: ['inventory.create', 'inventory.update'],
        },
        {
          label: 'Stock Alerts',
          icon: 'warning_amber',
          route: '/inventory/alerts',
          title: 'Stock Alerts',
          permissionsAny: ['inventory.read'],
        },
      ],
    },
    {
      label: 'Hardware',
      links: [
        {
          label: 'Hardware Configuration',
          icon: 'settings_input_component',
          route: '/hardware',
          title: 'Hardware Configuration',
          permissionsAny: ['settings.read', 'settings.update'],
        },
        {
          label: 'Device Status',
          icon: 'memory',
          route: '/hardware/status',
          title: 'Device Status',
          permissionsAny: ['settings.read', 'settings.update'],
        },
        {
          label: 'Receipt Designer',
          icon: 'receipt_long',
          route: '/hardware/receipt-designer',
          title: 'Receipt Designer',
          permissionsAny: ['settings.read', 'settings.update'],
        },
      ],
    },
    {
      label: 'Reports & Analytics',
      links: [
        {
          label: 'Reports Hub',
          icon: 'analytics',
          route: '/reports',
          title: 'Reports Hub',
          permissionsAny: [
            'report.sales',
            'report.inventory',
            'report.customers',
            'report.financial',
          ],
          excludeRoles: ['cashier'],
        },
        {
          label: 'Sales Reports',
          icon: 'trending_up',
          route: '/reports/sales',
          title: 'Sales Reports',
          permissionsAny: ['report.sales'],
          excludeRoles: ['cashier'],
        },
        {
          label: 'Inventory Reports',
          icon: 'fact_check',
          route: '/reports/inventory',
          title: 'Inventory Reports',
          permissionsAny: ['report.inventory'],
          excludeRoles: ['cashier'],
        },
        {
          label: 'Customer Reports',
          icon: 'groups',
          route: '/reports/customers',
          title: 'Customer Reports',
          permissionsAny: ['report.customers'],
          excludeRoles: ['cashier'],
        },
        {
          label: 'Product Performance',
          icon: 'insights',
          route: '/reports/products',
          title: 'Product Performance',
          permissionsAny: ['report.sales', 'report.inventory'],
          excludeRoles: ['cashier'],
        },
      ],
    },
    {
      label: 'Administration',
      links: [
        {
          label: 'User Management',
          icon: 'group',
          route: '/users',
          title: 'User Management',
          permissionsAny: ['user.management'],
        },
        {
          label: 'Settings',
          icon: 'settings',
          route: '/settings',
          title: 'Settings',
          permissionsAny: ['settings.read', 'settings.update'],
        },
        {
          label: 'Roles & Permissions',
          icon: 'admin_panel_settings',
          route: '/roles',
          title: 'Roles & Permissions',
          roles: ['super_admin'],
        },
      ],
    },
  ];

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

    // Prefetch notification data so the badge stays accurate
    this.loadNotifications();
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

  toggleNotificationsPanel(): void {
    this.notificationsOpen = !this.notificationsOpen;

    if (
      this.notificationsOpen &&
      !this.notificationsLoading &&
      !this.notificationGroups.length
    ) {
      this.loadNotifications();
    }
  }

  closeNotificationsPanel(): void {
    this.notificationsOpen = false;
  }

  @HostListener('document:keydown.escape')
  handleEscapeKey(): void {
    if (this.notificationsOpen) {
      this.closeNotificationsPanel();
    }
  }

  markAllNotificationsAsRead(): void {
    if (this.notificationUnreadCount === 0) {
      return;
    }

    this.notificationService
      .markAllAsRead()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notificationGroups.forEach((group) =>
            group.items.forEach((item) => {
              item.isRead = true;
            })
          );
          this.notificationUnreadCount = 0;
        },
        error: (error) => {
          console.error('Error marking notifications as read:', error);
        },
      });
  }

  openNotificationDetail(item: NotificationItem): void {
    this.markNotificationAsRead(item.id);

    const targetRoute = item.link || '/dashboard';
    this.router
      .navigateByUrl(targetRoute)
      .finally(() => this.closeNotificationsPanel());
  }

  handleNotificationAction(
    event: MouseEvent,
    action: NotificationActionButton,
    item: NotificationItem
  ): void {
    event.stopPropagation();

    this.markNotificationAsRead(item.id);

    if (action.route) {
      this.router
        .navigateByUrl(action.route)
        .finally(() => this.closeNotificationsPanel());
      return;
    }

    this.closeNotificationsPanel();
  }

  viewAllNotifications(): void {
    this.router
      .navigate(['/dashboard'])
      .finally(() => this.closeNotificationsPanel());
  }

  refreshNotifications(): void {
    if (this.notificationsLoading) {
      return;
    }

    this.loadNotifications();
  }

  getAvatarInitials(name?: string): string {
    if (!name) {
      return 'PP';
    }

    const segments = name.trim().split(/\s+/);

    if (segments.length === 1) {
      return segments[0].substring(0, 2).toUpperCase();
    }

    const first = segments[0].charAt(0);
    const last = segments[segments.length - 1].charAt(0);
    return `${first}${last}`.toUpperCase();
  }

  trackByNotification(_: number, item: NotificationItem): string {
    return item.id;
  }

  countUnread(items: NotificationItem[]): number {
    return items.reduce(
      (total, current) => total + (current.isRead ? 0 : 1),
      0
    );
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
      this.currentRoleSlug = null;
      this.permissionSet = new Set();
      this.recomputeNavigation();
      return;
    }

    const displayName = this.resolveUserName(user);

    this.userName = displayName;
    this.userRole = user.role?.name ?? user.role?.slug ?? '';
    this.userInitials = this.buildInitials(displayName, user.email);
    this.currentRoleSlug = user.role?.slug ?? null;
    this.permissionSet = new Set(user.permissions ?? []);
    this.recomputeNavigation();
  }

  private recomputeNavigation(): void {
    const links = this.dashboardLinks.filter((link) =>
      this.canAccessLink(link)
    );
    this.visiblePrimaryLinks = links;

    this.visibleSidebarSections = this.sidebarSections
      .map((section) => ({
        ...section,
        links: section.links.filter((link) => this.canAccessLink(link)),
      }))
      .filter((section) => section.links.length > 0);
  }

  private canAccessLink(link: SidebarLinkConfig): boolean {
    if (this.currentRoleSlug === 'super_admin') {
      return true;
    }

    if (
      link.excludeRoles?.length &&
      this.currentRoleSlug &&
      link.excludeRoles.includes(this.currentRoleSlug)
    ) {
      return false;
    }

    if (
      link.roles?.length &&
      (!this.currentRoleSlug || !link.roles.includes(this.currentRoleSlug))
    ) {
      return false;
    }

    if (
      link.permissionsAll?.length &&
      !link.permissionsAll.every((permission) =>
        this.permissionSet.has(permission)
      )
    ) {
      return false;
    }

    if (
      link.permissionsAny?.length &&
      !link.permissionsAny.some((permission) =>
        this.permissionSet.has(permission)
      )
    ) {
      return false;
    }

    return true;
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

  private loadNotifications(): void {
    this.notificationsLoading = true;
    this.notificationsError = null;

    forkJoin({
      list: this.notificationService.getNotifications({
        status: 'all',
        perPage: 10,
      }),
      unread: this.notificationService.getUnreadCount(),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ list, unread }) => {
          const notifications = list?.data ?? [];
          this.notificationGroups =
            this.buildNotificationGroupsFromBackend(notifications);
          this.notificationUnreadCount = unread ?? 0;
          this.notificationsLoading = false;
          this.lastNotificationsRefresh = new Date();
        },
        error: (error) => {
          console.error('Error loading notifications:', error);
          this.notificationsLoading = false;
          this.notificationsError = 'Unable to load notifications right now.';
          this.notificationGroups = [];
        },
      });
  }

  private buildNotificationGroupsFromBackend(
    notifications: UserNotification[]
  ): NotificationGroup[] {
    const grouped = new Map<NotificationCategory, NotificationItem[]>();

    notifications.forEach((notification) => {
      const mapped = this.mapBackendNotification(notification);
      const category = mapped.category;
      if (!grouped.has(category)) {
        grouped.set(category, []);
      }
      grouped.get(category)?.push(mapped);
    });

    if (!grouped.size) {
      return [];
    }

    return Array.from(grouped.entries()).map(([category, items]) => {
      const presentation = this.getCategoryPresentation(category);
      return {
        title: presentation.title,
        subtitle: presentation.subtitle,
        accentIcon: presentation.accentIcon,
        items,
      };
    });
  }

  private getCategoryPresentation(category: NotificationCategory): {
    title: string;
    subtitle: string;
    accentIcon: string;
  } {
    const catalog: Record<
      NotificationCategory,
      { title: string; subtitle: string; accentIcon: string }
    > = {
      stock: {
        title: 'Inventory alerts',
        subtitle: 'Live stock and replenishment signals',
        accentIcon: 'inventory_2',
      },
      supplier: {
        title: 'Suppliers & transfers',
        subtitle: 'Keep vendor and routing requests moving',
        accentIcon: 'local_shipping',
      },
      product: {
        title: 'Product updates',
        subtitle: 'Catalog, merchandising, and assets',
        accentIcon: 'category',
      },
      system: {
        title: 'System activity',
        subtitle: 'Platform, security, and account notices',
        accentIcon: 'shield',
      },
      sales: {
        title: 'Sales & payments',
        subtitle: 'POS, settlement, and checkout alerts',
        accentIcon: 'point_of_sale',
      },
      general: {
        title: 'Workspace updates',
        subtitle: 'Latest activity across your sites',
        accentIcon: 'notifications',
      },
    };

    return catalog[category] ?? catalog.general;
  }

  private mapBackendNotification(
    notification: UserNotification
  ): NotificationItem {
    return {
      id: notification.id,
      title: notification.title || 'Notification',
      message: notification.body || 'No additional details provided.',
      timeAgo: this.formatTimeAgo(notification.createdAt ?? undefined),
      category: this.resolveNotificationCategory(notification.category),
      isRead: notification.isRead,
      link: this.resolveNotificationLink(notification),
      metadata: this.buildNotificationMetadata(notification),
      actor: this.buildNotificationActor(notification),
      chip: this.buildNotificationChip(notification),
    };
  }

  private resolveNotificationCategory(
    category?: string | null
  ): NotificationCategory {
    if (!category) {
      return 'general';
    }

    const normalized = category.trim().toLowerCase();

    if (normalized.includes('stock') || normalized.includes('inventory')) {
      return 'stock';
    }

    if (
      normalized.includes('supplier') ||
      normalized.includes('transfer') ||
      normalized.includes('purchase')
    ) {
      return 'supplier';
    }

    if (normalized.includes('product') || normalized.includes('catalog')) {
      return 'product';
    }

    if (
      normalized.includes('system') ||
      normalized.includes('security') ||
      normalized.includes('platform')
    ) {
      return 'system';
    }

    if (
      normalized.includes('sale') ||
      normalized.includes('payment') ||
      normalized.includes('pos')
    ) {
      return 'sales';
    }

    return 'general';
  }

  private buildNotificationActor(
    notification: UserNotification
  ): NotificationItem['actor'] | undefined {
    const payload = this.normalizeNotificationData(notification);
    const actorName =
      this.getString(payload?.['actorName']) ??
      this.getString(payload?.['user']) ??
      this.getString(payload?.['owner']);
    const actorRole =
      this.getString(payload?.['actorRole']) ??
      this.getString(payload?.['role']);
    const avatarUrl =
      this.getString(payload?.['actorAvatar']) ??
      this.getString(payload?.['avatar']);

    if (!actorName && !actorRole && !avatarUrl) {
      return undefined;
    }

    return {
      name: actorName ?? 'Paradise POS',
      role: actorRole ?? undefined,
      avatarUrl: avatarUrl ?? undefined,
    };
  }

  private buildNotificationChip(
    notification: UserNotification
  ): NotificationItem['chip'] | undefined {
    const severity = this.getString(notification.severity ?? undefined);
    if (!severity) {
      return undefined;
    }

    const label = this.toTitleCase(severity.replace(/_/g, ' '));
    return {
      label,
      tone: this.mapSeverityToTone(severity),
    };
  }

  private buildNotificationMetadata(
    notification: UserNotification
  ): string | undefined {
    const payload = this.normalizeNotificationData(notification);

    if (!payload) {
      return undefined;
    }

    const parts: string[] = [];
    const entity =
      this.getString(payload['entityName']) ??
      this.getString(payload['entity']) ??
      this.getString(payload['target']);
    const reference =
      this.getString(payload['reference']) ??
      this.getString(payload['code']) ??
      this.getString(payload['document']);
    const location =
      this.getString(payload['locationName']) ??
      this.getString(payload['location']) ??
      this.getString(payload['site']);

    if (entity) {
      parts.push(entity);
    }

    if (reference) {
      parts.push(reference);
    }

    if (location) {
      parts.push(location);
    }

    if (!parts.length && notification.category) {
      parts.push(this.formatCategoryLabel(notification.category));
    }

    return parts.length ? parts.join(' • ') : undefined;
  }

  private resolveNotificationLink(
    notification: UserNotification
  ): string | undefined {
    const payload = this.normalizeNotificationData(notification);
    const destination =
      this.getString(payload?.['link']) ??
      this.getString(payload?.['route']) ??
      this.getString(payload?.['url']);
    return destination ?? undefined;
  }

  private normalizeNotificationData(
    notification: UserNotification
  ): Record<string, unknown> | null {
    if (!notification.data || typeof notification.data !== 'object') {
      return null;
    }

    return notification.data as Record<string, unknown>;
  }

  private markNotificationAsRead(notificationId: string): void {
    const target = this.findNotificationItem(notificationId);
    if (!target || target.isRead) {
      return;
    }

    target.isRead = true;
    this.notificationUnreadCount = Math.max(
      this.notificationUnreadCount - 1,
      0
    );

    this.notificationService
      .markAsRead(notificationId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        error: (error) => {
          console.error('Error marking notification as read:', error);
          target.isRead = false;
          this.notificationUnreadCount += 1;
        },
      });
  }

  private findNotificationItem(
    notificationId: string
  ): NotificationItem | undefined {
    for (const group of this.notificationGroups) {
      const match = group.items.find((item) => item.id === notificationId);
      if (match) {
        return match;
      }
    }

    return undefined;
  }

  private mapSeverityToTone(severity?: string | null): NotificationTone {
    const normalized = severity?.toLowerCase() ?? '';

    switch (normalized) {
      case 'critical':
      case 'danger':
        return 'danger';
      case 'warning':
      case 'high':
        return 'warning';
      case 'success':
      case 'low':
        return 'success';
      default:
        return 'info';
    }
  }

  private toTitleCase(value: string): string {
    return value
      .split(' ')
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(' ');
  }

  private getString(value: unknown): string | undefined {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed.length ? trimmed : undefined;
    }

    return undefined;
  }

  private formatCategoryLabel(value: string): string {
    return value
      .split(/[\s_-]+/)
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(' ');
  }

  private formatTimeAgo(value: Date | string | undefined): string {
    if (!value) {
      return 'Just now';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return 'Just now';
    }

    const diffMs = Date.now() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes < 1) {
      return 'Just now';
    }

    if (diffMinutes < 60) {
      return `${diffMinutes} min ago`;
    }

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) {
      const unit = diffHours === 1 ? 'hr' : 'hrs';
      return `${diffHours} ${unit} ago`;
    }

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) {
      const unit = diffDays === 1 ? 'day' : 'days';
      return `${diffDays} ${unit} ago`;
    }

    return date.toLocaleDateString();
  }
}
