import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

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
export class MainLayoutComponent implements OnInit {
  // Application version
  version = '1.0.0';

  // Sidebar state
  sidebarCollapsed = false;

  // User information (mock data - replace with actual auth service)
  userName = 'Admin User';
  userRole = 'Administrator';
  userInitials = 'AU';

  // Notifications
  notificationCount = 3;

  // Breadcrumbs
  breadcrumbs: Breadcrumb[] = [];

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Subscribe to router events to update breadcrumbs
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.updateBreadcrumbs();
      });

    // Initialize breadcrumbs
    this.updateBreadcrumbs();
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
    // Implement logout functionality
    console.log('Logout clicked');
    this.router.navigate(['/auth/login']);
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
}
