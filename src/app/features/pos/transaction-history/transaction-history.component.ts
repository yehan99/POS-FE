import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormBuilder, FormGroup } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import {
  Transaction,
  TransactionDashboardData,
  TransactionDashboardPeriod,
  TransactionFilter,
} from '../models/transaction.model';
import { TransactionService } from '../services/transaction.service';
import {
  ReceiptDialogComponent,
  ReceiptDialogData,
} from '../receipt-dialog/receipt-dialog.component';

@Component({
  selector: 'app-transaction-history',
  standalone: false,
  templateUrl: './transaction-history.component.html',
  styleUrl: './transaction-history.component.scss',
})
export class TransactionHistoryComponent implements OnInit {
  displayedColumns: string[] = [
    'transactionNumber',
    'date',
    'customerName',
    'items',
    'total',
    'paymentMethod',
    'status',
    'actions',
  ];

  transactions: Transaction[] = [];
  totalTransactions = 0;
  pageSize = 20;
  currentPage = 1;
  isLoading = false;

  dashboardData?: TransactionDashboardData;
  dashboardPeriod: TransactionDashboardPeriod = 'today';
  dashboardLoading = false;
  dashboardError = '';
  dashboardPeriods: { value: TransactionDashboardPeriod; label: string }[] = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'Last 7 Days' },
    { value: 'month', label: 'Last 30 Days' },
    { value: 'year', label: 'Year to Date' },
  ];

  get totalPages(): number {
    return this.calculateTotalPages();
  }

  filterForm: FormGroup;
  paymentMethods = ['cash', 'card', 'mobile', 'split'];
  statuses = ['completed', 'refunded', 'cancelled'];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private transactionService: TransactionService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private fb: FormBuilder
  ) {
    this.filterForm = this.fb.group({
      searchTerm: [''],
      startDate: [null],
      endDate: [null],
      paymentMethod: [''],
      status: [''],
      minAmount: [null],
      maxAmount: [null],
    });
  }

  ngOnInit(): void {
    this.loadDashboardData();
    this.loadTransactions();
    this.setupFilterListener();
  }

  setupFilterListener(): void {
    this.filterForm.valueChanges
      .pipe(debounceTime(500), distinctUntilChanged())
      .subscribe(() => {
        this.currentPage = 1;
        this.loadTransactions();
      });
  }

  loadDashboardData(): void {
    this.dashboardLoading = true;
    this.dashboardError = '';

    this.transactionService
      .getTransactionDashboard(this.dashboardPeriod)
      .subscribe({
        next: (data) => {
          this.dashboardData = data;
          this.dashboardLoading = false;
        },
        error: (error) => {
          console.error('Error loading transaction dashboard:', error);
          this.dashboardError = 'Unable to load dashboard insights.';
          this.dashboardLoading = false;
        },
      });
  }

  onDashboardPeriodChange(period: TransactionDashboardPeriod): void {
    if (this.dashboardPeriod === period) {
      return;
    }

    this.dashboardPeriod = period;
    this.loadDashboardData();
  }

  loadTransactions(): void {
    this.isLoading = true;
    const filter = this.buildFilter();

    this.transactionService
      .getFilteredTransactions(filter, this.currentPage, this.pageSize)
      .subscribe({
        next: (response) => {
          this.transactions = response.transactions;
          this.totalTransactions = response.total;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading transactions:', error);
          this.snackBar.open('Failed to load transactions', 'Close', {
            duration: 3000,
            panelClass: ['error-snackbar'],
          });
          this.isLoading = false;
        },
      });
  }

  buildFilter(): TransactionFilter {
    const formValue = this.filterForm.value;
    const filter: TransactionFilter = {};

    if (formValue.searchTerm) {
      filter.searchTerm = formValue.searchTerm;
    }
    if (formValue.startDate) {
      filter.startDate = formValue.startDate;
    }
    if (formValue.endDate) {
      filter.endDate = formValue.endDate;
    }
    if (formValue.paymentMethod) {
      filter.paymentMethod = formValue.paymentMethod;
    }
    if (formValue.status) {
      filter.status = formValue.status;
    }
    if (formValue.minAmount) {
      filter.minAmount = formValue.minAmount;
    }
    if (formValue.maxAmount) {
      filter.maxAmount = formValue.maxAmount;
    }

    return filter;
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadTransactions();
  }

  viewTransaction(transaction: Transaction): void {
    const dialogData: ReceiptDialogData = {
      transaction: transaction,
    };

    this.dialog.open(ReceiptDialogComponent, {
      width: '1000px',
      data: dialogData,
    });
  }

  printReceipt(transaction: Transaction): void {
    const dialogData: ReceiptDialogData = {
      transaction: transaction,
    };

    const dialogRef = this.dialog.open(ReceiptDialogComponent, {
      width: '1000px',
      data: dialogData,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'printed') {
        this.snackBar.open('Receipt printed successfully', 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar'],
        });
      }
    });
  }

  refundTransaction(transaction: Transaction): void {
    if (
      confirm(
        `Are you sure you want to refund transaction ${transaction.transactionNumber}?`
      )
    ) {
      const reason = prompt('Enter refund reason:');
      if (reason) {
        this.transactionService
          .refundTransaction(transaction.id, reason)
          .subscribe({
            next: () => {
              this.snackBar.open('Transaction refunded successfully', 'Close', {
                duration: 3000,
                panelClass: ['success-snackbar'],
              });
              this.loadTransactions();
            },
            error: (error) => {
              console.error('Error refunding transaction:', error);
              this.snackBar.open('Failed to refund transaction', 'Close', {
                duration: 3000,
                panelClass: ['error-snackbar'],
              });
            },
          });
      }
    }
  }

  clearFilters(): void {
    this.filterForm.reset({
      searchTerm: '',
      startDate: null,
      endDate: null,
      paymentMethod: '',
      status: '',
      minAmount: null,
      maxAmount: null,
    });
  }

  exportTransactions(): void {
    const filter = this.buildFilter();
    this.transactionService.exportTransactions(filter).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `transactions_${
          new Date().toISOString().split('T')[0]
        }.csv`;
        link.click();
        window.URL.revokeObjectURL(url);

        this.snackBar.open('Transactions exported successfully', 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar'],
        });
      },
      error: (error) => {
        console.error('Error exporting transactions:', error);
        this.snackBar.open('Failed to export transactions', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar'],
        });
      },
    });
  }

  getItemCount(transaction: Transaction): number {
    return transaction.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'completed':
        return 'primary';
      case 'refunded':
        return 'accent';
      case 'cancelled':
        return 'warn';
      default:
        return '';
    }
  }

  getPaymentMethodIcon(method: string): string {
    switch (method) {
      case 'cash':
        return 'payments';
      case 'card':
        return 'credit_card';
      case 'mobile':
        return 'phone_android';
      case 'split':
        return 'call_split';
      default:
        return 'payment';
    }
  }

  formatCurrency(value?: number | null): string {
    const amount = value ?? 0;
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  formatPercentage(value?: number | null): string {
    return `${(value ?? 0).toFixed(1)}%`;
  }

  formatTrendDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }

  get dashboardPeriodLabel(): string {
    const match = this.dashboardPeriods.find(
      (option) => option.value === this.dashboardPeriod
    );
    return match ? match.label : '';
  }

  private calculateTotalPages(): number {
    if (!this.totalTransactions || !this.pageSize) {
      return 1;
    }

    return Math.max(1, Math.ceil(this.totalTransactions / this.pageSize));
  }
}
