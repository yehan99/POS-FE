import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { FormBuilder, FormGroup } from '@angular/forms';
import { SelectionModel } from '@angular/cdk/collections';
import { SupplierService } from '../services/supplier.service';
import {
  Supplier,
  SupplierFilter,
  SupplierDashboardMetrics,
  SupplierPerformanceSummary,
} from '../models/inventory.model';
import { debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-suppliers',
  standalone: false,
  templateUrl: './suppliers.component.html',
  styleUrl: './suppliers.component.scss',
})
export class SuppliersComponent implements OnInit {
  displayedColumns: string[] = [
    'select',
    'code',
    'name',
    'contact',
    'email',
    'phone',
    'category',
    'status',
    'rating',
    'totalOrders',
    'actions',
  ];

  topSuppliersDisplayedColumns: string[] = [
    'supplierName',
    'totalSpend',
    'totalOrders',
    'onTimeDeliveryRate',
    'averageLeadTimeDays',
  ];

  dataSource = new MatTableDataSource<Supplier>([]);
  topSuppliersDataSource = new MatTableDataSource<SupplierPerformanceSummary>(
    []
  );
  selection = new SelectionModel<Supplier>(true, []);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  filterForm!: FormGroup;
  isLoading = false;
  dashboardLoading = false;
  dashboardMetrics?: SupplierDashboardMetrics;

  totalSuppliers = 0;
  pageSize = 10;
  currentPage = 0;

  categories = [
    'Electronics',
    'Food & Beverages',
    'Clothing',
    'Furniture',
    'Stationery',
    'Hardware',
    'Cosmetics',
    'Other',
  ];

  constructor(
    private supplierService: SupplierService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.initializeFilterForm();
    this.loadDashboardMetrics();
    this.loadSuppliers();
  }

  initializeFilterForm(): void {
    this.filterForm = this.fb.group({
      search: [''],
      status: [''],
      category: [''],
    });

    this.filterForm
      .get('search')
      ?.valueChanges.pipe(debounceTime(500), distinctUntilChanged())
      .subscribe(() => {
        this.currentPage = 0;
        this.loadSuppliers();
      });

    this.filterForm.get('status')?.valueChanges.subscribe(() => {
      this.currentPage = 0;
      this.loadSuppliers();
    });

    this.filterForm.get('category')?.valueChanges.subscribe(() => {
      this.currentPage = 0;
      this.loadSuppliers();
    });
  }

  loadDashboardMetrics(): void {
    this.dashboardLoading = true;
    this.supplierService.getSupplierDashboardMetrics().subscribe({
      next: (metrics) => {
        this.dashboardMetrics = metrics;
        this.topSuppliersDataSource.data = metrics.topSuppliers || [];
        this.dashboardLoading = false;
      },
      error: (error) => {
        console.error('Error loading supplier dashboard metrics:', error);
        this.dashboardLoading = false;
        this.loadMockDashboardMetrics();
      },
    });
  }

  loadMockDashboardMetrics(): void {
    const mockMetrics: SupplierDashboardMetrics = {
      totalSuppliers: 128,
      activeSuppliers: 94,
      newSuppliersThisMonth: 6,
      preferredSuppliers: 18,
      averageLeadTimeDays: 7.5,
      onTimeDeliveryRate: 87.2,
      totalSpend: 12500000,
      spendThisMonth: 820000,
      spendGrowthPercentage: 12.4,
      categoryBreakdown: [
        {
          category: 'Food & Beverages',
          supplierCount: 32,
          percentage: 25.0,
          totalSpend: 3200000,
        },
        {
          category: 'Electronics',
          supplierCount: 21,
          percentage: 16.4,
          totalSpend: 2100000,
        },
        {
          category: 'Hardware',
          supplierCount: 18,
          percentage: 14.1,
          totalSpend: 1760000,
        },
        {
          category: 'Packaging',
          supplierCount: 12,
          percentage: 9.8,
          totalSpend: 820000,
        },
      ],
      trend: [
        { label: 'May', totalSpend: 780000, purchaseOrders: 52 },
        { label: 'Jun', totalSpend: 820000, purchaseOrders: 55 },
        { label: 'Jul', totalSpend: 860000, purchaseOrders: 57 },
        { label: 'Aug', totalSpend: 910000, purchaseOrders: 61 },
      ],
      topSuppliers: [
        {
          supplierId: '1',
          supplierName: 'Sunrise Foods Ltd',
          rating: 4.7,
          totalOrders: 64,
          totalSpend: 1850000,
          onTimeDeliveryRate: 92.0,
          averageLeadTimeDays: 5.5,
        },
        {
          supplierId: '2',
          supplierName: 'Global Electronics Co.',
          rating: 4.5,
          totalOrders: 58,
          totalSpend: 1640000,
          onTimeDeliveryRate: 88.5,
          averageLeadTimeDays: 6.2,
        },
        {
          supplierId: '3',
          supplierName: 'Lanka Packaging Imports',
          rating: 4.3,
          totalOrders: 47,
          totalSpend: 930000,
          onTimeDeliveryRate: 90.1,
          averageLeadTimeDays: 4.9,
        },
        {
          supplierId: '4',
          supplierName: 'Evergreen Hardware',
          rating: 4.1,
          totalOrders: 39,
          totalSpend: 820000,
          onTimeDeliveryRate: 84.0,
          averageLeadTimeDays: 8.3,
        },
      ],
    };

    this.dashboardMetrics = mockMetrics;
    this.topSuppliersDataSource.data = mockMetrics.topSuppliers;
  }

  loadSuppliers(): void {
    this.isLoading = true;
    const formValue = this.filterForm.value;

    const filters: SupplierFilter = {
      search: formValue.search || undefined,
      status: formValue.status || undefined,
      category: formValue.category || undefined,
      page: this.currentPage + 1,
      pageSize: this.pageSize,
    };

    this.supplierService.getSuppliers(filters).subscribe({
      next: (response) => {
        this.dataSource.data = response.data;
        this.totalSuppliers = response.total;
        this.isLoading = false;
        this.selection.clear();
        setTimeout(() => {
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;
        });
      },
      error: (error) => {
        console.error('Error loading suppliers:', error);
        this.snackBar.open('Failed to load suppliers', 'Close', {
          duration: 3000,
        });
        this.isLoading = false;
      },
    });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadSuppliers();
  }

  clearFilters(): void {
    this.filterForm.reset();
    this.currentPage = 0;
    this.loadSuppliers();
  }

  openSupplierDialog(supplier?: Supplier): void {
    // TODO: Implement supplier dialog
    console.log('Open supplier dialog', supplier);
  }

  viewSupplierDetails(supplier: Supplier): void {
    // TODO: Navigate to supplier detail page
    console.log('View supplier details', supplier);
  }

  viewPurchaseHistory(supplier: Supplier): void {
    // TODO: Navigate to purchase history
    console.log('View purchase history', supplier);
  }

  deleteSupplier(supplier: Supplier): void {
    if (
      confirm(`Are you sure you want to delete supplier "${supplier.name}"?`)
    ) {
      this.supplierService.deleteSupplier(supplier.id).subscribe({
        next: () => {
          this.snackBar.open('Supplier deleted successfully', 'Close', {
            duration: 3000,
          });
          this.loadSuppliers();
        },
        error: (error) => {
          console.error('Error deleting supplier:', error);
          this.snackBar.open('Failed to delete supplier', 'Close', {
            duration: 3000,
          });
        },
      });
    }
  }

  bulkDelete(): void {
    if (this.selection.selected.length === 0) return;

    if (
      confirm(
        `Are you sure you want to delete ${this.selection.selected.length} supplier(s)?`
      )
    ) {
      const supplierIds = this.selection.selected.map((s) => s.id);

      this.supplierService.bulkDeleteSuppliers(supplierIds).subscribe({
        next: () => {
          this.snackBar.open('Suppliers deleted successfully', 'Close', {
            duration: 3000,
          });
          this.loadSuppliers();
        },
        error: (error) => {
          console.error('Error bulk deleting suppliers:', error);
          this.snackBar.open('Failed to delete suppliers', 'Close', {
            duration: 3000,
          });
        },
      });
    }
  }

  exportSuppliers(): void {
    const formValue = this.filterForm.value;

    const filters: SupplierFilter = {
      search: formValue.search || undefined,
      status: formValue.status || undefined,
      category: formValue.category || undefined,
    };

    this.supplierService.exportSuppliers(filters).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `suppliers_${
          new Date().toISOString().split('T')[0]
        }.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.snackBar.open('Suppliers exported successfully', 'Close', {
          duration: 3000,
        });
      },
      error: (error) => {
        console.error('Error exporting suppliers:', error);
        this.snackBar.open('Failed to export suppliers', 'Close', {
          duration: 3000,
        });
      },
    });
  }

  importSuppliers(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      this.snackBar.open('Please select a CSV file', 'Close', {
        duration: 3000,
      });
      return;
    }

    this.supplierService.importSuppliers(file).subscribe({
      next: (response) => {
        this.snackBar.open(
          `Imported ${response.success} supplier(s) successfully`,
          'Close',
          { duration: 3000 }
        );
        if (response.errors.length > 0) {
          console.error('Import errors:', response.errors);
        }
        this.loadSuppliers();
      },
      error: (error) => {
        console.error('Error importing suppliers:', error);
        this.snackBar.open('Failed to import suppliers', 'Close', {
          duration: 3000,
        });
      },
    });

    // Reset file input
    event.target.value = '';
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
  getStatusColor(status: string): string {
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

  getRatingStars(rating: number): string {
    return '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));
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

  formatLeadTime(days: number | null | undefined): string {
    if (days === null || days === undefined) {
      return '—';
    }

    if (days < 1) {
      return '<1 day';
    }

    return `${days.toFixed(1)} days`;
  }
}
