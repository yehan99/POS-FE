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
  StockAdjustment,
  AdjustmentType,
  Location,
} from '../models/inventory.model';
import { debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-stock-adjustments',
  standalone: false,
  templateUrl: './stock-adjustments.component.html',
  styleUrl: './stock-adjustments.component.scss',
})
export class StockAdjustmentsComponent implements OnInit {
  displayedColumns: string[] = [
    'select',
    'adjustmentNumber',
    'type',
    'product',
    'location',
    'quantity',
    'reason',
    'status',
    'date',
    'actions',
  ];

  dataSource = new MatTableDataSource<StockAdjustment>([]);
  selection = new SelectionModel<StockAdjustment>(true, []);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  filterForm!: FormGroup;
  isLoading = false;

  totalAdjustments = 0;
  pageSize = 10;
  currentPage = 0;

  adjustmentTypes: AdjustmentType[] = [
    'increase',
    'decrease',
    'damage',
    'loss',
    'found',
    'return',
    'correction',
  ];
  locations: Location[] = [];

  constructor(
    private inventoryService: InventoryService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.initializeFilterForm();
    this.loadLocations();
    this.loadAdjustments();
  }

  initializeFilterForm(): void {
    this.filterForm = this.fb.group({
      search: [''],
      type: [''],
      status: [''],
      locationId: [''],
      dateFrom: [''],
      dateTo: [''],
    });

    this.filterForm
      .get('search')
      ?.valueChanges.pipe(debounceTime(500), distinctUntilChanged())
      .subscribe(() => {
        this.currentPage = 0;
        this.loadAdjustments();
      });

    this.filterForm.get('type')?.valueChanges.subscribe(() => {
      this.currentPage = 0;
      this.loadAdjustments();
    });

    this.filterForm.get('status')?.valueChanges.subscribe(() => {
      this.currentPage = 0;
      this.loadAdjustments();
    });

    this.filterForm.get('locationId')?.valueChanges.subscribe(() => {
      this.currentPage = 0;
      this.loadAdjustments();
    });
  }

  loadLocations(): void {
    this.inventoryService.getLocations().subscribe({
      next: (locations) => {
        this.locations = locations;
      },
      error: (error) => {
        console.error('Error loading locations:', error);
      },
    });
  }

  loadAdjustments(): void {
    this.isLoading = true;
    const formValue = this.filterForm.value;

    const filters = {
      search: formValue.search || undefined,
      type: formValue.type || undefined,
      status: formValue.status || undefined,
      locationId: formValue.locationId || undefined,
      dateFrom: formValue.dateFrom || undefined,
      dateTo: formValue.dateTo || undefined,
      page: this.currentPage + 1,
      pageSize: this.pageSize,
    };

    this.inventoryService.getStockAdjustments(filters).subscribe({
      next: (response) => {
        this.dataSource.data = response.data;
        this.totalAdjustments = response.total;
        this.isLoading = false;
        this.selection.clear();
      },
      error: (error) => {
        console.error('Error loading adjustments:', error);
        this.snackBar.open('Failed to load adjustments', 'Close', {
          duration: 3000,
        });
        this.isLoading = false;
      },
    });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadAdjustments();
  }

  clearFilters(): void {
    this.filterForm.reset();
    this.currentPage = 0;
    this.loadAdjustments();
  }

  applyDateFilter(): void {
    this.currentPage = 0;
    this.loadAdjustments();
  }

  createAdjustment(): void {
    // TODO: Open adjustment creation dialog
    console.log('Create adjustment');
  }

  viewAdjustmentDetails(adjustment: StockAdjustment): void {
    // TODO: Open adjustment detail dialog
    console.log('View adjustment details', adjustment);
  }

  approveAdjustment(adjustment: StockAdjustment): void {
    if (
      confirm(
        `Are you sure you want to approve adjustment "${adjustment.adjustmentNumber}"?`
      )
    ) {
      this.inventoryService.approveStockAdjustment(adjustment.id).subscribe({
        next: () => {
          this.snackBar.open('Adjustment approved successfully', 'Close', {
            duration: 3000,
          });
          this.loadAdjustments();
        },
        error: (error) => {
          console.error('Error approving adjustment:', error);
          this.snackBar.open('Failed to approve adjustment', 'Close', {
            duration: 3000,
          });
        },
      });
    }
  }

  bulkApprove(): void {
    const pending = this.selection.selected.filter(
      (a) => a.status === 'pending'
    );
    if (pending.length === 0) {
      this.snackBar.open('No pending adjustments selected', 'Close', {
        duration: 3000,
      });
      return;
    }

    if (confirm(`Approve ${pending.length} adjustment(s)?`)) {
      let completed = 0;
      pending.forEach((adjustment) => {
        this.inventoryService.approveStockAdjustment(adjustment.id).subscribe({
          next: () => {
            completed++;
            if (completed === pending.length) {
              this.snackBar.open(
                `${completed} adjustment(s) approved successfully`,
                'Close',
                { duration: 3000 }
              );
              this.loadAdjustments();
            }
          },
          error: (error) => {
            console.error('Error approving adjustment:', error);
          },
        });
      });
    }
  }

  exportAdjustments(): void {
    const formValue = this.filterForm.value;

    const filters = {
      search: formValue.search || undefined,
      type: formValue.type || undefined,
      status: formValue.status || undefined,
      locationId: formValue.locationId || undefined,
      dateFrom: formValue.dateFrom || undefined,
      dateTo: formValue.dateTo || undefined,
    };

    this.inventoryService.exportStockAdjustments(filters).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `stock_adjustments_${
          new Date().toISOString().split('T')[0]
        }.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.snackBar.open('Adjustments exported successfully', 'Close', {
          duration: 3000,
        });
      },
      error: (error) => {
        console.error('Error exporting adjustments:', error);
        this.snackBar.open('Failed to export adjustments', 'Close', {
          duration: 3000,
        });
      },
    });
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

  // Utility methods
  getTypeColor(type: AdjustmentType): string {
    switch (type) {
      case 'increase':
      case 'found':
      case 'return':
        return '#10b981';
      case 'decrease':
        return '#f59e0b';
      case 'damage':
      case 'loss':
        return '#ef4444';
      case 'correction':
        return '#3b82f6';
      default:
        return '#6b7280';
    }
  }

  getTypeIcon(type: AdjustmentType): string {
    switch (type) {
      case 'increase':
      case 'found':
        return 'trending_up';
      case 'decrease':
        return 'trending_down';
      case 'damage':
        return 'broken_image';
      case 'loss':
        return 'report';
      case 'return':
        return 'assignment_return';
      case 'correction':
        return 'sync';
      default:
        return 'adjust';
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'pending':
        return '#f59e0b';
      case 'approved':
        return '#10b981';
      case 'rejected':
        return '#ef4444';
      default:
        return '#6b7280';
    }
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

  canApprove(adjustment: StockAdjustment): boolean {
    return adjustment.status === 'pending';
  }
}
