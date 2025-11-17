import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormBuilder, FormGroup } from '@angular/forms';
import { SelectionModel } from '@angular/cdk/collections';
import { Router } from '@angular/router';
import { InventoryService } from '../services/inventory.service';
import {
  StockAlert,
  AlertType,
  AlertStatus,
  AlertSeverity,
} from '../models/inventory.model';

@Component({
  selector: 'app-stock-alerts',
  standalone: false,
  templateUrl: './stock-alerts.component.html',
  styleUrl: './stock-alerts.component.scss',
})
export class StockAlertsComponent implements OnInit {
  dataSource: { data: StockAlert[] } = { data: [] };
  selection = new SelectionModel<StockAlert>(true, []);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  filterForm!: FormGroup;
  isLoading = false;

  totalAlerts = 0;
  pageSize = 10;
  currentPage = 0;

  alertTypes: AlertType[] = [
    'low_stock',
    'out_of_stock',
    'overstock',
    'expiring_soon',
    'expired',
  ];
  alertStatuses: AlertStatus[] = ['active', 'acknowledged', 'resolved'];
  severityLevels: AlertSeverity[] = ['low', 'medium', 'high', 'critical'];

  constructor(
    private inventoryService: InventoryService,
    private snackBar: MatSnackBar,
    private fb: FormBuilder,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeFilterForm();
    this.loadAlerts();
  }

  initializeFilterForm(): void {
    this.filterForm = this.fb.group({
      type: [''],
      status: [''],
      severity: [''],
    });

    this.filterForm.valueChanges.subscribe(() => {
      this.currentPage = 0;
      this.loadAlerts();
    });
  }

  loadAlerts(): void {
    this.isLoading = true;
    const formValue = this.filterForm.value;

    const filters = {
      type: formValue.type || undefined,
      status: formValue.status || undefined,
      page: this.currentPage + 1,
      pageSize: this.pageSize,
    };

    this.inventoryService.getStockAlerts(filters).subscribe({
      next: (response) => {
        this.dataSource.data = response.data;
        this.totalAlerts = response.total;
        this.isLoading = false;
        this.selection.clear();
      },
      error: (error) => {
        console.error('Error loading alerts:', error);
        this.snackBar.open('Failed to load alerts', 'Close', {
          duration: 3000,
        });
        this.isLoading = false;
      },
    });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadAlerts();
  }

  clearFilters(): void {
    this.filterForm.reset({
      type: '',
      status: '',
      severity: '',
    });
    this.currentPage = 0;
    this.loadAlerts();
  }

  hasActiveFilters(): boolean {
    const formValue = this.filterForm.value;
    return !!(formValue.type || formValue.status || formValue.severity);
  }

  // Summary methods
  getCriticalCount(): number {
    return this.dataSource.data.filter(
      (a) => a.severity === 'critical' && a.status === 'active'
    ).length;
  }

  getActiveCount(): number {
    return this.dataSource.data.filter((a) => a.status === 'active').length;
  }

  getOutOfStockCount(): number {
    return this.dataSource.data.filter((a) => a.alertType === 'out_of_stock')
      .length;
  }

  getLowStockCount(): number {
    return this.dataSource.data.filter((a) => a.alertType === 'low_stock')
      .length;
  }

  // Selection methods
  isAllSelected(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  toggleAllRows(): void {
    if (this.isAllSelected()) {
      this.selection.clear();
      return;
    }
    this.selection.select(...this.dataSource.data);
  }

  // Alert actions
  acknowledgeAlert(alert: StockAlert): void {
    this.inventoryService.acknowledgeAlert(alert.id).subscribe({
      next: () => {
        this.snackBar.open('Alert acknowledged', 'Close', { duration: 3000 });
        this.loadAlerts();
      },
      error: (error) => {
        console.error('Error acknowledging alert:', error);
        this.snackBar.open('Failed to acknowledge alert', 'Close', {
          duration: 3000,
        });
      },
    });
  }

  resolveAlert(alert: StockAlert): void {
    this.inventoryService.resolveAlert(alert.id).subscribe({
      next: () => {
        this.snackBar.open('Alert resolved', 'Close', { duration: 3000 });
        this.loadAlerts();
      },
      error: (error) => {
        console.error('Error resolving alert:', error);
        this.snackBar.open('Failed to resolve alert', 'Close', {
          duration: 3000,
        });
      },
    });
  }

  bulkAcknowledge(): void {
    const selectedAlerts = this.selection.selected;
    if (selectedAlerts.length === 0) {
      this.snackBar.open('No alerts selected', 'Close', { duration: 3000 });
      return;
    }

    const ids = selectedAlerts.map((a) => a.id);
    this.inventoryService.bulkResolveAlerts(ids, 'System').subscribe({
      next: (result) => {
        this.snackBar.open(`${result.count} alert(s) resolved`, 'Close', {
          duration: 3000,
        });
        this.loadAlerts();
      },
      error: (error) => {
        console.error('Error bulk resolving alerts:', error);
        this.snackBar.open('Failed to resolve alerts', 'Close', {
          duration: 3000,
        });
      },
    });
  }

  // Utility methods
  formatAlertType(type: AlertType): string {
    return type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  }

  getSeverityColor(severity: AlertSeverity): string {
    const colors = {
      low: '#4caf50',
      medium: '#ff9800',
      high: '#f44336',
      critical: '#d32f2f',
    };
    return colors[severity];
  }

  getTypeIcon(type: AlertType): string {
    const icons: { [key: string]: string } = {
      low_stock: 'trending_down',
      out_of_stock: 'error',
      overstock: 'trending_up',
      expiring_soon: 'schedule',
      expired: 'event_busy',
    };
    return icons[type];
  }

  getTypeColor(type: AlertType): string {
    const colors: { [key: string]: string } = {
      low_stock: '#ff9800',
      out_of_stock: '#f44336',
      overstock: '#2196f3',
      expiring_soon: '#ff5722',
      expired: '#d32f2f',
    };
    return colors[type];
  }

  getTypeBadgeColor(type: AlertType): string {
    const colors: { [key: string]: string } = {
      low_stock: 'rgba(255, 152, 0, 0.1)',
      out_of_stock: 'rgba(244, 67, 54, 0.1)',
      overstock: 'rgba(33, 150, 243, 0.1)',
      expiring_soon: 'rgba(255, 87, 34, 0.1)',
      expired: 'rgba(211, 47, 47, 0.1)',
    };
    return colors[type];
  }

  getStockColor(current: number, threshold?: number): string {
    if (!threshold) return '#666';
    if (current === 0) return '#f44336';
    if (current <= threshold) return '#ff9800';
    return '#4caf50';
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // Navigation methods
  viewProductDetails(alert: StockAlert): void {
    this.router.navigate(['/products', alert.productId]);
  }

  createAdjustment(alert: StockAlert): void {
    this.router.navigate(['/inventory/adjustments'], {
      queryParams: { productId: alert.productId },
    });
  }
}
