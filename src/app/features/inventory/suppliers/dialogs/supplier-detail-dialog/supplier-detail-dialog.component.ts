import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs/operators';
import { Supplier } from '../../../models/inventory.model';
import { SupplierService } from '../../../services/supplier.service';

interface SupplierDetailDialogData {
  supplierId: string;
  initialTab?: 'overview' | 'history';
}

interface SupplierStatistics {
  totalPurchaseOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  onTimeDeliveryRate: number;
  pendingOrders: number;
}

interface PurchaseHistoryItem {
  period: string;
  totalSpend: number;
  purchaseOrders: number;
  averageLeadTimeDays: number;
}

interface SupplierPurchaseHistoryResponse {
  data?: Array<{
    period: string;
    totalSpend: number;
    purchaseOrders: number;
    averageLeadTimeDays: number;
  }>;
}

@Component({
  selector: 'app-supplier-detail-dialog',
  standalone: false,
  templateUrl: './supplier-detail-dialog.component.html',
  styleUrls: ['./supplier-detail-dialog.component.scss'],
})
export class SupplierDetailDialogComponent implements OnInit {
  supplier?: Supplier;
  stats?: SupplierStatistics;
  history: PurchaseHistoryItem[] = [];

  isLoadingSupplier = false;
  isLoadingStats = false;
  isLoadingHistory = false;

  activeTabIndex = 0;

  constructor(
    private supplierService: SupplierService,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<SupplierDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SupplierDetailDialogData
  ) {}

  ngOnInit(): void {
    this.activeTabIndex = this.data.initialTab === 'history' ? 1 : 0;
    this.loadSupplier();
  }

  close(): void {
    this.dialogRef.close();
  }

  formatCurrency(value: number | null | undefined): string {
    if (value === null || value === undefined) {
      return '—';
    }

    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }

  formatPercentage(value: number | null | undefined): string {
    if (value === null || value === undefined) {
      return '—';
    }

    return `${value.toFixed(1)}%`;
  }

  formatLeadTime(value: number | null | undefined): string {
    if (value === null || value === undefined) {
      return '—';
    }

    if (value < 1) {
      return '<1 day';
    }

    return `${value.toFixed(1)} days`;
  }

  private loadSupplier(): void {
    this.isLoadingSupplier = true;
    this.supplierService
      .getSupplierById(this.data.supplierId)
      .pipe(finalize(() => (this.isLoadingSupplier = false)))
      .subscribe({
        next: (supplier: Supplier) => {
          this.supplier = supplier;
          this.loadStatistics();
          this.loadPurchaseHistory();
        },
        error: (error: unknown) => {
          console.error('Failed to load supplier details:', error);
          this.snackBar.open('Unable to load supplier details.', 'Close', {
            duration: 3000,
          });
          this.dialogRef.close();
        },
      });
  }

  private loadStatistics(): void {
    if (!this.supplier) {
      return;
    }

    this.isLoadingStats = true;
    this.supplierService
      .getSupplierStatistics(this.supplier.id)
      .pipe(finalize(() => (this.isLoadingStats = false)))
      .subscribe({
        next: (stats: SupplierStatistics) => {
          this.stats = stats;
        },
        error: (error: unknown) => {
          console.error('Failed to load supplier statistics:', error);
        },
      });
  }

  private loadPurchaseHistory(): void {
    if (!this.supplier) {
      return;
    }

    this.isLoadingHistory = true;
    this.supplierService
      .getSupplierPurchaseHistory(this.supplier.id, 1, 6)
      .pipe(finalize(() => (this.isLoadingHistory = false)))
      .subscribe({
        next: (response: SupplierPurchaseHistoryResponse) => {
          this.history = (response?.data || []).map((item) => ({
            period: item.period,
            totalSpend: item.totalSpend,
            purchaseOrders: item.purchaseOrders,
            averageLeadTimeDays: item.averageLeadTimeDays,
          }));
        },
        error: (error: unknown) => {
          console.error('Failed to load purchase history:', error);
        },
      });
  }

  getStatusColor(status: string | null | undefined): string {
    switch (status) {
      case 'active':
        return '#10b981';
      case 'inactive':
        return '#6b7280';
      case 'blocked':
        return '#ef4444';
      default:
        return '#9ca3af';
    }
  }
}
