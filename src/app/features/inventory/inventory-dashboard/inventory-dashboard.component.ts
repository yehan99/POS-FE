import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { InventoryService } from '../services/inventory.service';
import { PurchaseOrderService } from '../services/purchase-order.service';
import { InventoryStatistics, StockAlert } from '../models/inventory.model';

@Component({
  selector: 'app-inventory-dashboard',
  standalone: false,
  templateUrl: './inventory-dashboard.component.html',
  styleUrl: './inventory-dashboard.component.scss',
})
export class InventoryDashboardComponent implements OnInit {
  statistics: InventoryStatistics | null = null;
  recentAlerts: StockAlert[] = [];
  isLoading = false;

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

  constructor(
    private inventoryService: InventoryService,
    private purchaseOrderService: PurchaseOrderService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadStatistics();
    this.loadRecentAlerts();
  }

  loadStatistics(): void {
    this.isLoading = true;
    this.inventoryService.getInventoryStatistics().subscribe({
      next: (stats) => {
        this.statistics = stats;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading statistics:', error);
        this.isLoading = false;
      },
    });
  }

  loadRecentAlerts(): void {
    this.inventoryService
      .getStockAlerts({ pageSize: 5, status: 'active' })
      .subscribe({
        next: (response) => {
          this.recentAlerts = response.data;
        },
        error: (error) => {
          console.error('Error loading alerts:', error);
        },
      });
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  getAlertSeverityColor(severity: string): string {
    const colors: { [key: string]: string } = {
      low: '#4caf50',
      medium: '#ff9800',
      high: '#f44336',
      critical: '#d32f2f',
    };
    return colors[severity] || '#757575';
  }

  formatCurrency(amount: number): string {
    return `LKR ${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
}
