import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormBuilder, FormGroup } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { SelectionModel } from '@angular/cdk/collections';
import { CustomerService } from '../services/customer.service';
import {
  Customer,
  CustomerFilter,
  CustomerStatistics,
  LoyaltyTier,
} from '../models/customer.model';

@Component({
  selector: 'app-customer-list',
  standalone: false,
  templateUrl: './customer-list.component.html',
  styleUrl: './customer-list.component.scss',
})
export class CustomerListComponent implements OnInit {
  displayedColumns: string[] = [
    'select',
    'customerCode',
    'name',
    'phone',
    'email',
    'loyaltyTier',
    'loyaltyPoints',
    'totalSpent',
    'lastPurchase',
    'status',
    'actions',
  ];

  dataSource = new MatTableDataSource<Customer>([]);
  selection = new SelectionModel<Customer>(true, []);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  filterForm!: FormGroup;
  isLoading = false;
  statistics: CustomerStatistics | null = null;

  totalCustomers = 0;
  pageSize = 10;
  currentPage = 0;

  loyaltyTiers: LoyaltyTier[] = ['bronze', 'silver', 'gold', 'platinum'];

  constructor(
    private customerService: CustomerService,
    private router: Router,
    private snackBar: MatSnackBar,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.initializeFilterForm();
    this.loadCustomers();
    this.loadStatistics();
    this.setupFilterListener();
  }

  initializeFilterForm(): void {
    this.filterForm = this.fb.group({
      search: [''],
      loyaltyTier: [''],
      isActive: [''],
      minTotalSpent: [''],
      maxTotalSpent: [''],
      hasEmail: [''],
    });
  }

  setupFilterListener(): void {
    this.filterForm.valueChanges
      .pipe(debounceTime(500), distinctUntilChanged())
      .subscribe(() => {
        this.currentPage = 0;
        this.loadCustomers();
      });
  }

  loadCustomers(): void {
    this.isLoading = true;
    const filters = this.buildFilters();

    this.customerService.getCustomers(filters).subscribe({
      next: (response) => {
        this.dataSource.data = response.customers;
        this.totalCustomers = response.total;
        this.isLoading = false;
        this.selection.clear();
      },
      error: (error) => {
        console.error('Error loading customers:', error);
        this.snackBar.open('Failed to load customers', 'Close', {
          duration: 3000,
        });
        this.isLoading = false;
      },
    });
  }

  loadStatistics(): void {
    this.customerService.getCustomerStatistics().subscribe({
      next: (stats) => {
        this.statistics = stats;
      },
      error: (error) => {
        console.error('Error loading statistics:', error);
      },
    });
  }

  buildFilters(): CustomerFilter {
    const formValue = this.filterForm.value;
    const filters: CustomerFilter = {
      page: this.currentPage + 1,
      pageSize: this.pageSize,
      sortBy: this.sort?.active || 'createdAt',
      sortOrder: this.sort?.direction || 'desc',
    };

    if (formValue.search) {
      filters.search = formValue.search;
    }
    if (formValue.loyaltyTier) {
      filters.loyaltyTier = formValue.loyaltyTier;
    }
    if (formValue.isActive !== '') {
      filters.isActive = formValue.isActive === 'true';
    }
    if (formValue.minTotalSpent) {
      filters.minTotalSpent = parseFloat(formValue.minTotalSpent);
    }
    if (formValue.maxTotalSpent) {
      filters.maxTotalSpent = parseFloat(formValue.maxTotalSpent);
    }
    if (formValue.hasEmail !== '') {
      filters.hasEmail = formValue.hasEmail === 'true';
    }

    return filters;
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadCustomers();
  }

  onSortChange(): void {
    this.currentPage = 0;
    this.loadCustomers();
  }

  clearFilters(): void {
    this.filterForm.reset();
    this.currentPage = 0;
    this.loadCustomers();
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

  toggleSelection(customer: Customer): void {
    this.selection.toggle(customer);
  }

  // Navigation methods
  viewCustomer(customer: Customer): void {
    this.router.navigate(['/customers', customer.id]);
  }

  editCustomer(customer: Customer): void {
    this.router.navigate(['/customers/edit', customer.id]);
  }

  createCustomer(): void {
    this.router.navigate(['/customers/new']);
  }

  // Delete methods
  deleteCustomer(customer: Customer): void {
    if (
      confirm(
        `Are you sure you want to delete customer ${customer.firstName} ${customer.lastName}?`
      )
    ) {
      this.customerService.deleteCustomer(customer.id).subscribe({
        next: () => {
          this.snackBar.open('Customer deleted successfully', 'Close', {
            duration: 3000,
          });
          this.loadCustomers();
        },
        error: (error) => {
          console.error('Error deleting customer:', error);
          this.snackBar.open('Failed to delete customer', 'Close', {
            duration: 3000,
          });
        },
      });
    }
  }

  bulkDelete(): void {
    const selectedCustomers = this.selection.selected;
    if (selectedCustomers.length === 0) {
      this.snackBar.open('No customers selected', 'Close', { duration: 3000 });
      return;
    }

    if (
      confirm(
        `Are you sure you want to delete ${selectedCustomers.length} customer(s)?`
      )
    ) {
      const ids = selectedCustomers.map((c) => c.id);
      this.customerService.bulkDeleteCustomers(ids).subscribe({
        next: () => {
          this.snackBar.open(
            `${selectedCustomers.length} customer(s) deleted successfully`,
            'Close',
            { duration: 3000 }
          );
          this.loadCustomers();
        },
        error: (error) => {
          console.error('Error deleting customers:', error);
          this.snackBar.open('Failed to delete customers', 'Close', {
            duration: 3000,
          });
        },
      });
    }
  }

  // Export/Import methods
  exportCustomers(): void {
    this.snackBar.open(
      'Customer export will be available once the reporting API is ready.',
      'Close',
      {
        duration: 4000,
      }
    );
  }

  importCustomers(): void {
    this.snackBar.open(
      'Customer import will be enabled after the bulk upload API is implemented.',
      'Close',
      {
        duration: 4000,
      }
    );
  }

  // Utility methods
  getLoyaltyTierColor(tier: LoyaltyTier): string {
    const colors = {
      bronze: '#CD7F32',
      silver: '#C0C0C0',
      gold: '#FFD700',
      platinum: '#E5E4E2',
    };
    return colors[tier];
  }

  getLoyaltyTierIcon(tier: LoyaltyTier): string {
    const icons = {
      bronze: 'looks_3',
      silver: 'looks_two',
      gold: 'looks_one',
      platinum: 'star',
    };
    return icons[tier];
  }

  formatCurrency(amount: number): string {
    return `LKR ${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  formatDate(date: Date | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
}
