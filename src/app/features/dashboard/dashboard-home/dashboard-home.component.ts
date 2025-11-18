import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DashboardService } from '../services/dashboard.service';
import {
  DashboardSummary,
  DashboardKPI,
  RecentTransaction,
  InventoryAlert,
  TopSellingProduct,
  TopCustomer,
  QuickAction,
  DashboardPeriod,
} from '../models/dashboard.model';

@Component({
  selector: 'app-dashboard-home',
  standalone: false,
  templateUrl: './dashboard-home.component.html',
  styleUrl: './dashboard-home.component.scss',
})
export class DashboardHomeComponent implements OnInit {
  dashboardData: DashboardSummary | null = null;
  quickActions: QuickAction[] = [];
  isLoading = false;
  selectedPeriod: DashboardPeriod = 'today';
  readonly skeletonQuickActions = Array.from({ length: 4 });
  readonly skeletonKpis = Array.from({ length: 6 });
  readonly skeletonCharts = Array.from({ length: 3 });
  readonly skeletonListItems = Array.from({ length: 4 });
  readonly skeletonDualPanels = Array.from({ length: 2 });

  // Display columns for tables
  transactionColumns = [
    'id',
    'time',
    'customer',
    'items',
    'amount',
    'payment',
    'status',
  ];
  alertColumns = ['product', 'sku', 'stock', 'alert'];

  constructor(
    private dashboardService: DashboardService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
    this.loadQuickActions();
  }

  loadDashboardData(): void {
    this.isLoading = true;

    // Call real API
    this.dashboardService.getDashboardSummary(this.selectedPeriod).subscribe({
      next: (data) => {
        this.dashboardData = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading dashboard:', error);
        // Fallback to mock data on error
        this.dashboardData = this.dashboardService.getMockDashboardData();
        this.isLoading = false;
      },
    });
  }

  loadQuickActions(): void {
    this.dashboardService.getQuickActions().subscribe({
      next: (actions) => {
        this.quickActions = actions;
      },
    });
  }

  onPeriodChange(period: DashboardPeriod): void {
    this.selectedPeriod = period;
    this.loadDashboardData();
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  refreshDashboard(): void {
    this.loadDashboardData();
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }

  formatNumber(value: number): string {
    return new Intl.NumberFormat('en-LK').format(value);
  }

  formatPercentage(value: number): string {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  }

  formatTime(date: Date): string {
    return new Intl.DateTimeFormat('en-LK', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      completed: 'success',
      pending: 'warn',
      cancelled: 'error',
    };
    return colors[status] || 'default';
  }

  getAlertColor(severity: string): string {
    const colors: { [key: string]: string } = {
      critical: 'error',
      warning: 'warn',
      info: 'primary',
    };
    return colors[severity] || 'default';
  }

  getTierColor(tier: string): string {
    const colors: { [key: string]: string } = {
      platinum: '#E5E4E2',
      gold: '#FFD700',
      silver: '#C0C0C0',
      bronze: '#CD7F32',
    };
    return colors[tier] || '#999999';
  }

  getTrendIcon(trend: string): string {
    const icons: { [key: string]: string } = {
      up: 'trending_up',
      down: 'trending_down',
      stable: 'trending_flat',
    };
    return icons[trend] || 'trending_flat';
  }

  getTrendColor(trend: string): string {
    const colors: { [key: string]: string } = {
      up: 'success',
      down: 'error',
      stable: 'default',
    };
    return colors[trend] || 'default';
  }

  viewAllTransactions(): void {
    this.router.navigate(['/pos/transactions']);
  }

  viewInventory(): void {
    this.router.navigate(['/inventory']);
  }

  viewTopProducts(): void {
    this.router.navigate(['/reports/products']);
  }

  viewTopCustomers(): void {
    this.router.navigate(['/reports/customers']);
  }
}
