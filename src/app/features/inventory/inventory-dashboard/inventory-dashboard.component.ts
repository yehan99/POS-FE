import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterModule } from '@angular/router';
import { InventoryService } from '../services/inventory.service';
import {
  InventoryDashboardData,
  InventoryDashboardMetric,
  InventoryDashboardPipeline,
  InventoryDashboardException,
  InventoryDashboardAlert,
} from '../models/inventory.model';
import { SharedModule } from '../../../shared/shared.module';

interface InventoryMetricTile {
  label: string;
  icon: string;
  accent: 'primary' | 'accent' | 'warn' | 'error' | 'info';
  value: string;
  route?: string;
  ariaLabel: string;
}

interface InventoryPipelineItem {
  label: string;
  icon: string;
  accent: 'edit' | 'transfer' | 'po';
  hint: string;
  value: string;
  route: string;
}

interface InventoryExceptionItem {
  label: string;
  icon: string;
  severity: 'critical' | 'warning' | 'danger' | 'info';
  value: string;
  route?: string;
  ariaLabel: string;
}

@Component({
  selector: 'app-inventory-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    SharedModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './inventory-dashboard.component.html',
  styleUrls: ['./inventory-dashboard.component.scss'],
})
export class InventoryDashboardComponent implements OnInit {
  dashboardData: InventoryDashboardData | null = null;
  recentAlerts: InventoryDashboardAlert[] = [];
  isLoading = false;
  metricTiles: InventoryMetricTile[] = [];
  pipelineItems: InventoryPipelineItem[] = [];
  exceptionItems: InventoryExceptionItem[] = [];

  private readonly defaultStatistics = {
    totalProducts: 0,
    totalStockValue: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    overstockItems: 0,
    pendingAdjustments: 0,
    pendingTransfers: 0,
    pendingPurchaseOrders: 0,
    activeAlerts: 0,
  };

  quickActions = [
    {
      icon: 'add_circle',
      label: 'Stock Adjustment',
      route: '/inventory/adjustments',
      color: '#4caf50',
    },
    {
      icon: 'swap_horiz',
      label: 'Transfer Stock',
      route: '/inventory/transfers',
      color: '#2196f3',
    },
    {
      icon: 'shopping_cart',
      label: 'New Purchase Order',
      route: '/inventory/purchase-orders',
      color: '#ff9800',
    },
    {
      icon: 'people',
      label: 'Manage Suppliers',
      route: '/inventory/suppliers',
      color: '#9c27b0',
    },
    {
      icon: 'notifications',
      label: 'View Alerts',
      route: '/inventory/alerts',
      color: '#f44336',
    },
    {
      icon: 'assessment',
      label: 'Reports',
      route: '/inventory/reports',
      color: '#00bcd4',
    },
  ];

  private readonly inventoryService = inject(InventoryService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading = true;
    this.inventoryService.getDashboardData(5).subscribe({
      next: (data) => {
        this.dashboardData = data;
        this.metricTiles = this.mapMetricsToTiles(data.metrics);
        this.pipelineItems = this.mapPipelineToPipelineItems(data.pipeline);
        this.exceptionItems = this.mapExceptionsToExceptionItems(
          data.exceptions
        );
        this.recentAlerts = data.alerts;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading dashboard data:', error);
        this.isLoading = false;
      },
    });
  }

  loadStatistics(): void {
    // Legacy method - kept for compatibility
    this.loadDashboardData();
  }

  loadRecentAlerts(): void {
    // Alerts are now loaded with dashboard data
    // This method kept for compatibility
  }

  private mapMetricsToTiles(
    metrics: InventoryDashboardMetric[]
  ): InventoryMetricTile[] {
    return metrics.map((metric) => ({
      label: metric.label,
      icon: metric.icon,
      accent: metric.colorClass,
      value:
        typeof metric.value === 'number'
          ? this.formatNumber(metric.value)
          : metric.value,
      route: metric.route || undefined,
      ariaLabel: `${metric.label} ${metric.value}`,
    }));
  }

  private mapPipelineToPipelineItems(
    pipeline: InventoryDashboardPipeline[]
  ): InventoryPipelineItem[] {
    return pipeline.map((item) => ({
      label: item.label,
      icon: item.icon,
      accent: item.iconClass,
      hint: item.hint,
      value: this.formatNumber(item.value),
      route: item.route,
    }));
  }

  private mapExceptionsToExceptionItems(
    exceptions: InventoryDashboardException[]
  ): InventoryExceptionItem[] {
    return exceptions.map((exception) => ({
      label: exception.label,
      icon: exception.icon,
      severity: exception.severity,
      value: exception.value,
      route: exception.route,
      ariaLabel: `${exception.label} ${exception.value}`,
    }));
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  onNavigateKey(event: Event, route: string): void {
    event.preventDefault();
    const keyboardEvent = event as KeyboardEvent;
    if (keyboardEvent.repeat) {
      return;
    }
    this.navigateTo(route);
  }

  getAlertSeverityColor(severity: string): string {
    const colors: Record<string, string> = {
      low: '#4caf50',
      medium: '#ff9800',
      high: '#f44336',
      critical: '#d32f2f',
      warning: '#ff9800',
      info: '#2196f3',
    };
    return colors[severity] || '#757575';
  }

  formatCurrency(amount: number): string {
    return `LKR ${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  private formatNumber(value: number): string {
    return value.toLocaleString('en-US');
  }
}
