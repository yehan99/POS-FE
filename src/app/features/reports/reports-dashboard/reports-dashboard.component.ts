import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ReportsService } from '../services/reports.service';
import { ReportsDashboardSummary } from '../models/report.model';

@Component({
  selector: 'app-reports-dashboard',
  standalone: false,
  templateUrl: './reports-dashboard.component.html',
  styleUrl: './reports-dashboard.component.scss',
})
export class ReportsDashboardComponent implements OnInit {
  summary!: ReportsDashboardSummary;
  isLoading = false;
  readonly skeletonTiles = Array.from({ length: 6 });
  readonly skeletonCategories = Array.from({ length: 4 });

  reportCategories = [
    {
      title: 'Sales Reports',
      icon: 'trending_up',
      description: 'View detailed sales analytics and trends',
      color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      route: '/reports/sales',
      stats: [] as { label: string; value: string }[],
    },
    {
      title: 'Inventory Reports',
      icon: 'inventory_2',
      description: 'Track stock levels and inventory performance',
      color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      route: '/reports/inventory',
      stats: [] as { label: string; value: string }[],
    },
    {
      title: 'Customer Reports',
      icon: 'people',
      description: 'Analyze customer behavior and retention',
      color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      route: '/reports/customers',
      stats: [] as { label: string; value: string }[],
    },
    {
      title: 'Product Performance',
      icon: 'insights',
      description: 'Monitor product sales and profitability',
      color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      route: '/reports/products',
      stats: [] as { label: string; value: string }[],
    },
  ];

  constructor(private reportsService: ReportsService, private router: Router) {}

  ngOnInit(): void {
    this.loadDashboardSummary();
  }

  loadDashboardSummary(): void {
    this.isLoading = true;
    this.reportsService.getDashboardSummary().subscribe({
      next: (data) => {
        this.summary = data;
        this.updateReportStats();
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        // Use mock data for development
        this.loadMockData();
      },
    });
  }

  loadMockData(): void {
    this.summary = {
      salesSummary: {
        todaySales: 125000,
        yesterdaySales: 98000,
        weekSales: 750000,
        monthSales: 3200000,
        yearSales: 35000000,
        salesGrowth: 15.5,
        transactionGrowth: 12.3,
      },
      inventorySummary: {
        totalValue: 8500000,
        lowStockCount: 23,
        outOfStockCount: 7,
        turnoverRate: 4.5,
      },
      customerSummary: {
        totalCustomers: 1245,
        activeCustomers: 856,
        retentionRate: 78.5,
        averageLifetimeValue: 285000,
      },
      productSummary: {
        totalProducts: 456,
        topPerformers: 45,
        underperformers: 32,
        averageMargin: 32.5,
      },
    };
    this.updateReportStats();
  }

  updateReportStats(): void {
    this.reportCategories[0].stats = [
      {
        label: 'Today',
        value: this.formatCurrency(this.summary.salesSummary.todaySales),
      },
      {
        label: 'This Month',
        value: this.formatCurrency(this.summary.salesSummary.monthSales),
      },
      { label: 'Growth', value: `+${this.summary.salesSummary.salesGrowth}%` },
    ];

    this.reportCategories[1].stats = [
      {
        label: 'Stock Value',
        value: this.formatCurrency(this.summary.inventorySummary.totalValue),
      },
      {
        label: 'Low Stock',
        value: this.summary.inventorySummary.lowStockCount.toString(),
      },
      {
        label: 'Turnover',
        value: `${this.summary.inventorySummary.turnoverRate}x`,
      },
    ];

    this.reportCategories[2].stats = [
      {
        label: 'Total',
        value: this.summary.customerSummary.totalCustomers.toString(),
      },
      {
        label: 'Active',
        value: this.summary.customerSummary.activeCustomers.toString(),
      },
      {
        label: 'Retention',
        value: `${this.summary.customerSummary.retentionRate}%`,
      },
    ];

    this.reportCategories[3].stats = [
      {
        label: 'Products',
        value: this.summary.productSummary.totalProducts.toString(),
      },
      {
        label: 'Top Performers',
        value: this.summary.productSummary.topPerformers.toString(),
      },
      {
        label: 'Avg Margin',
        value: `${this.summary.productSummary.averageMargin}%`,
      },
    ];
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }
}
