import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { FormBuilder, FormGroup } from '@angular/forms';
import { SelectionModel } from '@angular/cdk/collections';
import { InventoryService } from '../services/inventory.service';
import {
  StockTransfer,
  TransferStatus,
  Location,
} from '../models/inventory.model';
import { debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-stock-transfers',
  standalone: false,
  templateUrl: './stock-transfers.component.html',
  styleUrl: './stock-transfers.component.scss',
})
export class StockTransfersComponent implements OnInit {
  displayedColumns: string[] = [
    'select',
    'transferNumber',
    'product',
    'quantity',
    'fromLocation',
    'toLocation',
    'status',
    'requestedDate',
    'actions',
  ];
  dataSource = new MatTableDataSource<StockTransfer>([]);
  selection = new SelectionModel<StockTransfer>(true, []);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  filterForm!: FormGroup;
  isLoading = false;
  loading = false;
  totalTransfers = 0;
  totalItems = 0;
  pageSize = 10;
  currentPage = 0;
  transferStatuses: TransferStatus[] = [
    'draft',
    'pending',
    'approved',
    'in_transit',
    'completed',
    'cancelled',
  ];
  locations: Location[] = [];

  constructor(
    private inventoryService: InventoryService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      search: [''],
      status: [''],
      fromLocationId: [''],
      toLocationId: [''],
    });

    this.filterForm.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => {
        this.currentPage = 0;
        this.loadTransfers();
      });

    this.inventoryService
      .getLocations()
      .subscribe((locations) => (this.locations = locations));
    this.loadTransfers();
  }

  loadTransfers(): void {
    this.isLoading = true;
    this.loading = true;
    const formValue = this.filterForm.value;

    this.inventoryService
      .getStockTransfers({
        search: formValue.search || undefined,
        status: formValue.status || undefined,
        locationId:
          formValue.fromLocationId || formValue.toLocationId || undefined,
        page: this.currentPage + 1,
        pageSize: this.pageSize,
      })
      .subscribe({
        next: (response) => {
          this.dataSource.data = response.data;
          this.totalTransfers = response.total;
          this.totalItems = response.total;
          this.isLoading = false;
          this.loading = false;
        },
        error: () => {
          this.snackBar.open('Failed to load transfers', 'Close', {
            duration: 3000,
          });
          this.isLoading = false;
          this.loading = false;
        },
      });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadTransfers();
  }

  clearFilters(): void {
    this.filterForm.reset();
  }

  createTransfer(): void {
    console.log('Create transfer');
  }

  exportTransfers(): void {
    const formValue = this.filterForm.value;
    this.inventoryService
      .getStockTransfers({
        search: formValue.search || undefined,
        status: formValue.status || undefined,
        locationId:
          formValue.fromLocationId || formValue.toLocationId || undefined,
      })
      .subscribe({
        next: (response) => {
          const csv = this.convertToCSV(response.data);
          const blob = new Blob([csv], { type: 'text/csv' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `stock-transfers-${new Date().getTime()}.csv`;
          a.click();
          window.URL.revokeObjectURL(url);
          this.snackBar.open('Transfers exported successfully', 'Close', {
            duration: 3000,
          });
        },
        error: () => {
          this.snackBar.open('Failed to export transfers', 'Close', {
            duration: 3000,
          });
        },
      });
  }

  bulkApprove(): void {
    const pendingTransfers = this.selection.selected.filter(
      (t) => t.status === 'pending'
    );
    if (pendingTransfers.length === 0) {
      this.snackBar.open('No pending transfers selected', 'Close', {
        duration: 3000,
      });
      return;
    }

    if (
      confirm(
        `Approve ${pendingTransfers.length} transfer(s)? Other statuses will be skipped.`
      )
    ) {
      let completed = 0;
      pendingTransfers.forEach((transfer) => {
        this.inventoryService.approveStockTransfer(transfer.id).subscribe({
          next: () => {
            completed++;
            if (completed === pendingTransfers.length) {
              this.snackBar.open(`${completed} transfer(s) approved`, 'Close', {
                duration: 3000,
              });
              this.selection.clear();
              this.loadTransfers();
            }
          },
        });
      });
    }
  }

  toggleAll(): void {
    this.isAllSelected()
      ? this.selection.clear()
      : this.dataSource.data.forEach((row) => this.selection.select(row));
  }

  viewDetails(transfer: StockTransfer): void {
    console.log('View details for transfer:', transfer);
  }

  cancelTransfer(id: string): void {
    if (confirm('Cancel this transfer? This action cannot be undone.')) {
      this.inventoryService
        .cancelStockTransfer(id, 'Cancelled by user')
        .subscribe({
          next: () => {
            this.snackBar.open('Transfer cancelled', 'Close', {
              duration: 3000,
            });
            this.loadTransfers();
          },
          error: () => {
            this.snackBar.open('Failed to cancel transfer', 'Close', {
              duration: 3000,
            });
          },
        });
    }
  }

  private convertToCSV(transfers: StockTransfer[]): string {
    const headers = [
      'Transfer Number',
      'Products',
      'Total Items',
      'Total Value',
      'From Location',
      'To Location',
      'Status',
      'Created Date',
      'Approved Date',
      'Shipped Date',
      'Received Date',
    ];
    const rows = transfers.map((t) => [
      t.transferNumber,
      t.items.map((item) => item.productName).join('; '),
      t.totalItems,
      t.totalValue,
      t.fromLocationName || '',
      t.toLocationName || '',
      t.status,
      this.formatDate(t.createdAt),
      t.approvedAt ? this.formatDate(t.approvedAt) : '',
      t.shippedAt ? this.formatDate(t.shippedAt) : '',
      t.receivedAt ? this.formatDate(t.receivedAt) : '',
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  approveTransfer(transferId: string): void {
    if (confirm(`Approve this transfer?`)) {
      this.inventoryService.approveStockTransfer(transferId).subscribe({
        next: () => {
          this.snackBar.open('Transfer approved', 'Close', { duration: 3000 });
          this.loadTransfers();
        },
      });
    }
  }

  shipTransfer(transferId: string): void {
    if (confirm(`Mark as shipped?`)) {
      this.inventoryService.shipStockTransfer(transferId).subscribe({
        next: () => {
          this.snackBar.open('Transfer shipped', 'Close', { duration: 3000 });
          this.loadTransfers();
        },
      });
    }
  }

  receiveTransfer(transferId: string): void {
    // For simplicity, we'll receive all items with their full quantities
    // In a real app, you'd open a dialog to specify received quantities
    this.inventoryService.getStockTransfers({}).subscribe({
      next: (response) => {
        const transfer = response.data.find((t) => t.id === transferId);
        if (transfer) {
          const items = transfer.items.map((item) => ({
            productId: item.productId,
            receivedQuantity: item.quantity,
          }));

          this.inventoryService
            .receiveStockTransfer(transferId, items)
            .subscribe({
              next: () => {
                this.snackBar.open('Transfer completed', 'Close', {
                  duration: 3000,
                });
                this.loadTransfers();
              },
            });
        }
      },
    });
  }

  isAllSelected(): boolean {
    return this.selection.selected.length === this.dataSource.data.length;
  }

  toggleAllRows(): void {
    this.isAllSelected()
      ? this.selection.clear()
      : this.selection.select(...this.dataSource.data);
  }

  getStatusColor(status: TransferStatus): string {
    const colors: Record<TransferStatus, string> = {
      draft: '#9ca3af',
      pending: '#f59e0b',
      approved: '#3b82f6',
      in_transit: '#8b5cf6',
      completed: '#10b981',
      cancelled: '#6b7280',
    };
    return colors[status] || '#9ca3af';
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  canApprove(t: StockTransfer): boolean {
    return t.status === 'pending';
  }
  canShip(t: StockTransfer): boolean {
    return t.status === 'approved';
  }
  canReceive(t: StockTransfer): boolean {
    return t.status === 'in_transit';
  }
}
