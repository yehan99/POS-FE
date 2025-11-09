import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormBuilder, FormGroup } from '@angular/forms';
import { SelectionModel } from '@angular/cdk/collections';
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
  displayedColumns: string[] = [
    'select',
    'severity',
    'type',
    'product',
    'currentStock',
    'threshold',
    'location',
    'status',
    'createdAt',
    'actions',
  ];

  dataSource = new MatTableDataSource<StockAlert>([]);
  selection = new SelectionModel<StockAlert>(true, []);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

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
    private fb: FormBuilder
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
    this.filterForm.reset();
    this.currentPage = 0;
    this.loadAlerts();
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
    this.inventoryService.bulkAcknowledgeAlerts(ids).subscribe({
      next: () => {
        this.snackBar.open(
          `${selectedAlerts.length} alert(s) acknowledged`,
          'Close',
          { duration: 3000 }
        );
        this.loadAlerts();
      },
      error: (error) => {
        console.error('Error bulk acknowledging alerts:', error);
        this.snackBar.open('Failed to acknowledge alerts', 'Close', {
          duration: 3000,
        });
      },
    });
  }

  // Utility methods
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

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
